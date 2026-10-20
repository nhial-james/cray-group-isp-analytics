import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Wifi,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Radio,
  Server
} from 'lucide-react';
import { AppUser, UserRole } from '../types';

import crayLogoRectangle from '../../assets/cray-logo-rectangle.svg';
import crayLogoSquare from '../../assets/cray-logo-square.svg';

interface LoginPageProps {
  users: AppUser[];
  onLogin: (user: AppUser) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const DEMO_CREDENTIALS: { email: string; pass: string; role: UserRole; name: string }[] = [
  { email: 'admin@craygroup.net', pass: 'password123', role: 'Admin', name: 'Nhial Admin (ISP Director)' },
  { email: 'noc@craygroup.net', pass: 'password123', role: 'Network Engineer', name: 'David Kirui (NOC Lead)' },
  { email: 'sales@craygroup.net', pass: 'password123', role: 'Billing & Sales Lead', name: 'Faith Mwangi (Billing & Sales)' },
  { email: 'analyst@craygroup.net', pass: 'password123', role: 'Data Analyst', name: 'Alex Ochieng (Data Analyst)' },
  { email: 'viewer@craygroup.net', pass: 'password123', role: 'Executive Viewer', name: 'Executive Partner (Viewer)' },
];

export function LoginPage({ users, onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setError('Please enter your Cray Group corporate email.');
      return;
    }
    if (!cleanPassword) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const matchedUser = users.find(u => u.email.toLowerCase() === cleanEmail);
      const demoMatch = DEMO_CREDENTIALS.find(d => d.email.toLowerCase() === cleanEmail);

      if (matchedUser && (cleanPassword === 'password123' || !matchedUser.password || matchedUser.password === cleanPassword)) {
        setIsLoading(false);
        onLogin(matchedUser);
      } else if (demoMatch) {
        const newUser: AppUser = {
          id: 'u_' + demoMatch.role.toLowerCase().replace(/\s+/g, '_'),
          name: demoMatch.name.split(' (')[0],
          email: demoMatch.email,
          role: demoMatch.role,
        };
        setIsLoading(false);
        onLogin(newUser);
      } else {
        setIsLoading(false);
        setError('Invalid credentials. Select one of the verified demo test accounts below to sign in instantly.');
      }
    }, 300);
  }

  function handleSelectDemo(demo: typeof DEMO_CREDENTIALS[0]) {
    setEmail(demo.email);
    setPassword(demo.pass);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        {/* Logo and Brand Title */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <img
              src={crayLogoRectangle}
              alt="Cray Group"
              className="h-12 w-auto max-w-[260px] object-contain"
            />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">
            ISP Analytics & Management Platform
          </h1>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Bandwidth, Sales, Station & Subscriber Network Intelligence Platform
          </p>
        </div>

        {/* Login Card */}
        <Card className="border border-border/70 shadow-xl rounded-2xl bg-card/90 backdrop-blur-md">
          <CardHeader className="p-6 pb-2 text-center">
            <CardTitle className="text-base font-bold text-foreground">Sign in to Console</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Enter credentials or pick a verified role below
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-2 space-y-4">
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Corporate Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@craygroup.net"
                    className="text-xs pl-9 h-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="text-xs pl-9 pr-9 h-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full text-xs h-9 bg-primary text-primary-foreground font-semibold shadow-xs"
              >
                {isLoading ? 'Verifying Credentials...' : 'Sign In to Console'}
              </Button>
            </form>

            {/* Quick Demo Switcher */}
            <div className="pt-3 border-t border-border/50 space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block text-center">
                One-Click Role Demonstration
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {DEMO_CREDENTIALS.map((demo) => (
                  <button
                    key={demo.email}
                    type="button"
                    onClick={() => handleSelectDemo(demo)}
                    className={`text-left p-2 rounded-lg border text-xs flex items-center justify-between transition-all ${
                      email.toLowerCase() === demo.email.toLowerCase()
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border/50 hover:bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-foreground block">{demo.name}</span>
                      <span className="text-[10px] text-muted-foreground">{demo.email}</span>
                    </div>
                    <Badge variant="outline" className="text-[9px] h-4">
                      {demo.role}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
