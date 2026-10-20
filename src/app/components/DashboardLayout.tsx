import React, { useState } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from './ui/sidebar';
import {
  BarChart3,
  Database,
  Layers,
  Radio,
  Users,
  FileSpreadsheet,
  Sparkles,
  Settings,
  Menu,
  Moon,
  Sun,
  Bell,
  Search,
  LogOut,
  ChevronDown,
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import { AppUser, UserRole } from '../types';
import crayLogoRectangle from '../../assets/cray-logo-rectangle.svg';
import crayLogoSquare from '../../assets/cray-logo-square.svg';

interface DashboardLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  children: React.ReactNode;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  notificationCount?: number;
  currentUser: AppUser;
  onLogout: () => void;
  onSwitchRole?: (role: UserRole) => void;
  onOpenAlerts?: () => void;
  appName?: string;
  slogan?: string;
  companyLogo?: string;
  dataSourceStatus?: {
    type: 'excel' | 'database';
    name: string;
    isLive: boolean;
    lastSync?: string;
  };
}

const allMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'data_hub', label: 'Data Hub & DB Link', icon: Database },
  { id: 'packages', label: 'Packages & Bandwidth', icon: Layers },
  { id: 'stations', label: 'Base Stations', icon: Radio },
  { id: 'subscribers', label: 'Subscribers & CRM', icon: Users },
  { id: 'reports', label: 'Reports & Downloads', icon: FileSpreadsheet },
  { id: 'chat', label: 'AI ISP Copilot', icon: Sparkles },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const pageTitles: Record<string, string> = {
  dashboard: 'ISP Executive Dashboard',
  data_hub: 'Data Ingestion & Database Link',
  packages: 'Internet Packages & Volume Analysis',
  stations: 'Base Stations & Hotspot Performance',
  subscribers: 'Subscribers, Retention & LTV',
  reports: 'Analytics Reports & Direct Downloads',
  chat: 'AI Telecommunications Copilot',
  settings: 'System & Database Link Settings',
};

export function DashboardLayout({
  activeTab,
  setActiveTab,
  isDarkMode,
  toggleDarkMode,
  children,
  searchQuery = '',
  setSearchQuery,
  notificationCount = 0,
  currentUser,
  onLogout,
  onSwitchRole,
  onOpenAlerts,
  appName = 'Cray Group ISP Analytics',
  slogan = 'Intelligent Bandwidth, Sales, Station & Subscriber Network Analytics',
  dataSourceStatus = {
    type: 'excel',
    name: 'Cray-Group-Sales-Analytics-Report.xlsx',
    isLive: true,
    lastSync: 'Live',
  },
}: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const NavItems = ({ onSelect }: { onSelect?: () => void }) => (
    <div className="flex flex-col gap-1 w-full">
      {allMenuItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setActiveTab(item.id);
              onSelect?.();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all duration-150 font-medium text-left ${
              isActive
                ? 'bg-[#243542] text-white shadow-sm ring-1 ring-[#3db7e4]/50 font-semibold'
                : 'hover:bg-accent/60 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#3db7e4]' : 'text-muted-foreground'}`} />
            <span className="truncate flex-1">{item.label}</span>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#3db7e4] shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex w-full">
        {/* Desktop Sidebar */}
        <Sidebar className="hidden lg:flex border-r border-border/50 backdrop-blur-xl bg-background/80">
          <SidebarHeader className="p-4 border-b border-border/50">
            <div className="flex flex-col gap-1.5">
              <div
                className="flex items-center cursor-pointer py-1"
                onClick={() => setActiveTab('dashboard')}
                title="Cray Group ISP Analytics"
              >
                <img
                  src={crayLogoRectangle}
                  alt="Cray Group"
                  className="h-8 w-auto max-w-[180px] object-contain"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-[#3db7e4]/40 text-[#243542] dark:text-[#3db7e4] font-medium bg-[#3db7e4]/5">
                  ISP Analytics Platform
                </Badge>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-3 flex flex-col justify-between h-[calc(100vh-85px)]">
            <div className="space-y-1">
              <NavItems />
            </div>

            {/* Sidebar Bottom: Active Data Source Card & Profile */}
            <div className="pt-3 border-t border-border/40 space-y-2">
              <div
                onClick={() => setActiveTab('data_hub')}
                className="p-2.5 rounded-lg bg-[#3db7e4]/5 hover:bg-[#3db7e4]/10 border border-[#3db7e4]/20 cursor-pointer transition-all text-xs space-y-1"
                title="Click to manage data ingestion or database connection"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#243542] dark:text-[#3db7e4] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                    Data Source
                  </span>
                  <Badge variant="outline" className="text-[9px] py-0 px-1 border-[#3db7e4]/40 text-[#3db7e4] font-semibold">
                    {dataSourceStatus.type === 'database' ? 'DB Linked' : 'Excel Active'}
                  </Badge>
                </div>
                <p className="font-medium text-[11px] truncate text-foreground">{dataSourceStatus.name}</p>
                <div className="text-[10px] text-muted-foreground flex items-center justify-between">
                  <span>Status: Connected</span>
                  <span>{dataSourceStatus.lastSync}</span>
                </div>
              </div>

              {/* User badge */}
              <div className="p-2 rounded-lg bg-card border border-border/40 text-xs flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-xs truncate text-foreground">{currentUser.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{currentUser.role}</p>
                </div>
                <Badge variant="secondary" className="text-[9px] py-0 px-1.5">
                  Verified
                </Badge>
              </div>
            </div>
          </SidebarContent>
        </Sidebar>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b border-border/50 backdrop-blur-xl bg-background/80 px-4 py-2.5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Mobile Menu */}
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden">
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 p-0">
                    <div className="p-5 border-b border-border/50">
                      <div className="flex flex-col gap-2">
                        <img
                          src={crayLogoRectangle}
                          alt="Cray Group"
                          className="h-9 w-auto max-w-[200px] object-contain"
                        />
                        <p className="text-[10px] text-muted-foreground">{slogan}</p>
                      </div>
                    </div>
                    <div className="p-3">
                      <nav className="space-y-1">
                        <NavItems onSelect={() => setIsMobileMenuOpen(false)} />
                      </nav>
                    </div>
                  </SheetContent>
                </Sheet>

                <SidebarTrigger className="hidden lg:flex" />

                <div className="flex items-center gap-2">
                  <img
                    src={crayLogoSquare}
                    alt="Cray"
                    className="w-6 h-6 object-contain hidden sm:block cursor-pointer"
                    onClick={() => setActiveTab('dashboard')}
                  />
                  <h1 className="text-sm font-bold tracking-tight text-foreground hidden sm:block">
                    {pageTitles[activeTab] ?? activeTab}
                  </h1>
                </div>
              </div>

              {/* Header Right Controls */}
              <div className="flex items-center gap-2">
                {/* Search */}
                {setSearchQuery && (
                  <div className="hidden md:flex items-center gap-1.5 bg-accent/40 rounded-lg px-2.5 py-1 min-w-44 border border-border/40">
                    <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search voucher, phone, station..."
                      className="bg-transparent border-none outline-none text-xs flex-1 min-w-0"
                    />
                  </div>
                )}

                {/* Dark Mode Toggle */}
                <div className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg bg-accent/30 border border-border/40">
                  <Sun className="w-3.5 h-3.5 text-muted-foreground" />
                  <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
                  <Moon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>

                {/* Notifications Bell */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-8"
                  onClick={onOpenAlerts}
                  title="Network & Sales Alerts"
                >
                  <Bell className="w-4 h-4" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-destructive rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </Button>

                {/* User Profile & Role Switcher */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-1.5 p-1 rounded-full hover:bg-accent/50 transition-colors outline-none"
                  >
                    <Avatar className="w-7 h-7 ring-2 ring-[#3db7e4]/30">
                      <AvatarFallback className="text-[11px] font-bold bg-[#243542] text-[#3db7e4]">
                        {getInitials(currentUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
                  </button>

                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-xl border border-border bg-popover p-3 shadow-xl z-50 space-y-3">
                      <div className="border-b pb-2 space-y-1">
                        <p className="font-semibold text-xs text-popover-foreground">{currentUser.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{currentUser.email}</p>
                        <div className="pt-0.5">
                          <Badge variant="secondary" className="text-[9px]">
                            {currentUser.role}
                          </Badge>
                        </div>
                      </div>

                      {onSwitchRole && (
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                            Switch Role (Verification)
                          </span>
                          <div className="grid grid-cols-1 gap-1">
                            {(
                              [
                                'Admin',
                                'Network Engineer',
                                'Billing & Sales Lead',
                                'Data Analyst',
                                'Executive Viewer',
                              ] as UserRole[]
                            ).map((r) => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => {
                                  onSwitchRole(r);
                                  setIsProfileMenuOpen(false);
                                }}
                                className={`text-left text-xs px-2 py-1.5 rounded-md flex items-center justify-between transition-colors ${
                                  currentUser.role === r
                                    ? 'bg-[#3db7e4]/10 text-[#3db7e4] font-medium'
                                    : 'hover:bg-accent/60 text-muted-foreground'
                                }`}
                              >
                                <span>{r}</span>
                                {currentUser.role === r && <UserCheck className="w-3.5 h-3.5 text-[#3db7e4]" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="border-t pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full justify-start text-xs text-destructive hover:bg-destructive/10 gap-2 h-7"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Sign Out
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main Body */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
