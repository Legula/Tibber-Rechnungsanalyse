
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  ComposedChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { InvoiceData } from '../types';

interface ChartsProps {
  invoices: InvoiceData[];
  isAllYears?: boolean;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export const Charts: React.FC<ChartsProps> = ({ invoices, isAllYears }) => {
  const chartData = useMemo(() => {
    const sorted = [...invoices].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.monthIndex - b.monthIndex;
    });

    return sorted.map(inv => ({
      ...inv,
      displayLabel: isAllYears 
        ? `${inv.month.substring(0, 3)} ${inv.year.toString().substring(2)}`
        : inv.month
    }));
  }, [invoices, isAllYears]);

  const yearlyComparisonData = useMemo(() => {
    const yearlyTotals: Record<number, { year: number; totalCost: number; consumption: number }> = {};
    
    invoices.forEach(inv => {
      if (!yearlyTotals[inv.year]) {
        yearlyTotals[inv.year] = { year: inv.year, totalCost: 0, consumption: 0 };
      }
      yearlyTotals[inv.year].totalCost += inv.totalCost;
      yearlyTotals[inv.year].consumption += inv.consumptionKwh;
    });

    return Object.values(yearlyTotals).sort((a, b) => a.year - b.year);
  }, [invoices]);

  const distributionData = useMemo(() => {
    if (invoices.length === 0) return [];
    const totals = invoices.reduce((acc, curr) => ({
      base: acc.base + curr.baseFeeCost,
      working: acc.working + curr.workingPriceCost,
      grid: acc.grid + curr.gridFeesCost,
      taxes: acc.taxes + curr.taxesAndLeviesCost
    }), { base: 0, working: 0, grid: 0, taxes: 0 });

    return [
      { name: 'Grundpreis', value: totals.base },
      { name: 'Energie', value: totals.working },
      { name: 'Netz', value: totals.grid },
      { name: 'Steuern/Abgaben', value: totals.taxes },
    ].filter(item => item.value > 0);
  }, [invoices]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-slate-200 shadow-lg rounded-lg">
          <p className="font-bold text-slate-700 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm flex justify-between gap-4" style={{ color: entry.color }}>
              <span>{entry.name}:</span>
              <span className="font-mono font-medium">{Number(entry.value).toFixed(2)} {entry.unit || '€'}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 mb-8">
      {/* New Yearly Comparison Chart */}
      {yearlyComparisonData.length > 1 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Jahresvergleich: Gesamtausgaben</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyComparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="year" tick={{ fill: '#64748b' }} axisLine={false} />
                <YAxis tick={{ fill: '#64748b' }} axisLine={false} unit=" €" />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="totalCost" 
                  name="Jahreskosten" 
                  fill="#6366f1" 
                  radius={[4, 4, 0, 0]} 
                  unit="€"
                  label={{ position: 'top', fill: '#64748b', fontSize: 12, formatter: (val: number) => `${val.toFixed(0)}€` }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Breakdown Stacked Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Kostenaufteilung nach Posten</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="displayLabel" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: '#64748b' }} axisLine={false} unit=" €" />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" />
                <Bar dataKey="baseFeeCost" name="Grundpreis" stackId="a" fill={COLORS[0]} unit="€" />
                <Bar dataKey="workingPriceCost" name="Energie" stackId="a" fill={COLORS[1]} unit="€" />
                <Bar dataKey="gridFeesCost" name="Netzentgelte" stackId="a" fill={COLORS[2]} unit="€" />
                <Bar dataKey="taxesAndLeviesCost" name="Steuern/Abgaben" stackId="a" fill={COLORS[3]} unit="€" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Ø Verteilung</h3>
          <div className="h-64 flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toFixed(2)} €`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {distributionData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="truncate">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Trend Area Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Effektiver Preisverlauf (ct/kWh)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="displayLabel" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                <YAxis domain={['auto', 'auto']} tick={{ fill: '#64748b' }} axisLine={false} unit=" ct" />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="avgPriceCent" name="Preis" stroke="#6366f1" strokeWidth={3} fill="url(#colorPrice)" unit="ct" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Consumption vs Cost Line Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Verbrauch vs. Gesamtkosten</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="displayLabel" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fill: '#64748b' }} axisLine={false} unit=" €" />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b' }} axisLine={false} unit=" kWh" />
                <Tooltip content={<CustomTooltip />} />
                <Bar yAxisId="left" dataKey="totalCost" name="Gesamt" fill="#e2e8f0" radius={[4, 4, 0, 0]} unit="€" />
                <Line yAxisId="right" type="monotone" dataKey="consumptionKwh" name="Verbrauch" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} unit="kWh" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
