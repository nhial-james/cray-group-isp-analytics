import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  TrendingUp, TrendingDown, Users, CheckCircle2, FileSpreadsheet,
  ArrowUpRight, ArrowDownRight, Sparkles, Download, Plus, Filter,
  Database, Radio, Wifi, Layers, PhoneCall, RefreshCw, AlertCircle,
  ExternalLink, ArrowRight
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  ISPFullDataset,
  UploadedFileRecord,
  AnalysisRecord,
  ISPDatabaseConnection,
  SystemSettings
} from '../types';
import { exportISPToExcelWorkbook, exportISPToPrintablePDF, formatKsh, formatNum } from '../services/ispDataService';

interface DashboardOverviewProps {
  dataset: ISPFullDataset;
  files: UploadedFileRecord[];
  databaseConnections: ISPDatabaseConnection[];
  activeDataSource: 'excel' | 'database';
  settings?: SystemSettings;
  setActiveTab: (tab: string) => void;
  onRefreshData?: () => void;
}

const STATION_COLORS = ['#0284c7', '#0d9488', '#f59e0b', '#ec4899', '#8b5cf6'];
const STATUS_COLORS = ['#10b981', '#64748b', '#0284c7'];

export function DashboardOverview({
  dataset,
  files = [],
  databaseConnections = [],
  activeDataSource,
  settings,
  setActiveTab,
  onRefreshData,
}: DashboardOverviewProps) {
  const [timeView, setTimeView] = useState<'daily' | 'monthly'>('daily');
  const [activeStationFilter, setActiveStationFilter] = useState<string>('all');

  const { summary, packages, stations, topCustomers, salesByDay, revenueTrend, monthlyTrend } = dataset;

  // Station pie chart data
  const stationPieData = useMemo(() => {
    return stations.map(s => ({
      name: s.stationName,
      value: s.revenueNum,
      vouchers: s.totalVouchers,
    }));
  }, [stations]);

  // Voucher status donut data
  const voucherStatusData = useMemo(() => {
    return [
      { name: 'Active Vouchers', value: summary.voucherStatus.active, color: '#10b981' },
      { name: 'Used Vouchers', value: summary.voucherStatus.used, color: '#0284c7' },
      { name: 'Expired Vouchers', value: summary.voucherStatus.expired, color: '#94a3b8' },
    ];
  }, [summary.voucherStatus]);

  // Daily or Monthly Trend Chart Data
  const trendData = useMemo(() => {
    if (timeView === 'monthly') {
      return monthlyTrend.map(m => ({
        label: m.month,
        revenue: m.revenueNum,
        vouchers: m.vouchersSold,
      }));
    }
    // Daily trend from revenueTrend
    return revenueTrend.map(r => ({
      label: r.date.split('-').slice(1).join('/'),
      revenue: r.revenueNum,
      vouchers: r.vouchersSold,
      avg: r.avgPerVoucherNum,
    }));
  }, [timeView, monthlyTrend, revenueTrend]);

  // Top 5 packages for chart
  const topPackagesData = useMemo(() => {
    return packages.slice(0, 6).map(p => ({
      name: p.packageName,
      revenue: p.totalRevenueNum,
      vouchers: p.totalVouchers,
      free: p.freeVouchers,
    }));
  }, [packages]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Ingestion Status & Direct Access Alert */}
      <div className="p-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-sky-500/5 to-card backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
            {activeDataSource === 'database' ? <Database className="w-5 h-5 text-primary" /> : <FileSpreadsheet className="w-5 h-5 text-primary" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">
                {activeDataSource === 'database' ? 'Direct Database Connection Active' : 'Cray Group ISP Sales Report Loaded'}
              </span>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] px-2">
                Live Data Synchronized
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Analyzing 14 connected data points: Daily & monthly revenue, packages, hotspot stations, and top subscriber retention.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveTab('data_hub')}
            className="text-xs h-8 gap-1.5 border-border/80"
          >
            <Database className="w-3.5 h-3.5 text-primary" />
            Switch Data Source / DB Link
          </Button>
          <Button
            size="sm"
            onClick={() => exportISPToExcelWorkbook(dataset)}
            className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-semibold shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Download Excel (14 Sheets)
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Revenue */}
        <Card className="border border-border/70 bg-gradient-to-br from-card to-card/60 rounded-xl hover:shadow-md transition-all">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Revenue</span>
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                {summary.totalRevenueFormatted}
              </div>
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+108.5% Growth</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Vouchers */}
        <Card className="border border-border/70 bg-gradient-to-br from-card to-card/60 rounded-xl hover:shadow-md transition-all">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Vouchers Sold</span>
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center">
                <Layers className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                {formatNum(summary.totalVouchers)}
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground font-medium">
              Across {packages.length} Packages
            </div>
          </CardContent>
        </Card>

        {/* Average Revenue Per Voucher */}
        <Card className="border border-border/70 bg-gradient-to-br from-card to-card/60 rounded-xl hover:shadow-md transition-all">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Avg ARPU</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                {summary.averageRevenuePerVoucherFormatted}
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground font-medium">
              Per Voucher Sold
            </div>
          </CardContent>
        </Card>

        {/* Active Hotspot Stations */}
        <Card className="border border-border/70 bg-gradient-to-br from-card to-card/60 rounded-xl hover:shadow-md transition-all">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Base Stations</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <Radio className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                {stations.length} Active
              </div>
            </div>
            <div className="text-[11px] text-primary font-semibold truncate" title={stations[0]?.stationName}>
              Lead: {stations[0]?.stationName}
            </div>
          </CardContent>
        </Card>

        {/* Active Vouchers in Session */}
        <Card className="border border-border/70 bg-gradient-to-br from-card to-card/60 rounded-xl hover:shadow-md transition-all">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Active Sessions</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Wifi className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                {summary.voucherStatus.active}
              </div>
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Live Connected Users
            </div>
          </CardContent>
        </Card>

        {/* Used & Expired Vouchers */}
        <Card className="border border-border/70 bg-gradient-to-br from-card to-card/60 rounded-xl hover:shadow-md transition-all">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Redeemed</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                {formatNum(summary.voucherStatus.used)}
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground font-medium">
              {summary.voucherStatus.expired} Expired
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Row: Revenue & Sales Dynamics + Station Share */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Revenue and Vouchers Trend */}
        <Card className="lg:col-span-2 border border-border/70 shadow-sm rounded-xl">
          <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">Sales & Revenue Velocity</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Historical trajectory of voucher sales volume and total collections (KSh)
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-lg border border-border/50">
              <Button
                variant={timeView === 'daily' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeView('daily')}
                className="text-xs h-7 px-2.5"
              >
                Daily
              </Button>
              <Button
                variant={timeView === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeView('monthly')}
                className="text-xs h-7 px-2.5"
              >
                Monthly
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorVouch" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => `KSh ${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      name === 'Revenue' ? formatKsh(Number(val)) : `${val} vouchers`,
                      name
                    ]}
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="vouchers"
                    name="Vouchers Sold"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVouch)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Metrics Bar below chart */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/50 text-center">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Highest Daily Sales</p>
                <p className="text-xs font-bold text-foreground mt-0.5">September Peak: 64 Vouchers</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Top Monthly Total</p>
                <p className="text-xs font-bold text-foreground mt-0.5">July: 1,441 Vouchers</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Current Run Rate</p>
                <p className="text-xs font-bold text-foreground mt-0.5">~1,200 Vouchers / Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right 1 Col: Station Market Share & Voucher Status */}
        <Card className="border border-border/70 shadow-sm rounded-xl flex flex-col justify-between">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold text-foreground">Base Station Revenue Share</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Market distribution across connected access stations
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-between">
            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stationPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stationPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATION_COLORS[index % STATION_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => formatKsh(Number(val))}
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Station Legend Table */}
            <div className="space-y-2 pt-2 border-t border-border/50">
              {stations.slice(0, 4).map((s, idx) => {
                const percent = summary.totalRevenue > 0 ? ((s.revenueNum / summary.totalRevenue) * 100).toFixed(1) : '0';
                return (
                  <div key={s.stationName} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATION_COLORS[idx % STATION_COLORS.length] }} />
                      <span className="font-medium text-foreground capitalize">{s.stationName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{s.revenue}</span>
                      <Badge variant="outline" className="text-[10px] h-4 px-1">{percent}%</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: Package Performance & Top Customers Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Packages Bar Chart */}
        <Card className="border border-border/70 shadow-sm rounded-xl">
          <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">Top Packages by Revenue</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Revenue contribution and paid vs free voucher ratios
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('packages')}
              className="text-xs text-primary gap-1 h-7"
            >
              All Packages <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPackagesData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `KSh ${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      name === 'Revenue' ? formatKsh(Number(val)) : `${val} vouchers`,
                      name
                    ]}
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="revenue" name="Revenue" fill="#0284c7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Subscribers Leaderboard */}
        <Card className="border border-border/70 shadow-sm rounded-xl flex flex-col justify-between">
          <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">Top Spending Subscribers (CRM)</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Customer Lifetime Value (LTV) and voucher purchase volume
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('subscribers')}
              className="text-xs text-primary gap-1 h-7"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="divide-y divide-border/40">
              {topCustomers.slice(0, 5).map((c) => (
                <div key={c.phoneNumber} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                      #{c.rank}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-foreground">{c.phoneNumber}</span>
                        {c.rank === 1 && (
                          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[9px] px-1.5 h-4">
                            VIP Client
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {c.vouchersBought} Vouchers Bought
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xs text-foreground">{c.totalSpent}</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">LTV: {c.lifetimeValue}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Quick Navigation & Export Hub */}
      <div className="p-5 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('data_hub')}
          className="p-3.5 rounded-lg border border-border/60 hover:border-primary/50 bg-background/50 hover:bg-primary/5 cursor-pointer transition-all space-y-1.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
            <Database className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs text-foreground">Data Hub & DB Link</h4>
          <p className="text-[11px] text-muted-foreground">
            Upload new Excel files or configure real-time database connection to ISP Management App.
          </p>
        </div>

        <div
          onClick={() => setActiveTab('packages')}
          className="p-3.5 rounded-lg border border-border/60 hover:border-sky-500/50 bg-background/50 hover:bg-sky-500/5 cursor-pointer transition-all space-y-1.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Layers className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs text-foreground">Package Intelligence</h4>
          <p className="text-[11px] text-muted-foreground">
            Analyze 5GB Daily, 20GB Weekly, 3GB 6hrs, free vouchers, and customer stickiness.
          </p>
        </div>

        <div
          onClick={() => setActiveTab('reports')}
          className="p-3.5 rounded-lg border border-border/60 hover:border-emerald-500/50 bg-background/50 hover:bg-emerald-500/5 cursor-pointer transition-all space-y-1.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Download className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs text-foreground">Direct Downloads</h4>
          <p className="text-[11px] text-muted-foreground">
            Download the official 14-sheet Excel report, executive PDF, Word document, or CSV.
          </p>
        </div>

        <div
          onClick={() => setActiveTab('chat')}
          className="p-3.5 rounded-lg border border-border/60 hover:border-indigo-500/50 bg-background/50 hover:bg-indigo-500/5 cursor-pointer transition-all space-y-1.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs text-foreground">AI ISP Copilot</h4>
          <p className="text-[11px] text-muted-foreground">
            Ask AI about sales forecasts, voucher anomaly detection, and station optimization.
          </p>
        </div>
      </div>
    </div>
  );
}