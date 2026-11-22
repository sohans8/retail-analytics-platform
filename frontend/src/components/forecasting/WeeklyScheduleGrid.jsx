import React from 'react';
import { Tag, Calendar, Sparkles, AlertCircle } from 'lucide-react';

export const WeeklyScheduleGrid = ({ schedule = [], onChangeSchedule }) => {
  const updateWeek = (index, field, value) => {
    const numValue = Math.max(0, Math.min(7, parseInt(value, 10) || 0));
    const newSchedule = schedule.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: numValue };
      }
      return item;
    });
    onChangeSchedule(newSchedule);
  };

  const applyPreset = (presetType) => {
    const newSchedule = schedule.map((item, idx) => {
      switch (presetType) {
        case 'all_promos':
          return { ...item, promo_days: 5, school_holiday_days: 0, state_holiday_days: 0 };
        case 'no_promos':
          return { ...item, promo_days: 0, school_holiday_days: 0, state_holiday_days: 0 };
        case 'alternate':
          return { ...item, promo_days: idx % 2 === 0 ? 5 : 0, school_holiday_days: 0, state_holiday_days: 0 };
        case 'holiday_season':
          return { ...item, promo_days: 5, school_holiday_days: 3, state_holiday_days: 1 };
        default:
          return item;
      }
    });
    onChangeSchedule(newSchedule);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Future Weekly Operational Schedule
          </label>
          <p className="text-xs text-slate-500">
            Define promotional campaigns and holiday calendars for each forecasted week (0–7 days).
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-400">Presets:</span>
          <button
            type="button"
            onClick={() => applyPreset('all_promos')}
            className="px-2 py-1 text-[11px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
          >
            All Promos (5d)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('alternate')}
            className="px-2 py-1 text-[11px] font-medium bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
          >
            Bi-Weekly
          </button>
          <button
            type="button"
            onClick={() => applyPreset('no_promos')}
            className="px-2 py-1 text-[11px] font-medium bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
          >
            No Promo (0d)
          </button>
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-16">Week</th>
                <th className="py-2.5 px-3 min-w-[130px]">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-600" />
                    <span>Promo Days (0–7)</span>
                  </div>
                </th>
                <th className="py-2.5 px-3 min-w-[130px]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>School Holiday (0–7)</span>
                  </div>
                </th>
                <th className="py-2.5 px-3 min-w-[130px]">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>State Holiday (0–7)</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schedule.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-800">
                    Week {idx + 1}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="7"
                        value={item.promo_days}
                        onChange={(e) => updateWeek(idx, 'promo_days', e.target.value)}
                        className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold text-center focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <span className="text-[11px] text-slate-400">
                        {item.promo_days > 0 ? (
                          <span className="text-blue-600 font-medium">Active</span>
                        ) : (
                          'Off'
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="0"
                      max="7"
                      value={item.school_holiday_days}
                      onChange={(e) => updateWeek(idx, 'school_holiday_days', e.target.value)}
                      className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold text-center focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="0"
                      max="7"
                      value={item.state_holiday_days}
                      onChange={(e) => updateWeek(idx, 'state_holiday_days', e.target.value)}
                      className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold text-center focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
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

export default WeeklyScheduleGrid;
