'use client';

import { useState, useEffect } from 'react';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/user-context';
import { useUnions } from '@/hooks/use-unions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Mail, Menu, ChevronDown, X } from 'lucide-react';
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

  const SidebarContent = () => (
    <>
        <div className="flex flex-col items-center justify-center py-6 relative">
          {/* Close button for overlay (< lg) */}
          <button 
            onClick={() => setIsOverlayOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden">
              <Image src="/TVK Connect1.png" alt="CCC Logo" width={64} height={64} className="object-cover" />
            </div>
          </div>
          <p className="text-[12px] uppercase tracking-[0.05em] font-bold text-white mt-2 text-center w-full border-b border-white/20 pb-4">{tSidebar('cadreCommandCentre')}</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href} onClick={() => setIsOverlayOpen(false)}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-[#FFD700] text-[#8F0A1B] font-bold shadow-md'
                      : 'text-white hover:bg-white/10 font-medium'
                  }`}
                >
                  <div className={`w-5 h-5 flex items-center justify-center ${isActive ? 'text-[#8F0A1B]' : 'text-white'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                  </div>
                  <span className="text-[16px]">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 flex flex-col items-center mt-auto border-t border-white/10">
          <p className="text-white/60 text-[11px] uppercase tracking-wider mb-1">{tSidebar('developedBy')}</p>
          <h3 className="text-[#FFD700] font-bold text-[15px] text-center mb-1">Prabakaran</h3>
          <p className="text-white/80 text-[12px] text-center leading-relaxed">
            {tSidebar('treasurer')}<br/>
            {tSidebar('southEastUnion')}
          </p>
        </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-[#F8F9FA] dark:bg-black font-sans relative">
      {/* Overlay Backdrop (< lg) */}
      {isOverlayOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40 lg:hidden transition-opacity duration-300" 
          onClick={() => setIsOverlayOpen(false)}
        />
      )}

      {/* Sidebar - Desktop (>= lg: docked in layout) */}
      <aside className={`bg-[#8F0A1B] flex-col hidden lg:flex text-white shadow-xl z-20 shrink-0 transition-all duration-300 ${isDesktopSidebarOpen ? 'w-[280px]' : 'w-0 overflow-hidden'}`}>
        <div className="w-[280px] h-full flex flex-col">
          <SidebarContent />
        </div>
      </aside>

      {/* Sidebar - Overlay (< lg: mobile & md-lg tablet) */}
      <aside className={`fixed top-0 left-0 bottom-0 w-[280px] bg-[#8F0A1B] flex flex-col text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${isOverlayOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#F8F9FA]">
        {/* Top Header */}
        <header className="h-[72px] bg-[#F8F9FA] flex items-center justify-between px-4 md:px-8 z-10 shrink-0">
          <div className="flex items-center gap-1 md:gap-2">
            {/* Mobile & Tablet menu button (< lg) */}
            <button 
              className="text-gray-700 hover:text-black lg:hidden p-1 rounded-md hover:bg-black/5 transition-colors cursor-pointer" 
              onClick={() => setIsOverlayOpen(!isOverlayOpen)}
              aria-label="Toggle Navigation Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            {/* Desktop menu button (>= lg) */}
            <button 
              className="text-gray-700 hover:text-black hidden lg:block p-1 rounded-md hover:bg-black/5 transition-colors cursor-pointer" 
              onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
              aria-label="Toggle Desktop Sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[#8F0A1B] truncate">{tHeader('constituencyName')}</h1>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            <button className="text-gray-600 hover:text-black relative hidden sm:block">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#8F0A1B] text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-[#F8F9FA]">3</span>
            </button>
            <button className="text-gray-600 hover:text-black relative hidden sm:block">
              <Mail className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#8F0A1B] text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-[#F8F9FA]">5</span>
            </button>
            
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 md:gap-3 outline-none cursor-pointer">
                <UserAvatar 
                  src={user?.photoUrl} 
                  name={user?.name || user?.userId || 'User'} 
                  size="md" 
                  ring="primary" 
                  elevation="sm" 
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11"
                  badge={
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900 block" title="Online" />
                  }
                />
                <div className="flex-col hidden sm:flex text-left">
                  <span className="text-[16px] font-bold text-gray-900 leading-tight">{user?.name || user?.userId || 'User'}</span>
                  <span className="text-[14px] text-[#8F0A1B] font-semibold">{user?.role === 'SUPER_ADMIN' ? tHeader('admin') : tHeader('secretary')}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{tHeader('myAccount')}</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                
                <div className="md:hidden flex items-center justify-between px-2 py-2 border-b mb-1">
                  <span className="text-sm font-medium">{tHeader('language')}</span>
                  <LanguageSwitcher />
                </div>

                <DropdownMenuItem onClick={() => { logout(); window.location.href = '/en/login'; }} className="text-red-600 cursor-pointer font-medium hover:bg-red-50 focus:bg-red-50 focus:text-red-700 mt-1">
                  {tHeader('signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 pb-4 md:pb-8 relative">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both h-full">
            {children}
          </div>
        </main>
        
        {/* Global Footer */}
        <footer className="bg-[#8F0A1B] text-white py-3 px-4 md:px-8 flex flex-col md:flex-row justify-between items-center text-[14px] md:text-[15px] shrink-0 mt-auto gap-2 md:gap-0">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 md:w-6 md:h-6 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 rounded-full flex items-center justify-center border border-white/20">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-black rounded-full" />
            </div>
            <span className="font-medium text-center md:text-left">{tFooter('partyName')}</span>
          </div>
          <div className="text-white/90 text-center md:text-right text-[12px] md:text-[15px]">
             {tFooter('regionDetails')}
          </div>
        </footer>
      </div>
    </div>
  );
}

