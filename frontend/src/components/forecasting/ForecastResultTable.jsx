import React from 'react';
import { Calendar, Tag, TrendingUp, Info } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const ForecastResultTable = ({ weeklyForecasts = [], schedule = [], totalPredicted = 0 }) => {
  if (!weeklyForecasts.length) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Weekly Forecast Breakdown</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual weekly sales predictions generated recursively by XGBoost
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
          {weeklyForecasts.length} Calendar Weeks
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Week</th>
              <th className="py-3 px-4">Week Start Date</th>
              <th className="py-3 px-4">Scheduled Promo</th>
              <th className="py-3 px-4">Holidays</th>
              <th className="py-3 px-4 text-right">Predicted Sales</th>
              <th className="py-3 px-4 text-right">Daily Run-Rate</th>
              <th className="py-3 px-4 text-right">Share of Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {weeklyForecasts.map((item, idx) => {
              const weekSchedule = schedule[idx] || {};
              const share = totalPredicted > 0 ? (item.predicted_weekly_sales / totalPredicted) * 100 : 0;
              const isPromoActive = (weekSchedule.promo_days || 0) > 0;

              return (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    Week {idx + 1}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(item.week_start)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {isPromoActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <Tag className="w-3 h-3 text-blue-600" />
                        {weekSchedule.promo_days} Promo Days
                      </span>
                    ) : (
                      <span className="text-slate-400">0 days (No promo)</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {(weekSchedule.school_holiday_days || 0) > 0 || (weekSchedule.state_holiday_days || 0) > 0 ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                        {weekSchedule.school_holiday_days || 0} school / {weekSchedule.state_holiday_days || 0} state
                      </span>
                    ) : (
                      <span className="text-slate-400">Regular week</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 text-sm">
                    {formatCurrency(item.predicted_weekly_sales)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600 font-medium">
                    {formatCurrency(item.predicted_weekly_sales / 7)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      {share.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900 text-xs">
            <tr>
              <td colSpan={4} className="py-3 px-4 uppercase tracking-wider text-slate-600">
                Total Horizon Projection
              </td>
              <td className="py-3 px-4 text-right text-sm text-blue-700">
                {formatCurrency(totalPredicted)}
              </td>
              <td className="py-3 px-4 text-right text-slate-700">
                {formatCurrency(totalPredicted / (weeklyForecasts.length * 7 || 1))}
              </td>
              <td className="py-3 px-4 text-right">
                100.0%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default ForecastResultTable;
