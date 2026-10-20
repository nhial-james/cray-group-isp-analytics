import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Users, Search, Download, PhoneCall, Award,
  Sparkles, Repeat, CheckCircle2, ArrowRight, Eye, ShieldCheck
} from 'lucide-react';
import { ISPFullDataset, ISPTopCustomer } from '../types';
import { exportISPToCSV, formatKsh, formatNum } from '../services/ispDataService';

interface SubscribersPageProps {
  dataset: ISPFullDataset;
}

export function SubscribersPage({ dataset }: SubscribersPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<ISPTopCustomer | null>(null);

  const { topCustomers, repeatCustomers, packageStickiness } = dataset;

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return topCustomers.filter(c => c.phoneNumber.includes(searchTerm));
  }, [topCustomers, searchTerm]);

  // Find customer's package preference
  const getCustomerStickiness = (phone: string) => {
    return packageStickiness.filter(p => p.phone === phone);
  };

  // Find customer's repeat total
  const getCustomerRepeats = (phone: string) => {
    const match = repeatCustomers.find(r => r.phoneNumber === phone);
    return match ? match.totalPurchases : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Subscribers, Retention & LTV (CRM)</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Subscriber spending habits, Lifetime Value (LTV), repeat purchase frequency, and package stickiness.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => exportISPToCSV(topCustomers, 'cray-group-top-subscribers.csv')}
          className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-semibold shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          Export Subscribers (CSV)
        </Button>
      </div>

      {/* Top Customer Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Highest LTV Client */}
        <Card className="border border-border/70 bg-gradient-to-br from-card to-primary/5 rounded-xl">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Top LTV Subscriber</span>
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px]">Rank #1</Badge>
            </div>
            <div className="text-xl font-mono font-extrabold text-foreground">{topCustomers[0]?.phoneNumber || '—'}</div>
            <div className="text-lg font-bold text-primary">{topCustomers[0]?.totalSpent} Spent</div>
            <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
              {topCustomers[0]?.vouchersBought} Vouchers Purchased
            </p>
          </CardContent>
        </Card>

        {/* Highest Repeat Volume */}
        <Card className="border border-border/70 bg-gradient-to-br from-card to-emerald-500/5 rounded-xl">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Highest Repurchases</span>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px]">High Velocity</Badge>
            </div>
            <div className="text-xl font-mono font-extrabold text-foreground">{repeatCustomers[0]?.phoneNumber || '—'}</div>
            <div className="text-lg font-bold text-emerald-600">{repeatCustomers[0]?.totalPurchases} Total Purchases</div>
            <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
              Preferred Plan: 3GB 6hrs (213 times)
            </p>
          </CardContent>
        </Card>

        {/* Average Top 20 Customer Spend */}
        <Card className="border border-border/70 bg-card rounded-xl">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Top 20 Tier Revenue</span>
              <Badge variant="outline" className="text-[9px]">VIP Segment</Badge>
            </div>
            <div className="text-xl font-extrabold text-foreground">
              {formatKsh(topCustomers.reduce((acc, c) => acc + c.totalSpentNum, 0))}
            </div>
            <div className="text-xs text-muted-foreground">
              Accounts for ~85% of total voucher collections
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table: Top Customers */}
      <Card className="border border-border/70 shadow-sm rounded-xl">
        <CardHeader className="p-5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold text-foreground">Subscriber Lifetime Value & Purchase Frequency</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Ranked list of ISP customers by total spend and repeat transactions
            </CardDescription>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search phone number..."
              className="text-xs h-8 pl-8 w-52"
            />
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="border border-border/60 rounded-lg overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/60 text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Rank</th>
                  <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Phone Number</th>
                  <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Vouchers Bought</th>
                  <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Total Spent</th>
                  <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Lifetime Value</th>
                  <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Preferred Plan</th>
                  <th className="p-3 font-semibold uppercase tracking-wider text-[10px] text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredCustomers.map((c) => {
                  const stickiness = getCustomerStickiness(c.phoneNumber);
                  const topPlan = stickiness[0];
                  return (
                    <tr key={c.phoneNumber} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-bold text-muted-foreground">#{c.rank}</td>
                      <td className="p-3 font-mono font-bold text-foreground flex items-center gap-2">
                        <PhoneCall className="w-3.5 h-3.5 text-primary" />
                        {c.phoneNumber}
                      </td>
                      <td className="p-3 font-medium text-foreground">{c.vouchersBought}</td>
                      <td className="p-3 font-bold text-foreground">{c.totalSpent}</td>
                      <td className="p-3 font-medium text-emerald-600">{c.lifetimeValue}</td>
                      <td className="p-3 text-muted-foreground">
                        {topPlan ? (
                          <span className="font-medium text-foreground">
                            {topPlan.packageName} <span className="text-primary font-semibold">({topPlan.timesBought}x)</span>
                          </span>
                        ) : (
                          '5GB Daily'
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedCustomer(c)}
                          className="text-xs h-7 gap-1 text-primary hover:bg-primary/10"
                        >
                          <Eye className="w-3 h-3" /> Profile
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Customer Profile Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="max-w-md w-full border border-border shadow-2xl rounded-xl bg-background">
            <CardHeader className="p-5 pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-primary" />
                  Subscriber Profile: {selectedCustomer.phoneNumber}
                </CardTitle>
                <Badge variant="outline" className="text-[10px]">Rank #{selectedCustomer.rank}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Total Spent</span>
                  <span className="text-base font-bold text-primary mt-1 block">{selectedCustomer.totalSpent}</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Vouchers Bought</span>
                  <span className="text-base font-bold text-foreground mt-1 block">{selectedCustomer.vouchersBought}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs text-foreground mb-2">Package Stickiness History</h4>
                <div className="space-y-1.5 border border-border/50 rounded-lg p-3 bg-muted/10">
                  {getCustomerStickiness(selectedCustomer.phoneNumber).map((s) => (
                    <div key={s.packageName} className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{s.packageName}</span>
                      <Badge variant="secondary" className="font-mono text-[10px]">{s.timesBought} Times</Badge>
                    </div>
                  ))}
                  {getCustomerStickiness(selectedCustomer.phoneNumber).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Standard package distribution across sessions.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button size="sm" onClick={() => setSelectedCustomer(null)} className="text-xs h-8">
                  Close Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
