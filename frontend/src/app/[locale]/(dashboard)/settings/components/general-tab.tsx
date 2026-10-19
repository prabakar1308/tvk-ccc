'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { 
  Building2, Globe, Clock, Lock, Server, Database, 
  Activity, ShieldCheck, CheckCircle2 
} from 'lucide-react';

export function GeneralTab() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Organization Identity */}
        <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden bg-gradient-to-br from-white via-white to-zinc-50/50 dark:from-zinc-900 dark:to-zinc-950">
          <CardHeader className="bg-gradient-to-r from-[#8F0A1B]/10 via-[#FFC72C]/10 to-transparent border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8F0A1B] text-white flex items-center justify-center shadow-xs shrink-0">
                <Building2 className="w-5 h-5 text-[#FFC72C]" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold">Party Organization & Scope</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Command Centre deployment and jurisdiction</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Political Party</span>
                <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5 block">Tamizhaga Vetri Kazhagam</span>
                <span className="text-xs text-primary font-semibold">வெற்றி தமிழ்நாடு</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Assembly Constituency</span>
                <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5 block">Kurinjipadi (AC-159)</span>
                <span className="text-xs text-muted-foreground font-medium">Cuddalore East District</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">System Version</span>
                <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5 block">v2.4 Production</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Latest Build Active
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Deployment Region</span>
                <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5 block">Tamil Nadu, India</span>
                <span className="text-xs text-muted-foreground font-medium">State General Administration</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language & Regional Localization */}
        <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden bg-gradient-to-br from-white via-white to-zinc-50/50 dark:from-zinc-900 dark:to-zinc-950">
          <CardHeader className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold">Language & Localization</CardTitle>
                <CardDescription className="text-xs sm:text-sm">System language, timezone, and format preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 block">Interface Language</span>
                <span className="text-xs sm:text-sm text-muted-foreground">Switch between English and Tamil (தமிழ்)</span>
              </div>
              <LanguageSwitcher className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold text-xs sm:text-sm py-1.5 px-3 rounded-lg shadow-2xs self-start sm:self-auto" />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" /> Timezone
                </span>
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1 block">IST (UTC+05:30)</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Indian Standard Time</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary" /> Session Lifetime
                </span>
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1 block">8 Hours</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Auto-refresh enabled</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Infrastructure & Services Status */}
        <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden bg-gradient-to-br from-white via-white to-zinc-50/50 dark:from-zinc-900 dark:to-zinc-950 md:col-span-2">
          <CardHeader className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Server className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold">Services & Infrastructure Connectivity</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Real-time status of backend services and databases</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight">PostgreSQL</p>
                    <p className="text-xs text-muted-foreground">Primary Database</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Connected
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Server className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight">Cloudflare R2</p>
                    <p className="text-xs text-muted-foreground">Media Storage CDN</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Healthy
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight">RBAC Auth</p>
                    <p className="text-xs text-muted-foreground">Role Access Engine</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Enforced
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight">Cadre Directory</p>
                    <p className="text-xs text-muted-foreground">Real-time Cache</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
