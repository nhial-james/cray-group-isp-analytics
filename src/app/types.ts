export type UserRole =
  | 'Admin'
  | 'Network Engineer'
  | 'Billing & Sales Lead'
  | 'Data Analyst'
  | 'Executive Viewer';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  avatar?: string;
}

// ─── ISP Data Interfaces (Matches Cray Group Sales Analytics Structure) ────────

export interface ISPSummaryMetrics {
  totalRevenue: number;
  totalRevenueFormatted: string;
  totalVouchers: number;
  averageRevenuePerVoucher: number;
  averageRevenuePerVoucherFormatted: string;
  voucherStatus: {
    active: number;
    expired: number;
    used: number;
  };
  top5Packages: {
    package: string;
    revenue: string;
    revenueNum: number;
  }[];
  top5Stations: {
    station: string;
    revenue: string;
    revenueNum: number;
  }[];
  monthlyGrowth: {
    month: string;
    vouchers: number;
    growthPercent: string;
  }[];
}

export interface ISPSalesByDay {
  date: string;
  totalVouchers: number;
}

export interface ISPRevenueTrend {
  date: string;
  vouchersSold: number;
  revenue: string;
  revenueNum: number;
  avgPerVoucher: string;
  avgPerVoucherNum: number;
}

export interface ISPPackageStat {
  packageName: string;
  totalVouchers: number;
  totalRevenue: string;
  totalRevenueNum: number;
  freeVouchers: number;
  avgRevenue: string;
  avgRevenueNum: number;
}

export interface ISPStationStat {
  stationName: string;
  totalVouchers: number;
  revenue: string;
  revenueNum: number;
  avgPerVoucher: string;
  avgPerVoucherNum: number;
}

export interface ISPTopCustomer {
  rank: number;
  phoneNumber: string;
  vouchersBought: number;
  totalSpent: string;
  totalSpentNum: number;
  lifetimeValue: string;
  lifetimeValueNum: number;
}

export interface ISPRepeatCustomer {
  phoneNumber: string;
  totalPurchases: number;
}

export interface ISPPackageStickiness {
  phone: string;
  packageName: string;
  timesBought: number;
}

export interface ISPWeeklyTrend {
  week: number | string;
  vouchersSold: number;
  revenue: string;
  revenueNum: number;
}

export interface ISPMonthlyTrend {
  month: string;
  vouchersSold: number;
  revenue: string;
  revenueNum: number;
}

export interface ISPMonthlyByStation {
  month: string;
  stationName: string;
  vouchersSold: number;
}

export interface ISPCrossStationSale {
  station: string;
  package: string;
  sold: number;
}

// Complete ISP Dataset Bundle
export interface ISPFullDataset {
  summary: ISPSummaryMetrics;
  salesByDay: ISPSalesByDay[];
  revenueTrend: ISPRevenueTrend[];
  packages: ISPPackageStat[];
  stations: ISPStationStat[];
  topCustomers: ISPTopCustomer[];
  repeatCustomers: ISPRepeatCustomer[];
  packageStickiness: ISPPackageStickiness[];
  weeklyTrend: ISPWeeklyTrend[];
  monthlyTrend: ISPMonthlyTrend[];
  monthlyByStation: ISPMonthlyByStation[];
  crossStationSales: ISPCrossStationSale[];
  salesByPackage: { packageName: string; totalVouchers: number }[];
  salesByStation: { stationName: string; totalVouchers: number }[];
}

// ─── Direct Database & API Connection Models ──────────────────────────────────

export type ISPConnectionType =
  | 'PostgreSQL'
  | 'MySQL'
  | 'REST API'
  | 'FreeRADIUS DB'
  | 'Mikrotik API';

export type SyncFrequency = 'Realtime' | '5m' | '15m' | 'Hourly' | 'Daily' | 'Manual';

export interface ISPDatabaseConnection {
  id: string;
  name: string;
  type: ISPConnectionType;
  endpointUrl: string;
  databaseName?: string;
  port?: number;
  username?: string;
  authToken?: string;
  sslEnabled: boolean;
  status: 'Connected' | 'Disconnected' | 'Syncing' | 'Error';
  lastSyncTime?: string;
  lastLatencyMs?: number;
  autoSync: boolean;
  syncFrequency: SyncFrequency;
  notes?: string;
}

// ─── File Upload & Ingestion Records ──────────────────────────────────────────

export interface UploadedFileRecord {
  id: string;
  name: string;
  type: 'xlsx' | 'xls' | 'csv' | 'json';
  sizeBytes: number;
  uploadDate: string;
  uploadedBy: string;
  processingStatus: 'Uploaded' | 'Processing' | 'Ready' | 'Failed';
  analysisStatus: 'Not Analysed' | 'Analysed';
  sheetNames?: string[];
  selectedSheet?: string;
  rawRows?: Record<string, any>[];
  headers?: string[];
  errorMessage?: string;
  parsedISPData?: Partial<ISPFullDataset>;
}

export interface AnalysisRecord {
  id: string;
  fileId: string;
  datasetName: string;
  analysisDate: string;
  analyzedBy: string;
  status: 'Completed' | 'Failed' | 'In Progress';
  summary: string;
  keyFindings: string[];
  dataQuality: {
    totalRecords: number;
    missingValuesCount: number;
    duplicateRows: number;
    columnCoverage: Record<string, number>;
    notes: string[];
  };
  insights: string[];
  recommendations: string[];
  metrics: {
    recordCount: number;
    totalRevenue?: string;
    totalVouchers?: number;
    topStation?: string;
    topPackage?: string;
    arpu?: string;
  };
}

// ─── System Settings ──────────────────────────────────────────────────────────

export interface SystemSettings {
  appName: string;
  organizationName: string;
  slogan?: string;
  companyLogo?: string;
  primaryColor: string;
  currencySymbol: string;
  geminiApiKey: string;
  adminPassword?: string;
  supportEmail: string;
  enableAlerts: boolean;
  defaultExportFormat: 'excel' | 'pdf' | 'word' | 'csv' | 'json';
  activeDataSource: 'excel' | 'database';
  activeDatabaseId?: string;
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  appName: 'Cray Group ISP Analytics',
  organizationName: 'Cray Group Internet Service Provider',
  slogan: 'Intelligent Bandwidth, Sales, Station & Subscriber Network Analytics',
  companyLogo: '',
  primaryColor: '#3db7e4', // Cray Cyan Brand Color
  currencySymbol: 'KSh',
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
  adminPassword: 'admin',
  supportEmail: 'noc@craygroup.net',
  enableAlerts: true,
  defaultExportFormat: 'excel',
  activeDataSource: 'excel',
};

// ─── Default Seed Users ───────────────────────────────────────────────────────

export const SEED_USERS: AppUser[] = [
  {
    id: 'u_admin',
    name: 'Nhial Admin',
    email: 'admin@craygroup.net',
    role: 'Admin',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80',
  },
  {
    id: 'u_noc',
    name: 'David Kirui (NOC Lead)',
    email: 'noc@craygroup.net',
    role: 'Network Engineer',
    password: 'password123',
  },
  {
    id: 'u_sales',
    name: 'Faith Mwangi (Billing & Sales)',
    email: 'sales@craygroup.net',
    role: 'Billing & Sales Lead',
    password: 'password123',
  },
  {
    id: 'u_analyst',
    name: 'Alex Ochieng (Data Analyst)',
    email: 'analyst@craygroup.net',
    role: 'Data Analyst',
    password: 'password123',
  },
  {
    id: 'u_viewer',
    name: 'Executive Partner',
    email: 'viewer@craygroup.net',
    role: 'Executive Viewer',
    password: 'password123',
  },
];

// ─── Role Permissions ─────────────────────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<UserRole, {
  canUploadData: boolean;
  canConfigureDatabase: boolean;
  canExportReports: boolean;
  canManageSettings: boolean;
  canUseAICopilot: boolean;
  description: string;
}> = {
  Admin: {
    canUploadData: true,
    canConfigureDatabase: true,
    canExportReports: true,
    canManageSettings: true,
    canUseAICopilot: true,
    description: 'Full administrative access to all network analytics, database links, and settings.',
  },
  'Network Engineer': {
    canUploadData: true,
    canConfigureDatabase: true,
    canExportReports: true,
    canManageSettings: false,
    canUseAICopilot: true,
    description: 'Access to hotspot base stations, bandwidth statistics, and router/DB sync.',
  },
  'Billing & Sales Lead': {
    canUploadData: true,
    canConfigureDatabase: false,
    canExportReports: true,
    canManageSettings: false,
    canUseAICopilot: true,
    description: 'Management of voucher sales, package pricing, customer LTV, and daily reports.',
  },
  'Data Analyst': {
    canUploadData: true,
    canConfigureDatabase: false,
    canExportReports: true,
    canManageSettings: false,
    canUseAICopilot: true,
    description: 'Full analytical access to cross-station matrices, package stickiness, and exports.',
  },
  'Executive Viewer': {
    canUploadData: false,
    canConfigureDatabase: false,
    canExportReports: true,
    canManageSettings: false,
    canUseAICopilot: true,
    description: 'Read-only access to executive dashboards, sales trends, and PDF exports.',
  },
};

// ─── Default Pre-configured Database Connections ──────────────────────────────

export const SEED_DATABASE_CONNECTIONS: ISPDatabaseConnection[] = [
  {
    id: 'db_cray_core',
    name: 'Cray Group Primary ISP Management DB',
    type: 'PostgreSQL',
    endpointUrl: 'postgresql://isp_core_admin:cray_sec_2026@db-cluster.craygroup.net:5432/cray_isp_prod',
    databaseName: 'cray_isp_prod',
    port: 5432,
    username: 'isp_core_admin',
    sslEnabled: true,
    status: 'Connected',
    lastSyncTime: 'Just now',
    lastLatencyMs: 14,
    autoSync: true,
    syncFrequency: '15m',
    notes: 'Direct read-replica connection to primary Radius billing & voucher database.',
  },
  {
    id: 'db_mikrotik_hotspots',
    name: 'Hotspot Gateway & Mikrotik API Cluster',
    type: 'Mikrotik API',
    endpointUrl: 'https://gateway-api.craygroup.net/v2/hotspot/stations',
    databaseName: 'radius_hotspots',
    port: 8728,
    username: 'api_operator',
    sslEnabled: true,
    status: 'Connected',
    lastSyncTime: '3 mins ago',
    lastLatencyMs: 22,
    autoSync: true,
    syncFrequency: '5m',
    notes: 'Live station feeds from Daystar, Juja, Mumias, Bookers, and Public Hotspots.',
  },
];
