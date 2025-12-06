import React from 'react';
import { InvoiceData } from '../types';
import { FileText, Trash2 } from 'lucide-react';

interface InvoiceTableProps {
  invoices: InvoiceData[];
  onDelete: (id: string) => void;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices, onDelete }) => {
  if (invoices.length === 0) return null;

  // Sort by month index
  const sorted = [...invoices].sort((a, b) => a.monthIndex - b.monthIndex);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">Verarbeitete Rechnungen</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-sm">
              <th className="p-4 font-medium">Monat</th>
              <th className="p-4 font-medium">Verbrauch</th>
              <th className="p-4 font-medium">Betrag</th>
              <th className="p-4 font-medium">Ø Preis</th>
              <th className="p-4 font-medium">Datei</th>
              <th className="p-4 font-medium text-right">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((inv) => (
              <tr key={inv.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors text-sm">
                <td className="p-4 font-medium text-slate-800">{inv.month} {inv.year}</td>
                <td className="p-4 text-slate-600">{inv.consumptionKwh.toFixed(1)} kWh</td>
                <td className="p-4 text-slate-600">{inv.totalCost.toFixed(2)} €</td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {inv.avgPriceCent.toFixed(2)} ct/kWh
                  </span>
                </td>
                <td className="p-4 text-slate-500 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="truncate max-w-[150px]">{inv.fileName}</span>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => onDelete(inv.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
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