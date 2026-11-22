import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Store,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  CircleDot
} from 'lucide-react';

export const Sidebar = ({ activePage, onNavigate, isCollapsed, onToggleCollapse }) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      desc: 'Executive summary & key metrics'
    },
    {
      id: 'analytics',
      label: 'Sales Analytics',
      icon: BarChart3,
      badge: null,
      desc: 'Multidimensional trends & seasonality'
    },
    {
      id: 'forecasting',
      label: 'Sales Forecasting',
      icon: TrendingUp,
      badge: 'ML Powered',
      desc: 'Recursive XGBoost weekly predictions'
    },
    {
      id: 'stores',
      label: 'Store Performance',
      icon: Store,
      badge: '1,115 Stores',
      desc: 'Location rankings & type analysis'
    },
    {
      id: 'reports',
      label: 'Reports & Validation',
      icon: FileText,
      badge: null,
      desc: 'Model metrics & CSV downloads'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: null,
      desc: 'System config & API diagnostics'
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen bg-white border-r border-slate-200 transition-all duration-300 flex flex-col justify-between ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header / Branding */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xs shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div className="flex flex-col truncate">
                <span className="text-base font-bold text-slate-900 tracking-tight leading-tight flex items-center gap-1.5">
                  RetailPulse
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded-sm border border-blue-200">
                    Pro
                  </span>
                </span>
                <span className="text-[11px] text-slate-500 font-medium truncate">
                  Analytics & ML Platform
                </span>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="w-full flex justify-center">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Layers className="w-5 h-5" />
              </div>
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ${
              isCollapsed ? 'hidden' : 'block'
            }`}
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="p-3 space-y-1">
          {!isCollapsed && (
            <p className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Platform Modules
            </p>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-600 rounded-r-md" />
                )}

                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />

                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between overflow-hidden">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          item.badge === 'ML Powered'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom User Profile Section */}
      <div className="p-3 border-t border-slate-100">
        {isCollapsed ? (
          <div className="flex justify-center">
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              title="Expand sidebar"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  SS
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-slate-800 truncate">Sohan Shetty</span>
                <span className="text-[11px] text-slate-500 truncate">Lead Data Analyst</span>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500" title="Online" />
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
