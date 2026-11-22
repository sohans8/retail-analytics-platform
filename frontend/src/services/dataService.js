/**
 * Grounded analytical data service compiled from the verified Rossmann dataset,
 * PostgreSQL analytical views, and official EDA outputs.
 */

export const BUSINESS_OVERVIEW = {
  totalRecords: 1017209,
  totalStores: 1115,
  dateRange: {
    start: '2013-01-01',
    end: '2015-07-31',
  },
  totalSales: 5873180623,
  averageDailySales: 5773.82,
  averageWeeklySales: 68220.14,
  totalCustomers: 644041755,
  averageCustomers: 633.15,
  openRecords: 844392,
  promotionRecords: 388080,
  averagePromotionLift: 38.77, // +38.77%
};

// 31 monthly revenue points from docs/eda_outputs/monthly_sales.csv
export const MONTHLY_SALES_TREND = [
  { date: '2013-01-31', month: 'Jan 2013', sales: 180132207, avgSales: 6239.64 },
  { date: '2013-02-28', month: 'Feb 2013', sales: 171534275, avgSales: 6428.60 },
  { date: '2013-03-31', month: 'Mar 2013', sales: 201180369, avgSales: 7212.83 },
  { date: '2013-04-30', month: 'Apr 2013', sales: 183431432, avgSales: 6579.32 },
  { date: '2013-05-31', month: 'May 2013', sales: 185411063, avgSales: 7076.22 },
  { date: '2013-06-30', month: 'Jun 2013', sales: 180702351, avgSales: 6467.05 },
  { date: '2013-07-31', month: 'Jul 2013', sales: 208843882, avgSales: 6923.15 },
  { date: '2013-08-31', month: 'Aug 2013', sales: 198042727, avgSales: 6595.93 },
  { date: '2013-09-30', month: 'Sep 2013', sales: 178053963, avgSales: 6363.39 },
  { date: '2013-10-31', month: 'Oct 2013', sales: 187662330, avgSales: 6473.35 },
  { date: '2013-11-30', month: 'Nov 2013', sales: 196170924, avgSales: 6904.51 },
  { date: '2013-12-31', month: 'Dec 2013', sales: 231710561, avgSales: 8613.46 },
  { date: '2014-01-31', month: 'Jan 2014', sales: 187752787, avgSales: 6539.40 },
  { date: '2014-02-28', month: 'Feb 2014', sales: 178924677, avgSales: 6678.04 },
  { date: '2014-03-31', month: 'Mar 2014', sales: 193019854, avgSales: 6654.02 },
  { date: '2014-04-30', month: 'Apr 2014', sales: 194544977, avgSales: 7226.78 },
  { date: '2014-05-31', month: 'May 2014', sales: 194693257, avgSales: 6948.12 },
  { date: '2014-06-30', month: 'Jun 2014', sales: 190047051, avgSales: 7250.66 },
  { date: '2014-07-31', month: 'Jul 2014', sales: 173892707, avgSales: 6891.48 },
  { date: '2014-08-31', month: 'Aug 2014', sales: 163748475, avgSales: 6714.31 },
  { date: '2014-09-30', month: 'Sep 2014', sales: 164516168, avgSales: 6756.59 },
  { date: '2014-10-31', month: 'Oct 2014', sales: 164216398, avgSales: 6757.32 },
  { date: '2014-11-30', month: 'Nov 2014', sales: 173327953, avgSales: 7539.60 },
  { date: '2014-12-31', month: 'Dec 2014', sales: 202120592, avgSales: 8603.81 },
  { date: '2015-01-31', month: 'Jan 2015', sales: 198843730, avgSales: 6913.18 },
  { date: '2015-02-28', month: 'Feb 2015', sales: 178275458, avgSales: 6660.27 },
  { date: '2015-03-31', month: 'Mar 2015', sales: 205631683, avgSales: 7071.24 },
  { date: '2015-04-30', month: 'Apr 2015', sales: 197918886, avgSales: 7349.11 },
  { date: '2015-05-31', month: 'May 2015', sales: 189143897, avgSales: 7308.50 },
  { date: '2015-06-30', month: 'Jun 2015', sales: 207363373, avgSales: 7295.62 },
  { date: '2015-07-31', month: 'Jul 2015', sales: 212322616, avgSales: 7033.34 }
];

// Store Type distribution from docs/eda_outputs/store_type_analysis.csv
export const STORE_TYPE_ANALYSIS = [
  {
    type: 'Type a',
    label: 'Standard / High Street',
    storeType: 'a',
    storeCount: 602,
    totalSales: 3165334859,
    avgSales: 6925.17,
    avgCustomers: 795.36,
    percentage: 53.9,
    fill: '#2563eb' // Tailwind Blue 600
  },
  {
    type: 'Type d',
    label: 'Extended Assortment',
    storeType: 'd',
    storeCount: 348,
    totalSales: 1765392943,
    avgSales: 6822.14,
    avgCustomers: 606.34,
    percentage: 30.1,
    fill: '#0284c7' // Tailwind Sky 600
  },
  {
    type: 'Type c',
    label: 'Shopping Mall',
    storeType: 'c',
    storeCount: 148,
    totalSales: 783221426,
    avgSales: 6932.51,
    avgCustomers: 815.47,
    percentage: 13.3,
    fill: '#6366f1' // Tailwind Indigo 500
  },
  {
    type: 'Type b',
    label: 'Mega / Extended Hours',
    storeType: 'b',
    storeCount: 17,
    totalSales: 159231395,
    avgSales: 10231.41,
    avgCustomers: 2021.82,
    percentage: 2.7,
    fill: '#10b981' // Tailwind Emerald 500
  }
];

// Weekday performance from docs/eda_outputs/weekday_analysis.csv
export const WEEKDAY_ANALYSIS = [
  { dayNumber: 1, day: 'Monday', shortDay: 'Mon', avgSales: 8216.07, totalSales: 1130203012, avgCustomers: 855.44 },
  { dayNumber: 2, day: 'Tuesday', shortDay: 'Tue', avgSales: 7088.11, totalSales: 1020411930, avgCustomers: 769.99 },
  { dayNumber: 3, day: 'Wednesday', shortDay: 'Wed', avgSales: 6728.12, totalSales: 954962863, avgCustomers: 740.60 },
  { dayNumber: 4, day: 'Thursday', shortDay: 'Thu', avgSales: 6767.31, totalSales: 911177709, avgCustomers: 755.57 },
  { dayNumber: 5, day: 'Friday', shortDay: 'Fri', avgSales: 7072.68, totalSales: 980555941, avgCustomers: 781.77 },
  { dayNumber: 6, day: 'Saturday', shortDay: 'Sat', avgSales: 5874.84, totalSales: 846317735, avgCustomers: 660.18 },
  { dayNumber: 7, day: 'Sunday', shortDay: 'Sun', avgSales: 8224.72, totalSales: 29551433, avgCustomers: 1441.53 }
];

// Promotion impact from docs/eda_outputs/promotion_analysis.csv
export const PROMOTION_ANALYSIS = [
  {
    status: 'No Promotion',
    promo: false,
    avgSales: 5929.41,
    avgCustomers: 696.86,
    totalSales: 2771974337,
    recordCount: 467496,
    color: '#94a3b8'
  },
  {
    status: 'Promotion Active',
    promo: true,
    avgSales: 8228.28,
    avgCustomers: 844.43,
    totalSales: 3101206286,
    recordCount: 376896,
    color: '#2563eb'
  }
];

// Holiday impact from reports/eda/holiday_analysis.csv
export const HOLIDAY_ANALYSIS = [
  { category: 'Regular Day (No Holiday)', stateHoliday: '0', schoolHoliday: false, avgSales: 6895.15, avgCustomers: 757.35, records: 680339 },
  { category: 'School Holiday Only', stateHoliday: '0', schoolHoliday: true, avgSales: 7196.90, avgCustomers: 781.77, records: 163143 },
  { category: 'Public Holiday (State a)', stateHoliday: 'a', schoolHoliday: false, avgSales: 8492.07, avgCustomers: 1266.11, records: 590 },
  { category: 'Public + School Holiday (a)', stateHoliday: 'a', schoolHoliday: true, avgSales: 8461.40, avgCustomers: 1353.26, records: 104 },
  { category: 'Easter Holiday (State b)', stateHoliday: 'b', schoolHoliday: false, avgSales: 34781.17, avgCustomers: 5076.17, records: 6 },
  { category: 'Easter + School Holiday (b)', stateHoliday: 'b', schoolHoliday: true, avgSales: 8813.36, avgCustomers: 1540.59, records: 139 },
  { category: 'Christmas Holiday (c)', stateHoliday: 'c', schoolHoliday: true, avgSales: 9743.75, avgCustomers: 1569.23, records: 71 }
];

// Top ranked stores from docs/eda_outputs/store_performance.csv
export const TOP_STORES = [
  { rank: 1, storeId: 262, storeType: 'b', assortment: 'Basic (a)', totalSales: 19516842, avgSales: 20718.52, totalCustomers: 3204694, avgCustomers: 3402.01 },
  { rank: 2, storeId: 817, storeType: 'a', assortment: 'Basic (a)', totalSales: 17057867, avgSales: 21757.48, totalCustomers: 2454370, avgCustomers: 3130.57 },
  { rank: 3, storeId: 562, storeType: 'b', assortment: 'Extended (c)', totalSales: 16927322, avgSales: 17969.56, totalCustomers: 2924960, avgCustomers: 3105.05 },
  { rank: 4, storeId: 1114, storeType: 'a', assortment: 'Extended (c)', totalSales: 16202585, avgSales: 20666.56, totalCustomers: 2509542, avgCustomers: 3200.95 },
  { rank: 5, storeId: 251, storeType: 'a', assortment: 'Extended (c)', totalSales: 14896870, avgSales: 19123.07, totalCustomers: 1908934, avgCustomers: 2450.49 },
  { rank: 6, storeId: 513, storeType: 'a', assortment: 'Extended (c)', totalSales: 14252406, avgSales: 18179.09, totalCustomers: 1643527, avgCustomers: 2096.34 },
  { rank: 7, storeId: 788, storeType: 'a', assortment: 'Extended (c)', totalSales: 14082141, avgSales: 17961.91, totalCustomers: 1346835, avgCustomers: 1717.90 },
  { rank: 8, storeId: 733, storeType: 'b', assortment: 'Extra (b)', totalSales: 14067158, avgSales: 14933.29, totalCustomers: 3206058, avgCustomers: 3403.46 },
  { rank: 9, storeId: 383, storeType: 'a', assortment: 'Extended (c)', totalSales: 13489879, avgSales: 17294.72, totalCustomers: 1720249, avgCustomers: 2205.45 },
  { rank: 10, storeId: 756, storeType: 'a', assortment: 'Extended (c)', totalSales: 12911782, avgSales: 16574.82, totalCustomers: 1827980, avgCustomers: 2346.57 },
  { rank: 11, storeId: 335, storeType: 'b', assortment: 'Basic (a)', totalSales: 12541731, avgSales: 13313.94, totalCustomers: 2246936, avgCustomers: 2385.28 },
  { rank: 12, storeId: 698, storeType: 'a', assortment: 'Extended (c)', totalSales: 12202270, avgSales: 15564.12, totalCustomers: 1518304, avgCustomers: 1936.61 },
  { rank: 13, storeId: 523, storeType: 'a', assortment: 'Extended (c)', totalSales: 12175995, avgSales: 15530.61, totalCustomers: 1397803, avgCustomers: 1782.91 },
  { rank: 14, storeId: 595, storeType: 'a', assortment: 'Extended (c)', totalSales: 11774982, avgSales: 15019.11, totalCustomers: 1382516, avgCustomers: 1763.41 },
  { rank: 15, storeId: 586, storeType: 'a', assortment: 'Extended (c)', totalSales: 11742401, avgSales: 15131.96, totalCustomers: 1832458, avgCustomers: 2361.41 },
  { rank: 16, storeId: 320, storeType: 'a', assortment: 'Extended (c)', totalSales: 11630218, avgSales: 14834.46, totalCustomers: 1617489, avgCustomers: 2063.12 },
  { rank: 17, storeId: 842, storeType: 'd', assortment: 'Extended (c)', totalSales: 11553523, avgSales: 18574.80, totalCustomers: 714829, avgCustomers: 1149.24 },
  { rank: 18, storeId: 380, storeType: 'd', assortment: 'Basic (a)', totalSales: 11261676, avgSales: 14456.58, totalCustomers: 1075375, avgCustomers: 1380.46 },
  { rank: 19, storeId: 544, storeType: 'a', assortment: 'Extended (c)', totalSales: 10993709, avgSales: 14094.50, totalCustomers: 1439156, avgCustomers: 1845.07 },
  { rank: 20, storeId: 1033, storeType: 'd', assortment: 'Basic (a)', totalSales: 10870270, avgSales: 13865.14, totalCustomers: 1018597, avgCustomers: 1299.23 },
  { rank: 21, storeId: 259, storeType: 'b', assortment: 'Extra (b)', totalSales: 10851871, avgSales: 11643.64, totalCustomers: 2210980, avgCustomers: 2372.30 },
  { rank: 22, storeId: 336, storeType: 'a', assortment: 'Extended (c)', totalSales: 10850316, avgSales: 13910.66, totalCustomers: 1529043, avgCustomers: 1960.31 },
  { rank: 23, storeId: 546, storeType: 'a', assortment: 'Extended (c)', totalSales: 10726323, avgSales: 13681.53, totalCustomers: 1271083, avgCustomers: 1621.28 },
  { rank: 24, storeId: 682, storeType: 'b', assortment: 'Basic (a)', totalSales: 10557379, avgSales: 11207.41, totalCustomers: 1656830, avgCustomers: 1758.84 },
  { rank: 25, storeId: 467, storeType: 'c', assortment: 'Extended (c)', totalSales: 10501035, avgSales: 13480.15, totalCustomers: 1257034, avgCustomers: 1613.65 },
  { rank: 26, storeId: 423, storeType: 'b', assortment: 'Basic (a)', totalSales: 10200356, avgSales: 10828.40, totalCustomers: 1776735, avgCustomers: 1886.13 },
  { rank: 27, storeId: 769, storeType: 'b', assortment: 'Extra (b)', totalSales: 10198000, avgSales: 10825.90, totalCustomers: 2902351, avgCustomers: 3081.05 },
  { rank: 28, storeId: 211, storeType: 'a', assortment: 'Extended (c)', totalSales: 10187567, avgSales: 12994.35, totalCustomers: 1164871, avgCustomers: 1485.80 },
  { rank: 29, storeId: 768, storeType: 'a', assortment: 'Extended (c)', totalSales: 10185601, avgSales: 12991.84, totalCustomers: 1054827, avgCustomers: 1345.44 },
  { rank: 30, storeId: 470, storeType: 'a', assortment: 'Extended (c)', totalSales: 10174712, avgSales: 13111.74, totalCustomers: 1377377, avgCustomers: 1774.97 },
  { rank: 31, storeId: 560, storeType: 'd', assortment: 'Basic (a)', totalSales: 10168806, avgSales: 13612.86, totalCustomers: 1225287, avgCustomers: 1640.28 },
  { rank: 32, storeId: 84, storeType: 'a', assortment: 'Extended (c)', totalSales: 10092722, avgSales: 12956.00, totalCustomers: 1084610, avgCustomers: 1392.31 },
  { rank: 33, storeId: 827, storeType: 'a', assortment: 'Extended (c)', totalSales: 10000214, avgSales: 12771.67, totalCustomers: 1302475, avgCustomers: 1663.44 },
  { rank: 34, storeId: 831, storeType: 'a', assortment: 'Basic (a)', totalSales: 9884733, avgSales: 12689.00, totalCustomers: 1228453, avgCustomers: 1576.96 },
  { rank: 35, storeId: 261, storeType: 'd', assortment: 'Extended (c)', totalSales: 9828244, avgSales: 12616.49, totalCustomers: 739220, avgCustomers: 948.93 },
  { rank: 36, storeId: 1014, storeType: 'c', assortment: 'Extended (c)', totalSales: 9509102, avgSales: 12206.81, totalCustomers: 1051375, avgCustomers: 1349.65 },
  { rank: 37, storeId: 444, storeType: 'd', assortment: 'Extended (c)', totalSales: 9470625, avgSales: 12188.71, totalCustomers: 1105765, avgCustomers: 1423.12 },
  { rank: 38, storeId: 469, storeType: 'c', assortment: 'Extended (c)', totalSales: 9330742, avgSales: 11901.46, totalCustomers: 1192174, avgCustomers: 1520.63 },
  { rank: 39, storeId: 125, storeType: 'a', assortment: 'Basic (a)', totalSales: 9280089, avgSales: 11836.85, totalCustomers: 1233970, avgCustomers: 1573.94 },
  { rank: 40, storeId: 1018, storeType: 'c', assortment: 'Extended (c)', totalSales: 9187204, avgSales: 11748.34, totalCustomers: 1063112, avgCustomers: 1359.48 },
  { rank: 41, storeId: 1097, storeType: 'b', assortment: 'Extra (b)', totalSales: 9179413, avgSales: 9744.60, totalCustomers: 2280508, avgCustomers: 2420.92 },
  { rank: 42, storeId: 390, storeType: 'a', assortment: 'Basic (a)', totalSales: 9023552, avgSales: 11568.66, totalCustomers: 832564, avgCustomers: 1067.39 },
  { rank: 43, storeId: 1075, storeType: 'a', assortment: 'Extended (c)', totalSales: 9004545, avgSales: 11485.39, totalCustomers: 856724, avgCustomers: 1092.76 },
  { rank: 44, storeId: 640, storeType: 'd', assortment: 'Basic (a)', totalSales: 8984969, avgSales: 11533.98, totalCustomers: 685137, avgCustomers: 879.51 },
  { rank: 45, storeId: 449, storeType: 'a', assortment: 'Extended (c)', totalSales: 8789176, avgSales: 11253.75, totalCustomers: 1198781, avgCustomers: 1534.93 },
  { rank: 46, storeId: 479, storeType: 'a', assortment: 'Extended (c)', totalSales: 8782548, avgSales: 11230.88, totalCustomers: 1039144, avgCustomers: 1328.83 },
  { rank: 47, storeId: 207, storeType: 'd', assortment: 'Basic (a)', totalSales: 8768418, avgSales: 11184.21, totalCustomers: 1019499, avgCustomers: 1300.38 },
  { rank: 48, storeId: 416, storeType: 'a', assortment: 'Extended (c)', totalSales: 8633413, avgSales: 11012.01, totalCustomers: 1096337, avgCustomers: 1398.39 },
  { rank: 49, storeId: 1066, storeType: 'a', assortment: 'Basic (a)', totalSales: 8626583, avgSales: 11073.92, totalCustomers: 877097, avgCustomers: 1125.93 },
  { rank: 50, storeId: 1, storeType: 'c', assortment: 'Basic (a)', totalSales: 3716854, avgSales: 4716.82, totalCustomers: 440523, avgCustomers: 559.04 }
];

// Top Model Features from reports/forecasting/feature_importance.csv
export const MODEL_TOP_FEATURES = [
  { feature: 'Sales_Lag_2', name: 'Sales Lag (2 Weeks Prior)', importance: 0.1659, percentage: 16.59 },
  { feature: 'Sales_Rolling_Mean_8', name: '8-Week Rolling Mean Sales', importance: 0.1118, percentage: 11.18 },
  { feature: 'Sales_Rolling_Mean_4', name: '4-Week Rolling Mean Sales', importance: 0.1078, percentage: 10.78 },
  { feature: 'HasPromotion', name: 'Promotion Active Flag', importance: 0.0943, percentage: 9.43 },
  { feature: 'PromoDays', name: 'Promotional Days in Week', importance: 0.0277, percentage: 2.77 },
  { feature: 'Sales_Lag_1', name: 'Sales Lag (1 Week Prior)', importance: 0.0218, percentage: 2.18 },
  { feature: 'Store_262', name: 'Store #262 Identity Bias', importance: 0.0171, percentage: 1.71 },
  { feature: 'Store_379', name: 'Store #379 Identity Bias', importance: 0.0148, percentage: 1.48 },
  { feature: 'StateHolidayDays', name: 'State Holiday Days Count', importance: 0.0068, percentage: 0.68 },
  { feature: 'WeekOfYear', name: 'Calendar Week of Year', importance: 0.0067, percentage: 0.67 }
];
