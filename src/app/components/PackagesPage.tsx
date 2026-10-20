import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Layers, Search, Download, TrendingUp, Sparkles,
  CheckCircle2, ArrowUpRight, BarChart2, Filter, Wifi
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { ISPFullDataset } from '../types';
import { exportISPToCSV, formatKsh, formatNum } from '../services/ispDataService';

interface PackagesPageProps {
  dataset: ISPFullDataset;
}

const COLORS = ['#0284c7', '#0d9488', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b', '#10b981', '#f97316'];

export function PackagesPage({ dataset }: PackagesPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'revenue' | 'vouchers' | 'avg'>('revenue');

  const { packages, packageStickiness } = dataset;

  // Filtered and sorted packages
  const filteredPackages = useMemo(() => {
    let list = packages.filter(p => p.packageName.toLowerCase().includes(searchTerm.toLowerCase()));
    if (sortField === 'revenue') {
      list.sort((a, b) => b.totalRevenueNum - a.totalRevenueNum);
    } else if (sortField === 'vouchers') {
      list.sort((a, b) => b.totalVouchers - a.totalVouchers);
    } else {
      list.sort((a, b) => b.avgRevenueNum - a.avgRevenueNum);
    }
    return list;
  }, [packages, searchTerm, sortField]);

  // Aggregate free vs paid vouchers
  const totalFreeVouchers = useMemo(() => {
    return packages.reduce((acc, p) => acc + p.freeVouchers, 0);
  }, [packages]);

  const totalPaidVouchers = useMemo(() => {
    return dataset.summary.totalVouchers - totalFreeVouchers;
  }, [dataset.summary.totalVouchers, totalFreeVouchers]);

  // Chart data: Top 8 Packages Volume vs Revenue
  const chartData = useMemo(() => {
    return packages.slice(0, 8).map(p => ({
      name: p.packageName,
      revenue: p.totalRevenueNum,
      vouchers: p.totalVouchers,
      free: p.freeVouchers,
    }));
  }, [packages]);

  // Stickiness summary by package
  const stickinessSummary = useMemo(() => {
    const map = new Map<string, number>();
    packageStickiness.forEach(s => {
      const current = map.get(s.packageName) || 0;
      map.set(s.packageName, current + s.timesBought);
    });
    return Array.from(map.entries()).map(([name, count]) => ({
      name,
      count,
    })).sort((a, b) => b.count - a.count);
  }, [packageStickiness]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Internet Packages & Bandwidth Analysis</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Commercial breakdown of voucher packages, pricing elasticity, free promotion allowances, and subscriber loyalty.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => exportISPToCSV(packages, 'cray-group-packages-analytics.csv')}
          className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-semibold shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          Export Packages (CSV)
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-border/70 bg-card rounded-xl">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Active Packages</span>
            <div className="text-2xl font-extrabold text-foreground mt-1">{packages.length} Catalog Plans</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Daily, Weekly & Micro-hourly</p>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card rounded-xl">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Flagship Product</span>
            <div className="text-2xl font-extrabold text-primary mt-1">{packages[0]?.packageName || '5GB Daily'}</div>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">{packages[0]?.totalRevenue} Generated</p>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card rounded-xl">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Free Promotional Vouchers</span>
            <div className="text-2xl font-extrabold text-foreground mt-1">{formatNum(totalFreeVouchers)}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Complimentary / Trial Allocation</p>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card rounded-xl">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Stickiest Repeat Plan</span>
            <div className="text-2xl font-extrabold text-indigo-600 mt-1">{stickinessSummary[0]?.name || '3GB 6hrs'}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{stickinessSummary[0]?.count || 213} Repeat Purchases</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts: Package Revenue & Free vs Paid Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border border-border/70 shadow-sm rounded-xl">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold text-foreground">Package Revenue & Paid Voucher Distribution</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Comparison of total collections (KSh) and unit volume per package
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => `KSh ${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      name === 'Revenue' ? formatKsh(Number(val)) : `${val} vouchers`,
                      name
                    ]}
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="vouchers" name="Vouchers Sold" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Package Loyalty & Stickiness ranking */}
        <Card className="border border-border/70 shadow-sm rounded-xl flex flex-col justify-between">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold text-foreground">Package Stickiness & Repeat Rate</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Packages purchased most consistently by repeating subscribers
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 flex-1">
            <div className="divide-y divide-border/40">
              {stickinessSummary.slice(0, 6).map((item, idx) => (
                <div key={item.name} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-xs text-muted-foreground w-4">#{idx + 1}</span>
                    <span className="font-semibold text-xs text-foreground">{item.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {item.count} Repurchases
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Package Catalog Table */}
      <Card className="border border-border/70 shadow-sm rounded-xl">
        <CardHeader className="p-5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold text-foreground">Full Internet Package Catalog</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Detailed performance metrics for every plan in the system
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search plan..."
                className="text-xs h-8 pl-8 w-44"
              />
            </div>

            <select
              value={sortField}
              onChange={(e: any) => setSortField(e.target.value)}
              className="text-xs h-8 bg-background border border-border rounded-lg px-2.5 font-medium"
            >
              <option value="revenue">Sort by Revenue</option>
              <option value="vouchers">Sort by Volume Sold</option>
              <option value="avg">Sort by ARPU / Margin</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="border border-border/60 rounded-lg overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/60 text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Package Name</th>
                  <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Total Vouchers</th>
                  <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Total Revenue</th>
                  <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Free Vouchers</th>
                  <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Avg Yield / ARPU</th>
                  <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Revenue Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredPackages.map((p) => {
                  const share = dataset.summary.totalRevenue > 0
                    ? ((p.totalRevenueNum / dataset.summary.totalRevenue) * 100).toFixed(1)
                    : '0.0';
                  return (
                    <tr key={p.packageName} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-bold text-foreground flex items-center gap-2">
                        <Wifi className="w-3.5 h-3.5 text-primary" />
                        {p.packageName}
                      </td>
                      <td className="p-3 font-medium text-foreground">{formatNum(p.totalVouchers)}</td>
                      <td className="p-3 font-bold text-foreground">{p.totalRevenue}</td>
                      <td className="p-3 text-muted-foreground">
                        {p.freeVouchers > 0 ? (
                          <span className="text-amber-600 font-medium">{p.freeVouchers} Free</span>
                        ) : (
                          '0'
                        )}
                      </td>
                      <td className="p-3 font-medium text-foreground">{p.avgRevenue}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] font-semibold text-primary">
                          {share}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
