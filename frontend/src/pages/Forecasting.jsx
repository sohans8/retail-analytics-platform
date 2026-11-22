import React, { useState } from 'react';
import {
  TrendingUp,
  Sparkles,
  Calendar,
  Store,
  Layers,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  Clock,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import WeeklyScheduleGrid from '../components/forecasting/WeeklyScheduleGrid';
import ForecastSummaryCard from '../components/forecasting/ForecastSummaryCard';
import ForecastTrajectoryChart from '../components/charts/ForecastTrajectoryChart';
import ForecastResultTable from '../components/forecasting/ForecastResultTable';
import EmptyState from '../components/common/EmptyState';
import api from '../services/api';
import { TOP_STORES } from '../services/dataService';

export const Forecasting = ({ initialStoreId = 1 }) => {
  const [storeId, setStoreId] = useState(initialStoreId);
  const [horizonWeeks, setHorizonWeeks] = useState(4);
  const [schedule, setSchedule] = useState([
    { promo_days: 5, school_holiday_days: 0, state_holiday_days: 0 },
    { promo_days: 0, school_holiday_days: 0, state_holiday_days: 0 },
    { promo_days: 5, school_holiday_days: 2, state_holiday_days: 0 },
    { promo_days: 0, school_holiday_days: 0, state_holiday_days: 0 },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [forecastResult, setForecastResult] = useState(null);

  // Sync schedule array length whenever horizonWeeks changes
  const handleHorizonChange = (newHorizon) => {
    const horizon = Math.max(1, Math.min(12, parseInt(newHorizon, 10) || 1));
    setHorizonWeeks(horizon);

    setSchedule((prev) => {
      if (prev.length === horizon) return prev;
      if (prev.length < horizon) {
        // Add additional weeks with default configuration
        const additions = Array.from({ length: horizon - prev.length }).map((_, i) => ({
          promo_days: (prev.length + i) % 2 === 0 ? 5 : 0,
          school_holiday_days: 0,
          state_holiday_days: 0,
        }));
        return [...prev, ...additions];
      }
      // Truncate to horizon
      return prev.slice(0, horizon);
    });
  };

  const handleGenerateForecast = async (e) => {
    e?.preventDefault();
    setError(null);

    // Validate inputs
    if (!storeId || storeId < 1 || storeId > 1115) {
      setError('Please select a valid store ID between 1 and 1,115.');
      return;
    }

    if (schedule.length !== horizonWeeks) {
      setError(`The future schedule length (${schedule.length}) must match the selected horizon (${horizonWeeks}).`);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        store_id: parseInt(storeId, 10),
        horizon_weeks: parseInt(horizonWeeks, 10),
        future_schedule: schedule.map((item) => ({
          promo_days: parseInt(item.promo_days, 10) || 0,
          school_holiday_days: parseInt(item.school_holiday_days, 10) || 0,
          state_holiday_days: parseInt(item.state_holiday_days, 10) || 0,
        })),
      };

      const response = await api.generateForecast(payload);
      setForecastResult(response);
    } catch (err) {
      console.error('Forecast request failed:', err);
      setError(err.message || 'Failed to generate forecast. Please check API server connectivity.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForecastResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>AI Sales Forecasting Engine</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Generate recursive multi-week sales predictions powered by the production XGBoost model (`/forecast`).
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Recursive 1 to 12-Week Horizons</span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Forecasting Error</h4>
            <p className="mt-0.5 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Forecast Configuration Form Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
        <form onSubmit={handleGenerateForecast} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Store Selection */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Target Store Location
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="1"
                  max="1115"
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Enter Store ID (1-1115)"
                  required
                />
              </div>

              {/* Quick Store Buttons */}
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400">Popular:</span>
                {[1, 262, 817, 562, 1114].map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setStoreId(id)}
                    className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                      parseInt(storeId, 10) === id
                        ? 'bg-blue-600 text-white border-blue-600 font-bold'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    #{id}
                  </button>
                ))}
              </div>
            </div>

            {/* Forecast Horizon (Weeks) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Forecast Horizon
                </label>
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {horizonWeeks} {horizonWeeks === 1 ? 'Week' : 'Weeks'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                value={horizonWeeks}
                onChange={(e) => handleHorizonChange(e.target.value)}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                <span>1 Wk</span>
                <span>4 Wks (1 Mo)</span>
                <span>8 Wks (2 Mo)</span>
                <span>12 Wks (1 Qtr)</span>
              </div>
            </div>

            {/* Horizon Presets */}
            <div className="flex flex-col justify-end">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Horizon Quick Select
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[2, 4, 8, 12].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => handleHorizonChange(w)}
                    className={`py-2 px-1 text-xs font-bold rounded-lg border text-center transition-all ${
                      horizonWeeks === w
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {w}W
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly Schedule Grid */}
          <div className="pt-4 border-t border-slate-100">
            <WeeklyScheduleGrid
              schedule={schedule}
              onChangeSchedule={setSchedule}
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Recursively calculates dynamic lag & rolling mean features</span>
            </div>

            <div className="flex items-center gap-3">
              {forecastResult && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Clear Results
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                  loading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Executing XGBoost Model...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Forecast</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Forecast Output Results */}
      {forecastResult ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Summary Hero Card */}
          <ForecastSummaryCard
            forecastResult={forecastResult}
            onReset={handleReset}
          />

          {/* Interactive Trajectory Chart */}
          <ForecastTrajectoryChart
            weeklyForecasts={forecastResult.weekly_forecasts}
            totalPredicted={forecastResult.total_predicted_sales}
          />

          {/* Detailed Table */}
          <ForecastResultTable
            weeklyForecasts={forecastResult.weekly_forecasts}
            schedule={schedule}
            totalPredicted={forecastResult.total_predicted_sales}
          />
        </div>
      ) : (
        <EmptyState
          icon={TrendingUp}
          title="No Active Forecast Generated"
          description="Configure your target store, forecast horizon (1–12 weeks), and promotional schedule above, then click 'Generate Forecast' to trigger real-time predictions."
          actionLabel="Generate 4-Week Sample Forecast"
          onAction={handleGenerateForecast}
        />
      )}
    </div>
  );
};

export default Forecasting;
