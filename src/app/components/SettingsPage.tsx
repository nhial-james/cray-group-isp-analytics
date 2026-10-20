import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Settings, Palette, Key, Lock, Building, Shield, RefreshCw,
  Check, Eye, EyeOff, Sparkles, CheckCircle2, AlertTriangle, Save,
  Upload, Database, Radio, Wifi
} from 'lucide-react';
import { SystemSettings, AppUser } from '../types';
import { testGeminiConnection, DEFAULT_GEMINI_API_KEY } from '../services/gemini';

interface SettingsPageProps {
  settings: SystemSettings;
  onSaveSettings: (settings: SystemSettings) => void;
  currentUser: AppUser;
  onResetDemoData?: () => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const COLOR_PRESETS = [
  { name: 'Cray Electric Cyan', hex: '#3db7e4' },
  { name: 'Cray Deep Navy', hex: '#243542' },
  { name: 'Royal Indigo', hex: '#4f46e5' },
  { name: 'Emerald Network', hex: '#059669' },
  { name: 'Amber Alert', hex: '#d97706' },
];

export function SettingsPage({
  settings,
  onSaveSettings,
  currentUser,
  onResetDemoData,
  showToast,
}: SettingsPageProps) {
  const [appName, setAppName] = useState(settings.appName || 'Cray Group ISP Analytics');
  const [orgName, setOrgName] = useState(settings.organizationName || 'Cray Group Internet Service Provider');
  const [slogan, setSlogan] = useState(settings.slogan || 'Intelligent Bandwidth, Sales, Station & Subscriber Network Analytics');
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor || '#0284c7');
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || 'KSh');
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey || DEFAULT_GEMINI_API_KEY);
  const [showKey, setShowKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleColorChange = (hex: string) => {
    setPrimaryColor(hex);
    document.documentElement.style.setProperty('--primary', hex);
    document.documentElement.style.setProperty('--color-primary', hex);
  };

  const handleTestKey = async () => {
    setIsTestingKey(true);
    setKeyStatus('idle');
    try {
      const res = await testGeminiConnection(geminiApiKey);
      if (res.success) {
        setKeyStatus('success');
        showToast?.('Google Gemini AI connection verified!', 'success');
      } else {
        setKeyStatus('error');
        showToast?.(res.message || 'API connection failed', 'error');
      }
    } catch (e: any) {
      setKeyStatus('error');
      showToast?.(e.message || 'Connection error', 'error');
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SystemSettings = {
      ...settings,
      appName,
      organizationName: orgName,
      slogan,
      primaryColor,
      currencySymbol,
      geminiApiKey,
    };
    onSaveSettings(updated);
    showToast?.('System settings saved successfully!', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-2 border-b border-border/50">
        <h2 className="text-xl font-bold tracking-tight text-foreground">System & Database Link Settings</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure branding, currency, telecommunications AI integration, and administrative controls.
        </p>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Brand & Organization Identity */}
        <Card className="border border-border/70 shadow-sm rounded-xl">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Building className="w-4 h-4 text-primary" />
              ISP Organization Branding
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Branding options applied across executive exports and the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">App Name</label>
                <Input
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">ISP Company Name</label>
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">System Slogan / Subtitle</label>
                <Input
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Currency Symbol</label>
                <Input
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="text-xs h-9 font-bold"
                  required
                />
              </div>
            </div>

            {/* Primary Color Palette */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <span className="text-xs font-semibold text-foreground block">Corporate Accent Color</span>
              <div className="flex flex-wrap items-center gap-2.5">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => handleColorChange(color.hex)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      primaryColor === color.hex
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/10'
                        : 'border-border/60 hover:bg-muted/40'
                    }`}
                  >
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: color.hex }} />
                    <span>{color.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Copilot & Gemini API Config */}
        <Card className="border border-border/70 shadow-sm rounded-xl">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Telecommunications AI Copilot (Gemini API)
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Powers automated voucher sales forecasting and anomaly detection
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Google Gemini API Key</label>
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="text-xs h-9 font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestKey}
                disabled={isTestingKey}
                className="text-xs h-8 gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingKey ? 'animate-spin' : ''}`} />
                {isTestingKey ? 'Verifying...' : 'Test Connection'}
              </Button>

              {keyStatus === 'success' && (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> API Key Verified
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Reset */}
        <Card className="border border-border/70 shadow-sm rounded-xl">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold text-foreground">Reset & Re-seed Dataset</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Restore the system to the official verified Cray Group Sales Analytics report baseline
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onResetDemoData}
              className="text-xs h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              Reset to Official Cray Group Report Baseline
            </Button>
          </CardContent>
        </Card>

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            className="text-xs h-9 gap-2 bg-primary text-primary-foreground font-semibold px-5 shadow-xs"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
