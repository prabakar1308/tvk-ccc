'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useUser } from '@/contexts/user-context';
import { authApi, UserProfile } from '@/services/api/auth';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  Shield,
  Phone,
  CreditCard,
  MapPin,
  Building2,
  GitBranch,
  KeyRound,
  LogOut,
  Calendar,
  Layers,
  Lock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export interface MyAccountDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onChangePasswordClick: () => void;
}

export function MyAccountDialog({
  isOpen,
  onOpenChange,
  onChangePasswordClick,
}: MyAccountDialogProps) {
  const t = useTranslations('Account');
  const tHeader = useTranslations('Header');
  const { user: contextUser, logout } = useUser();
  const [activeTab, setActiveTab] = useState<'details' | 'security'>('details');

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['auth', 'me'],
    queryFn: authApi.getMe,
    enabled: isOpen,
    staleTime: 60 * 1000,
  });

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

  const getRoleBadgeColor = (role?: string | null) => {
    switch (role?.toUpperCase()) {
      case 'SUPER_ADMIN':
        return 'bg-gradient-to-r from-red-600 to-amber-600 text-white border-red-700/30';
      case 'DISTRICT_LEADER':
        return 'bg-[#8F0A1B] text-white border-[#8F0A1B]/30';
      case 'UNION_LEADER':
        return 'bg-amber-500 text-white border-amber-600/30';
      case 'KILAI_LEADER':
        return 'bg-blue-600 text-white border-blue-700/30';
      default:
        return 'bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700';
    }
  };

  const maskAadhaar = (aadhaar?: string | null) => {
    if (!aadhaar) return null;
    const clean = aadhaar.replace(/\s+/g, '');
    if (clean.length === 12) {
      return `•••• •••• ${clean.slice(8)}`;
    }
    return aadhaar;
  };

  const displayName = profile?.cadre?.name || contextUser?.name || profile?.userId || contextUser?.userId || 'User';
  const displayRole = profile?.role?.name || contextUser?.role || 'CADRE';
  const displayPhoto = profile?.cadre?.photoUrl || contextUser?.photoUrl;
  const displayUserId = profile?.userId || contextUser?.userId;

  const permissionsList = profile?.role?.permissions?.map(p => p.permission.action) || contextUser?.permissions || [];
  const isSuperAdmin = displayRole === 'SUPER_ADMIN';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] p-0 overflow-hidden border-zinc-200/80 dark:border-zinc-800 shadow-2xl rounded-2xl max-h-[90vh] flex flex-col">
        {/* Hero Banner with TVK Theme */}
        <div className="relative bg-gradient-to-r from-[#8F0A1B] via-[#9e0f22] to-[#8F0A1B] px-6 pt-7 pb-6 text-white shrink-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-36 h-36 bg-black/20 rounded-full blur-xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 relative z-10">
            <div className="relative shrink-0">
              <UserAvatar
                src={displayPhoto}
                name={displayName}
                size="2xl"
                shape="circle"
                ring="gold"
                elevation="glow"
                className="w-20 h-20 sm:w-22 sm:h-22 border-3 border-white/90 shadow-lg"
              />
              <span
                className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-xs block"
                title="Online"
              />
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider shadow-xs border ${getRoleBadgeColor(
                    displayRole
                  )}`}
                >
                  <Shield className="w-3 h-3" />
                  {getRoleDisplayName(displayRole)}
                </span>
                {profile?.cadre?.memberId && (
                  <span className="inline-flex items-center text-[11px] font-mono font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/30 backdrop-blur-xs">
                    {profile.cadre.memberId}
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-sm truncate">
                {displayName}
              </h2>

              <p className="text-xs sm:text-sm text-white/80 font-medium flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                <Phone className="w-3.5 h-3.5 text-[#FFD700]" />
                <span>{displayUserId}</span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 border-t border-white/15 pt-3">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-white text-[#8F0A1B] shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {t('personalInfo')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-white text-[#8F0A1B] shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {t('security')}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {isLoading && !profile ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
              <div className="w-7 h-7 border-3 border-[#8F0A1B] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium">Loading account details...</span>
            </div>
          ) : activeTab === 'details' ? (
            <div className="space-y-4">
              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* User ID / Mobile */}
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs mb-1">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span>{t('userId')}</span>
                  </div>
                  <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 font-mono">
                    {profile?.userId || contextUser?.userId || '-'}
                  </div>
                </div>

                {/* Role */}
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs mb-1">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    <span>{t('role')}</span>
                  </div>
                  <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                    {getRoleDisplayName(displayRole)}
                  </div>
                </div>

                {/* Member ID (if cadre) */}
                {profile?.cadre?.memberId && (
                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs mb-1">
                      <CreditCard className="w-3.5 h-3.5 text-primary" />
                      <span>{t('memberId')}</span>
                    </div>
                    <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 font-mono">
                      {profile.cadre.memberId}
                    </div>
                  </div>
                )}

                {/* Voter ID */}
                {profile?.cadre?.voterId && (
                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs mb-1">
                      <CreditCard className="w-3.5 h-3.5 text-primary" />
                      <span>{t('voterId')}</span>
                    </div>
                    <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 font-mono">
                      {profile.cadre.voterId}
                    </div>
                  </div>
                )}

                {/* Aadhaar Number (Masked) */}
                {profile?.cadre?.aadhaarNumber && (
                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs mb-1">
                      <Lock className="w-3.5 h-3.5 text-primary" />
                      <span>{t('aadhaarNumber')}</span>
                    </div>
                    <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 font-mono">
                      {maskAadhaar(profile.cadre.aadhaarNumber)}
                    </div>
                  </div>
                )}

                {/* District */}
                {profile?.cadre?.district?.name && (
                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs mb-1">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span>{t('district')}</span>
                    </div>
                    <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      {profile.cadre.district.name}
                    </div>
                  </div>
                )}

                {/* Union / Org Unit */}
                {profile?.cadre?.union?.name && (
                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs mb-1">
                      <Building2 className="w-3.5 h-3.5 text-primary" />
                      <span>{t('union')}</span>
                    </div>
                    <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      {profile.cadre.union.name}
                    </div>
                  </div>
                )}

                {/* Kilai / Branch */}
                {profile?.cadre?.homeKilai?.name && (
                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs mb-1">
                      <GitBranch className="w-3.5 h-3.5 text-primary" />
                      <span>{t('kilai')}</span>
                    </div>
                    <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      {profile.cadre.homeKilai.name}
                    </div>
                  </div>
                )}

                {/* Wing */}
                {profile?.cadre?.wing?.name && (
                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs mb-1">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      <span>{t('wing')}</span>
                    </div>
                    <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      {profile.cadre.wing.name}
                    </div>
                  </div>
                )}

                {/* Area & Booth */}
                {(profile?.cadre?.area || profile?.cadre?.boothNo) && (
                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs mb-1">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span>{t('area')} / {t('boothNo')}</span>
                    </div>
                    <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      {[profile.cadre.area, profile.cadre.boothNo ? `Booth #${profile.cadre.boothNo}` : null]
                        .filter(Boolean)
                        .join(' • ')}
                    </div>
                  </div>
                )}

                {/* Account Created Date */}
                {profile?.createdAt && (
                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs mb-1">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span>{t('memberSince')}</span>
                    </div>
                    <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      {new Date(profile.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Security & Permissions Tab */
            <div className="space-y-4">
              {/* Password Action Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-zinc-50 to-primary/5 dark:from-amber-500/10 dark:via-zinc-900 dark:to-primary/5 border border-amber-500/20 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                    <span>{t('changePassword')}</span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t('changePasswordDesc')}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={onChangePasswordClick}
                  className="rounded-xl bg-[#8F0A1B] hover:bg-[#730815] text-white text-xs font-semibold h-9 px-4 shrink-0 shadow-xs cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                  {t('changePassword')}
                </Button>
              </div>

              {/* Permissions Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    {t('permissions')}
                  </h3>
                  <span className="text-[11px] font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                    {isSuperAdmin ? t('superAdminAccess') : `${permissionsList.length} ${t('activePermissions')}`}
                  </span>
                </div>

                {isSuperAdmin ? (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                      {t('superAdminAccess')} - You have full, unrestricted access to all modules, organizational units, and system controls.
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800">
                    {permissionsList.length > 0 ? (
                      permissionsList.map((perm) => (
                        <span
                          key={perm}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shadow-2xs"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                          {perm}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-400 py-2">
                        No explicit permissions assigned. Default role permissions apply.
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-8 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              logout();
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50 rounded-xl text-xs h-9 px-3.5 cursor-pointer w-full sm:w-auto"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            {tHeader('signOut')}
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              onClick={onChangePasswordClick}
              className="bg-[#8F0A1B] hover:bg-[#730815] text-white rounded-xl text-xs font-semibold h-9 px-3.5 cursor-pointer shadow-xs w-full sm:w-auto"
            >
              <KeyRound className="w-3.5 h-3.5 mr-1.5" />
              {t('changePassword')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs h-9 px-4 cursor-pointer w-full sm:w-auto"
            >
              {t('close')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
