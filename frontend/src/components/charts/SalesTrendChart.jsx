import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MONTHLY_SALES_TREND } from '../../services/dataService';
import { formatCurrency } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs border border-slate-800">
        <p className="font-semibold text-slate-300">{label}</p>
        <p className="text-base font-bold text-white mt-1">
          {formatCurrency(payload[0].value, { compact: false })}
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Avg Store Daily: {formatCurrency(data.avgSales)}
        </p>
      </div>
    );
  }
  return null;
};

export const SalesTrendChart = ({ data = MONTHLY_SALES_TREND, title = 'Monthly Revenue Trend' }) => {
  const [filterYear, setFilterYear] = useState('ALL');

  const filteredData = data.filter((item) => {
    if (filterYear === 'ALL') return true;
    return item.date.startsWith(filterYear);
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Network sales trajectory across 1,115 stores (2013 – 2015)
          </p>
        </div>

        {/* Filter Pills */}
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold">
          {['ALL', '2013', '2014', '2015'].map((yr) => (
            <button
              key={yr}
              onClick={() => setFilterYear(yr)}
              className={`px-3 py-1 rounded-md transition-all ${
                filterYear === yr
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {yr === 'ALL' ? 'Entire Period' : yr}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              stroke="#94a3b8"
              fontSize={11}
              dy={5}
            />
            <YAxis
              tickLine={false}
              stroke="#94a3b8"
              fontSize={11}
              tickFormatter={(v) => formatCurrency(v, { compact: true })}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#2563eb"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#salesGradient)"
              activeDot={{ r: 6, fill: '#1d4ed8', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesTrendChart;
