import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  FileSpreadsheet, FileText, Printer, Download,
  CheckCircle2, Sparkles, Filter, Database, Shield,
  Layers, Radio, Users, Check
} from 'lucide-react';
import { ISPFullDataset, SystemSettings, AppUser } from '../types';
import {
  exportISPToExcelWorkbook,
  exportISPToWord,
  exportISPToPrintablePDF,
  exportISPToJSON,
  exportISPToCSV,
  formatKsh,
  formatNum
} from '../services/ispDataService';

interface ReportsPageProps {
  dataset: ISPFullDataset;
  currentUser: AppUser;
  settings?: SystemSettings;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function ReportsPage({
  dataset,
  currentUser,
  settings,
  showToast,
}: ReportsPageProps) {
  const [selectedFormat, setSelectedFormat] = useState<'excel' | 'word' | 'pdf' | 'csv' | 'json'>('excel');
  const [reportTitle, setReportTitle] = useState('Cray Group ISP Sales & Network Analytics Report');
  const [includeAIInsights, setIncludeAIInsights] = useState(true);
  const [includeStations, setIncludeStations] = useState(true);
  const [includePackages, setIncludePackages] = useState(true);
  const [includeSubscribers, setIncludeSubscribers] = useState(true);

  const handleDownload = () => {
    switch (selectedFormat) {
      case 'excel':
        exportISPToExcelWorkbook(dataset, `${reportTitle.replace(/\s+/g, '_')}.xlsx`);
        showToast('Downloaded complete 14-sheet Excel report!', 'success');
        break;
      case 'word':
        exportISPToWord(dataset, settings);
        showToast('Downloaded Executive Word Document (.doc)!', 'success');
        break;
      case 'pdf':
        exportISPToPrintablePDF(dataset, settings);
        showToast('Generated printable PDF report view!', 'success');
        break;
      case 'json':
        exportISPToJSON(dataset, `${reportTitle.replace(/\s+/g, '_')}.json`);
        showToast('Downloaded structured JSON data!', 'success');
        break;
      case 'csv':
        exportISPToCSV(dataset.packages, 'cray-group-packages-sales.csv');
        showToast('Downloaded CSV data file!', 'success');
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Analytics Reports & Direct Downloads</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Export the complete ISP dataset, board reports, and sales audits directly in Excel, Word, PDF, CSV, or JSON.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleDownload}
          className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-semibold shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          Download Now ({selectedFormat.toUpperCase()})
        </Button>
      </div>

      {/* Format Selection Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
        {/* Excel Option */}
        <div
          onClick={() => setSelectedFormat('excel')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedFormat === 'excel'
              ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-sm'
              : 'border-border/70 bg-card hover:border-primary/40'
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-xs text-foreground">Excel Workbook (.xlsx)</h4>
          <p className="text-[10px] text-muted-foreground mt-1">
            Complete 14 interconnected sheets matching Cray Group's official audit template.
          </p>
          <Badge className="mt-3 text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            Recommended
          </Badge>
        </div>

        {/* Word Document Option */}
        <div
          onClick={() => setSelectedFormat('word')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedFormat === 'word'
              ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-sm'
              : 'border-border/70 bg-card hover:border-primary/40'
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3">
            <FileText className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-xs text-foreground">Word Document (.doc)</h4>
          <p className="text-[10px] text-muted-foreground mt-1">
            Executive narrative report with KPI blocks, station reviews, and strategic insights.
          </p>
          <Badge variant="outline" className="mt-3 text-[9px]">Executive</Badge>
        </div>

        {/* PDF Option */}
        <div
          onClick={() => setSelectedFormat('pdf')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedFormat === 'pdf'
              ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-sm'
              : 'border-border/70 bg-card hover:border-primary/40'
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-3">
            <Printer className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-xs text-foreground">Printable PDF Report</h4>
          <p className="text-[10px] text-muted-foreground mt-1">
            Full-color executive brief with formatted tables, station summaries, and headers.
          </p>
          <Badge variant="outline" className="mt-3 text-[9px]">Print Ready</Badge>
        </div>

        {/* CSV Option */}
        <div
          onClick={() => setSelectedFormat('csv')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedFormat === 'csv'
              ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-sm'
              : 'border-border/70 bg-card hover:border-primary/40'
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3">
            <Layers className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-xs text-foreground">Flat CSV Exports</h4>
          <p className="text-[10px] text-muted-foreground mt-1">
            Raw tabular data for downstream ingestion into accounting, ERP, or billing software.
          </p>
          <Badge variant="outline" className="mt-3 text-[9px]">ERP Ready</Badge>
        </div>

        {/* JSON Option */}
        <div
          onClick={() => setSelectedFormat('json')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedFormat === 'json'
              ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-sm'
              : 'border-border/70 bg-card hover:border-primary/40'
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-3">
            <Database className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-xs text-foreground">Structured JSON Data</h4>
          <p className="text-[10px] text-muted-foreground mt-1">
            Complete dataset payload with all 14 sheets keyed for API integrations and backups.
          </p>
          <Badge variant="outline" className="mt-3 text-[9px]">API Payload</Badge>
        </div>
      </div>

      {/* Report Configuration & Direct Download Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border border-border/70 shadow-sm rounded-xl">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold text-foreground">Report Customization & Parameters</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Configure titles, corporate branding, and sections to include
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Report Title</label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full text-xs h-9 bg-background border border-border rounded-lg px-3 font-medium outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground block">Sections to Include</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-muted/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAIInsights}
                    onChange={(e) => setIncludeAIInsights(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span>Executive AI Insights & Strategy</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-muted/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeStations}
                    onChange={(e) => setIncludeStations(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span>Base Stations & Hotspot Rankings</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-muted/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includePackages}
                    onChange={(e) => setIncludePackages(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span>Package Catalog & ARPU Analysis</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-muted/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSubscribers}
                    onChange={(e) => setIncludeSubscribers(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span>Top Spending Subscribers (CRM)</span>
                </label>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                onClick={handleDownload}
                className="text-xs h-9 gap-2 bg-primary text-primary-foreground font-semibold px-4"
              >
                <Download className="w-4 h-4" />
                Generate & Download {selectedFormat.toUpperCase()}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Preview Summary Card */}
        <Card className="border border-border/70 shadow-sm rounded-xl flex flex-col justify-between">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold text-foreground">Export Payload Summary</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Summary of records ready for download
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-3">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Revenue:</span>
                <span className="font-bold text-foreground">{dataset.summary.totalRevenueFormatted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Vouchers:</span>
                <span className="font-bold text-foreground">{formatNum(dataset.summary.totalVouchers)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Base Stations:</span>
                <span className="font-bold text-foreground">{dataset.stations.length} Stations</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Internet Packages:</span>
                <span className="font-bold text-foreground">{dataset.packages.length} Plans</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Sheets:</span>
                <span className="font-bold text-primary">14 Connected Sheets</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => exportISPToExcelWorkbook(dataset)}
              className="w-full text-xs h-8 gap-2 border-primary/30 text-primary hover:bg-primary/10"
            >
              <FileSpreadsheet className="w-4 h-4" /> Download 14-Sheet Excel Direct
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
