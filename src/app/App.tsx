import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DashboardLayout } from './components/DashboardLayout';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import {
  Wifi, Radio, Database, CheckCircle2, AlertTriangle, X,
  FileSpreadsheet, ShieldAlert
} from 'lucide-react';
import {
  AppUser,
  UserRole,
  ISPFullDataset,
  UploadedFileRecord,
  ISPDatabaseConnection,
  SystemSettings,
  DEFAULT_SYSTEM_SETTINGS,
  SEED_USERS,
  SEED_DATABASE_CONNECTIONS
} from './types';
import { getCrayGroupDefaultDataset } from './services/ispDataService';
import { LoginPage } from './components/LoginPage';
import { DashboardOverview } from './components/DashboardOverview';
import { DataHubPage } from './components/DataHubPage';
import { PackagesPage } from './components/PackagesPage';
import { StationsPage } from './components/StationsPage';
import { SubscribersPage } from './components/SubscribersPage';
import { ReportsPage } from './components/ReportsPage';
import { AIChatPage } from './components/AIChatPage';
import { SettingsPage } from './components/SettingsPage';
import { DataQualityAlertsModal } from './components/DataQualityAlertsModal';

function useLocalState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [key, state]);

  return [state, setState];
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl text-xs font-semibold transition-all
      ${type === 'success' ? 'bg-emerald-600 text-white' : type === 'info' ? 'bg-sky-600 text-white' : 'bg-destructive text-white'}`}>
      {type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useLocalState<string>('cray_isp_active_tab', 'dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Authentication & Session
  const [currentUser, setCurrentUser] = useLocalState<AppUser | null>('cray_isp_session', SEED_USERS[0]);

  // Core ISP Analytics Dataset (Pre-loaded with Cray-Group-Sales-Analytics-Report.xlsx)
  const defaultData = useMemo(() => getCrayGroupDefaultDataset(), []);
  const [dataset, setDataset] = useLocalState<ISPFullDataset>('cray_isp_dataset', defaultData);

  // Safe dataset fallback: guarantees all 14 sheets/arrays exist even if an older cached object was in localStorage
  const safeDataset = useMemo<ISPFullDataset>(() => {
    if (!dataset) return defaultData;
    return {
      ...defaultData,
      ...dataset,
      summary: { ...defaultData.summary, ...(dataset.summary || {}) },
      packages: dataset.packages && dataset.packages.length > 0 ? dataset.packages : defaultData.packages,
      stations: dataset.stations && dataset.stations.length > 0 ? dataset.stations : defaultData.stations,
      topCustomers: dataset.topCustomers && dataset.topCustomers.length > 0 ? dataset.topCustomers : defaultData.topCustomers,
      repeatCustomers: dataset.repeatCustomers && dataset.repeatCustomers.length > 0 ? dataset.repeatCustomers : defaultData.repeatCustomers,
      packageStickiness: dataset.packageStickiness && dataset.packageStickiness.length > 0 ? dataset.packageStickiness : defaultData.packageStickiness,
      weeklyTrend: dataset.weeklyTrend && dataset.weeklyTrend.length > 0 ? dataset.weeklyTrend : defaultData.weeklyTrend,
      monthlyTrend: dataset.monthlyTrend && dataset.monthlyTrend.length > 0 ? dataset.monthlyTrend : defaultData.monthlyTrend,
      monthlyByStation: dataset.monthlyByStation && dataset.monthlyByStation.length > 0 ? dataset.monthlyByStation : defaultData.monthlyByStation,
      crossStationSales: dataset.crossStationSales && dataset.crossStationSales.length > 0 ? dataset.crossStationSales : defaultData.crossStationSales,
      salesByDay: dataset.salesByDay && dataset.salesByDay.length > 0 ? dataset.salesByDay : defaultData.salesByDay,
      revenueTrend: dataset.revenueTrend && dataset.revenueTrend.length > 0 ? dataset.revenueTrend : defaultData.revenueTrend,
      salesByPackage: dataset.salesByPackage && dataset.salesByPackage.length > 0 ? dataset.salesByPackage : defaultData.salesByPackage,
      salesByStation: dataset.salesByStation && dataset.salesByStation.length > 0 ? dataset.salesByStation : defaultData.salesByStation,
    };
  }, [dataset, defaultData]);

  // Ingestion: Uploaded Files & DB Connections
  const [files, setFiles] = useLocalState<UploadedFileRecord[]>('cray_isp_files', []);
  const [databaseConnections, setDatabaseConnections] = useLocalState<ISPDatabaseConnection[]>(
    'cray_isp_connections',
    SEED_DATABASE_CONNECTIONS
  );
  const [activeDataSource, setActiveDataSource] = useLocalState<'excel' | 'database'>('cray_isp_datasource', 'excel');

  // Modals state
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);

  // Branding & Settings
  const [systemSettings, setSystemSettings] = useLocalState<SystemSettings>('cray_isp_settings', DEFAULT_SYSTEM_SETTINGS);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    if (systemSettings.primaryColor) {
      document.documentElement.style.setProperty('--primary', systemSettings.primaryColor);
      document.documentElement.style.setProperty('--color-primary', systemSettings.primaryColor);
    }
  }, [systemSettings.primaryColor]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  }, []);

  const handleResetDemoData = useCallback(() => {
    const fresh = getCrayGroupDefaultDataset();
    setDataset(fresh);
    setDatabaseConnections(SEED_DATABASE_CONNECTIONS);
    setActiveDataSource('excel');
    showToast('Reset application to official Cray Group Sales Analytics baseline (14 sheets)', 'success');
  }, [setDataset, setDatabaseConnections, setActiveDataSource, showToast]);

  // Unauthenticated Guard: Redirect to Login
  if (!currentUser) {
    return (
      <LoginPage
        users={SEED_USERS}
        onLogin={(user) => {
          setCurrentUser(user);
          setActiveTab('dashboard');
          showToast(`Signed in as ${user.name} (${user.role})`, 'success');
        }}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(d => !d)}
      />
    );
  }

  // Active data source label
  const dataSourceStatus = {
    type: activeDataSource,
    name: activeDataSource === 'database'
      ? (databaseConnections.find(c => c.status === 'Connected')?.name || 'Cray Core Radius DB')
      : 'Cray-Group-Sales-Analytics-Report.xlsx',
    isLive: true,
    lastSync: 'Live Stream',
  };

  function renderPage() {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardOverview
            dataset={safeDataset}
            files={files}
            databaseConnections={databaseConnections}
            activeDataSource={activeDataSource}
            settings={systemSettings}
            setActiveTab={setActiveTab}
          />
        );
      case 'data_hub':
        return (
          <DataHubPage
            dataset={safeDataset}
            onUpdateDataset={(newD) => {
              setDataset(newD);
              showToast('ISP dataset updated across all system dashboards!', 'success');
            }}
            files={files}
            onSaveFile={(file) => setFiles(prev => [file, ...prev.filter(f => f.id !== file.id)])}
            onDeleteFile={(id) => setFiles(prev => prev.filter(f => f.id !== id))}
            databaseConnections={databaseConnections}
            onSaveConnection={(conn) => setDatabaseConnections(prev => [conn, ...prev.filter(c => c.id !== conn.id)])}
            onDeleteConnection={(id) => setDatabaseConnections(prev => prev.filter(c => c.id !== id))}
            activeDataSource={activeDataSource}
            onSetActiveDataSource={(source, dbId) => {
              setActiveDataSource(source);
              if (dbId) {
                setSystemSettings(s => ({ ...s, activeDatabaseId: dbId }));
              }
            }}
            currentUser={currentUser}
            showToast={showToast}
          />
        );
      case 'packages':
        return <PackagesPage dataset={safeDataset} />;
      case 'stations':
        return <StationsPage dataset={safeDataset} />;
      case 'subscribers':
        return <SubscribersPage dataset={safeDataset} />;
      case 'reports':
        return (
          <ReportsPage
            dataset={safeDataset}
            currentUser={currentUser}
            settings={systemSettings}
            showToast={showToast}
          />
        );
      case 'chat':
        return (
          <AIChatPage
            dataset={safeDataset}
            currentUser={currentUser}
            geminiApiKey={systemSettings.geminiApiKey}
            showToast={showToast}
            systemSettings={systemSettings}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            settings={systemSettings}
            onSaveSettings={(s) => setSystemSettings(s)}
            currentUser={currentUser}
            onResetDemoData={handleResetDemoData}
            showToast={showToast}
          />
        );
      default:
        return (
          <DashboardOverview
            dataset={safeDataset}
            files={files}
            databaseConnections={databaseConnections}
            activeDataSource={activeDataSource}
            settings={systemSettings}
            setActiveTab={setActiveTab}
          />
        );
    }
  }

  return (
    <>
      <DashboardLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(d => !d)}
        notificationCount={3}
        currentUser={currentUser}
        appName={systemSettings.appName}
        slogan={systemSettings.slogan}
        companyLogo={systemSettings.companyLogo}
        dataSourceStatus={dataSourceStatus}
        onLogout={() => {
          setCurrentUser(null);
          localStorage.removeItem('cray_isp_session');
          showToast('Signed out successfully', 'success');
        }}
        onSwitchRole={(newRole) => {
          const match = SEED_USERS.find(u => u.role === newRole) || {
            id: 'u_' + newRole.toLowerCase().replace(/\s+/g, '_'),
            name: `${newRole} Specialist`,
            email: `${newRole.toLowerCase().replace(/\s+/g, '')}@craygroup.net`,
            role: newRole,
          };
          setCurrentUser(match);
          showToast(`Switched active role to ${newRole}`, 'success');
        }}
        onOpenAlerts={() => setIsAlertsModalOpen(true)}
      >
        {renderPage()}
      </DashboardLayout>

      {/* Network & Billing Alerts Modal */}
      <DataQualityAlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        currentUser={currentUser}
        dataset={dataset}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setIsAlertsModalOpen(false);
        }}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
