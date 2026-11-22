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
import { TOP_STORES } from '../../services/dataService';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs border border-slate-800">
        <p className="font-bold text-white">Store #{data.storeId}</p>
        <p className="text-[11px] text-slate-300">Type: {data.storeType.toUpperCase()} • Assortment: {data.assortment}</p>
        <div className="mt-2 pt-2 border-t border-slate-800 space-y-1">
          <p className="font-semibold text-blue-400">Total: {formatCurrency(data.totalSales)}</p>
          <p className="text-slate-300">Daily Avg: {formatCurrency(data.avgSales)}</p>
          <p className="text-slate-400">Customers: {formatNumber(data.totalCustomers)}</p>
        </div>
      </div>
    );
  }
  return null;
};

export const StorePerformanceChart = ({ limit = 8 }) => {
  const chartData = TOP_STORES.slice(0, limit);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900">Top Performing Stores</h3>
          <p className="text-xs text-slate-500 mt-0.5">Highest grossing locations ranked by total network sales</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md">
          Top {limit} Stores
        </span>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="storeId"
              tickFormatter={(id) => `Store ${id}`}
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
            <Bar
              dataKey="totalSales"
              fill="#2563eb"
              radius={[4, 4, 0, 0]}
              maxBarSize={38}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StorePerformanceChart;
