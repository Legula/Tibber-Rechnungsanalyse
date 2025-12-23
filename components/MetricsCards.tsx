
import React, { useMemo } from 'react';
import { Euro, Zap, TrendingUp, Calendar, Building2, Clock } from 'lucide-react';
import { InvoiceData } from '../types';

interface MetricsCardsProps {
  invoices: InvoiceData[];
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ invoices }) => {
  const totalCost = invoices.reduce((acc, curr) => acc + curr.totalCost, 0);
  const totalConsumption = invoices.reduce((acc, curr) => acc + curr.consumptionKwh, 0);
  
  const avgMonthlyCost = invoices.length > 0 ? totalCost / invoices.length : 0;
  const avgPricePerKwh = totalConsumption > 0 ? (totalCost / totalConsumption) * 100 : 0;

  const yearlyStats = useMemo(() => {
    const years: Record<number, { cost: number; kwh: number }> = {};
    invoices.forEach(inv => {
      if (!years[inv.year]) years[inv.year] = { cost: 0, kwh: 0 };
      years[inv.year].cost += inv.totalCost;
      years[inv.year].kwh += inv.consumptionKwh;
    });
    return Object.entries(years).map(([year, data]) => ({
      year,
      avg: data.kwh > 0 ? (data.cost / data.kwh) * 100 : 0
    })).sort((a, b) => b.year.localeCompare(a.year));
  }, [invoices]);

  const providerStats = useMemo(() => {
    const providers: Record<string, { cost: number; kwh: number }> = {};
    invoices.forEach(inv => {
      const p = inv.provider || 'Unbekannt';
      if (!providers[p]) providers[p] = { cost: 0, kwh: 0 };
      providers[p].cost += inv.totalCost;
      providers[p].kwh += inv.consumptionKwh;
    });
    return Object.entries(providers).map(([name, data]) => ({
      name,
      avg: data.kwh > 0 ? (data.cost / data.kwh) * 100 : 0
    })).sort((a, b) => a.avg - b.avg);
  }, [invoices]);

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

  const yearsCount = Array.from(new Set(invoices.map(i => i.year))).length;

  return (
    <div className="space-y-6 mb-8">
      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          title="Gesamtkosten" 
          value={`${totalCost.toFixed(2)} €`}
          subtext={`${invoices.length} Monate aus ${yearsCount} Jahr(en)`}
          icon={Euro}
          colorClass="bg-emerald-500"
        />
        <Card 
          title="Gesamtverbrauch" 
          value={`${Math.round(totalConsumption).toLocaleString()} kWh`}
          subtext="Summe gewählter Zeitraum"
          icon={Zap}
          colorClass="bg-amber-500"
        />
        <Card 
          title="Ø Strompreis" 
          value={`${avgPricePerKwh.toFixed(1)} ct/kWh`}
          subtext="Effektiver Schnitt"
          icon={TrendingUp}
          colorClass="bg-indigo-500"
        />
        <Card 
          title="Ø Monatliche Kosten" 
          value={`${avgMonthlyCost.toFixed(2)} €`}
          subtext="Über alle gewählten Monate"
          icon={Calendar}
          colorClass="bg-sky-500"
        />
      </div>

      {/* Secondary Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Price by Year */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-indigo-500" />
            <h4 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Ø Preis pro Jahr</h4>
          </div>
          <div className="space-y-3">
            {yearlyStats.map(stat => (
              <div key={stat.year} className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Jahr {stat.year}</span>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-slate-900">{stat.avg.toFixed(1)} <span className="text-xs font-normal text-slate-400">ct/kWh</span></span>
                  <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden hidden sm:block">
                    <div 
                      className="bg-indigo-500 h-full" 
                      style={{ width: `${Math.min(100, (stat.avg / 50) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price by Provider */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-emerald-500" />
            <h4 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Ø Preis pro Anbieter</h4>
          </div>
          <div className="space-y-3">
            {providerStats.map(stat => (
              <div key={stat.name} className="flex items-center justify-between">
                <span className="text-slate-600 font-medium truncate max-w-[150px]" title={stat.name}>{stat.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-slate-900">{stat.avg.toFixed(1)} <span className="text-xs font-normal text-slate-400">ct/kWh</span></span>
                  <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden hidden sm:block">
                    <div 
                      className="bg-emerald-500 h-full" 
                      style={{ width: `${Math.min(100, (stat.avg / 50) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
