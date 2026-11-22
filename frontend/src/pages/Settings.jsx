import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Server,
  Cpu,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import api from '../services/api';

export const Settings = () => {
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState(null);
  const [modelFeatures, setModelFeatures] = useState(null);

  const testConnection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);

    const startTime = performance.now();
    try {
      const data = await api.getHealth();
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      setConnectionResult({
        success: true,
        message: 'FastAPI Backend Online & Operational',
        latency: `${latency}ms`,
        details: data
      });
    } catch (err) {
      setConnectionResult({
        success: false,
        message: err.message || 'Unable to connect to backend',
        details: null
      });
    } finally {
      setTestingConnection(false);
    }
  };

  useEffect(() => {
    testConnection();

    // Fetch feature list
    api.getModelFeatures()
      .then((data) => setModelFeatures(data))
      .catch((err) => console.log('Feature fetch note:', err.message));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-blue-600" />
          <span>System Settings & Architecture Diagnostics</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Verify API connections, model feature inputs, and data pipeline integrity.
        </p>
      </div>

      {/* API Connectivity Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">FastAPI Backend Connection</h3>
          </div>
          {connectionResult && (
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 ${
                connectionResult.success
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {connectionResult.success ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Connected ({connectionResult.latency})</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Disconnected</span>
                </>
              )}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              API Base URL
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="http://127.0.0.1:8000"
            />
          </div>

          <div>
            <button
              onClick={testConnection}
              disabled={testingConnection}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
              <span>{testingConnection ? 'Testing...' : 'Test Connection'}</span>
            </button>
          </div>
        </div>

        {connectionResult && (
          <div
            className={`p-3.5 rounded-lg text-xs leading-relaxed border ${
              connectionResult.success
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/60 border-rose-200 text-rose-900'
            }`}
          >
            <p className="font-semibold">{connectionResult.message}</p>
            {connectionResult.details && (
              <p className="text-[11px] text-slate-600 mt-1">
                Model: <strong>{connectionResult.details.model_name}</strong> • Horizon:{' '}
                <strong>{connectionResult.details.forecast_horizon_weeks} weeks</strong>
              </p>
            )}
          </div>
        )}
      </div>

      {/* ML Model Architecture & Features Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Cpu className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">Machine Learning Model Artifact</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[11px] font-medium">Model Algorithm</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">XGBoost Regressor</span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Recursive weekly lag formulation</span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[11px] font-medium">Trained Feature Dimensions</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">
              {modelFeatures ? `${modelFeatures.total_features} Features` : '1,146 Features'}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Categorical OHE + Temporal + Lags</span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[11px] font-medium">Model Persistence Path</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block font-mono text-[11px] truncate">
              xgboost_weekly_sales.joblib
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Single-file artifact with preprocessors</span>
          </div>
        </div>

        {modelFeatures && (
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Key Numeric Model Input Features
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {modelFeatures.numeric_features?.map((f) => (
                <span
                  key={f}
                  className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[11px]"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Database & Infrastructure Specs */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Database className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">Database & Pipeline Architecture</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
            <span className="font-bold text-slate-800 block text-sm">PostgreSQL Schema Specifications</span>
            <ul className="space-y-1.5 text-slate-600 text-xs">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span>Primary Entity: <code className="bg-slate-200 px-1 rounded">stores</code> (1,115 rows)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span>Transactional Entity: <code className="bg-slate-200 px-1 rounded">sales</code> (1,017,209 rows)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span>Foreign Key: <code className="bg-slate-200 px-1 rounded">fk_sales_store</code> on <code className="bg-slate-200 px-1 rounded">store_id</code></span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
            <span className="font-bold text-slate-800 block text-sm">High-Throughput Ingestion Specs</span>
            <ul className="space-y-1.5 text-slate-600 text-xs">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>Streaming Protocol: PostgreSQL binary COPY with in-memory <code className="bg-slate-200 px-1 rounded">StringIO</code></span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>Chunk Size: 100,000 records per batch</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>Total Ingestion Duration: &lt; 30 seconds</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
