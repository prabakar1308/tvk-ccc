'use client';

import React from 'react';
import { Phone, Edit2, Trash2, Award, Shield, UserCheck, MapPin, Sparkles } from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface CadreCardData {
  id: string;
  name: string;
  memberId?: string;
  phone?: string;
  photoUrl?: string;
  role?: string;
  level?: 'DISTRICT' | 'GROUP' | 'UNION' | 'KILAI' | string;
  officeBearerRoles?: { role: string }[];
  wing?: { id?: string; name: string };
  district?: { id?: string; name: string };
  union?: { id?: string; name: string };
  homeKilai?: { id?: string; name: string };
  area?: string;
  boothNo?: string;
  [key: string]: any;
}

export interface CadreCardProps {
  cadre: CadreCardData;
  highlight?: boolean;
  minWidth?: string;
  className?: string;
  showLocation?: boolean;
  showMemberId?: boolean;
  showLevelBadge?: boolean;
  onView?: (cadre: CadreCardData) => void;
  onEdit?: (e: React.MouseEvent, cadre: CadreCardData) => void;
  onDelete?: (e: React.MouseEvent, id: string) => void;
  onCall?: (person: { name: string; phone: string }, e: React.MouseEvent) => void;
}

/**
 * Format raw role strings like 'DISTRICT_SECRETARY' or 'EXECUTIVE_COMMITTEE_MEMBER'
 * into clean, readable designations.
 */
function formatDesignation(rawRole?: string): string {
  if (!rawRole) return 'Administrator';
  
  const upper = rawRole.toUpperCase().trim();
  if (
    upper === 'EXECUTIVE_COMMITTEE_MEMBER' || 
    upper === 'EXECUTIVE COMMITTEE MEMBER' ||
    upper.includes('EXECUTIVE') ||
    upper === 'EC' ||
    upper === 'EC MEMBER' ||
    upper === 'EC_MEMBER'
  ) {
    return 'EC Member';
  }
  if (upper === 'DISTRICT_SECRETARY') return 'District Secretary';
  if (upper === 'UNION_SECRETARY') return 'Union Secretary';
  if (upper === 'KILAI_SECRETARY') return 'Kilai Secretary';
  if (upper === 'UNION_PRESIDENT') return 'Union President';
  if (upper === 'KILAI_PRESIDENT') return 'Kilai President';
  if (upper === 'JOINT_SECRETARY') return 'Joint Secretary';
  if (upper === 'DEPUTY_SECRETARY') return 'Deputy Secretary';
  if (upper === 'TREASURER') return 'Treasurer';
  if (upper === 'VICE_PRESIDENT') return 'Vice President';
  if (upper === 'MEMBER') return 'Member';

  return rawRole
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}

/**
 * Format area / village strings like 'KUDIKADU' -> 'Kudikadu'
 */
function formatArea(area?: string): string | null {
  if (!area || !area.trim() || area === '-') return null;
  return area
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}

/**
 * Return styled badge configs based on role prominence and cadre level
 */
function getRoleBadgeConfig(designation: string, level?: string) {
  const lower = designation.toLowerCase().trim();

  // Treasurer / Joint / Deputy / Incharge (Order before secretary so Joint/Deputy Secretary don't trigger general secretary)
  if (lower.includes('joint') || lower.includes('deputy') || lower.includes('treasurer') || lower.includes('incharge')) {
    return {
      style: 'bg-gradient-to-r from-amber-500/20 via-[#FFC72C]/25 to-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/40 font-bold',
      icon: Award,
      isLeader: false,
    };
  }

  // Secretary / President / Convener (High Leadership)
  if (lower.includes('secretary') || lower.includes('president') || lower.includes('leader') || lower.includes('convener')) {
    return {
      style: 'bg-gradient-to-r from-[#8F0A1B] to-[#B81930] text-white shadow-xs border border-[#8F0A1B]/40',
      icon: Shield,
      isLeader: true,
    };
  }

  // Level-specific badge styling for general roles
  if (level === 'DISTRICT') {
    return {
      style: 'bg-[#8F0A1B] text-white border border-[#8F0A1B]/40 shadow-xs',
      icon: Award,
      isLeader: false,
    };
  }

  if (level === 'UNION') {
    return {
      style: 'bg-[#FFC72C] text-black font-extrabold border border-amber-400/60 shadow-xs',
      icon: Award,
      isLeader: false,
    };
  }

  // EC Member / Member / Default
  return {
    style: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/70',
    icon: UserCheck,
    isLeader: false,
  };
}

export const CadreCard: React.FC<CadreCardProps> = ({
  cadre,
  highlight: explicitHighlight,
  minWidth = '240px',
  className,
  showLocation = true,
  showMemberId = true,
  showLevelBadge = false,
  onView,
  onEdit,
  onDelete,
  onCall,
}) => {
  const rawRole = cadre.officeBearerRoles?.[0]?.role || cadre.role || 'Member';
  const designation = formatDesignation(rawRole);
  const badgeConfig = getRoleBadgeConfig(designation, cadre.level);
  
  // Highlight if explicit prop or primary Secretary/President leader
  const isHighlighted = explicitHighlight ?? (badgeConfig.isLeader && Boolean(cadre.officeBearerRoles?.length));

  const handleCardClick = () => {
    if (onView) {
      onView(cadre);
    }
  };

  const handleCallClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onCall && cadre.phone) {
      onCall({ name: cadre.name, phone: cadre.phone }, e);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) {
      onEdit(e, cadre);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(e, cadre.id);
    }
  };

  const RoleIcon = badgeConfig.icon;

  // Area / Location derivation (prioritizes cadre.area)
  const formattedArea = formatArea(cadre.area);
  const locationLabel = formattedArea 
    ? (cadre.boothNo ? `${formattedArea} (Booth ${cadre.boothNo})` : formattedArea)
    : cadre.homeKilai?.name 
      ? cadre.homeKilai.name 
      : cadre.union?.name 
        ? cadre.union.name 
        : cadre.district?.name 
          ? `${cadre.district.name} Dist.` 
          : null;

  return (
    <div
      onClick={handleCardClick}
      style={{ minWidth }}
      className={cn(
        'group relative flex flex-col justify-between rounded-2xl sm:rounded-3xl border transition-all duration-300 overflow-hidden cursor-pointer select-none text-left',
        'shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_36px_-6px_rgba(143,10,27,0.18)] hover:-translate-y-1.5',
        isHighlighted
          ? 'bg-gradient-to-b from-[#8F0A1B]/[0.05] via-white to-amber-500/[0.04] dark:from-[#8F0A1B]/20 dark:via-zinc-900 dark:to-amber-500/10 border-[#8F0A1B]/40 hover:border-[#8F0A1B] dark:border-[#8F0A1B]/50'
          : 'bg-white dark:bg-zinc-900/95 border-zinc-200/80 dark:border-zinc-800 hover:border-[#8F0A1B]/50 dark:hover:border-[#8F0A1B]/60',
        className
      )}
    >
      {/* Top Accent Gradient Line */}
      <div
        className={cn(
          'absolute top-0 left-0 w-full h-1.5 transition-all duration-300',
          isHighlighted
            ? 'bg-gradient-to-r from-[#8F0A1B] via-[#FFC72C] to-[#8F0A1B] opacity-100'
            : 'bg-gradient-to-r from-zinc-200 via-primary/30 to-zinc-200 dark:from-zinc-800 dark:via-primary/40 dark:to-zinc-800 group-hover:from-[#8F0A1B] group-hover:via-[#FFC72C] group-hover:to-[#8F0A1B]'
        )}
      />

      {/* Ambient Top Glow on Hover */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-[#8F0A1B]/10 via-[#FFC72C]/10 to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />

      {/* Card Header: Member ID / Leader Tag & Action Buttons */}
      <div className="pt-4 px-4 sm:px-5 flex items-center justify-between gap-2 z-10 relative">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {isHighlighted && (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-[#8F0A1B] to-[#B81930] text-white shadow-2xs">
              <Sparkles className="w-2.5 h-2.5 text-[#FFC72C]" />
              Lead
            </span>
          )}

          {showMemberId && cadre.memberId && (
            <span className="inline-flex items-center text-[10px] font-mono font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-200/60 dark:border-zinc-700/60">
              {cadre.memberId}
            </span>
          )}

          {showLevelBadge && cadre.level && (
            <span className="inline-flex items-center text-[9px] font-extrabold uppercase tracking-wider text-primary/80 dark:text-primary/90 bg-primary/10 px-1.5 py-0.5 rounded">
              {cadre.level}
            </span>
          )}
        </div>

        {/* Action Buttons (Edit / Delete) */}
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1 transition-opacity duration-200 opacity-90 sm:opacity-0 sm:group-hover:opacity-100">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEditClick}
                className="h-7 w-7 rounded-full text-zinc-500 hover:text-[#8F0A1B] hover:bg-[#8F0A1B]/10 dark:hover:bg-[#8F0A1B]/20 transition-colors"
                title="Edit administrator"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDeleteClick}
                className="h-7 w-7 rounded-full text-zinc-500 hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 transition-colors"
                title="Delete administrator"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Main Body: Avatar, Name, Role, Location */}
      <div className="px-4 sm:px-5 pt-3 pb-4 flex flex-col items-center text-center z-10 relative">
        {/* Avatar with Status Pulse */}
        <div className="relative mb-3.5 group-hover:scale-105 transition-transform duration-300">
          <UserAvatar
            src={cadre.photoUrl}
            name={cadre.name || 'Administrator'}
            size="2xl"
            ring={isHighlighted ? 'primary' : 'default'}
            elevation={isHighlighted ? 'glow' : 'md'}
          />
          {/* Active status indicator dot */}
          <span 
            className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full shadow-xs" 
            title="Active Administrator"
          />
        </div>

        {/* Name */}
        <h3 className="font-heading font-extrabold text-[16px] sm:text-[17px] text-zinc-900 dark:text-zinc-100 leading-tight mb-2 group-hover:text-[#8F0A1B] transition-colors line-clamp-1 w-full px-1">
          {cadre.name || 'Unnamed Administrator'}
        </h3>

        {/* Role / Designation Badge */}
        <div className="flex flex-col items-center gap-1 w-full">
          <span
            className={cn(
              'inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-[12px] font-bold tracking-wide uppercase max-w-full truncate',
              badgeConfig.style
            )}
            title={designation}
          >
            <RoleIcon className="w-3 h-3 shrink-0" />
            <span className="truncate">{designation}</span>
          </span>

          {/* Wing Badge (if exists) */}
          {cadre.wing && (
            <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-200/50 dark:border-zinc-700/50">
              <Sparkles className="w-2.5 h-2.5 text-amber-500" />
              <span className="truncate max-w-[180px]">{cadre.wing.name}</span>
            </div>
          )}

          {/* Location or Area tag */}
          {showLocation && locationLabel && (
            <div 
              className="flex items-center justify-center gap-1.5 text-[11px] sm:text-[12px] font-semibold text-zinc-600 dark:text-zinc-300 mt-2 max-w-full truncate px-2.5 py-0.5 rounded-full bg-zinc-100/90 dark:bg-zinc-800/80 border border-zinc-200/70 dark:border-zinc-700/60 shadow-2xs"
              title={formattedArea ? `Area: ${locationLabel}` : locationLabel}
            >
              <MapPin className="w-3 h-3 text-[#8F0A1B] shrink-0" />
              <span className="truncate">{locationLabel}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer / Contact Action */}
      <div className="px-4 sm:px-5 pb-4 pt-1 z-10 relative border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
        {cadre.phone ? (
          <button
            onClick={handleCallClick}
            className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100/90 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs hover:shadow-xs transition-all active:scale-[0.98] cursor-pointer group/call"
            title={`Call ${cadre.name} (${cadre.phone})`}
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover/call:animate-bounce shrink-0" />
            <span className="font-mono tracking-tight">{cadre.phone}</span>
          </button>
        ) : (
          <div className="w-full py-2 text-center text-[11px] font-medium text-zinc-400 dark:text-zinc-500 italic">
            No phone registered
          </div>
        )}
      </div>
    </div>
  );
};

export default CadreCard;
