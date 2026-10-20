import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Radio, Download, Wifi, TrendingUp, Users,
  Activity, MapPin, CheckCircle2, AlertTriangle, Layers
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area
} from 'recharts';
import { ISPFullDataset } from '../types';
import { exportISPToCSV, formatKsh, formatNum } from '../services/ispDataService';

interface StationsPageProps {
  dataset: ISPFullDataset;
}

const STATION_COLORS = ['#0284c7', '#0d9488', '#f59e0b', '#ec4899', '#8b5cf6'];

export function StationsPage({ dataset }: StationsPageProps) {
  const { stations, crossStationSales, monthlyByStation, summary } = dataset;

  const [selectedStation, setSelectedStation] = useState<string>(stations[0]?.stationName || 'Daystar');

  // Station monthly trend data
  const stationMonthlyChartData = useMemo(() => {
    const months = Array.from(new Set(monthlyByStation.map(m => m.month))).sort();
    return months.map(m => {
      const row: any = { month: m };
      stations.forEach(s => {
        const match = monthlyByStation.find(item => item.month === m && item.stationName.toLowerCase() === s.stationName.toLowerCase());
        row[s.stationName] = match ? match.vouchersSold : 0;
      });
      return row;
    });
  }, [monthlyByStation, stations]);

  // Packages sold at selected station
  const stationPackages = useMemo(() => {
    return crossStationSales.filter(c => c.station.toLowerCase() === selectedStation.toLowerCase());
  }, [crossStationSales, selectedStation]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Base Stations & Hotspot Performance</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Geographic hotspot network analysis, station revenue rankings, cross-station package demand, and monthly station velocity.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => exportISPToCSV(stations, 'cray-group-stations-performance.csv')}
          className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-semibold shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          Export Station Data (CSV)
        </Button>
      </div>

      {/* Station Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {stations.map((s, idx) => {
          const share = summary.totalRevenue > 0 ? ((s.revenueNum / summary.totalRevenue) * 100).toFixed(1) : '0';
          const isSelected = selectedStation.toLowerCase() === s.stationName.toLowerCase();
          return (
            <Card
              key={s.stationName}
              onClick={() => setSelectedStation(s.stationName)}
              className={`cursor-pointer transition-all rounded-xl border ${
                isSelected
                  ? 'border-primary shadow-md ring-1 ring-primary/30 bg-primary/5'
                  : 'border-border/70 hover:border-primary/40 bg-card'
              }`}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATION_COLORS[idx % STATION_COLORS.length] }} />
                    <span className="font-bold text-xs capitalize text-foreground">{s.stationName}</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] h-4 px-1">{share}%</Badge>
                </div>

                <div className="text-lg font-extrabold text-foreground">{s.revenue}</div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                  <span>{formatNum(s.totalVouchers)} Vouchers</span>
                  <span>{s.avgPerVoucher} / ARPU</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Monthly Trajectory by Station Chart */}
      <Card className="border border-border/70 shadow-sm rounded-xl">
        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-sm font-bold text-foreground">Monthly Voucher Volume Trajectory by Station</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Longitudinal monthly voucher sales across each hotspot deployment
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-2">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stationMonthlyChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} vouchers`, name]}
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                {stations.map((s, idx) => (
                  <Area
                    key={s.stationName}
                    type="monotone"
                    dataKey={s.stationName}
                    name={s.stationName}
                    stroke={STATION_COLORS[idx % STATION_COLORS.length]}
                    fill={STATION_COLORS[idx % STATION_COLORS.length]}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cross Station Sales Heatmap / Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Packages at Selected Station */}
        <Card className="border border-border/70 shadow-sm rounded-xl">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold text-foreground">
              Package Demand at {selectedStation} Station
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Vouchers purchased specifically at this hotspot location
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {stationPackages.length > 0 ? (
              <div className="space-y-3">
                {stationPackages.map((cp) => (
                  <div key={cp.package} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">{cp.package}</span>
                      <span className="font-bold text-primary">{formatNum(cp.sold)} Vouchers Sold</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(100, (cp.sold / 3307) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No specific package cross-sales recorded for this station.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Station Infrastructure & Audit */}
        <Card className="border border-border/70 shadow-sm rounded-xl flex flex-col justify-between">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold text-foreground">Hotspot Station Infrastructure Audit</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              NOC status, backhaul connectivity, and expansion priority
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-3">
            <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-foreground block">Daystar Hotspot Cluster</span>
                <span className="text-[10px] text-muted-foreground">High-density campus network &bull; 94.4% of total traffic</span>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                High Utilization
              </Badge>
            </div>

            <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-foreground block">Juja Station APs</span>
                <span className="text-[10px] text-muted-foreground">Secondary university hub &bull; 455 vouchers</span>
              </div>
              <Badge className="bg-sky-500/10 text-sky-600 border-sky-500/20 text-[10px]">
                Growing
              </Badge>
            </div>

            <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-foreground block">Mumias & Bookers Stations</span>
                <span className="text-[10px] text-muted-foreground">Low activity &bull; Recommend physical site check</span>
              </div>
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                Action Needed
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
