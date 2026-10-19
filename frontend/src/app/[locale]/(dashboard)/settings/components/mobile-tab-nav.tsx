'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Settings2, Shield, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type TabKey = 'general' | 'roles' | 'user-roles';

export interface TabConfig {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  badge?: number | string | null;
  badgeColor?: string;
  description: string;
}

interface MobileTabNavProps {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  rolesCount?: number;
  queuedCadresCount?: number;
}

export function MobileTabNav({
  activeTab,
  onChangeTab,
  rolesCount = 0,
  queuedCadresCount = 0,
}: MobileTabNavProps) {
  const tabs: TabConfig[] = [
    {
      key: 'general',
      label: 'General',
      icon: <Settings2 className="w-4 h-4 shrink-0 text-[#FFC72C]" />,
      description: 'System info, language & health',
    },
    {
      key: 'roles',
      label: 'System Roles',
      icon: <Shield className="w-4 h-4 shrink-0 text-[#FFC72C]" />,
      badge: rolesCount > 0 ? rolesCount : null,
      description: 'Permissions & security matrix',
    },
    {
      key: 'user-roles',
      label: 'Role Assignment',
      icon: <UserCog className="w-4 h-4 shrink-0 text-[#FFC72C]" />,
      badge: queuedCadresCount > 0 ? queuedCadresCount : null,
      badgeColor: 'bg-[#FFC72C] text-[#8F0A1B] animate-pulse',
      description: 'Assign or revoke cadre roles',
    },
  ];

  const currentIndex = tabs.findIndex(t => t.key === activeTab);
  const currentTab = tabs[currentIndex] || tabs[0];

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    onChangeTab(tabs[prevIndex].key);
  };

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % tabs.length;
    onChangeTab(tabs[nextIndex].key);
  };

  return (
    <div className="block sm:hidden w-full">
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-red-50/40 to-amber-50/40 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-zinc-950 rounded-2xl p-3.5 border border-[#8F0A1B]/20 dark:border-zinc-800 shadow-md shadow-[#8F0A1B]/5">
        {/* Subtle Top Accent Ribbon */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8F0A1B] via-[#D97706] to-[#FFC72C]" />

        {/* Ambient Warm Glow */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#FFC72C]/15 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-[#8F0A1B]/10 rounded-full blur-xl pointer-events-none" />

        {/* Main Navigator Row */}
        <div className="relative z-10 flex items-center justify-between gap-2.5">
          {/* Left Arrow Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handlePrev}
            className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 hover:text-[#8F0A1B] dark:hover:text-red-400 active:scale-95 transition-all shrink-0 cursor-pointer border border-zinc-200 dark:border-zinc-700/80 shadow-2xs"
            aria-label="Previous tab"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          {/* Center Display: Active Tab Information */}
          <div className="flex-1 min-w-0 text-center px-1">
            <div className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#8F0A1B] via-[#A81327] to-[#B81930] text-white shadow-md shadow-[#8F0A1B]/25 border border-[#8F0A1B]/30 max-w-full">
              {currentTab.icon}
              <span className="font-black text-sm tracking-tight truncate">
                {currentTab.label}
              </span>
              {currentTab.badge !== null && currentTab.badge !== undefined && (
                <span className={cn(
                  "px-1.5 py-0.2 rounded-full text-xs font-mono font-black shrink-0",
                  currentTab.badgeColor || "bg-white/20 text-white"
                )}>
                  {currentTab.badge}
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-semibold truncate mt-1">
              {currentTab.description}
            </p>
          </div>

          {/* Right Arrow Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 hover:text-[#8F0A1B] dark:hover:text-red-400 active:scale-95 transition-all shrink-0 cursor-pointer border border-zinc-200 dark:border-zinc-700/80 shadow-2xs"
            aria-label="Next tab"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Step Indicator Dots & Position Text */}
        <div className="relative z-10 flex items-center justify-between pt-2.5 mt-2.5 border-t border-zinc-200/80 dark:border-zinc-800 px-1 text-xs text-zinc-500 dark:text-zinc-400 font-bold">
          <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8F0A1B] animate-pulse"></span>
            Tab {currentIndex + 1} of {tabs.length}
          </span>

          <div className="flex items-center gap-1.5">
            {tabs.map((tab, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onChangeTab(tab.key)}
                  className={cn(
                    "transition-all rounded-full cursor-pointer",
                    isActive
                      ? "w-6 h-2 bg-gradient-to-r from-[#8F0A1B] to-[#D97706] shadow-xs"
                      : "w-2 h-2 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400"
                  )}
                  aria-label={`Go to ${tab.label}`}
                />
              );
            })}
          </div>

          <span className="text-muted-foreground font-medium text-xs">Swipe or tap arrows</span>
        </div>
      </div>
    </div>
  );
}
