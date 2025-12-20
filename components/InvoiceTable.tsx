
import React from 'react';
import { InvoiceData } from '../types';
import { FileText, Trash2, Download } from 'lucide-react';

interface InvoiceTableProps {
  invoices: InvoiceData[];
  onDelete: (id: string) => void;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices, onDelete }) => {
  if (invoices.length === 0) return null;

  const sorted = [...invoices].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.monthIndex - a.monthIndex;
  });

  const handleExport = () => {
    const headers = [
      'Monat', 'Jahr', 'Verbrauch (kWh)', 'Gesamt (EUR)', 
      'Grundpreis (EUR)', 'Energie (EUR)', 'Netz (EUR)', 'Steuern (EUR)', 
      'Ø Preis (ct/kWh)', 'Dateiname'
    ];
    
    const rows = sorted.map(inv => [
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
    link.setAttribute('download', 'stromrechnungen_detail_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Dokument-Details</h3>
          <p className="text-xs text-slate-500 mt-1">KI-extrahierte Einzelposten der Rechnungen</p>
        </div>
        <button 
          onClick={handleExport}
          className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Details
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <th className="p-4 font-semibold">Zeitraum</th>
              <th className="p-4 font-semibold">Verbrauch</th>
              <th className="p-4 font-semibold">Gesamt</th>
              <th className="p-4 font-semibold">Grundpreis</th>
              <th className="p-4 font-semibold">Energie/Netz</th>
              <th className="p-4 font-semibold">Steuern</th>
              <th className="p-4 font-semibold text-right">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((inv) => (
              <tr key={inv.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors text-sm">
                <td className="p-4 font-medium text-slate-800">
                  <div className="flex flex-col">
                    <span>{inv.month} {inv.year}</span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[100px]" title={inv.fileName}>{inv.fileName}</span>
                  </div>
                </td>
                <td className="p-4 text-slate-600">{inv.consumptionKwh.toFixed(1)} kWh</td>
                <td className="p-4 font-bold text-slate-900">{inv.totalCost.toFixed(2)} €</td>
                <td className="p-4 text-slate-500">{inv.baseFeeCost.toFixed(2)} €</td>
                <td className="p-4 text-slate-500">
                  <div className="flex flex-col">
                    <span>E: {inv.workingPriceCost.toFixed(2)} €</span>
                    <span>N: {inv.gridFeesCost.toFixed(2)} €</span>
                  </div>
                </td>
                <td className="p-4 text-slate-500">{inv.taxesAndLeviesCost.toFixed(2)} €</td>
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
