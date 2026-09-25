'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/user-context';
import { useUnions } from '@/hooks/use-unions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Mail, Menu, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('Index');
  const tSidebar = useTranslations('Sidebar');
  const pathname = usePathname();
  const { user, activeUnionId, setActiveUnionId, logout } = useUser();
  const { data: unions } = useUnions();

  const navItems = [
    { name: tSidebar('home'), href: '/', icon: 'home' },
    { name: tSidebar('unions'), href: '/unions', icon: 'building' },
    { name: tSidebar('kilais'), href: '/kilais', icon: 'git-branch' },
    { name: tSidebar('cadres'), href: '/cadres', icon: 'users' },
    { name: tSidebar('booths'), href: '/booths', icon: 'map-pin' },
    // { name: 'Representatives', href: '/representatives', icon: 'user-check' },
    // { name: 'Training', href: '/training', icon: 'graduation-cap' },
    // { name: 'Communications', href: '/communications', icon: 'megaphone' },
    { name: tSidebar('announcements'), href: '/announcements', icon: 'clipboard-list' },
    { name: tSidebar('analytics'), href: '/analytics', icon: 'bar-chart' },
    { name: tSidebar('reports'), href: '/reports', icon: 'file-text' },
    { name: tSidebar('settings'), href: '/settings', icon: 'settings' },
  ];

  return (
    <div className="min-h-screen flex bg-[#F8F9FA] dark:bg-black font-sans">
      {/* Sidebar - Full Height */}
      <aside className="w-[280px] bg-[#8F0A1B] flex flex-col hidden md:flex text-white shadow-xl z-20">
        {/* Sidebar Logo Area */}
        <div className="flex flex-col items-center justify-center py-6">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden">
              <Image src="/CCC logo.png" alt="CCC Logo" width={64} height={64} className="object-cover" />
            </div>
            {/* <div className="flex flex-col">
              <h2 className="text-3xl font-bold tracking-wider text-[#FFD700] leading-none">TVK</h2>
            </div> */}
          </div>
          <p className="text-[12px] uppercase tracking-[0.05em] font-bold text-white mt-2 text-center w-full border-b border-white/20 pb-4">CADRE COMMAND CENTRE</p>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-[#FFD700] text-[#8F0A1B] font-bold shadow-md'
                      : 'text-white hover:bg-white/10 font-medium'
                  }`}
                >
                  {/* Icon Placeholder based on name */}
                  <div className={`w-5 h-5 flex items-center justify-center ${isActive ? 'text-[#8F0A1B]' : 'text-white'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                  </div>
                  <span className="text-[16px]">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer (Flag Area) */}
        <div className="p-6 flex flex-col items-center mt-auto">
          <div className="w-20 h-12 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 rounded flex items-center justify-center mb-3 shadow-sm border border-white/20 relative overflow-hidden">
             <div className="w-4 h-4 bg-black rounded-full z-10" />
             {/* Wavy flag effect */}
             <div className="absolute inset-0 bg-white/20 mix-blend-overlay"></div>
          </div>
          <h3 className="text-white font-bold text-[15px] text-center mb-1">Tamizhaga Vetri Kazhagam</h3>
          <p className="text-white/80 text-[13px] text-center leading-relaxed">
            
            Kurinjipadi Assembly Constituency<br/>
            Cuddalore District
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FA]">
        {/* Top Header */}
        <header className="h-[72px] bg-[#F8F9FA] flex items-center justify-between px-4 md:px-8 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button className="text-gray-700 hover:text-black">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-[#8F0A1B]">Kurunjipadi Constituency</h1>
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
            
            <LanguageSwitcher />

            <div className="flex items-center gap-2 md:gap-3 cursor-pointer">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
                <img src={`https://ui-avatars.com/api/?name=${(user as any)?.name || 'Rajkumar RKD'}&background=random`} alt="User" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col hidden sm:flex">
                <span className="text-[16px] font-bold text-gray-900 leading-tight">{(user as any)?.name || 'Rajkumar RKD'}</span>
                <span className="text-[14px] text-[#8F0A1B] font-semibold">{user?.role === 'SUPER_ADMIN' ? 'Admin' : 'Secretary'}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" />
            </div>
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
            <span className="font-medium text-center md:text-left">Tamizhaga Vetri Kazhagam</span>
          </div>
          <div className="text-white/90 text-center md:text-right text-[12px] md:text-[15px]">
            South East Union &nbsp;|&nbsp; Kurinjipadi Assembly Constituency &nbsp;|&nbsp; Cuddalore District
          </div>
        </footer>
      </div>
    </div>
  );
}

