import React from 'react';

export const KpiCard = ({
  title,
  value,
  subvalue,
  badgeText,
  badgeType = 'positive', // 'positive' | 'negative' | 'neutral' | 'blue'
  icon: Icon,
  trend,
  className = '',
}) => {
  const getBadgeClasses = () => {
    switch (badgeType) {
      case 'positive':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'negative':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
          </div>
        </div>
        {Icon && (
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 shrink-0">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        {subvalue && (
          <span className="text-slate-500 font-medium truncate" title={subvalue}>
            {subvalue}
          </span>
        )}
        {badgeText && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getBadgeClasses()}`}
          >
            {trend === 'up' && '↑ '}
            {trend === 'down' && '↓ '}
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
};

export default KpiCard;
