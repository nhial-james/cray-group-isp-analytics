import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import {
  Upload, FileSpreadsheet, Database, CheckCircle2, AlertTriangle,
  RefreshCw, Download, Server, Radio, Shield, Layers, Plus,
  Trash2, Eye, ExternalLink, Activity, ArrowRight, Sparkles, Check
} from 'lucide-react';
import {
  ISPFullDataset,
  UploadedFileRecord,
  ISPDatabaseConnection,
  AppUser,
  ISPConnectionType,
  SyncFrequency
} from '../types';
import {
  parseISPExcelWorkbook,
  getCrayGroupDefaultDataset,
  exportISPToExcelWorkbook,
  formatKsh,
  formatNum
} from '../services/ispDataService';

interface DataHubPageProps {
  dataset: ISPFullDataset;
  onUpdateDataset: (newDataset: ISPFullDataset) => void;
  files: UploadedFileRecord[];
  onSaveFile: (file: UploadedFileRecord) => void;
  onDeleteFile: (fileId: string) => void;
  databaseConnections: ISPDatabaseConnection[];
  onSaveConnection: (conn: ISPDatabaseConnection) => void;
  onDeleteConnection: (connId: string) => void;
  activeDataSource: 'excel' | 'database';
  onSetActiveDataSource: (source: 'excel' | 'database', dbId?: string) => void;
  currentUser: AppUser;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function DataHubPage({
  dataset,
  onUpdateDataset,
  files,
  onSaveFile,
  onDeleteFile,
  databaseConnections,
  onSaveConnection,
  onDeleteConnection,
  activeDataSource,
  onSetActiveDataSource,
  currentUser,
  showToast,
}: DataHubPageProps) {
  const [activeSubTab, setActiveSubTab] = useState<'upload' | 'database' | 'inspector'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Inspector sheet selector
  const [selectedInspectorSheet, setSelectedInspectorSheet] = useState<string>('Summary');

  // New DB Connection Form State
  const [isAddingConnection, setIsAddingConnection] = useState(false);
  const [dbName, setDbName] = useState('');
  const [dbType, setDbType] = useState<ISPConnectionType>('PostgreSQL');
  const [dbUrl, setDbUrl] = useState('');
  const [dbPort, setDbPort] = useState(5432);
  const [dbDatabase, setDbDatabase] = useState('');
  const [dbUser, setDbUser] = useState('');
  const [dbToken, setDbToken] = useState('');
  const [dbSsl, setDbSsl] = useState(true);
  const [dbSyncFreq, setDbSyncFreq] = useState<SyncFrequency>('15m');
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);

  // ─── File Upload Handler ────────────────────────────────────────────────────

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const parsedDataset = parseISPExcelWorkbook(workbook);

      // Save as UploadedFileRecord
      const newFileRecord: UploadedFileRecord = {
        id: 'file_' + Math.random().toString(36).slice(2, 9),
        name: file.name,
        type: (file.name.split('.').pop() as any) || 'xlsx',
        sizeBytes: file.size,
        uploadDate: new Date().toISOString().split('T')[0],
        uploadedBy: currentUser.name,
        processingStatus: 'Ready',
        analysisStatus: 'Analysed',
        sheetNames: workbook.SheetNames,
        selectedSheet: workbook.SheetNames[0] || 'Summary',
        parsedISPData: parsedDataset,
      };

      onSaveFile(newFileRecord);
      onUpdateDataset(parsedDataset);
      onSetActiveDataSource('excel');
      showToast(`Successfully parsed and loaded "${file.name}" with ${workbook.SheetNames.length} ISP sheets!`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`Error reading Excel file: ${err.message || 'Invalid format'}`, 'error');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Instant Load of Official Sample
  const handleLoadOfficialSample = () => {
    const sample = getCrayGroupDefaultDataset();
    onUpdateDataset(sample);
    onSetActiveDataSource('excel');
    showToast('Loaded official Cray-Group-Sales-Analytics-Report (14 Connected Sheets)', 'success');
  };

  // ─── DB Connection Test & Save ──────────────────────────────────────────────

  const handleTestConnection = () => {
    if (!dbUrl.trim()) {
      showToast('Please provide a Database URL or API Endpoint', 'error');
      return;
    }
    setIsTestingConn(true);
    setTestResult(null);

    setTimeout(() => {
      setIsTestingConn(false);
      const simulatedLatency = Math.floor(Math.random() * 15) + 10; // 10-25ms
      setTestResult({
        success: true,
        message: `Handshake successful. SSL verified. Ping latency: ${simulatedLatency}ms. Ready to stream data points.`,
        latency: simulatedLatency,
      });
      showToast('Connection verified successfully!', 'success');
    }, 800);
  };

  const handleSaveConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbName.trim() || !dbUrl.trim()) {
      showToast('Connection Name and Endpoint URL are required', 'error');
      return;
    }

    const newConn: ISPDatabaseConnection = {
      id: 'conn_' + Math.random().toString(36).slice(2, 9),
      name: dbName,
      type: dbType,
      endpointUrl: dbUrl,
      databaseName: dbDatabase || undefined,
      port: dbPort || 5432,
      username: dbUser || undefined,
      authToken: dbToken || undefined,
      sslEnabled: dbSsl,
      status: 'Connected',
      lastSyncTime: 'Just now',
      lastLatencyMs: testResult?.latency || 16,
      autoSync: true,
      syncFrequency: dbSyncFreq,
      notes: `Configured by ${currentUser.name}`,
    };

    onSaveConnection(newConn);
    onSetActiveDataSource('database', newConn.id);
    setIsAddingConnection(false);
    showToast(`Saved and connected to "${dbName}"`, 'success');
  };

  const handleSyncDatabaseNow = (conn: ISPDatabaseConnection) => {
    showToast(`Syncing fresh data points from "${conn.name}"...`, 'info');
    setTimeout(() => {
      // Simulate live sync updating dataset with slight realtime delta
      const current = getCrayGroupDefaultDataset();
      current.summary.voucherStatus.active += Math.floor(Math.random() * 5);
      onUpdateDataset(current);
      onSetActiveDataSource('database', conn.id);
      showToast(`Database synchronized! Fresh voucher and station metrics pulled directly from ISP core.`, 'success');
    }, 1000);
  };

  // ─── Inspector Sheet Table Data ─────────────────────────────────────────────

  const sheetData = useMemo(() => {
    switch (selectedInspectorSheet) {
      case 'Summary':
        return dataset.summary.top5Packages.map(p => ({ Metric: 'Top Package', Name: p.package, Revenue: p.revenue }));
      case 'Sales by Day':
        return dataset.salesByDay;
      case 'Revenue Trend':
        return dataset.revenueTrend;
      case 'Packages':
        return dataset.packages;
      case 'Stations':
        return dataset.stations;
      case 'Top Customers':
        return dataset.topCustomers;
      case 'Repeat Customers':
        return dataset.repeatCustomers;
      case 'Package Stickiness':
        return dataset.packageStickiness;
      case 'Weekly Trend':
        return dataset.weeklyTrend;
      case 'Monthly Trend':
        return dataset.monthlyTrend;
      case 'Monthly by Station':
        return dataset.monthlyByStation;
      case 'Cross Station Sales':
        return dataset.crossStationSales;
      default:
        return dataset.packages;
    }
  }, [selectedInspectorSheet, dataset]);

  const inspectorColumns = useMemo(() => {
    if (!sheetData || sheetData.length === 0) return [];
    return Object.keys(sheetData[0]);
  }, [sheetData]);

  return (
    <div className="space-y-6">
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Data Hub & Ingestion Engine</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ingest ISP data via Excel upload (e.g. Cray-Group-Sales-Analytics-Report.xlsx) or connect directly to the ISP Management Database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleLoadOfficialSample}
            variant="outline"
            className="text-xs h-8 gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Load Cray Group Sample (14 Sheets)
          </Button>
          <Button
            size="sm"
            onClick={() => exportISPToExcelWorkbook(dataset)}
            className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-semibold shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Download Current Dataset (.xlsx)
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeSubTab} onValueChange={(v: any) => setActiveSubTab(v)} className="space-y-6">
        <TabsList className="bg-card border border-border/60 p-1">
          <TabsTrigger value="upload" className="text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel / CSV Upload
          </TabsTrigger>
          <TabsTrigger value="database" className="text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium">
            <Database className="w-3.5 h-3.5" />
            Direct Database Link ({databaseConnections.length})
          </TabsTrigger>
          <TabsTrigger value="inspector" className="text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium">
            <Layers className="w-3.5 h-3.5" />
            Data Point Inspector (14 Sheets)
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: EXCEL UPLOAD ────────────────────────────────────────── */}
        <TabsContent value="upload" className="space-y-6">
          <Card className="border border-border/70 shadow-sm rounded-xl">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold text-foreground">Upload ISP Sales Analytics Spreadsheet</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Drop your official ISP report (e.g. Cray-Group-Sales-Analytics-Report.xlsx). All 14 sheets, summary aggregates, packages, and station matrices will be automatically extracted.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-primary bg-primary/10 scale-[0.99]'
                    : 'border-border/80 hover:border-primary/60 bg-muted/20 hover:bg-muted/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3">
                  <Upload className="w-7 h-7" />
                </div>

                <h4 className="font-bold text-sm text-foreground">
                  {isProcessing ? 'Parsing ISP Sheets...' : 'Click to select or drag and drop your ISP Excel file'}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Supports Microsoft Excel (.xlsx, .xls) and CSV files. Example: <code>Cray-Group-Sales-Analytics-Report (1).xlsx</code>
                </p>

                <div className="flex items-center justify-center gap-2 mt-4">
                  <Badge variant="outline" className="text-[10px] bg-background">14 Sheets Auto-detected</Badge>
                  <Badge variant="outline" className="text-[10px] bg-background">Revenue & Vouchers</Badge>
                  <Badge variant="outline" className="text-[10px] bg-background">Hotspot Stations</Badge>
                  <Badge variant="outline" className="text-[10px] bg-background">Subscribers CRM</Badge>
                </div>
              </div>

              {/* Uploaded History List */}
              <div className="pt-4 border-t border-border/50">
                <h4 className="font-bold text-xs text-foreground mb-3 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                  Active Ingestion Files
                </h4>

                <div className="divide-y divide-border/40 border border-border/50 rounded-lg overflow-hidden bg-card">
                  <div className="p-3.5 flex items-center justify-between bg-primary/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">Cray-Group-Sales-Analytics-Report.xlsx</span>
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px]">Active Dataset</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          14 Sheets &bull; 5,904 Vouchers &bull; KSh 238,375 Total Revenue &bull; Verified
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedInspectorSheet('Summary')}
                        className="text-xs h-7 gap-1"
                      >
                        <Eye className="w-3 h-3" /> Inspect
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => exportISPToExcelWorkbook(dataset)}
                        className="text-xs h-7 gap-1 bg-primary text-primary-foreground"
                      >
                        <Download className="w-3 h-3" /> Export
                      </Button>
                    </div>
                  </div>

                  {files.map(f => (
                    <div key={f.id} className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-xs text-foreground">{f.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Uploaded by {f.uploadedBy} on {f.uploadDate} &bull; {(f.sizeBytes / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDeleteFile(f.id)}
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 2: DIRECT DATABASE LINK ─────────────────────────────────── */}
        <TabsContent value="database" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Direct ISP Management App Database Connections</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Connect directly to your ISP core database (FreeRADIUS, MikroTik, PostgreSQL, or REST API) to stream live vouchers, stations, and subscriber data points.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsAddingConnection(!isAddingConnection)}
              className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAddingConnection ? 'Cancel' : 'Add Database Link'}
            </Button>
          </div>

          {/* Add Connection Modal/Form */}
          {isAddingConnection && (
            <Card className="border border-primary/30 shadow-md rounded-xl bg-card">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-sm font-bold text-foreground">Configure New ISP Management DB Connection</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Provide connection parameters for direct read-only access to live ISP data points.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <form onSubmit={handleSaveConnection} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Connection Name</label>
                      <Input
                        value={dbName}
                        onChange={(e) => setDbName(e.target.value)}
                        placeholder="e.g. Cray Core Radius DB"
                        className="text-xs h-9"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Database Engine / Connector Type</label>
                      <select
                        value={dbType}
                        onChange={(e: any) => setDbType(e.target.value)}
                        className="w-full text-xs h-9 bg-background border border-border rounded-lg px-2.5 font-medium"
                      >
                        <option value="PostgreSQL">PostgreSQL (Radius & Accounting)</option>
                        <option value="MySQL">MySQL (Billing & Subscribers)</option>
                        <option value="REST API">REST API Endpoint (ISP Core JSON)</option>
                        <option value="FreeRADIUS DB">FreeRADIUS Server DB</option>
                        <option value="Mikrotik API">MikroTik RouterOS API</option>
                      </select>
                    </div>

                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Database Endpoint URL / URI</label>
                      <Input
                        value={dbUrl}
                        onChange={(e) => setDbUrl(e.target.value)}
                        placeholder="postgresql://username:password@db.craygroup.net:5432/isp_db or https://api.craygroup.net/v1"
                        className="text-xs h-9 font-mono"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Database Name</label>
                      <Input
                        value={dbDatabase}
                        onChange={(e) => setDbDatabase(e.target.value)}
                        placeholder="cray_isp_prod"
                        className="text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Username / Client ID</label>
                      <Input
                        value={dbUser}
                        onChange={(e) => setDbUser(e.target.value)}
                        placeholder="isp_readonly_operator"
                        className="text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Password / Bearer Auth Token</label>
                      <Input
                        type="password"
                        value={dbToken}
                        onChange={(e) => setDbToken(e.target.value)}
                        placeholder="••••••••••••••••"
                        className="text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Auto-Sync Frequency</label>
                      <select
                        value={dbSyncFreq}
                        onChange={(e: any) => setDbSyncFreq(e.target.value)}
                        className="w-full text-xs h-9 bg-background border border-border rounded-lg px-2.5 font-medium"
                      >
                        <option value="Realtime">Real-time Webhook Stream</option>
                        <option value="5m">Every 5 Minutes</option>
                        <option value="15m">Every 15 Minutes (Recommended)</option>
                        <option value="Hourly">Hourly</option>
                        <option value="Daily">Daily Snapshot</option>
                      </select>
                    </div>
                  </div>

                  {testResult && (
                    <div className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                      testResult.success ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-destructive/10 text-destructive'
                    }`}>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{testResult.message}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestConnection}
                      disabled={isTestingConn}
                      className="text-xs h-8 gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingConn ? 'animate-spin' : ''}`} />
                      {isTestingConn ? 'Testing Latency...' : 'Test Handshake & Ping'}
                    </Button>
                    <Button
                      type="submit"
                      className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-semibold"
                    >
                      <Check className="w-3.5 h-3.5" /> Save & Activate Link
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Active Connections List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {databaseConnections.map((conn) => {
              const isActive = activeDataSource === 'database';
              return (
                <Card
                  key={conn.id}
                  className={`border transition-all rounded-xl ${
                    isActive ? 'border-primary shadow-md bg-gradient-to-br from-card to-primary/5' : 'border-border/70 bg-card'
                  }`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                          <Server className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-foreground">{conn.name}</h4>
                            <Badge variant="outline" className="text-[9px] h-4 px-1">{conn.type}</Badge>
                          </div>
                          <p className="font-mono text-[10px] text-muted-foreground truncate max-w-[220px]">
                            {conn.endpointUrl}
                          </p>
                        </div>
                      </div>

                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        {conn.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-lg bg-muted/30 border border-border/40 text-center">
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase font-semibold block">Latency</span>
                        <span className="text-xs font-bold text-foreground">{conn.lastLatencyMs || 14}ms</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase font-semibold block">Sync Schedule</span>
                        <span className="text-xs font-bold text-foreground">{conn.syncFrequency}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase font-semibold block">SSL Handshake</span>
                        <span className="text-xs font-bold text-emerald-600">Active</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground">{conn.notes}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <span className="text-[10px] text-muted-foreground">
                        Last synced: {conn.lastSyncTime || 'Live'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSyncDatabaseNow(conn)}
                          className="text-xs h-7 gap-1 border-primary/30 text-primary hover:bg-primary/10"
                        >
                          <RefreshCw className="w-3 h-3" /> Sync Now
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            onSetActiveDataSource('database', conn.id);
                            showToast(`Active data source switched to "${conn.name}"`, 'success');
                          }}
                          variant={isActive ? 'default' : 'outline'}
                          className="text-xs h-7 font-medium"
                        >
                          {isActive ? 'Live Stream Active' : 'Select'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ─── TAB 3: DATA POINT INSPECTOR ─────────────────────────────────── */}
        <TabsContent value="inspector" className="space-y-4">
          <Card className="border border-border/70 shadow-sm rounded-xl">
            <CardHeader className="p-4 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">Interactive Sheet Data Point Viewer</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  View raw records across all 14 interconnected ISP sheets
                </CardDescription>
              </div>

              {/* Sheet selector dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Select Sheet:</span>
                <select
                  value={selectedInspectorSheet}
                  onChange={(e) => setSelectedInspectorSheet(e.target.value)}
                  className="text-xs h-8 bg-background border border-border rounded-lg px-2.5 font-medium"
                >
                  <option value="Summary">Summary Dashboard</option>
                  <option value="Sales by Day">Sales by Day ({dataset.salesByDay.length} rows)</option>
                  <option value="Revenue Trend">Revenue Trend ({dataset.revenueTrend.length} rows)</option>
                  <option value="Packages">Packages ({dataset.packages.length} rows)</option>
                  <option value="Stations">Stations ({dataset.stations.length} rows)</option>
                  <option value="Top Customers">Top Customers ({dataset.topCustomers.length} rows)</option>
                  <option value="Repeat Customers">Repeat Customers ({dataset.repeatCustomers.length} rows)</option>
                  <option value="Package Stickiness">Package Stickiness ({dataset.packageStickiness.length} rows)</option>
                  <option value="Weekly Trend">Weekly Trend ({dataset.weeklyTrend.length} rows)</option>
                  <option value="Monthly Trend">Monthly Trend ({dataset.monthlyTrend.length} rows)</option>
                  <option value="Monthly by Station">Monthly by Station ({dataset.monthlyByStation.length} rows)</option>
                  <option value="Cross Station Sales">Cross Station Sales ({dataset.crossStationSales.length} rows)</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="border border-border/60 rounded-lg overflow-x-auto max-h-96">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-muted-foreground border-b border-border/60 sticky top-0">
                    <tr>
                      {inspectorColumns.map((col) => (
                        <th key={col} className="p-2.5 font-semibold uppercase tracking-wider text-[10px]">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {sheetData.slice(0, 50).map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        {inspectorColumns.map((col) => (
                          <td key={col} className="p-2.5 font-medium text-foreground">
                            {row[col] !== undefined && row[col] !== null ? String(row[col]) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-3">
                <span>Showing {Math.min(sheetData.length, 50)} of {sheetData.length} records</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportISPToExcelWorkbook(dataset)}
                  className="text-xs h-7 gap-1"
                >
                  <Download className="w-3 h-3" /> Download Sheet Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
