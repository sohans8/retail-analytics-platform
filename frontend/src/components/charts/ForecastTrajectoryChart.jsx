import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { formatCurrency, formatDate } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs border border-slate-800">
        <p className="font-bold text-white">Week Starting: {formatDate(label)}</p>
        <p className="text-base font-bold text-blue-400 mt-1">
          {formatCurrency(payload[0].value)}
        </p>
        <div className="mt-1 pt-1 border-t border-slate-800 text-[11px] text-slate-300">
          <p>Estimated Daily Avg: {formatCurrency(payload[0].value / 7)}</p>
          {data.promo_days !== undefined && (
            <p>Scheduled Promo Days: {data.promo_days} days</p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const ForecastTrajectoryChart = ({ weeklyForecasts = [], totalPredicted = 0 }) => {
  if (!weeklyForecasts.length) return null;

  const chartData = weeklyForecasts.map((item, idx) => ({
    weekNumber: `Week ${idx + 1}`,
    weekStart: item.week_start,
    predictedSales: item.predicted_weekly_sales,
    ...item
  }));

  const avgWeekly = totalPredicted / weeklyForecasts.length;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Predicted Sales Trajectory</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Recursive XGBoost multi-week projection with schedule-adjusted parameters
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>Predicted Weekly Sales</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-slate-500">
            <span className="w-3 border-t-2 border-dashed border-amber-500" />
            <span>Horizon Mean ({formatCurrency(avgWeekly, { compact: true })})</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="weekStart"
              tickFormatter={(v) => formatDate(v)}
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
            <ReferenceLine
              y={avgWeekly}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="predictedSales"
              stroke="#2563eb"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#forecastGradient)"
              activeDot={{ r: 6, fill: '#1d4ed8', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ForecastTrajectoryChart;
