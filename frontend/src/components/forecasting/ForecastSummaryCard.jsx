import React from 'react';
import {
  TrendingUp,
  Store,
  Calendar,
  Layers,
  Sparkles,
  Download,
  RotateCcw
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToCSV } from '../../utils/exportUtils';

export const ForecastSummaryCard = ({ forecastResult, onReset }) => {
  if (!forecastResult) return null;

  const {
    store_id,
    forecast_horizon_weeks,
    total_predicted_sales,
    historical_data_through,
    weekly_forecasts = [],
    model = 'XGBoost',
  } = forecastResult;

  const averageWeekly = total_predicted_sales / (forecast_horizon_weeks || 1);

  const handleExport = () => {
    const exportData = weekly_forecasts.map((item, idx) => ({
      'Week Number': idx + 1,
      'Store ID': item.store_id,
      'Week Start': item.week_start,
      'Predicted Weekly Sales (INR)': item.predicted_weekly_sales,
      'Estimated Daily Average (INR)': (item.predicted_weekly_sales / 7).toFixed(2),
    }));

    exportToCSV(exportData, `store_${store_id}_sales_forecast_${forecast_horizon_weeks}w`);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-6 shadow-md border border-slate-700/60">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-700/70">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-blue-400" />
              {model} Recursive Model
            </span>
            <span className="text-xs text-slate-400">
              Horizon: <strong className="text-white">{forecast_horizon_weeks} Weeks</strong>
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1.5 tracking-tight flex items-center gap-2">
            Store #{store_id} Sales Forecast
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Historical baseline through: <strong className="text-slate-200">{formatDate(historical_data_through)}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-blue-300" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onReset}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Forecast</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
          <span className="text-xs font-medium text-slate-400 block">Total Projected Revenue</span>
          <span className="text-2xl font-black text-blue-400 mt-1 block tracking-tight">
            {formatCurrency(total_predicted_sales)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {formatCurrency(total_predicted_sales, { compact: true })} across {forecast_horizon_weeks} wks
          </span>
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
          <span className="text-xs font-medium text-slate-400 block">Weekly Run-Rate</span>
          <span className="text-2xl font-bold text-white mt-1 block tracking-tight">
            {formatCurrency(averageWeekly)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Average per week
          </span>
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
          <span className="text-xs font-medium text-slate-400 block">Estimated Daily Pace</span>
          <span className="text-2xl font-bold text-white mt-1 block tracking-tight">
            {formatCurrency(averageWeekly / 7)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Per day average
          </span>
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
          <span className="text-xs font-medium text-slate-400 block">Model Convergence</span>
          <span className="text-2xl font-bold text-emerald-400 mt-1 block tracking-tight">
            95.78% R²
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Validation WAPE: 5.17%
          </span>
        </div>
      </div>
    </div>
  );
};

export default ForecastSummaryCard;
