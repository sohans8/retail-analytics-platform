import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Store,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Filter,
  Layers,
  Award,
  Zap,
  Tag
} from 'lucide-react';
import KpiCard from '../components/common/KpiCard';
import SalesTrendChart from '../components/charts/SalesTrendChart';
import StorePerformanceChart from '../components/charts/StorePerformanceChart';
import StoreTypeDonutChart from '../components/charts/StoreTypeDonutChart';
import PromotionImpactBarChart from '../components/charts/PromotionImpactBarChart';
import WeekdayPatternChart from '../components/charts/WeekdayPatternChart';
import { BUSINESS_OVERVIEW, TOP_STORES } from '../services/dataService';
import { formatCurrency, formatNumber } from '../utils/formatters';
import api from '../services/api';

export const Dashboard = ({ onNavigate }) => {
  const [modelMetrics, setModelMetrics] = useState(null);
  const [selectedStoreType, setSelectedStoreType] = useState('ALL');

  useEffect(() => {
    // Fetch live evaluation metrics from backend
    api.getMetrics()
      .then((data) => setModelMetrics(data.evaluation))
      .catch((err) => console.log('Backend metrics load note:', err.message));
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Context */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-2">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span>Retail Operations & Machine Learning Analytics</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
            Retail Sales Performance & Predictive Intelligence
          </h2>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Enterprise analytics across 1,115 stores and 1.01M daily transactions.
            Coupled with an XGBoost forecasting model trained on recursive weekly lags.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('forecasting')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer hover:shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch Sales Forecast</span>
          </button>
        </div>
      </div>

      {/* 4 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Network Sales"
          value={formatCurrency(BUSINESS_OVERVIEW.totalSales, { compact: true })}
          subvalue="1,017,209 operational records"
          badgeText="Verified Total"
          badgeType="blue"
          icon={DollarSign}
        />

        <KpiCard
          title="Average Weekly Sales"
          value={formatCurrency(BUSINESS_OVERVIEW.averageWeeklySales)}
          subvalue="Benchmark per active store/week"
          badgeText="+38.8% on Promo"
          badgeType="positive"
          trend="up"
          icon={TrendingUp}
        />

        <KpiCard
          title="Active Store Network"
          value={formatNumber(BUSINESS_OVERVIEW.totalStores)}
          subvalue="Across 4 store tiers (a, b, c, d)"
          badgeText="602 Type-A Stores"
          badgeType="neutral"
          icon={Store}
        />

        <KpiCard
          title="ML Forecast Model"
          value={modelMetrics ? `${(modelMetrics.R2 * 100).toFixed(2)}% R²` : '95.78% R²'}
          subvalue={modelMetrics ? `WAPE: ${modelMetrics.WAPE_Percent.toFixed(2)}%` : 'WAPE: 5.17%'}
          badgeText="XGBoost v1.1"
          badgeType="positive"
          icon={Sparkles}
        />
      </div>

      {/* Row 1: Sales Trend (Main) & Store Type Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesTrendChart />
        </div>
        <div className="lg:col-span-1">
          <StoreTypeDonutChart />
        </div>
      </div>

      {/* Row 2: Top Stores Bar & Promotion Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StorePerformanceChart limit={8} />
        </div>
        <div className="lg:col-span-1">
          <PromotionImpactBarChart />
        </div>
      </div>

      {/* Row 3: Weekday Sales Pattern */}
      <div className="grid grid-cols-1 gap-6">
        <WeekdayPatternChart />
      </div>

      {/* Quick Store Forecast Spotlight */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Featured Store Locations</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any high-volume flagship store to forecast next quarter weekly sales
            </p>
          </div>
          <button
            onClick={() => onNavigate('stores')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
          >
            <span>View all 1,115 stores</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {TOP_STORES.slice(0, 4).map((s) => (
            <div
              key={s.storeId}
              className="p-3.5 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:shadow-xs transition-all bg-slate-50/50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Store #{s.storeId}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-blue-100/80 text-blue-800">
                    Rank #{s.rank}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Type: {s.storeType.toUpperCase()} • {s.assortment}
                </p>
                <p className="text-sm font-bold text-slate-900 mt-2">
                  {formatCurrency(s.totalSales, { compact: true })}
                </p>
              </div>

              <button
                onClick={() => onNavigate('forecasting')}
                className="mt-3 w-full py-1.5 px-2 bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 hover:border-blue-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Forecast Sales</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
