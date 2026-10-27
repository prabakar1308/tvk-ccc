'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { 
  ArrowLeft, Users as UsersIcon, UserRound, Phone, PhoneCall,
  Plus, LayoutGrid, TableProperties, Edit2, Trash2, Shield, ShieldCheck,
  MapPin, Award, UserPlus, Clock,
  Monitor, Scale, Radio, Mic, GraduationCap, Users, TreePine, 
  History, Rainbow, HeartHandshake, Zap, BookOpen, Baby, 
  Store, Sailboat, Scissors, Briefcase, HardHat, Lightbulb, 
  Globe, Stethoscope, Wheat, Palette, HandHeart, Tv
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { CadreFormDialog } from '@/components/cadre-form-dialog';
import { useQueryClient } from '@tanstack/react-query';
import { UserAvatar } from '@/components/ui/user-avatar';
import { CallConfirmationDialog } from '@/components/shared/call-confirmation-dialog';

import { useWings, useWingMembers, useAssignWingMember, useRemoveWingMember } from '@/hooks/use-wings';
import { isCoordinatorRole, isCoCoordinatorRole, getCanonicalWingRole, translatePersonNameToTamil } from '@/lib/name-translations';
import { useCadres } from '@/hooks/use-cadres';
import { useDistricts } from '@/hooks/use-districts';
import { useUnions } from '@/hooks/use-unions';
import { useSessionStorage } from '@/hooks/use-session-storage';

const iconMap: Record<string, any> = {
  Monitor, Scale, Radio, Mic, GraduationCap, Users, TreePine, 
  History, Rainbow, HeartHandshake, Zap, BookOpen, UserRound, 
  UserPlus, Baby, Shield, Store, Sailboat, Scissors, Briefcase, 
  HardHat, Lightbulb, Globe, Stethoscope, Wheat, Palette, 
  HandHeart, Tv
};

export default function WingDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations('Wings');
  const queryClient = useQueryClient();
  
  const wingId = params.id as string;
  const [sessionLevel, , isMountedLevel] = useSessionStorage('wings_level', 'district');
  const [sessionDistrict, , isMountedDistrict] = useSessionStorage('wings_district', '');
  const [sessionUnion, , isMountedUnion] = useSessionStorage('wings_union', '');
  
  const isMounted = isMountedLevel && isMountedDistrict && isMountedUnion;
  
  const level = sessionLevel;
  const orgId = level === 'district' ? sessionDistrict : sessionUnion;

  const { data: wingsData = [] } = useWings();
  const wing = wingsData.find((w: any) => w.id === wingId) || { 
    name: 'Wing Details', 
    color: 'bg-[#8F0A1B]', 
    textColor: 'text-[#8F0A1B]',
    iconName: 'Shield',
    order: 1
  };
  
  const WingIcon = iconMap[wing.iconName] || Shield;

  const { data: members = [], isLoading: isMembersLoading } = useWingMembers(wingId, level, orgId);
  const { mutate: assignMember, isPending: isAssigning } = useAssignWingMember();
  const { mutate: removeMember, isPending: isRemoving } = useRemoveWingMember();

  const { data: districts = [] } = useDistricts();
  const { data: unions = [] } = useUnions();

  const orgName = level === 'district' 
    ? districts.find((d: any) => d.id === orgId)?.name 
    : unions.find((u: any) => u.id === orgId)?.name;

  const [viewMode, setViewMode] = useState<'tile' | 'table'>('tile');
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [callPerson, setCallPerson] = useState<{ name: string; phone: string } | null>(null);

  const handleInitiateCall = (phone: string, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCallPerson({ phone, name });
  };

  const filterParams: any = { level: level.toUpperCase() };
  if (level === 'district') {
    filterParams.districtId = orgId;
  } else if (level === 'union') {
    filterParams.unionId = orgId;
  }
  
  const { data: cadresResponse } = useCadres(filterParams);
  const cadres = cadresResponse || [];

  const coordinators = members.filter((m: any) => isCoordinatorRole(m.rawRole || m.canonicalRole || m.role));
  const coCoordinators = members.filter((m: any) => isCoCoordinatorRole(m.rawRole || m.canonicalRole || m.role));

  const handleAdd = (role: string) => {
    setEditingId(null);
    setEditingRole(role === 'Coordinator' ? 'COORDINATOR' : 'CO_COORDINATOR');
    setIsManageDialogOpen(true);
  };

  const handleEdit = (member: any) => {
    setEditingId(member.id);
    setEditingRole(getCanonicalWingRole(member.rawRole || member.canonicalRole || member.role));
    setIsManageDialogOpen(true);
  };

  const handleDelete = (member: any) => {
    if (confirm(`Are you sure you want to remove ${member.name} from this wing?`)) {
      removeMember({ cadreId: member.id });
    }
  };

  const renderTileView = (memberList: any[], title: string, role: string) => {
    const isCoordinatorRole = role === 'Coordinator';

    return (
      <div className="mb-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${isCoordinatorRole ? 'bg-[#8F0A1B]/10 text-[#8F0A1B] dark:bg-[#8F0A1B]/20 dark:text-red-300' : 'bg-[#548777]/10 text-[#548777] dark:bg-teal-950/40 dark:text-teal-300'} border border-current/20 shadow-xs`}>
              {isCoordinatorRole ? <ShieldCheck className="w-5 h-5" /> : <UsersIcon className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {title}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  memberList.length > 0 
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700' 
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60'
                }`}>
                  {isCoordinatorRole ? `${memberList.length} / 1 Position` : `${memberList.length} / 10 Positions`}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {isCoordinatorRole 
                  ? 'Principal executive officer heading the wing at this jurisdiction' 
                  : 'Deputy officers supporting wing operations, coordination and outreach'}
              </p>
            </div>
          </div>

          {(isCoordinatorRole ? memberList.length === 0 : memberList.length < 10) && (
            <Button 
              size="sm" 
              onClick={() => handleAdd(role)}
              className="rounded-xl shadow-xs bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-[#8F0A1B] hover:text-white dark:hover:bg-[#8F0A1B] border border-zinc-200/90 dark:border-zinc-700 font-bold transition-all self-start sm:self-auto h-9 px-4 active:scale-95"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add {role}
            </Button>
          )}
        </div>
        
        {memberList.length === 0 ? (
          <div className="group rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-8 text-center flex flex-col items-center justify-center transition-all hover:border-[#8F0A1B]/40 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 max-w-xl">
            <div className={`w-14 h-14 rounded-2xl ${isCoordinatorRole ? 'bg-[#8F0A1B]/10 text-[#8F0A1B]' : 'bg-[#548777]/10 text-[#548777]'} flex items-center justify-center mb-3 shadow-xs border border-current/20 group-hover:scale-110 transition-transform`}>
              {isCoordinatorRole ? <UserPlus className="w-7 h-7" /> : <UsersIcon className="w-7 h-7" />}
            </div>
            <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              No {title} Assigned
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-4 leading-relaxed">
              {isCoordinatorRole 
                ? 'Appoint an active cadre as the primary Coordinator to direct this wing in this jurisdiction.'
                : 'Add up to 10 co-coordinators to assist in wing campaigns, events, and member relations.'}
            </p>
            <Button 
              onClick={() => handleAdd(role)}
              className="bg-[#8F0A1B] hover:bg-[#720815] text-white font-bold rounded-xl shadow-sm px-5 py-2 h-auto text-xs transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Assign {role}
            </Button>
          </div>
        ) : isCoordinatorRole ? (
          /* Coordinator Executive Leadership Card (Prominent Wide Layout) */
          <div className="max-w-xl">
            {memberList.map((member: any) => (
              <div 
                key={member.id} 
                className="group relative overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-sm hover:shadow-[0_20px_40px_-12px_rgba(143,10,27,0.15)] hover:border-[#8F0A1B]/50 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                {/* Top Accent Strip */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#8F0A1B] via-[#C2185B] to-[#8F0A1B] opacity-95 group-hover:opacity-100 transition-opacity z-10" />

                {/* Ambient Decorative Gradient */}
                <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-gradient-to-br from-[#8F0A1B]/15 via-red-500/5 to-transparent rounded-full opacity-70 group-hover:scale-150 transition-transform duration-700 ease-out pointer-events-none z-0" />

                <div className="p-6 pb-4 flex-1 flex flex-col z-10 relative">
                  {/* Top Bar: Role Badge & Action Buttons */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#8F0A1B]/10 text-[#8F0A1B] dark:bg-[#8F0A1B]/25 dark:text-red-300 border border-[#8F0A1B]/25 shadow-xs">
                        <ShieldCheck className="w-4 h-4 text-[#8F0A1B] dark:text-red-400" />
                        Executive Coordinator
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active Lead
                      </span>
                    </div>

                    {/* Quick Edit/Delete Actions */}
                    <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800/80 p-1 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 shadow-xs">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer" 
                        title="Edit position"
                        onClick={() => handleEdit(member)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer" 
                        title="Remove member"
                        onClick={() => handleDelete(member)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Profile Layout */}
                  <div className="flex items-center gap-5 my-2">
                    <div className="relative shrink-0 group-hover:scale-105 transition-transform duration-300">
                      <UserAvatar 
                        src={member.photoUrl} 
                        name={member.name} 
                        size="xl" 
                        shape="square" 
                        ring="primary" 
                        elevation="md" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-xl text-zinc-900 dark:text-zinc-100 group-hover:text-[#8F0A1B] transition-colors truncate tracking-tight">
                        {locale === 'ta' && member.name
                          ? translatePersonNameToTamil(member.name)
                          : member.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-[#8F0A1B] shrink-0" />
                        <span className="truncate">
                          {member.district?.name || member.union?.name || orgName || 'Jurisdiction Lead'}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          {level === 'district' ? 'District Wing Head' : 'Org Unit Wing Head'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Emerald Call Button */}
                <div className="p-6 pt-0 z-10 relative">
                  <div className="pt-3.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                    {member.phone ? (
                      <button 
                        onClick={(e) => handleInitiateCall(member.phone, member.name, e)} 
                        className="w-full inline-flex items-center justify-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100/90 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 border border-emerald-200/90 dark:border-emerald-800/80 py-2.5 px-4 rounded-xl transition-all active:scale-[0.98] shadow-xs group/phone cursor-pointer"
                      >
                        <PhoneCall className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover/phone:animate-bounce shrink-0" />
                        <span className="font-mono tracking-wider text-[13px]">{member.phone}</span>
                      </button>
                    ) : (
                      <div className="w-full py-2.5 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-400 text-xs text-center italic border border-zinc-200/40">
                        No phone registered
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Co-coordinators Grid Layout (3 Columns with Ample Breathing Room) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {memberList.map((member: any) => (
              <div 
                key={member.id} 
                className="group relative overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xs hover:shadow-[0_16px_36px_-10px_rgba(84,135,119,0.18)] hover:border-[#548777]/50 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
              >
                {/* Top Accent Strip */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#548777] opacity-90 group-hover:opacity-100 transition-opacity z-10" />

                {/* Ambient Decorative Gradient */}
                <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-gradient-to-br from-[#548777]/15 to-transparent rounded-full opacity-60 group-hover:scale-150 transition-transform duration-700 ease-out pointer-events-none z-0" />

                <div className="p-5 pb-3 flex-1 flex flex-col z-10 relative">
                  {/* Card Header: Role Badge + Action Buttons */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#548777]/10 text-[#548777] dark:bg-teal-950/40 dark:text-teal-300 border border-[#548777]/20 shadow-xs">
                        <UsersIcon className="w-3.5 h-3.5 text-[#548777] dark:text-teal-400" />
                        Co-coordinator
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    </div>

                    {/* Quick Edit/Delete Actions */}
                    <div className="flex items-center gap-0.5 bg-zinc-50 dark:bg-zinc-800/80 p-1 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 shadow-xs">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer" 
                        title="Edit position"
                        onClick={() => handleEdit(member)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer" 
                        title="Remove member"
                        onClick={() => handleDelete(member)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Member Profile Info */}
                  <div className="flex items-center gap-4 my-1.5">
                    <div className="relative shrink-0 group-hover:scale-105 transition-transform duration-300">
                      <UserAvatar 
                        src={member.photoUrl} 
                        name={member.name} 
                        size="xl" 
                        shape="square" 
                        ring="primary" 
                        elevation="md" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[16px] text-zinc-900 dark:text-zinc-100 group-hover:text-[#8F0A1B] transition-colors truncate leading-snug">
                        {locale === 'ta' && member.name
                          ? translatePersonNameToTamil(member.name)
                          : member.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-[#548777] shrink-0" />
                        <span className="truncate">
                          {member.district?.name || member.union?.name || orgName || (level === 'district' ? 'District Unit' : 'Org Unit')}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-md border border-zinc-200/50 dark:border-zinc-700/50">
                          <Award className="w-3 h-3 text-amber-500" />
                          {level === 'district' ? 'District Wing' : 'Org Unit Wing'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Phone Action */}
                <div className="p-5 pt-0 z-10 relative">
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                    {member.phone ? (
                      <button 
                        onClick={(e) => handleInitiateCall(member.phone, member.name, e)} 
                        className="w-full inline-flex items-center justify-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100/90 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200/80 dark:border-emerald-800/60 py-2.5 px-3 rounded-xl transition-all active:scale-[0.98] shadow-xs group/phone cursor-pointer"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-600 group-hover/phone:animate-bounce shrink-0" />
                        <span className="font-mono tracking-wider">{member.phone}</span>
                      </button>
                    ) : (
                      <div className="w-full py-2.5 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-400 text-xs text-center italic border border-zinc-200/40">
                        No phone registered
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTableView = (memberList: any[], title: string, role: string) => {
    const isCoordinatorRole = role === 'Coordinator';

    return (
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isCoordinatorRole ? 'bg-[#8F0A1B]/10 text-[#8F0A1B]' : 'bg-[#548777]/10 text-[#548777]'}`}>
              {isCoordinatorRole ? <ShieldCheck className="w-4 h-4" /> : <UsersIcon className="w-4 h-4" />}
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              {title}
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {memberList.length}
              </span>
            </h3>
          </div>
          {(isCoordinatorRole ? memberList.length === 0 : memberList.length < 10) && (
            <Button size="sm" variant="outline" className="rounded-xl shadow-xs bg-white dark:bg-zinc-900" onClick={() => handleAdd(role)}>
              <Plus className="w-4 h-4 mr-1.5" /> Add {role}
            </Button>
          )}
        </div>

        <Card className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs bg-white dark:bg-zinc-900 overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-50/70 dark:bg-zinc-800/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-zinc-900 dark:text-zinc-100">Member</TableHead>
                <TableHead className="font-bold text-zinc-900 dark:text-zinc-100">Jurisdiction</TableHead>
                <TableHead className="font-bold text-zinc-900 dark:text-zinc-100">Contact Number</TableHead>
                <TableHead className="font-bold text-zinc-900 dark:text-zinc-100 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-28 text-center text-zinc-400">
                    No {title.toLowerCase()} assigned yet.
                  </TableCell>
                </TableRow>
              ) : (
                memberList.map((member: any) => (
                  <TableRow key={member.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3.5">
                        <UserAvatar 
                          src={member.photoUrl} 
                          name={member.name} 
                          size="md" 
                          shape="square"
                          ring="primary" 
                          elevation="sm" 
                        />
                        <div>
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                            {locale === 'ta' && member.name
                              ? translatePersonNameToTamil(member.name)
                              : member.name}
                          </span>
                          <span className="text-xs text-zinc-400">
                            {locale === 'ta'
                              ? (role === 'Coordinator' ? 'ஒருங்கிணைப்பாளர்' : 'இணை ஒருங்கிணைப்பாளர்')
                              : role}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                        {member.district?.name || member.union?.name || orgName || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {member.phone ? (
                        <button
                          onClick={(e) => handleInitiateCall(member.phone, member.name, e)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200/60 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span className="font-mono">{member.phone}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-400 italic">No phone</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-blue-600 rounded-lg" onClick={() => handleEdit(member)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-600 rounded-lg" onClick={() => handleDelete(member)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-xs border border-zinc-200/80 dark:border-zinc-800 relative overflow-hidden">
        {/* Left Color Bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-2 ${wing.color || 'bg-primary'}`} />
        
        <div className="flex items-center gap-4 pl-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 h-11 w-11 shrink-0 border border-zinc-200/60 dark:border-zinc-700" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
          </Button>

          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700 shadow-xs flex items-center justify-center shrink-0">
              <WingIcon className={`w-7 h-7 ${wing.textColor || 'text-primary'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {wing.name}
                </h1>
                {wing.order && (
                  <span 
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider shadow-xs"
                    style={{ backgroundColor: '#6d9188ff', color: 'white' }}
                  >
                    Wing {wing.order < 10 ? `0${wing.order}` : wing.order}
                  </span>
                )}
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1 flex items-center gap-2 flex-wrap">
                <span>Manage leadership for</span>
                <span className="font-bold text-[#8F0A1B] bg-[#8F0A1B]/10 px-2.5 py-0.5 rounded-lg border border-[#8F0A1B]/20">
                  {orgName || '...'}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {level === 'district' ? 'District Level' : 'Org Unit Level'}
                </span>
              </p>
            </div>
          </div>
        </div>
        
        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl border border-zinc-200/60 dark:border-zinc-700 self-end sm:self-auto">
          <button 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${viewMode === 'tile' ? 'bg-white dark:bg-zinc-900 shadow-xs text-[#8F0A1B]' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
            onClick={() => setViewMode('tile')}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Cards</span>
          </button>
          <button 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${viewMode === 'table' ? 'bg-white dark:bg-zinc-900 shadow-xs text-[#8F0A1B]' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
            onClick={() => setViewMode('table')}
          >
            <TableProperties className="w-4 h-4" />
            <span>Table</span>
          </button>
        </div>
      </div>

      <div className="pb-8">
        {isMembersLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : viewMode === 'tile' ? (
          <>
            {renderTileView(coordinators, 'Coordinator', 'Coordinator')}
            {renderTileView(coCoordinators, 'Co-coordinators', 'Co-coordinator')}
          </>
        ) : (
          <>
            {renderTableView(coordinators, 'Coordinator', 'Coordinator')}
            {renderTableView(coCoordinators, 'Co-coordinators', 'Co-coordinator')}
          </>
        )}
      </div>

      <CadreFormDialog 
        isOpen={isManageDialogOpen}
        onOpenChange={setIsManageDialogOpen}
        editingId={editingId}
        cadres={members}
        defaultLevel={level.toUpperCase() as any}
        lockLevel={true}
        defaultDistrictId={level === 'district' ? orgId : undefined}
        defaultUnionId={level === 'union' ? orgId : undefined}
        defaultWingId={wingId}
        defaultRole={editingRole}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['wings', wingId, 'members'] });
          queryClient.invalidateQueries({ queryKey: ['cadres'] });
        }}
      />

      <CallConfirmationDialog 
        person={callPerson}
        onOpenChange={(open) => !open && setCallPerson(null)}
      />
    </div>
  );
}

