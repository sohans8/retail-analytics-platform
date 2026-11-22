import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { WEEKDAY_ANALYSIS } from '../../services/dataService';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs border border-slate-800">
        <p className="font-bold text-white">{data.day}</p>
        <p className="text-blue-400 font-semibold mt-1">
          Daily Average: {formatCurrency(data.avgSales)}
        </p>
        <div className="mt-1 pt-1 border-t border-slate-800 text-[11px] text-slate-300">
          <p>Avg Customers: {formatNumber(data.avgCustomers)}</p>
          <p>Total Revenue: {formatCurrency(data.totalSales, { compact: true })}</p>
          {data.day === 'Sunday' && (
            <p className="text-amber-400 mt-1 font-semibold">* Selected high-volume stores open on Sundays</p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const WeekdayPatternChart = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Weekly Sales Pattern</h3>
          <p className="text-xs text-slate-500 mt-0.5">Average revenue distribution by day of the week (Mon – Sun)</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
          Monday Peak Demand
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={WEEKDAY_ANALYSIS} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="shortDay" tickLine={false} stroke="#94a3b8" fontSize={11} dy={5} />
            <YAxis
              tickLine={false}
              stroke="#94a3b8"
              fontSize={11}
              tickFormatter={(v) => formatCurrency(v, { compact: true })}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="avgSales" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={42} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div>
          <span className="text-slate-400 block text-[11px]">Highest Weekday</span>
          <span className="font-bold text-slate-800">Monday ({formatCurrency(WEEKDAY_ANALYSIS[0].avgSales)})</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Lowest Weekday</span>
          <span className="font-bold text-slate-800">Saturday ({formatCurrency(WEEKDAY_ANALYSIS[5].avgSales)})</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Sunday Customer Traffic</span>
          <span className="font-bold text-emerald-700">{formatNumber(WEEKDAY_ANALYSIS[6].avgCustomers)} / open store</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Weekday Avg Footfall</span>
          <span className="font-bold text-slate-800">~760 customers</span>
        </div>
      </div>
    </div>
  );
};

export default WeekdayPatternChart;
