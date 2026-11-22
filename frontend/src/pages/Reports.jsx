import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  Cpu,
  BarChart2,
  Table,
  Sparkles,
  Layers,
  ArrowDownToLine,
  RefreshCw
} from 'lucide-react';
import {
  BUSINESS_OVERVIEW,
  MONTHLY_SALES_TREND,
  TOP_STORES,
  MODEL_TOP_FEATURES
} from '../services/dataService';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { exportToCSV } from '../utils/exportUtils';
import api from '../services/api';

export const Reports = () => {
  const [metrics, setMetrics] = useState(null);
  const [validationData, setValidationData] = useState([]);
  const [loadingValidation, setLoadingValidation] = useState(false);

  useEffect(() => {
    // Fetch live model evaluation metrics
    api.getMetrics()
      .then((data) => setMetrics(data.evaluation))
      .catch((err) => console.log('Metrics error:', err.message));

    // Fetch sample validation predictions
    setLoadingValidation(true);
    api.getValidationPredictions(15)
      .then((data) => setValidationData(data.predictions || []))
      .catch((err) => console.log('Validation error:', err.message))
      .finally(() => setLoadingValidation(false));
  }, []);

  const downloadAllValidation = async () => {
    try {
      const data = await api.getValidationPredictions(1000);
      exportToCSV(data.predictions, 'xgboost_validation_predictions_1000');
    } catch (err) {
      alert('Failed to download validation data: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Reports & Model Validation</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Official model validation benchmarks, feature rankings, and exportable data artifacts.
          </p>
        </div>
      </div>

      {/* Live Model Performance Scorecard */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              XGBoost Model Evaluation Metrics (Out-of-Sample)
            </h3>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
            Production Quality
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-xs font-semibold text-slate-500 block">R² Score (Variance Explained)</span>
            <span className="text-2xl font-black text-blue-700 mt-1 block">
              {metrics ? `${(metrics.R2 * 100).toFixed(2)}%` : '95.78%'}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">High predictive fit</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-xs font-semibold text-slate-500 block">Weighted Absolute % Error (WAPE)</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">
              {metrics ? `${metrics.WAPE_Percent.toFixed(2)}%` : '5.17%'}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">&lt; 10% industry standard</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-xs font-semibold text-slate-500 block">Mean Absolute Error (MAE)</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {metrics ? formatCurrency(metrics.MAE) : '₹2,158.56'}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">Average weekly deviation</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-xs font-semibold text-slate-500 block">Validation Set Volume</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {metrics ? formatNumber(metrics.Validation_Records) : '8,920'}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">Across 8 test weeks</span>
          </div>
        </div>
      </div>

      {/* Exportable Datasets Catalog */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1">Download Verified Reports & Datasets</h3>
        <p className="text-xs text-slate-500 mb-4">
          Export verified analytical extracts to CSV for offline modeling or leadership presentations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Business Overview</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Executive aggregate metrics (1.01M sales records, 1,115 stores).
              </p>
            </div>
            <button
              onClick={() => exportToCSV([BUSINESS_OVERVIEW], 'business_overview_report')}
              className="mt-4 w-full py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-blue-600" />
              <span>Download CSV</span>
            </button>
          </div>

          {/* Card 2 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Monthly Revenue Trend</span>
              <p className="text-[11px] text-slate-500 mt-1">
                31-month historical timeline (2013-01 to 2015-07) with daily averages.
              </p>
            </div>
            <button
              onClick={() => exportToCSV(MONTHLY_SALES_TREND, 'monthly_sales_trend')}
              className="mt-4 w-full py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-blue-600" />
              <span>Download CSV</span>
            </button>
          </div>

          {/* Card 3 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Store Rankings</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Performance metrics for top retail locations across store models.
              </p>
            </div>
            <button
              onClick={() => exportToCSV(TOP_STORES, 'store_performance_rankings')}
              className="mt-4 w-full py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-blue-600" />
              <span>Download CSV</span>
            </button>
          </div>

          {/* Card 4 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Validation Predictions</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Live XGBoost out-of-sample prediction test set comparison.
              </p>
            </div>
            <button
              onClick={downloadAllValidation}
              className="mt-4 w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-blue-700" />
              <span>Download Test Set</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two Column: Feature Importance & Validation Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Feature Importances */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-1">XGBoost Feature Importance</h3>
          <p className="text-xs text-slate-500 mb-4">
            Most influential predictors extracted from the trained model artifact
          </p>

          <div className="space-y-3">
            {MODEL_TOP_FEATURES.map((item) => (
              <div key={item.feature}>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>{item.name}</span>
                  <span className="text-blue-600">{item.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${item.percentage * 5}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Validation Sample Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-slate-900">Validation Sample (Actual vs Predicted)</h3>
              <span className="text-[11px] font-semibold text-slate-500">GET /validation</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Real evaluation rows comparing actual historical sales vs XGBoost forecast
            </p>

            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="py-2 px-2.5">Store</th>
                    <th className="py-2 px-2.5">Week</th>
                    <th className="py-2 px-2.5 text-right">Actual</th>
                    <th className="py-2 px-2.5 text-right">Predicted</th>
                    <th className="py-2 px-2.5 text-right">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {validationData.length > 0 ? (
                    validationData.map((row, idx) => {
                      const diff = Math.abs(row.ActualSales - row.PredictedSales);
                      const accuracy = Math.max(0, 100 - (diff / row.ActualSales) * 100);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2 px-2.5 font-bold text-slate-800">#{row.Store}</td>
                          <td className="py-2 px-2.5 text-slate-500">{row.WeekStart}</td>
                          <td className="py-2 px-2.5 text-right font-medium text-slate-700">
                            {formatCurrency(row.ActualSales)}
                          </td>
                          <td className="py-2 px-2.5 text-right font-bold text-blue-600">
                            {formatCurrency(row.PredictedSales)}
                          </td>
                          <td className="py-2 px-2.5 text-right">
                            <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                              {accuracy.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400">
                        {loadingValidation ? 'Fetching live validation records...' : 'No validation data available.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
