
import React from 'react';
import { InvoiceData } from '../types';
import { Trash2 } from 'lucide-react';
// @ts-ignore
import { jsPDF } from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';

interface InvoiceTableProps {
  invoices: InvoiceData[];
  onDelete: (id: string) => void;
}

const CsvIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2 text-emerald-600">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
    <path d="M8 13h2"/>
    <path d="M14 13h2"/>
    <path d="M8 17h2"/>
    <path d="M14 17h2"/>
  </svg>
);

const PdfIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2 text-red-600">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
    <path d="M9 15h6"/>
    <path d="M12 12v6"/>
  </svg>
);

export const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices, onDelete }) => {
  if (invoices.length === 0) return null;

  const sorted = [...invoices].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.monthIndex - a.monthIndex;
  });

  const handleCsvExport = () => {
    const headers = [
      'Anbieter', 'Monat', 'Jahr', 'Verbrauch (kWh)', 'Gesamt (EUR)', 
      'Grundpreis (EUR)', 'Energie (EUR)', 'Netz (EUR)', 'Steuern (EUR)', 
      'Ø Preis (ct/kWh)', 'Dateiname'
    ];
    
    const rows = sorted.map(inv => [
      `"${inv.provider || 'Unbekannt'}"`,
      inv.month,
      inv.year,
      inv.consumptionKwh.toFixed(2),
      inv.totalCost.toFixed(2),
      inv.baseFeeCost.toFixed(2),
      inv.workingPriceCost.toFixed(2),
      inv.gridFeesCost.toFixed(2),
      inv.taxesAndLeviesCost.toFixed(2),
      inv.avgPriceCent.toFixed(2),
      `"${inv.fileName}"`
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'stromrechnungen_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePdfExport = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      const autoTableFunction = typeof autoTable === 'function' ? autoTable : (autoTable as any).default;

      if (typeof autoTableFunction !== 'function') {
        throw new Error('autoTable is not a function');
      }

      // Header
      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229); // Indigo-600
      doc.text('Smart Strom-Analyzer Detaillierter Report', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')} | Alle Beträge in Euro (€)`, 14, 30);
      
      // 1. Detailed Table
      const detailedData = sorted.map(inv => [
        `${inv.month} ${inv.year}`,
        inv.provider || 'Unbekannt',
        `${inv.consumptionKwh.toFixed(1)} kWh`,
        `${inv.totalCost.toFixed(2)}`,
        `${inv.baseFeeCost.toFixed(2)}`,
        `${inv.workingPriceCost.toFixed(2)}`,
        `${inv.gridFeesCost.toFixed(2)}`,
        `${inv.taxesAndLeviesCost.toFixed(2)}`,
        `${inv.avgPriceCent.toFixed(2)} ct`
      ]);

      autoTableFunction(doc, {
        startY: 40,
        head: [['Zeitraum', 'Anbieter', 'Verbrauch', 'Gesamt', 'Grundpreis', 'Energie', 'Netz', 'Steuern', 'Ø Preis']],
        body: detailedData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], fontSize: 9, halign: 'center' },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { textColor: [79, 70, 229] },
          3: { fontStyle: 'bold', halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right' },
          7: { halign: 'right' },
          8: { halign: 'right' }
        },
      });

      // Statistics Section
      const finalY = (doc as any).lastAutoTable.finalY || 40;
      doc.setFontSize(14);
      doc.setTextColor(79, 70, 229);
      doc.text('Analysen & Durchschnittswerte', 14, finalY + 15);

      // 2. Yearly Stats Table
      const yearsMap: Record<number, { cost: number; kwh: number }> = {};
      invoices.forEach(inv => {
        if (!yearsMap[inv.year]) yearsMap[inv.year] = { cost: 0, kwh: 0 };
        yearsMap[inv.year].cost += inv.totalCost;
        yearsMap[inv.year].kwh += inv.consumptionKwh;
      });
      const yearlyStatsData = Object.entries(yearsMap).map(([year, data]) => [
        `Jahr ${year}`,
        `${data.cost.toFixed(2)} €`,
        `${data.kwh.toFixed(1)} kWh`,
        `${(data.cost / data.kwh * 100).toFixed(2)} ct/kWh`
      ]).sort((a, b) => b[0].localeCompare(a[0]));

      autoTableFunction(doc, {
        startY: finalY + 20,
        head: [['Zeitraum', 'Kosten Gesamt', 'Verbrauch Gesamt', 'Ø Preis']],
        body: yearlyStatsData,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] }, // Indigo-500
        styles: { fontSize: 9 },
        margin: { right: 150 }, // Half page width roughly
      });

      // 3. Provider Stats Table
      const providersMap: Record<string, { cost: number; kwh: number }> = {};
      invoices.forEach(inv => {
        const p = inv.provider || 'Unbekannt';
        if (!providersMap[p]) providersMap[p] = { cost: 0, kwh: 0 };
        providersMap[p].cost += inv.totalCost;
        providersMap[p].kwh += inv.consumptionKwh;
      });
      const providerStatsData = Object.entries(providersMap).map(([name, data]) => [
        name,
        `${data.cost.toFixed(2)} €`,
        `${data.kwh.toFixed(1)} kWh`,
        `${(data.cost / data.kwh * 100).toFixed(2)} ct/kWh`
      ]).sort((a, b) => (a[3] as string).localeCompare(b[3] as string));

      autoTableFunction(doc, {
        startY: finalY + 20,
        head: [['Anbieter', 'Kosten Gesamt', 'Verbrauch Gesamt', 'Ø Preis']],
        body: providerStatsData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] }, // Emerald-500
        styles: { fontSize: 9 },
        margin: { left: 150 }, // Place on the right side
      });

      doc.save('strom-analyzer-detaillierter-report.pdf');
    } catch (error) {
      console.error('Fehler beim PDF-Export:', error);
      alert('Der PDF-Export ist fehlgeschlagen. Bitte nutzen Sie vorerst den CSV-Export.');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Dokument-Details</h3>
          <p className="text-xs text-slate-500 mt-1">KI-extrahierte Einzelposten inkl. Anbieter</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleCsvExport}
            className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 hover:border-emerald-200 transition-all group"
          >
            <CsvIcon />
            CSV Export
          </button>
          <button 
            onClick={handlePdfExport}
            className="inline-flex items-center px-4 py-2 border border-indigo-200 shadow-sm text-sm font-medium rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:border-red-200 transition-all group"
          >
            <PdfIcon />
            PDF Report (inkl. Stats)
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <th className="p-4 font-semibold">Zeitraum / Anbieter</th>
              <th className="p-4 font-semibold">Verbrauch</th>
              <th className="p-4 font-semibold">Gesamt</th>
              <th className="p-4 font-semibold">Grundpreis</th>
              <th className="p-4 font-semibold">Energie/Netz</th>
              <th className="p-4 font-semibold text-right">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((inv) => (
              <tr key={inv.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors text-sm">
                <td className="p-4 font-medium text-slate-800">
                  <div className="flex flex-col">
                    <span className="font-bold">{inv.month} {inv.year}</span>
                    <span className="text-indigo-600 text-xs font-semibold">{inv.provider || 'Unbekannt'}</span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[150px]" title={inv.fileName}>{inv.fileName}</span>
                  </div>
                </td>
                <td className="p-4 text-slate-600 font-medium">{inv.consumptionKwh.toFixed(1)} kWh</td>
                <td className="p-4 font-bold text-slate-900">{inv.totalCost.toFixed(2)} €</td>
                <td className="p-4 text-slate-500">{inv.baseFeeCost.toFixed(2)} €</td>
                <td className="p-4 text-slate-500">
                  <div className="flex flex-col text-xs">
                    <span className="flex justify-between gap-2"><span>Energie:</span> <span>{inv.workingPriceCost.toFixed(2)} €</span></span>
                    <span className="flex justify-between gap-2 text-slate-400"><span>Netz:</span> <span>{inv.gridFeesCost.toFixed(2)} €</span></span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => onDelete(inv.id)}
                    className="group p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all"
                    aria-label="Eintrag löschen"
                    title="Diesen Monat löschen"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
