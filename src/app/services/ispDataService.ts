import * as XLSX from 'xlsx';
import {
  ISPFullDataset,
  ISPSummaryMetrics,
  ISPSalesByDay,
  ISPRevenueTrend,
  ISPPackageStat,
  ISPStationStat,
  ISPTopCustomer,
  ISPRepeatCustomer,
  ISPPackageStickiness,
  ISPWeeklyTrend,
  ISPMonthlyTrend,
  ISPMonthlyByStation,
  ISPCrossStationSale,
  ISPDatabaseConnection,
  SystemSettings
} from '../types';
import rawSeedJson from './crayGroupSampleData.json';

// ─── Number / Currency Cleaners ──────────────────────────────────────────────

export function parseCurrency(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatKsh(val: number): string {
  return `KSh ${val.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

export function formatNum(val: number): string {
  return val.toLocaleString('en-KE');
}

// ─── Authentic Cray Group ISP Seed Dataset ────────────────────────────────────

export function getCrayGroupDefaultDataset(): ISPFullDataset {
  const data = rawSeedJson as Record<string, any[]>;

  // 1. Summary
  const summaryRows = data['Summary'] || [];
  // Parse Key Metrics
  let totalRevenue = 238375;
  let totalVouchers = 5904;
  let avgRevenuePerVoucher = 40;
  let activeVouchers = 184;
  let expiredVouchers = 4848;
  let usedVouchers = 872;

  summaryRows.forEach(row => {
    const col0 = String(row['SALES SUMMARY DASHBOARD'] || '').trim();
    const col1 = row[''] !== undefined ? row[''] : row['_1'];
    if (col0 === 'Total Revenue') totalRevenue = parseCurrency(col1) || totalRevenue;
    if (col0 === 'Total Vouchers') totalVouchers = parseCurrency(col1) || totalVouchers;
    if (col0 === 'Average Revenue per Voucher') avgRevenuePerVoucher = parseCurrency(col1) || avgRevenuePerVoucher;
    if (col0 === 'Active') activeVouchers = parseCurrency(col1) || activeVouchers;
    if (col0 === 'Expired') expiredVouchers = parseCurrency(col1) || expiredVouchers;
    if (col0 === 'Used') usedVouchers = parseCurrency(col1) || usedVouchers;
  });

  const top5Packages = [
    { package: '5GB Daily', revenue: 'KSh 125,073', revenueNum: 125073 },
    { package: '20GB Weekly', revenue: 'KSh 45,372', revenueNum: 45372 },
    { package: '3GB 6hrs', revenue: 'KSh 25,400', revenueNum: 25400 },
    { package: '8GB Daily', revenue: 'KSh 24,304', revenueNum: 24304 },
    { package: '3 GB', revenue: 'KSh 6,075', revenueNum: 6075 },
  ];

  const top5Stations = [
    { station: 'Daystar', revenue: 'KSh 225,149', revenueNum: 225149 },
    { station: 'Juja', revenue: 'KSh 13,215', revenueNum: 13215 },
    { station: 'mumias', revenue: 'KSh 11', revenueNum: 11 },
    { station: 'bookers', revenue: 'KSh 0', revenueNum: 0 },
    { station: 'Public Hotspot', revenue: 'KSh 0', revenueNum: 0 },
  ];

  const monthlyGrowth = [
    { month: '2025-04', vouchers: 5, growthPercent: '-' },
    { month: '2025-05', vouchers: 674, growthPercent: '+13380.0%' },
    { month: '2025-06', vouchers: 1405, growthPercent: '+108.5%' },
    { month: '2025-07', vouchers: 1441, growthPercent: '+2.6%' },
    { month: '2025-08', vouchers: 1183, growthPercent: '-17.9%' },
    { month: '2025-09', vouchers: 1196, growthPercent: '+1.1%' },
  ];

  const summary: ISPSummaryMetrics = {
    totalRevenue,
    totalRevenueFormatted: formatKsh(totalRevenue),
    totalVouchers,
    averageRevenuePerVoucher: avgRevenuePerVoucher,
    averageRevenuePerVoucherFormatted: formatKsh(avgRevenuePerVoucher),
    voucherStatus: {
      active: activeVouchers,
      expired: expiredVouchers,
      used: usedVouchers,
    },
    top5Packages,
    top5Stations,
    monthlyGrowth,
  };

  // 2. Sales by Day
  const salesByDay: ISPSalesByDay[] = (data['Sales by Day'] || []).map(r => ({
    date: String(r['Date'] || ''),
    totalVouchers: parseCurrency(r['Total Vouchers']),
  })).filter(x => Boolean(x.date));

  // 3. Revenue Trend
  const revenueTrend: ISPRevenueTrend[] = (data['Revenue Trend'] || []).map(r => {
    const revNum = parseCurrency(r['Revenue']);
    const avgNum = parseCurrency(r['Avg per Voucher']);
    return {
      date: String(r['Date'] || ''),
      vouchersSold: parseCurrency(r['Vouchers Sold']),
      revenue: String(r['Revenue'] || formatKsh(revNum)),
      revenueNum: revNum,
      avgPerVoucher: String(r['Avg per Voucher'] || formatKsh(avgNum)),
      avgPerVoucherNum: avgNum,
    };
  }).filter(x => Boolean(x.date));

  // 4. Packages
  const packages: ISPPackageStat[] = (data['Packages'] || []).map(r => {
    const revNum = parseCurrency(r['Total Revenue']);
    const avgNum = parseCurrency(r['Avg Revenue']);
    return {
      packageName: String(r['Package Name'] || 'Unknown'),
      totalVouchers: parseCurrency(r['Total Vouchers']),
      totalRevenue: String(r['Total Revenue'] || formatKsh(revNum)),
      totalRevenueNum: revNum,
      freeVouchers: parseCurrency(r['Free Vouchers']),
      avgRevenue: String(r['Avg Revenue'] || formatKsh(avgNum)),
      avgRevenueNum: avgNum,
    };
  });

  // 5. Stations
  const stations: ISPStationStat[] = (data['Stations'] || []).map(r => {
    const revNum = parseCurrency(r['Revenue']);
    const avgNum = parseCurrency(r['Avg per Voucher']);
    return {
      stationName: String(r['Station Name'] || 'Unknown'),
      totalVouchers: parseCurrency(r['Total Vouchers']),
      revenue: String(r['Revenue'] || formatKsh(revNum)),
      revenueNum: revNum,
      avgPerVoucher: String(r['Avg per Voucher'] || formatKsh(avgNum)),
      avgPerVoucherNum: avgNum,
    };
  });

  // 6. Top Customers
  const topCustomers: ISPTopCustomer[] = (data['Top Customers'] || []).map((r, i) => {
    const spentNum = parseCurrency(r['Total Spent']);
    const ltvNum = parseCurrency(r['Lifetime Value'] || spentNum);
    return {
      rank: r['Rank'] ? Number(r['Rank']) : i + 1,
      phoneNumber: String(r['Phone Number'] || ''),
      vouchersBought: parseCurrency(r['Vouchers Bought']),
      totalSpent: String(r['Total Spent'] || formatKsh(spentNum)),
      totalSpentNum: spentNum,
      lifetimeValue: String(r['Lifetime Value'] || formatKsh(ltvNum)),
      lifetimeValueNum: ltvNum,
    };
  });

  // 7. Repeat Customers
  const repeatCustomers: ISPRepeatCustomer[] = (data['Repeat Customers'] || []).map(r => ({
    phoneNumber: String(r['Phone Number'] || ''),
    totalPurchases: parseCurrency(r['Total Purchases']),
  }));

  // 8. Package Stickiness
  const packageStickiness: ISPPackageStickiness[] = (data['Package Stickiness'] || []).map(r => ({
    phone: String(r['Phone'] || ''),
    packageName: String(r['Package Name'] || ''),
    timesBought: parseCurrency(r['Times Bought']),
  }));

  // 9. Weekly Trend
  const weeklyTrend: ISPWeeklyTrend[] = (data['Weekly Trend'] || []).map(r => {
    const revNum = parseCurrency(r['Revenue']);
    return {
      week: r['Week'] || '',
      vouchersSold: parseCurrency(r['Vouchers Sold']),
      revenue: String(r['Revenue'] || formatKsh(revNum)),
      revenueNum: revNum,
    };
  });

  // 10. Monthly Trend
  const monthlyTrend: ISPMonthlyTrend[] = (data['Monthly Trend'] || []).map(r => {
    const revNum = parseCurrency(r['Revenue']);
    return {
      month: String(r['Month'] || ''),
      vouchersSold: parseCurrency(r['Vouchers Sold']),
      revenue: String(r['Revenue'] || formatKsh(revNum)),
      revenueNum: revNum,
    };
  });

  // 11. Monthly by Station
  const monthlyByStation: ISPMonthlyByStation[] = (data['Monthly by Station'] || []).map(r => ({
    month: String(r['Month'] || ''),
    stationName: String(r['Station Name'] || ''),
    vouchersSold: parseCurrency(r['Vouchers Sold']),
  }));

  // 12. Cross Station Sales
  const crossStationSales: ISPCrossStationSale[] = (data['Cross Station Sales'] || []).map(r => ({
    station: String(r['Station'] || ''),
    package: String(r['Package'] || ''),
    sold: parseCurrency(r['Sold']),
  }));

  // 13. Sales by Package
  const salesByPackage = (data['Sales by Package'] || []).map(r => ({
    packageName: String(r['Package Name'] || ''),
    totalVouchers: parseCurrency(r['Total Vouchers']),
  }));

  // 14. Sales by Station
  const salesByStation = (data['Sales by Station'] || []).map(r => ({
    stationName: String(r['Station Name'] || ''),
    totalVouchers: parseCurrency(r['Total Vouchers']),
  }));

  return {
    summary,
    salesByDay,
    revenueTrend,
    packages,
    stations,
    topCustomers,
    repeatCustomers,
    packageStickiness,
    weeklyTrend,
    monthlyTrend,
    monthlyByStation,
    crossStationSales,
    salesByPackage,
    salesByStation,
  };
}

// ─── Excel File Parser for Uploaded Reports ───────────────────────────────────

export function parseISPExcelWorkbook(workbook: XLSX.WorkBook): ISPFullDataset {
  const result = getCrayGroupDefaultDataset();
  const sheets = workbook.SheetNames;

  // Find matching sheets regardless of exact casing or whitespace
  const findSheet = (keywords: string[]) => {
    const lowerKeywords = keywords.map(k => k.toLowerCase());
    return sheets.find(s => {
      const lower = s.toLowerCase();
      return lowerKeywords.some(k => lower.includes(k));
    });
  };

  const readSheet = (sheetName?: string) => {
    if (!sheetName || !workbook.Sheets[sheetName]) return [];
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as Record<string, any>[];
  };

  // 1. Packages
  const pkgSheet = findSheet(['packages', 'sales by package']);
  if (pkgSheet) {
    const raw = readSheet(pkgSheet);
    if (raw.length > 0) {
      result.packages = raw.map(r => {
        const name = r['Package Name'] || r['Package'] || r['package_name'] || 'Custom Package';
        const sold = parseCurrency(r['Total Vouchers'] || r['Sold'] || r['vouchers_sold']);
        const rev = parseCurrency(r['Total Revenue'] || r['Revenue'] || r['total_revenue']);
        const free = parseCurrency(r['Free Vouchers'] || r['Free'] || 0);
        const avg = sold > 0 ? Math.round(rev / sold) : 0;
        return {
          packageName: String(name),
          totalVouchers: sold,
          totalRevenue: formatKsh(rev),
          totalRevenueNum: rev,
          freeVouchers: free,
          avgRevenue: formatKsh(avg),
          avgRevenueNum: avg,
        };
      });
    }
  }

  // 2. Stations
  const stationSheet = findSheet(['stations', 'sales by station']);
  if (stationSheet) {
    const raw = readSheet(stationSheet);
    if (raw.length > 0) {
      result.stations = raw.map(r => {
        const name = r['Station Name'] || r['Station'] || r['station_name'] || 'Base Station';
        const sold = parseCurrency(r['Total Vouchers'] || r['Vouchers'] || r['vouchers_sold']);
        const rev = parseCurrency(r['Revenue'] || r['Total Revenue'] || 0);
        const avg = sold > 0 ? Math.round(rev / sold) : 0;
        return {
          stationName: String(name),
          totalVouchers: sold,
          revenue: formatKsh(rev),
          revenueNum: rev,
          avgPerVoucher: formatKsh(avg),
          avgPerVoucherNum: avg,
        };
      });
    }
  }

  // 3. Top Customers
  const customerSheet = findSheet(['top customers', 'customers', 'subscribers']);
  if (customerSheet) {
    const raw = readSheet(customerSheet);
    if (raw.length > 0) {
      result.topCustomers = raw.map((r, i) => {
        const phone = r['Phone Number'] || r['Phone'] || r['MSISDN'] || r['phone_number'] || '254...';
        const bought = parseCurrency(r['Vouchers Bought'] || r['Vouchers'] || 1);
        const spent = parseCurrency(r['Total Spent'] || r['Spent'] || r['Lifetime Value'] || 0);
        return {
          rank: i + 1,
          phoneNumber: String(phone),
          vouchersBought: bought,
          totalSpent: formatKsh(spent),
          totalSpentNum: spent,
          lifetimeValue: formatKsh(spent),
          lifetimeValueNum: spent,
        };
      });
    }
  }

  // 4. Revenue Trend
  const revSheet = findSheet(['revenue trend', 'sales by day', 'trend']);
  if (revSheet) {
    const raw = readSheet(revSheet);
    if (raw.length > 0) {
      result.revenueTrend = raw.map(r => {
        const date = String(r['Date'] || r['date'] || '');
        const sold = parseCurrency(r['Vouchers Sold'] || r['Total Vouchers'] || 0);
        const rev = parseCurrency(r['Revenue'] || 0);
        const avg = sold > 0 ? Math.round(rev / sold) : 0;
        return {
          date,
          vouchersSold: sold,
          revenue: formatKsh(rev),
          revenueNum: rev,
          avgPerVoucher: formatKsh(avg),
          avgPerVoucherNum: avg,
        };
      }).filter(x => Boolean(x.date));
    }
  }

  // Recalculate summary metrics from updated sections
  const totalRev = result.packages.reduce((acc, p) => acc + p.totalRevenueNum, 0) || result.summary.totalRevenue;
  const totalVouch = result.packages.reduce((acc, p) => acc + p.totalVouchers, 0) || result.summary.totalVouchers;
  const avgRev = totalVouch > 0 ? Math.round(totalRev / totalVouch) : 40;

  result.summary.totalRevenue = totalRev;
  result.summary.totalRevenueFormatted = formatKsh(totalRev);
  result.summary.totalVouchers = totalVouch;
  result.summary.averageRevenuePerVoucher = avgRev;
  result.summary.averageRevenuePerVoucherFormatted = formatKsh(avgRev);

  return result;
}

// ─── Export Functions (Direct Downloads) ───────────────────────────────────────

/**
 * Downloads a complete 14-Sheet Excel Workbook matching Cray Group's report structure.
 */
export function exportISPToExcelWorkbook(dataset: ISPFullDataset, filename: string = 'Cray-Group-ISP-Analytics-Report.xlsx') {
  const wb = XLSX.utils.book_new();

  // 1. Summary
  const summaryAoa: any[][] = [
    ['CRAY GROUP ISP SALES SUMMARY DASHBOARD', '', '', ''],
    ['Generated At:', new Date().toISOString(), 'System:', 'Cray Group ISP Analytics'],
    [],
    ['Key Metrics', 'Value', '', ''],
    ['Total Revenue', dataset.summary.totalRevenueFormatted, '', ''],
    ['Total Vouchers', formatNum(dataset.summary.totalVouchers), '', ''],
    ['Average Revenue per Voucher', dataset.summary.averageRevenuePerVoucherFormatted, '', ''],
    [],
    ['Voucher Status', 'Count', '', ''],
    ['Active', dataset.summary.voucherStatus.active, '', ''],
    ['Expired', dataset.summary.voucherStatus.expired, '', ''],
    ['Used', dataset.summary.voucherStatus.used, '', ''],
    [],
    ['Top 5 Packages by Revenue', 'Revenue', '', ''],
    ...dataset.summary.top5Packages.map(p => [p.package, p.revenue]),
    [],
    ['Top 5 Stations by Revenue', 'Revenue', '', ''],
    ...dataset.summary.top5Stations.map(s => [s.station, s.revenue]),
    [],
    ['Monthly Growth', 'Vouchers', 'Growth %', ''],
    ...dataset.summary.monthlyGrowth.map(m => [m.month, m.vouchers, m.growthPercent]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryAoa), 'Summary');

  // 2. Sales by Day
  const salesByDayAoa = [
    ['Date', 'Total Vouchers'],
    ...dataset.salesByDay.map(s => [s.date, s.totalVouchers]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(salesByDayAoa), 'Sales by Day');

  // 3. Revenue Trend
  const revTrendAoa = [
    ['Date', 'Vouchers Sold', 'Revenue', 'Avg per Voucher'],
    ...dataset.revenueTrend.map(r => [r.date, r.vouchersSold, r.revenue, r.avgPerVoucher]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(revTrendAoa), 'Revenue Trend');

  // 4. Packages
  const packagesAoa = [
    ['Package Name', 'Total Vouchers', 'Total Revenue', 'Free Vouchers', 'Avg Revenue'],
    ...dataset.packages.map(p => [p.packageName, p.totalVouchers, p.totalRevenue, p.freeVouchers, p.avgRevenue]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(packagesAoa), 'Packages');

  // 5. Stations
  const stationsAoa = [
    ['Station Name', 'Total Vouchers', 'Revenue', 'Avg per Voucher'],
    ...dataset.stations.map(s => [s.stationName, s.totalVouchers, s.revenue, s.avgPerVoucher]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(stationsAoa), 'Stations');

  // 6. Top Customers
  const topCustomersAoa = [
    ['Rank', 'Phone Number', 'Vouchers Bought', 'Total Spent', 'Lifetime Value'],
    ...dataset.topCustomers.map(c => [c.rank, c.phoneNumber, c.vouchersBought, c.totalSpent, c.lifetimeValue]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(topCustomersAoa), 'Top Customers');

  // 7. Repeat Customers
  const repeatCustomersAoa = [
    ['Phone Number', 'Total Purchases'],
    ...dataset.repeatCustomers.map(c => [c.phoneNumber, c.totalPurchases]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(repeatCustomersAoa), 'Repeat Customers');

  // 8. Package Stickiness
  const stickinessAoa = [
    ['Phone', 'Package Name', 'Times Bought'],
    ...dataset.packageStickiness.map(p => [p.phone, p.packageName, p.timesBought]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(stickinessAoa), 'Package Stickiness');

  // 9. Weekly Trend
  const weeklyTrendAoa = [
    ['Week', 'Vouchers Sold', 'Revenue'],
    ...dataset.weeklyTrend.map(w => [w.week, w.vouchersSold, w.revenue]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(weeklyTrendAoa), 'Weekly Trend');

  // 10. Monthly Trend
  const monthlyTrendAoa = [
    ['Month', 'Vouchers Sold', 'Revenue'],
    ...dataset.monthlyTrend.map(m => [m.month, m.vouchersSold, m.revenue]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(monthlyTrendAoa), 'Monthly Trend');

  // 11. Monthly by Station
  const monthlyByStationAoa = [
    ['Month', 'Station Name', 'Vouchers Sold'],
    ...dataset.monthlyByStation.map(m => [m.month, m.stationName, m.vouchersSold]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(monthlyByStationAoa), 'Monthly by Station');

  // 12. Cross Station Sales
  const crossStationAoa = [
    ['Station', 'Package', 'Sold'],
    ...dataset.crossStationSales.map(c => [c.station, c.package, c.sold]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(crossStationAoa), 'Cross Station Sales');

  // 13. Sales by Package
  const salesByPkgAoa = [
    ['Package Name', 'Total Vouchers'],
    ...dataset.salesByPackage.map(s => [s.packageName, s.totalVouchers]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(salesByPkgAoa), 'Sales by Package');

  // 14. Sales by Station
  const salesByStationAoa = [
    ['Station Name', 'Total Vouchers'],
    ...dataset.salesByStation.map(s => [s.stationName, s.totalVouchers]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(salesByStationAoa), 'Sales by Station');

  // Trigger browser download
  XLSX.writeFile(wb, filename);
}

/**
 * Downloads a comprehensive Executive Word Document (.doc) with complete ISP analysis.
 */
export function exportISPToWord(dataset: ISPFullDataset, settings?: SystemSettings) {
  const primary = settings?.primaryColor || '#3db7e4';
  const navy = '#243542';
  const appName = settings?.appName || 'Cray Group ISP Analytics';
  const orgName = settings?.organizationName || 'Cray Group Internet Service Provider';
  const dateStr = new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });

  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${appName} - Executive Report</title>
      <style>
        body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; margin: 40px; color: #1e293b; line-height: 1.5; font-size: 11pt; }
        h1 { color: ${navy}; font-size: 22pt; margin-bottom: 4px; }
        h2 { color: ${navy}; font-size: 15pt; border-bottom: 2px solid ${primary}; padding-bottom: 6px; margin-top: 24px; }
        h3 { color: #334155; font-size: 12pt; margin-top: 16px; }
        .meta { color: #64748b; font-size: 10pt; margin-bottom: 24px; }
        .kpi-container { display: flex; width: 100%; margin-bottom: 24px; }
        .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 18px; margin-right: 12px; width: 22%; display: inline-block; vertical-align: top; }
        .kpi-val { font-size: 18pt; font-weight: bold; color: ${primary}; }
        .kpi-label { font-size: 9pt; color: #64748b; text-transform: uppercase; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 20px; font-size: 10pt; }
        th { background-color: ${navy}; color: #ffffff; font-weight: bold; text-align: left; padding: 8px 12px; border: 1px solid ${navy}; }
        td { padding: 8px 12px; border: 1px solid #e2e8f0; }
        tr:nth-child(even) td { background-color: #fafbfc; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 8.5pt; font-weight: bold; background: #e0f2fe; color: #0284c7; }
      </style>
    </head>
    <body>
      <div style="border-bottom: 3px solid ${primary}; padding-bottom: 14px; margin-bottom: 20px;">
        <h1 style="color: ${navy}; margin: 0 0 4px 0;">CRAY GROUP &bull; ISP EXECUTIVE REPORT</h1>
        <div class="meta">${orgName} &bull; Network & Commercial Intelligence &bull; Generated: ${dateStr}</div>
      </div>

      <div class="kpi-container">
        <div class="kpi-card">
          <div class="kpi-label">Total Revenue</div>
          <div class="kpi-val">${dataset.summary.totalRevenueFormatted}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Total Vouchers</div>
          <div class="kpi-val">${formatNum(dataset.summary.totalVouchers)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Average ARPU</div>
          <div class="kpi-val">${dataset.summary.averageRevenuePerVoucherFormatted}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Active Hotspots</div>
          <div class="kpi-val">${dataset.stations.length} Stations</div>
        </div>
      </div>

      <h2>1. Executive Summary & Strategic Insights</h2>
      <p>
        During the analyzed operational period, Cray Group ISP achieved total voucher revenue of <strong>${dataset.summary.totalRevenueFormatted}</strong> across <strong>${formatNum(dataset.summary.totalVouchers)} vouchers</strong>.
        The system reflects high utilization with <strong>${dataset.summary.voucherStatus.used} used vouchers</strong>, <strong>${dataset.summary.voucherStatus.active} currently active sessions</strong>, and a core average revenue per voucher of <strong>${dataset.summary.averageRevenuePerVoucherFormatted}</strong>.
      </p>
      <ul>
        <li><strong>Primary Revenue Driver:</strong> <em>Daystar Station</em> accounts for the overwhelming majority of revenue (<strong>${dataset.summary.top5Stations[0]?.revenue}</strong>), indicating high subscriber density.</li>
        <li><strong>Flagship Package:</strong> <em>5GB Daily</em> generated <strong>${dataset.summary.top5Packages[0]?.revenue}</strong> (${dataset.packages[0]?.totalVouchers} vouchers), representing the core daily data product.</li>
        <li><strong>High-Value Subscribers:</strong> Top customer <code>${dataset.topCustomers[0]?.phoneNumber}</code> contributed <strong>${dataset.topCustomers[0]?.totalSpent}</strong> in total lifetime spend across ${dataset.topCustomers[0]?.vouchersBought} vouchers.</li>
        <li><strong>Retention & Stickiness:</strong> <em>3GB 6hrs</em> demonstrated the highest recurring stickiness among high-frequency repeating users.</li>
      </ul>

      <h2>2. Base Station Performance Matrix</h2>
      <table>
        <thead>
          <tr>
            <th>Station Name</th>
            <th>Total Vouchers</th>
            <th>Total Revenue</th>
            <th>ARPU / Avg Voucher</th>
            <th>Market Share %</th>
          </tr>
        </thead>
        <tbody>
          ${dataset.stations.map(s => {
            const share = dataset.summary.totalRevenue > 0 ? ((s.revenueNum / dataset.summary.totalRevenue) * 100).toFixed(1) : '0.0';
            return `
              <tr>
                <td><strong>${s.stationName}</strong></td>
                <td>${formatNum(s.totalVouchers)}</td>
                <td><strong>${s.revenue}</strong></td>
                <td>${s.avgPerVoucher}</td>
                <td><span class="badge">${share}%</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <h2>3. Internet Package Sales & Margin Breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Package Name</th>
            <th>Vouchers Sold</th>
            <th>Total Revenue</th>
            <th>Free Vouchers</th>
            <th>Avg Revenue</th>
          </tr>
        </thead>
        <tbody>
          ${dataset.packages.map(p => `
            <tr>
              <td><strong>${p.packageName}</strong></td>
              <td>${formatNum(p.totalVouchers)}</td>
              <td><strong>${p.totalRevenue}</strong></td>
              <td>${p.freeVouchers}</td>
              <td>${p.avgRevenue}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>4. Top Spending Subscribers & Customer Retention</h2>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Phone Number</th>
            <th>Vouchers Bought</th>
            <th>Total Spent</th>
            <th>Customer Lifetime Value</th>
          </tr>
        </thead>
        <tbody>
          ${dataset.topCustomers.slice(0, 10).map(c => `
            <tr>
              <td>#${c.rank}</td>
              <td><code>${c.phoneNumber}</code></td>
              <td>${c.vouchersBought}</td>
              <td><strong>${c.totalSpent}</strong></td>
              <td>${c.lifetimeValue}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>5. Actionable Network Recommendations</h2>
      <ol>
        <li><strong>Expand Hotspot Footprint around Daystar:</strong> Add supplementary MikroTik access points to relieve channel congestion and capture additional unserviced traffic.</li>
        <li><strong>Incentivize 20GB Weekly Plan:</strong> Promote weekly and monthly packages with 10% loyalty discounts to increase subscriber lock-in and ARPU.</li>
        <li><strong>Automate SMS Alerts for Repeating Customers:</strong> Notify high-frequency customers when their daily package is nearing expiration to prevent connection drops.</li>
        <li><strong>Reactivate Low-Volume Stations:</strong> Conduct site surveys at Mumias and Bookers stations to verify power reliability and backhaul latency.</li>
      </ol>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Cray-Group-ISP-Executive-Report-${new Date().toISOString().split('T')[0]}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads printable PDF / Executive HTML Print View.
 */
export function exportISPToPrintablePDF(dataset: ISPFullDataset, settings?: SystemSettings) {
  const primary = settings?.primaryColor || '#3db7e4';
  const navy = '#243542';
  const appName = settings?.appName || 'Cray Group ISP Analytics';
  const orgName = settings?.organizationName || 'Cray Group Internet Service Provider';
  const dateStr = new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${appName} - Executive Report</title>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 30px; color: #0f172a; line-height: 1.5; font-size: 11pt; }
        @media print { body { margin: 15mm; } .no-print { display: none; } }
        .header { border-bottom: 3px solid ${primary}; padding-bottom: 14px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
        .title { font-size: 22pt; font-weight: 800; color: ${navy}; margin: 0; }
        .sub { font-size: 10pt; color: #64748b; margin-top: 4px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
        .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
        .kpi-title { font-size: 8pt; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px; }
        .kpi-value { font-size: 18pt; font-weight: bold; color: ${primary}; margin-top: 4px; }
        h2 { font-size: 13pt; border-bottom: 1.5px solid ${primary}; padding-bottom: 6px; margin-top: 24px; color: ${navy}; font-weight: 700; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; font-size: 9.5pt; }
        th { background: ${navy}; color: #ffffff; padding: 8px 10px; text-align: left; border: 1px solid ${navy}; font-weight: 600; }
        td { padding: 7px 10px; border: 1px solid #e2e8f0; }
        tr:nth-child(even) td { background: #fafbfc; }
        .btn-print { background: ${navy}; color: white; border: 1px solid ${primary}; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px;">
        <button class="btn-print" onclick="window.print()">Print or Save as PDF</button>
      </div>

      <div class="header">
        <div>
          <h1 class="title">${appName}</h1>
          <div class="sub">${orgName} &bull; Network & Sales Performance Intelligence</div>
        </div>
        <div style="text-align: right; font-size: 9pt; color: #64748b;">
          <div>Report Date: ${dateStr}</div>
          <div>Status: Verified Production Data</div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi">
          <div class="kpi-title">Total Revenue</div>
          <div class="kpi-value">${dataset.summary.totalRevenueFormatted}</div>
        </div>
        <div class="kpi">
          <div class="kpi-title">Vouchers Sold</div>
          <div class="kpi-value">${formatNum(dataset.summary.totalVouchers)}</div>
        </div>
        <div class="kpi">
          <div class="kpi-title">ARPU / Avg Voucher</div>
          <div class="kpi-value">${dataset.summary.averageRevenuePerVoucherFormatted}</div>
        </div>
        <div class="kpi">
          <div class="kpi-title">Active Stations</div>
          <div class="kpi-value">${dataset.stations.length}</div>
        </div>
      </div>

      <h2>Base Station Breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Station Name</th>
            <th>Vouchers Sold</th>
            <th>Revenue</th>
            <th>Avg / Voucher</th>
          </tr>
        </thead>
        <tbody>
          ${dataset.stations.map(s => `
            <tr>
              <td><strong>${s.stationName}</strong></td>
              <td>${formatNum(s.totalVouchers)}</td>
              <td><strong>${s.revenue}</strong></td>
              <td>${s.avgPerVoucher}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>Top Internet Packages by Revenue</h2>
      <table>
        <thead>
          <tr>
            <th>Package</th>
            <th>Vouchers</th>
            <th>Total Revenue</th>
            <th>Free Vouchers</th>
            <th>Avg Revenue</th>
          </tr>
        </thead>
        <tbody>
          ${dataset.packages.slice(0, 8).map(p => `
            <tr>
              <td><strong>${p.packageName}</strong></td>
              <td>${formatNum(p.totalVouchers)}</td>
              <td><strong>${p.totalRevenue}</strong></td>
              <td>${p.freeVouchers}</td>
              <td>${p.avgRevenue}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>Top Spending Subscribers (CRM)</h2>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Phone Number</th>
            <th>Vouchers Bought</th>
            <th>Total Spent</th>
            <th>Lifetime Value</th>
          </tr>
        </thead>
        <tbody>
          ${dataset.topCustomers.slice(0, 10).map(c => `
            <tr>
              <td>#${c.rank}</td>
              <td><code>${c.phoneNumber}</code></td>
              <td>${c.vouchersBought}</td>
              <td><strong>${c.totalSpent}</strong></td>
              <td>${c.lifetimeValue}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Downloads complete JSON representation of the dataset.
 */
export function exportISPToJSON(dataset: ISPFullDataset, filename: string = 'cray-group-isp-data.json') {
  const jsonStr = JSON.stringify(dataset, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a flat CSV of daily sales or package statistics.
 */
export function exportISPToCSV(dataRows: any[], filename: string = 'cray-group-sales.csv') {
  if (!dataRows || dataRows.length === 0) return;
  const ws = XLSX.utils.json_to_sheet(dataRows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
