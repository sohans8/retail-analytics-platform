import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { PROMOTION_ANALYSIS, BUSINESS_OVERVIEW } from '../../services/dataService';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { Sparkles, ArrowUpRight } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs border border-slate-800">
        <p className="font-bold text-white">{data.status}</p>
        <p className="text-blue-400 font-semibold mt-1">
          Daily Average: {formatCurrency(data.avgSales)}
        </p>
        <div className="mt-1 pt-1 border-t border-slate-800 text-[11px] text-slate-300">
          <p>Total Revenue: {formatCurrency(data.totalSales, { compact: true })}</p>
          <p>Avg Customers: {formatNumber(data.avgCustomers)} per day</p>
          <p>Operational Days: {formatNumber(data.recordCount)} records</p>
        </div>
      </div>
    );
  }
  return null;
};

export const PromotionImpactBarChart = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="text-base font-bold text-slate-900">Promotion Revenue Impact</h3>
          <p className="text-xs text-slate-500 mt-0.5">Average daily sales comparing active campaigns vs organic</p>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>+{BUSINESS_OVERVIEW.averagePromotionLift}% Lift</span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={PROMOTION_ANALYSIS} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="status" tickLine={false} stroke="#94a3b8" fontSize={11} dy={5} />
            <YAxis
              tickLine={false}
              stroke="#94a3b8"
              fontSize={11}
              tickFormatter={(v) => formatCurrency(v, { compact: true })}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="avgSales" radius={[6, 6, 0, 0]} maxBarSize={60}>
              {PROMOTION_ANALYSIS.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
        <span className="flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          Empirical Promotion Uplift
        </span>
        <span className="font-semibold text-slate-800">
          +{formatCurrency(PROMOTION_ANALYSIS[1].avgSales - PROMOTION_ANALYSIS[0].avgSales)} / store / day
        </span>
      </div>
    </div>
  );
};

export default PromotionImpactBarChart;
