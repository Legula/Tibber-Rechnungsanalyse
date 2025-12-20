
import { GoogleGenAI, Type } from "@google/genai";
import { InvoiceData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export const analyzeInvoiceWithGemini = async (file: File): Promise<Omit<InvoiceData, 'id' | 'fileName'>> => {
  const base64Data = await fileToBase64(file);

  // Use gemini-3-flash-preview for extraction tasks as per guidelines
  const model = "gemini-3-flash-preview";

  const prompt = `
    Analysiere diese Stromrechnung von Tibber.
    Extrahiere folgende Daten:
    1. Den Monat und das Jahr, auf das sich die Rechnung bezieht (Leistungszeitraum).
    2. Den Gesamtverbrauch in kWh.
    3. Den Rechnungsbetrag (Gesamtsumme) in Euro.
    
    Gib das Ergebnis im JSON-Format zurück.
    Der Monat soll als deutscher String zurückgegeben werden (z.B. "Januar").
    Der monthIndex soll 0 für Januar, 1 für Februar usw. sein.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            month: { type: Type.STRING, description: "Monatsname auf Deutsch, z.B. Januar" },
            monthIndex: { type: Type.INTEGER, description: "0-basierter Index des Monats (0=Jan, 11=Dez)" },
            year: { type: Type.INTEGER },
            consumptionKwh: { type: Type.NUMBER, description: "Verbrauch in kWh" },
            totalCost: { type: Type.NUMBER, description: "Gesamtbetrag in Euro" },
          },
          required: ["month", "monthIndex", "year", "consumptionKwh", "totalCost"],
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Keine Antwort von Gemini erhalten.");

    const data = JSON.parse(text);

    return {
      month: data.month,
      monthIndex: data.monthIndex,
      year: data.year,
      consumptionKwh: data.consumptionKwh,
      totalCost: data.totalCost,
      avgPriceCent: (data.totalCost / data.consumptionKwh) * 100
    };

  } catch (error) {
    console.error("Fehler bei der Analyse:", error);
    throw new Error("Die Rechnung konnte nicht verarbeitet werden.");
  }
};
