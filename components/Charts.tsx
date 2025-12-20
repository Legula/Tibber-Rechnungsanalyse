
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, ComposedChart, Area, AreaChart
} from 'recharts';
import { InvoiceData } from '../types';

interface ChartsProps {
  invoices: InvoiceData[];
  isAllYears?: boolean;
}

export const Charts: React.FC<ChartsProps> = ({ invoices, isAllYears }) => {
  // Process data for charts
  const chartData = useMemo(() => {
    if (isAllYears) {
      // For "All Years", group by Month + Year or just chronological
      return [...invoices].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthIndex - b.monthIndex;
      }).map(inv => ({
        ...inv,
        displayLabel: `${inv.month.substring(0, 3)} ${inv.year.toString().substring(2)}`
      }));
    } else {
      // For a single year, use full month names
      return [...invoices].sort((a, b) => a.monthIndex - b.monthIndex)
        .map(inv => ({ ...inv, displayLabel: inv.month }));
    }
  }, [invoices, isAllYears]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-slate-200 shadow-lg rounded-lg">
          <p className="font-bold text-slate-700 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {Number(entry.value).toFixed(2)} {entry.unit}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Cost & Consumption Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">
          {isAllYears ? 'Kosten & Verbrauch (Historie)' : `Kosten & Verbrauch ${invoices[0]?.year || ''}`}
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="displayLabel" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" orientation="left" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} unit=" €" />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} unit=" kWh" />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36}/>
              <Bar yAxisId="left" dataKey="totalCost" name="Kosten" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={isAllYears ? 12 : 24} unit="€" />
              <Line yAxisId="right" type="monotone" dataKey="consumptionKwh" name="Verbrauch" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} unit="kWh" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Average Price Trend */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Strompreis Entwicklung (ct/kWh)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="displayLabel" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} unit=" ct" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="avgPriceCent" name="Ø Preis" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={3} unit="ct" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
