import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  AlertTriangle,
  X,
  CheckCircle2,
  Radio,
  Wifi,
  Users,
  Database,
  ArrowRight
} from 'lucide-react';
import { ISPFullDataset, AppUser } from '../types';

interface DataQualityAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
  dataset: ISPFullDataset;
  onNavigateTab: (tab: string) => void;
}

export function DataQualityAlertsModal({
  isOpen,
  onClose,
  currentUser,
  dataset,
  onNavigateTab,
}: DataQualityAlertsModalProps) {
  if (!isOpen) return null;

  const alerts = [
    {
      id: 'alt_mumias',
      severity: 'warning' as const,
      title: 'Low Volume Warning: Mumias Base Station',
      description: 'Mumias Station generated only KSh 11 across 5 vouchers in April with 0 vouchers since. Check access point backhaul and power status.',
      targetTab: 'stations',
      actionLabel: 'Inspect Stations',
    },
    {
      id: 'alt_bookers',
      severity: 'danger' as const,
      title: 'Zero Sales Alert: Bookers Hotspot',
      description: 'Bookers Station has 0 vouchers sold and KSh 0 revenue. Verify Mikrotik gateway configuration or SSID broadcast.',
      targetTab: 'stations',
      actionLabel: 'Inspect Hotspot',
    },
    {
      id: 'alt_vip',
      severity: 'info' as const,
      title: 'High-Value VIP Retention: +254 745 754 571',
      description: 'Subscriber has reached KSh 200,630 lifetime spend. Automatic priority bandwidth tagging recommended.',
      targetTab: 'subscribers',
      actionLabel: 'View Subscriber',
    },
    {
      id: 'alt_expiry',
      severity: 'warning' as const,
      title: 'Voucher Expiration Ratio',
      description: `${dataset.summary.voucherStatus.expired.toLocaleString()} vouchers expired vs ${dataset.summary.voucherStatus.used} redeemed. Review validity duration policy for 3GB/5GB micro-packages.`,
      targetTab: 'packages',
      actionLabel: 'Review Packages',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="max-w-lg w-full border border-border shadow-2xl rounded-2xl bg-background overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-border/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Network & Sales Operational Alerts
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Automated anomaly detection across connected ISP stations and billing streams
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-xl border space-y-2 text-xs ${
                alert.severity === 'danger'
                  ? 'border-destructive/30 bg-destructive/5'
                  : alert.severity === 'warning'
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : 'border-primary/30 bg-primary/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">{alert.title}</span>
                <Badge
                  variant="outline"
                  className={`text-[9px] uppercase font-bold ${
                    alert.severity === 'danger'
                      ? 'text-destructive border-destructive/30'
                      : alert.severity === 'warning'
                      ? 'text-amber-600 border-amber-500/30'
                      : 'text-primary border-primary/30'
                  }`}
                >
                  {alert.severity}
                </Badge>
              </div>

              <p className="text-muted-foreground leading-relaxed">{alert.description}</p>

              <div className="flex justify-end pt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    onNavigateTab(alert.targetTab);
                    onClose();
                  }}
                  className="text-xs h-7 gap-1 text-primary hover:bg-primary/10"
                >
                  {alert.actionLabel} <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
