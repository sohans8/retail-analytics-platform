/**
 * Utility functions for currency, number, percentage, and date formatting.
 * Default currency is Indian Rupee (INR - ₹).
 */

export const formatCurrency = (amount, options = {}) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00';
  }

  const { compact = false, decimals = 2, currency = 'INR' } = options;
  const num = Number(amount);
  const symbol = currency === 'INR' ? '₹' : '€';

  if (compact) {
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';

    if (abs >= 10000000) {
      // 1 Crore = 10,000,000
      return `${sign}${symbol}${(abs / 10000000).toFixed(decimals)} Cr`;
    }
    if (abs >= 100000) {
      // 1 Lakh = 100,000
      return `${sign}${symbol}${(abs / 100000).toFixed(decimals)} L`;
    }
    if (abs >= 1000) {
      return `${sign}${symbol}${(abs / 1000).toFixed(decimals)}k`;
    }
    return `${sign}${symbol}${abs.toFixed(decimals)}`;
  }

  return `${symbol}${num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
};

export const formatNumber = (num, compact = false) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  const val = Number(num);

  if (compact) {
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (abs >= 10000000) return `${sign}${(abs / 10000000).toFixed(2)} Cr`;
    if (abs >= 100000) return `${sign}${(abs / 100000).toFixed(2)} L`;
    if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(1)}k`;
    return `${sign}${abs}`;
  }

  return val.toLocaleString('en-IN');
};

export const formatPercent = (val, includeSign = true) => {
  if (val === null || val === undefined || isNaN(val)) return '0.00%';
  const num = Number(val);
  const sign = includeSign && num > 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};
