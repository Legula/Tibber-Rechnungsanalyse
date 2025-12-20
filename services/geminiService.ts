
import { GoogleGenAI, Type } from "@google/genai";
import { InvoiceData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export const analyzeInvoiceWithGemini = async (file: File): Promise<Omit<InvoiceData, 'id' | 'fileName'>> => {
  const base64Data = await fileToBase64(file);
  const model = "gemini-3-flash-preview";

  const prompt = `
    Analysiere diese Stromrechnung im Detail.
    Extrahiere folgende Daten:
    1. Zeitraum: Monat (Deutsch) und Jahr.
    2. Verbrauch: Gesamt-kWh.
    3. Gesamtsumme: Rechnungsbetrag in Euro.
    4. Preisaufteilung (versuche die Beträge so genau wie möglich zuzuordnen):
       - Grundpreis-Kosten (fixe monatliche Gebühr)
       - Arbeitspreis-Kosten (reine Energiekosten basierend auf Verbrauch)
       - Netzentgelte/Netznutzung (falls separat aufgeführt, sonst zu Arbeitspreis)
       - Steuern & Abgaben (MwSt, Stromsteuer, Umlagen)
    
    WICHTIG: Die Summe der Einzelposten sollte in etwa der Gesamtsumme entsprechen.
    Gib das Ergebnis als JSON zurück.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            month: { type: Type.STRING },
            monthIndex: { type: Type.INTEGER },
            year: { type: Type.INTEGER },
            consumptionKwh: { type: Type.NUMBER },
            totalCost: { type: Type.NUMBER },
            baseFeeCost: { type: Type.NUMBER, description: "Summe Grundpreis" },
            workingPriceCost: { type: Type.NUMBER, description: "Summe Arbeitspreis/Energie" },
            gridFeesCost: { type: Type.NUMBER, description: "Summe Netzentgelte" },
            taxesAndLeviesCost: { type: Type.NUMBER, description: "Summe Steuern und Abgaben" },
          },
          required: ["month", "monthIndex", "year", "consumptionKwh", "totalCost", "baseFeeCost", "workingPriceCost", "gridFeesCost", "taxesAndLeviesCost"],
        }
      }
    });

    const data = JSON.parse(response.text || "{}");

    return {
      month: data.month,
      monthIndex: data.monthIndex,
      year: data.year,
      consumptionKwh: data.consumptionKwh,
      totalCost: data.totalCost,
      baseFeeCost: data.baseFeeCost,
      workingPriceCost: data.workingPriceCost,
      gridFeesCost: data.gridFeesCost,
      taxesAndLeviesCost: data.taxesAndLeviesCost,
      avgPriceCent: data.consumptionKwh > 0 ? (data.totalCost / data.consumptionKwh) * 100 : 0
    };
  } catch (error) {
    console.error("Analysefehler:", error);
    throw new Error("Detaillierte Analyse fehlgeschlagen.");
  }
};
