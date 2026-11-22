import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Cpu,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';

export const Navbar = ({ activePage, isSidebarCollapsed }) => {
  const [apiHealth, setApiHealth] = useState({ status: 'checking', message: 'Checking API...' });
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const pageMeta = {
    dashboard: {
      title: 'Executive Dashboard',
      breadcrumb: ['Overview', 'Executive KPI Summary'],
      desc: 'High-level business intelligence, network revenue trends, and operational metrics.'
    },
    analytics: {
      title: 'Sales & Channel Analytics',
      breadcrumb: ['Analytics', 'Historical Performance'],
      desc: 'Multidimensional sales trends, store type shares, weekday patterns, and promotion lift.'
    },
    forecasting: {
      title: 'Sales Forecasting Engine',
      breadcrumb: ['Predictive ML', 'XGBoost Weekly Forecasting'],
      desc: 'Recursive multi-week sales predictions based on promotional schedules and calendar holidays.'
    },
    stores: {
      title: 'Store Performance Rankings',
      breadcrumb: ['Store Network', 'Location Rankings'],
      desc: 'Rankings, customer volumes, and assortment models for all 1,115 retail locations.'
    },
    reports: {
      title: 'Reports & Model Validation',
      breadcrumb: ['Reporting', 'Validation Metrics'],
      desc: 'Evaluation metrics, feature importances, and exportable analytical datasets.'
    },
    settings: {
      title: 'Platform Settings & Diagnostics',
      breadcrumb: ['Configuration', 'System Health'],
      desc: 'API connectivity, ML model parameters, and database integration status.'
    }
  };

  const currentMeta = pageMeta[activePage] || pageMeta.dashboard;

  const checkHealth = async () => {
    try {
      setApiHealth({ status: 'checking', message: 'Connecting...' });
      const data = await api.getHealth();
      if (data.status === 'healthy') {
        setApiHealth({
          status: 'online',
          message: `${data.model_name || 'XGBoost'} (8-Wk)`,
          details: data
        });
      } else {
        setApiHealth({ status: 'warning', message: 'API Warning' });
      }
    } catch {
      setApiHealth({ status: 'offline', message: 'Backend Offline' });
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-6 flex items-center justify-between transition-all">
      {/* Page Title & Breadcrumbs */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span>Home</span>
          <span>/</span>
          {currentMeta.breadcrumb.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <span className={idx === currentMeta.breadcrumb.length - 1 ? 'text-blue-600 font-semibold' : ''}>
                {crumb}
              </span>
              {idx < currentMeta.breadcrumb.length - 1 && <span>/</span>}
            </React.Fragment>
          ))}
        </div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
          {currentMeta.title}
        </h1>
      </div>

      {/* Right Action Cluster */}
      <div className="flex items-center gap-3">
        {/* Search Field */}
        <div className="relative hidden md:block w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search stores, metrics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder-slate-400 transition-all"
          />
        </div>

        {/* Live Backend Connection Status Pill */}
        <div
          onClick={checkHealth}
          className={`cursor-pointer inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            apiHealth.status === 'online'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70'
              : apiHealth.status === 'checking'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/70'
          }`}
          title="Click to re-ping FastAPI backend (http://127.0.0.1:8000)"
        >
          <span className="relative flex h-2 w-2">
            {apiHealth.status === 'online' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                apiHealth.status === 'online'
                  ? 'bg-emerald-500'
                  : apiHealth.status === 'checking'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
          </span>
          <span className="truncate max-w-[150px]">{apiHealth.message}</span>
          <RefreshCw className="w-3 h-3 text-slate-400" />
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-4 z-50 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800">System Notifications</span>
                <span className="text-[10px] text-blue-600 font-semibold cursor-pointer">Mark read</span>
              </div>
              <div className="mt-3 space-y-2.5">
                <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100 text-emerald-900 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">FastAPI Backend Active</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">Connected to XGBoost Weekly Model at port 8000.</p>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-blue-50/60 border border-blue-100 text-blue-900 flex items-start gap-2">
                  <Cpu className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">1,017,209 Historical Records</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">PostgreSQL verified schema with 1,115 stores.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
