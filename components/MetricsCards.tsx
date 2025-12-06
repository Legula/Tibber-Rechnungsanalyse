import React from 'react';
import { Euro, Zap, TrendingUp, Calendar } from 'lucide-react';
import { InvoiceData } from '../types';

interface MetricsCardsProps {
  invoices: InvoiceData[];
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ invoices }) => {
  const totalCost = invoices.reduce((acc, curr) => acc + curr.totalCost, 0);
  const totalConsumption = invoices.reduce((acc, curr) => acc + curr.consumptionKwh, 0);
  
  const avgMonthlyCost = invoices.length > 0 ? totalCost / invoices.length : 0;
  const avgPricePerKwh = totalConsumption > 0 ? (totalCost / totalConsumption) * 100 : 0;

  const Card = ({ title, value, subtext, icon: Icon, colorClass }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card 
        title="Gesamtkosten 2025" 
        value={`${totalCost.toFixed(2)} €`}
        subtext={`${invoices.length} Rechnungen erfasst`}
        icon={Euro}
        colorClass="bg-emerald-500"
      />
      <Card 
        title="Gesamtverbrauch" 
        value={`${Math.round(totalConsumption)} kWh`}
        subtext="Im Jahr 2025"
        icon={Zap}
        colorClass="bg-amber-500"
      />
      <Card 
        title="Ø Strompreis" 
        value={`${avgPricePerKwh.toFixed(1)} ct/kWh`}
        subtext="Effektiver Durchschnitt"
        icon={TrendingUp}
        colorClass="bg-indigo-500"
      />
      <Card 
        title="Ø Monatliche Kosten" 
        value={`${avgMonthlyCost.toFixed(2)} €`}
        subtext="Basierend auf Daten"
        icon={Calendar}
        colorClass="bg-sky-500"
      />
    </div>
  );
};