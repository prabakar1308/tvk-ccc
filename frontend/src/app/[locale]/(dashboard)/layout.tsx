'use client';

import { useState, useEffect } from 'react';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/user-context';
import { useUnions } from '@/hooks/use-unions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Mail, Menu, ChevronDown, X, User as UserIcon, KeyRound, LogOut } from 'lucide-react';
import Image from 'next/image';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from '@/components/ui/user-avatar';
import { MyAccountDialog } from '@/components/my-account-dialog';
import { ChangePasswordDialog } from '@/components/change-password-dialog';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('Index');
  const tSidebar = useTranslations('Sidebar');
  const tHeader = useTranslations('Header');
  const tFooter = useTranslations('Footer');
  const pathname = usePathname();
  const { user, activeUnionId, setActiveUnionId, logout, hasPermission } = useUser();
  const { data: unions } = useUnions();
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMyAccountOpen, setIsMyAccountOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  useEffect(() => {
    // In md - lg range (768px <= width < 1024px), sidebar should be visible as overlay by default
    const isTabletRange = () => window.innerWidth >= 768 && window.innerWidth < 1024;
    
    if (isTabletRange()) {
      setIsOverlayOpen(true);
    }

    const mediaQuery = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsOverlayOpen(e.matches);
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  const navItems = [
    { name: tSidebar('home'), href: '/', icon: 'home', permission: null },
    { name: tSidebar('unions'), href: '/unions', icon: 'building', permission: 'unions:read' },
    { name: tSidebar('kilais'), href: '/kilais', icon: 'git-branch', permission: 'kilais:read' },
    { name: tSidebar('cadres'), href: '/cadres', icon: 'users', permission: 'cadres:read' },
    { name: tSidebar('wings'), href: '/wings', icon: 'bird', permission: 'wings:read' },
    { name: tSidebar('booths'), href: '/booths', icon: 'map-pin', permission: 'booths:read' },
    { name: tSidebar('announcements'), href: '/announcements', icon: 'clipboard-list', permission: 'announcements:read' },
    { name: tSidebar('analytics'), href: '/analytics', icon: 'bar-chart', permission: 'analytics:read' },
    { name: tSidebar('reports'), href: '/reports', icon: 'file-text', permission: 'reports:read' },
    { name: tSidebar('settings'), href: '/settings', icon: 'settings', permission: 'settings:read' },
  ].filter(item => !item.permission || hasPermission(item.permission));

  const getRoleDisplayName = (role?: string | null) => {
    if (!role) return '';
    switch (role.toUpperCase()) {
      case 'SUPER_ADMIN':
        return tHeader('roleSuperAdmin');
      case 'DISTRICT_LEADER':
        return tHeader('roleDistrictLeader');
      case 'UNION_LEADER':
        return tHeader('roleUnionLeader');
      case 'KILAI_LEADER':
        return tHeader('roleKilaiLeader');
      case 'CADRE':
        return tHeader('roleCadre');
      default:
        return role;
    }
  };

  const SidebarContent = () => (
    <>
        <div className="flex flex-col items-center justify-center py-3.5 relative shrink-0">
          {/* Close button for overlay (< lg) */}
          <button 
            onClick={() => setIsOverlayOpen(false)}
            className="lg:hidden absolute top-3 right-3 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden">
              <Image src="/TVK Connect1.png" alt="CCC Logo" width={48} height={48} className="object-cover" />
            </div>
          </div>
          <p className="text-[11px] uppercase tracking-[0.05em] font-bold text-white mt-1.5 text-center w-full border-b border-white/20 pb-2.5">{tSidebar('cadreCommandCentre')}</p>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto py-2 px-3 space-y-0.5 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href} onClick={() => setIsOverlayOpen(false)}>
                <div
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-[#FFD700] text-[#8F0A1B] font-bold shadow-md'
                      : 'text-white hover:bg-white/10 font-medium'
                  }`}
                >
                  <div className={`w-4.5 h-4.5 flex items-center justify-center ${isActive ? 'text-[#8F0A1B]' : 'text-white'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                  </div>
                  <span className="text-[14px]">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="py-2.5 px-4 flex flex-col items-center mt-auto border-t border-white/10 shrink-0">
          <p className="text-white/60 text-[10px] uppercase tracking-wider mb-0.5">{tSidebar('developedBy')}</p>
          <h3 className="text-[#FFD700] font-bold text-[13px] text-center mb-0.5">Prabakaran</h3>
          <p className="text-white/80 text-[11px] text-center leading-tight">
            {tSidebar('treasurer')}<br/>
            {tSidebar('southEastUnion')}
          </p>
        </div>
    </>
  );

  return (
    <div className="h-screen max-h-screen overflow-hidden flex bg-[#F8F9FA] dark:bg-black font-sans relative">
      {/* Overlay Backdrop (< lg) */}
      {isOverlayOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40 lg:hidden transition-opacity duration-300" 
          onClick={() => setIsOverlayOpen(false)}
        />
      )}

      {/* Sidebar - Desktop (>= lg: docked in layout) */}
      <aside className={`bg-[#8F0A1B] flex-col hidden lg:flex text-white shadow-xl z-20 shrink-0 h-full max-h-screen overflow-hidden transition-all duration-300 ${isDesktopSidebarOpen ? 'w-[280px]' : 'w-0 overflow-hidden'}`}>
        <div className="w-[280px] h-full flex flex-col min-h-0 overflow-hidden">
          <SidebarContent />
        </div>
      </aside>

      {/* Sidebar - Overlay (< lg: mobile & md-lg tablet) */}
      <aside className={`fixed top-0 left-0 bottom-0 w-[280px] bg-[#8F0A1B] flex flex-col text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden overflow-hidden ${isOverlayOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="w-full h-full flex flex-col min-h-0 overflow-hidden">
          <SidebarContent />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full max-h-screen overflow-hidden bg-[#f3f3ef]">
        {/* Top Header */}
        <header 
          style={{ 
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(0, 0, 0, 0.12) 100%), linear-gradient(90deg, rgba(143, 10, 27, 1) 13%, rgba(242, 200, 48, 1) 48%, rgba(143, 10, 27, 1) 87%)' 
          }}
          className="relative h-[72px] flex items-center justify-between px-4 md:px-8 z-10 shrink-0 text-white border-b border-black/15 shadow-[0_4px_25px_-4px_rgba(143,10,27,0.4)]"
        >
          {/* Top Edge Refined Glass Sheen */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-white/30 via-white/60 to-white/30 pointer-events-none" />

          {/* Left Brand & Menu Area */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            {/* Mobile & Tablet menu button (< lg) */}
            <button 
              className="text-white lg:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 border border-white/25 shadow-xs transition-colors cursor-pointer" 
              onClick={() => setIsOverlayOpen(!isOverlayOpen)}
              aria-label="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
            </button>

            {/* Desktop menu button (>= lg) */}
            <button 
              className="text-white hidden lg:flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 border border-white/25 shadow-xs transition-colors cursor-pointer" 
              onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
              aria-label="Toggle Desktop Sidebar"
            >
              <Menu className="w-5 h-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
            </button>

            <div className="flex flex-col min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-white/85 uppercase tracking-widest leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                TVK Connect
              </span>
              <h1 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] truncate mt-0.5">
                {tHeader('constituencyName')}
              </h1>
            </div>
          </div>
          
          {/* Right Action Icons & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <button 
              className="h-10 w-10 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 border border-white/25 flex items-center justify-center text-white transition-colors shadow-xs relative hidden sm:flex cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#8F0A1B] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                3
              </span>
            </button>

            <button 
              className="h-10 w-10 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 border border-white/25 flex items-center justify-center text-white transition-colors shadow-xs relative hidden sm:flex cursor-pointer"
              title="Messages"
            >
              <Mail className="w-4.5 h-4.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#8F0A1B] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                5
              </span>
            </button>
            
            <div className="hidden md:flex items-center">
              <LanguageSwitcher className="bg-white/15 text-white border-white/25 hover:bg-white/25 focus:ring-white/50 shadow-xs font-semibold rounded-xl text-xs py-1.5 px-2.5 h-10 cursor-pointer [&>option]:text-zinc-900 [&>option]:bg-white" />
            </div>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger className="flex items-center gap-2.5 sm:gap-3 py-1.5 px-2 sm:px-3 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 shadow-xs transition-colors outline-none cursor-pointer group active:scale-[0.98]">
                <div className="relative shrink-0">
                  <UserAvatar 
                    src={user?.photoUrl} 
                    name={user?.name || user?.userId || 'User'} 
                    size="sm" 
                    shape="circle"
                    ring="none" 
                    elevation="none" 
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white shadow-xs block" title="Online" />
                </div>
                <div className="flex-col hidden sm:flex text-left">
                  <span className="text-[14px] font-extrabold text-white leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                    {user?.name || user?.userId || 'User'}
                  </span>
                  <span className="text-[11px] text-white/90 font-semibold tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] mt-0.5">
                    {getRoleDisplayName(user?.role)}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-white/80 group-hover:text-white group-hover:translate-y-0.5 transition-all hidden sm:block drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="w-60 p-1.5 shadow-xl rounded-2xl border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <div className="px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl mb-1.5 border border-zinc-100 dark:border-zinc-800/60">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {user?.name || user?.userId || 'User'}
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono truncate mt-0.5">
                    {user?.userId}
                  </p>
                  <div className="mt-1.5">
                    <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8F0A1B]/10 text-[#8F0A1B] dark:bg-[#8F0A1B]/20 dark:text-red-400">
                      {getRoleDisplayName(user?.role)}
                    </span>
                  </div>
                </div>

                <DropdownMenuItem
                  onClick={() => setIsMyAccountOpen(true)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer font-medium text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-[#8F0A1B]" />
                  <span>{tHeader('myAccount')}</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer font-medium text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800 transition-colors"
                >
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>{tHeader('changePassword')}</span>
                </DropdownMenuItem>

                <div className="md:hidden flex items-center justify-between px-3 py-2 border-t border-b border-zinc-100 dark:border-zinc-800 my-1">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{tHeader('language')}</span>
                  <LanguageSwitcher />
                </div>

                <DropdownMenuSeparator className="my-1" />

                <DropdownMenuItem
                  onClick={() => { logout(); window.location.href = '/en/login'; }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 cursor-pointer font-medium text-xs hover:bg-red-50 dark:hover:bg-red-950/30 focus:bg-red-50 dark:focus:bg-red-950/30 focus:text-red-700 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-red-600" />
                  <span>{tHeader('signOut')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 min-h-0 overflow-y-auto px-4 md:px-8 py-4 md:pb-6 relative main-scrollbar">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            {children}
          </div>
        </main>
        
        {/* Global Footer */}
        <footer className="bg-[#8F0A1B] text-white py-2.5 px-4 md:px-8 flex flex-col md:flex-row justify-between items-center text-[13px] md:text-[14px] shrink-0 gap-2 md:gap-0">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 md:w-6 md:h-6 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 rounded-full flex items-center justify-center border border-white/20">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-black rounded-full" />
            </div>
            <span className="font-medium text-center md:text-left">{tFooter('partyName')}</span>
          </div>
          <div className="text-white/90 text-center md:text-right text-[12px] md:text-[14px]">
             {tFooter('regionDetails')}
          </div>
        </footer>
      </div>

      {/* Account & Security Dialogs */}
      <MyAccountDialog
        isOpen={isMyAccountOpen}
        onOpenChange={setIsMyAccountOpen}
        onChangePasswordClick={() => {
          setIsMyAccountOpen(false);
          setIsChangePasswordOpen(true);
        }}
      />
      <ChangePasswordDialog
        isOpen={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
      />
    </div>
  );
}

