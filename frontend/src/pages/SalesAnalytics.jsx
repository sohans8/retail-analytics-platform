import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Filter,
  Layers,
  ArrowUpRight,
  Sparkles,
  PieChart as PieIcon,
  Tag,
  AlertCircle
} from 'lucide-react';
import SalesTrendChart from '../components/charts/SalesTrendChart';
import StorePerformanceChart from '../components/charts/StorePerformanceChart';
import StoreTypeDonutChart from '../components/charts/StoreTypeDonutChart';
import PromotionImpactBarChart from '../components/charts/PromotionImpactBarChart';
import WeekdayPatternChart from '../components/charts/WeekdayPatternChart';
import {
  HOLIDAY_ANALYSIS,
  STORE_TYPE_ANALYSIS,
  WEEKDAY_ANALYSIS,
  PROMOTION_ANALYSIS,
  BUSINESS_OVERVIEW
} from '../services/dataService';
import { formatCurrency, formatNumber } from '../utils/formatters';

export const SalesAnalytics = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Sales & Channel Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Deep-dive multi-dimensional performance across temporal, promotional, holiday, and store-format dimensions.
          </p>
        </div>

        {/* Global Dataset Context */}
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg">
          <span>Total Cohort: 1,017,209 Daily Sales Records</span>
        </div>
      </div>

      {/* Primary Historical Trajectory */}
      <SalesTrendChart title="Longitudinal Historical Revenue (2013–2015)" />

      {/* 2-Column: Store Types & Promotion Lift */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StoreTypeDonutChart />
        <PromotionImpactBarChart />
      </div>

      {/* Weekday Performance */}
      <WeekdayPatternChart />

      {/* Holiday Impact Analysis Section */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Holiday Footfall & Sales Impact</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Empirical variance across regular days, school holidays, and public state holidays (a=Public, b=Easter, c=Christmas)
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md">
            Easter & Christmas Surges
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Holiday Category</th>
                <th className="py-2.5 px-3">State Holiday Code</th>
                <th className="py-2.5 px-3">School Holiday</th>
                <th className="py-2.5 px-3 text-right">Operational Records</th>
                <th className="py-2.5 px-3 text-right">Avg Daily Sales</th>
                <th className="py-2.5 px-3 text-right">Avg Customers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {HOLIDAY_ANALYSIS.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    {item.category}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 text-slate-700">
                      {item.stateHoliday === '0' ? 'None (0)' : `Type '${item.stateHoliday}'`}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {item.schoolHoliday ? (
                      <span className="text-amber-700 font-semibold">Yes</span>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600 font-medium">
                    {formatNumber(item.records)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    {formatCurrency(item.avgSales)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-700 font-semibold">
                    {formatNumber(item.avgCustomers)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesAnalytics;
