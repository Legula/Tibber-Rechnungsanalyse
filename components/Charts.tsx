import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, ComposedChart, Area
} from 'recharts';
import { InvoiceData } from '../types';

interface ChartsProps {
  invoices: InvoiceData[];
}

export const Charts: React.FC<ChartsProps> = ({ invoices }) => {
  // Sort data by month index just to be sure
  const sortedData = [...invoices].sort((a, b) => a.monthIndex - b.monthIndex);

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
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Kosten & Verbrauch</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={sortedData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" orientation="left" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} unit=" €" />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} unit=" kWh" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar yAxisId="left" dataKey="totalCost" name="Kosten (€)" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} unit="€" />
              <Line yAxisId="right" type="monotone" dataKey="consumptionKwh" name="Verbrauch (kWh)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} unit="kWh" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Average Price Trend */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Durchschnittspreis Entwicklung (ct/kWh)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sortedData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} unit=" ct" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="avgPriceCent" name="Ø Preis" stroke="#6366f1" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={3} unit="ct" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Necessary mock for AreaChart to avoid type errors in previous block if ComposedChart doesn't support Area directly easily without imports
import { AreaChart } from 'recharts';
