import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { STORE_TYPE_ANALYSIS } from '../../services/dataService';
import { formatCurrency } from '../../utils/formatters';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs border border-slate-800">
        <p className="font-bold text-white">{data.type} ({data.label})</p>
        <p className="text-blue-400 font-semibold mt-1">
          {formatCurrency(data.totalSales, { compact: false })} ({data.percentage}%)
        </p>
        <div className="mt-1 pt-1 border-t border-slate-800 text-[11px] text-slate-300">
          <p>Stores: {data.storeCount} locations</p>
          <p>Daily Avg: {formatCurrency(data.avgSales)}</p>
        </div>
      </div>
    );
  }
  return null;
};

export const StoreTypeDonutChart = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
      <div className="mb-2">
        <h3 className="text-base font-bold text-slate-900">Revenue Contribution by Store Type</h3>
        <p className="text-xs text-slate-500 mt-0.5">Share of aggregate network revenue across 4 store models</p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={STORE_TYPE_ANALYSIS}
              dataKey="totalSales"
              nameKey="type"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
            >
              {STORE_TYPE_ANALYSIS.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} stroke="#ffffff" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
        {STORE_TYPE_ANALYSIS.map((item) => (
          <div key={item.type} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
            <div className="flex-1 flex justify-between overflow-hidden">
              <span className="font-medium text-slate-700 truncate">{item.type}</span>
              <span className="font-bold text-slate-900">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoreTypeDonutChart;
