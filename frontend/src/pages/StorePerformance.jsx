import React, { useState, useMemo } from 'react';
import {
  Store,
  Search,
  ArrowUpDown,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Building2,
  ExternalLink
} from 'lucide-react';
import { TOP_STORES, STORE_TYPE_ANALYSIS } from '../services/dataService';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { exportToCSV } from '../utils/exportUtils';
import StorePerformanceChart from '../components/charts/StorePerformanceChart';

export const StorePerformance = ({ onSelectStoreForForecast }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [sortField, setSortField] = useState('totalSales');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter and sort stores
  const filteredStores = useMemo(() => {
    return TOP_STORES.filter((store) => {
      const matchesSearch =
        store.storeId.toString().includes(searchQuery.trim()) ||
        store.assortment.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType =
        selectedType === 'ALL' || store.storeType.toLowerCase() === selectedType.toLowerCase();
      return matchesSearch && matchesType;
    }).sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (sortAsc) return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });
  }, [searchQuery, selectedType, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredStores.length / pageSize) || 1;
  const paginatedStores = filteredStores.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleExport = () => {
    exportToCSV(
      filteredStores.map((s) => ({
        Rank: s.rank,
        'Store ID': s.storeId,
        'Store Type': s.storeType.toUpperCase(),
        Assortment: s.assortment,
        'Total Sales (INR)': s.totalSales,
        'Average Daily Sales (INR)': s.avgSales,
        'Total Customers': s.totalCustomers,
      })),
      'store_performance_rankings'
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-600" />
            <span>Store Performance Rankings</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Comparative performance, customer volumes, and assortment models across retail locations.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors flex items-center gap-2 cursor-pointer shadow-xs self-start"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Store Rankings</span>
        </button>
      </div>

      {/* Top Stores Visual Chart */}
      <StorePerformanceChart limit={10} />

      {/* Store Ranking Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Filter Controls Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Store ID or Assortment..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500">Store Type:</span>
            {['ALL', 'a', 'b', 'c', 'd'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setSelectedType(t);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                  selectedType === t
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {t === 'ALL' ? 'All Models' : `Type ${t.toUpperCase()}`}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th
                  onClick={() => handleSort('rank')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    <span>Rank</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('storeId')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    <span>Store ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Store Model</th>
                <th className="py-3 px-4">Assortment</th>
                <th
                  onClick={() => handleSort('totalSales')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Sales</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('avgSales')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Daily Average</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalCustomers')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Customer Visits</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedStores.length > 0 ? (
                paginatedStores.map((s) => (
                  <tr key={s.storeId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-700">
                      <span
                        className={`inline-block w-6 text-center py-0.5 rounded text-[11px] ${
                          s.rank <= 3
                            ? 'bg-amber-100 text-amber-900 font-black'
                            : s.rank <= 10
                            ? 'bg-blue-50 text-blue-800 font-bold'
                            : 'text-slate-600'
                        }`}
                      >
                        #{s.rank}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      Store #{s.storeId}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 uppercase">
                        Type {s.storeType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {s.assortment}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 text-sm">
                      {formatCurrency(s.totalSales)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700 font-semibold">
                      {formatCurrency(s.avgSales)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {formatNumber(s.totalCustomers)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectStoreForForecast(s.storeId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title={`Forecast next 4 weeks for Store #${s.storeId}`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Forecast</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No store matches query "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredStores.length)} of {filteredStores.length} stores
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorePerformance;
