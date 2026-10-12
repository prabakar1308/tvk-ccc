'use client';

import React, { useState } from 'react';
import { User, ZoomIn } from 'lucide-react';

export interface UserAvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
  imageClassName?: string;
  ring?: 'primary' | 'gold' | 'default' | 'none';
  elevation?: 'none' | 'sm' | 'md' | 'lg' | 'glow';
  shape?: 'circle' | 'rounded' | 'square';
  showZoomOnHover?: boolean;
  onZoomClick?: () => void;
  badge?: React.ReactNode;
  alt?: string;
}

// Generate harmonious gradients based on name
const GRADIENTS = [
  'from-[#8F0A1B] via-[#A81327] to-[#600511]', // TVK Maroon (Primary)
  'from-[#8F0A1B] via-[#B81930] to-[#E65100]', // TVK Maroon to Warm Orange
  'from-[#9C1226] via-[#C2185B] to-[#7B1FA2]', // Ruby to Plum
  'from-[#1E3A8A] via-[#1D4ED8] to-[#0284C7]', // Deep Royal Blue
  'from-[#065F46] via-[#059669] to-[#10B981]', // Emerald
  'from-[#7C2D12] via-[#C2410C] to-[#F59E0B]', // Amber Bronze
  'from-[#4C1D95] via-[#6D28D9] to-[#8B5CF6]', // Purple Violet
  'from-[#8F0A1B] via-[#D97706] to-[#FFC72C]', // TVK Maroon to Manjal Gold
];

function getGradientForName(name: string = ''): string {
  if (!name) return GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
}

function getInitials(name: string = ''): string {
  if (!name.trim()) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SIZE_CONFIGS = {
  xs: {
    container: 'w-7 h-7 min-w-[1.75rem]',
    text: 'text-[11px] font-bold',
    icon: 'w-3.5 h-3.5',
    zoomIcon: 'w-2.5 h-2.5',
  },
  sm: {
    container: 'w-9 h-9 min-w-[2.25rem]',
    text: 'text-xs font-bold',
    icon: 'w-4 h-4',
    zoomIcon: 'w-3 h-3',
  },
  md: {
    container: 'w-12 h-12 min-w-[3rem]',
    text: 'text-sm font-extrabold',
    icon: 'w-5 h-5',
    zoomIcon: 'w-3.5 h-3.5',
  },
  lg: {
    container: 'w-16 h-16 min-w-[4rem]',
    text: 'text-base font-extrabold',
    icon: 'w-7 h-7',
    zoomIcon: 'w-4 h-4',
  },
  xl: {
    container: 'w-20 h-20 sm:w-24 sm:h-24 min-w-[5rem]',
    text: 'text-lg sm:text-xl font-black tracking-wide',
    icon: 'w-9 h-9',
    zoomIcon: 'w-5 h-5',
  },
  '2xl': {
    container: 'w-28 h-28 sm:w-32 sm:h-32 min-w-[7rem]',
    text: 'text-2xl sm:text-3xl font-black tracking-wider',
    icon: 'w-12 h-12',
    zoomIcon: 'w-6 h-6',
  },
  '3xl': {
    container: 'w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 min-w-[8rem]',
    text: 'text-3xl sm:text-4xl font-black tracking-wider',
    icon: 'w-14 h-14',
    zoomIcon: 'w-7 h-7',
  },
};

const RING_CONFIGS = {
  none: '',
  default: 'ring-2 ring-white/90 dark:ring-zinc-800 shadow-sm',
  primary: 'ring-4 ring-offset-2 ring-offset-background ring-[#8F0A1B]/25 hover:ring-[#8F0A1B]/50 transition-all duration-300',
  gold: 'ring-4 ring-offset-2 ring-offset-background ring-[#FFC72C]/40 hover:ring-[#FFC72C]/70 transition-all duration-300',
};

const ELEVATION_CONFIGS = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-xl',
  glow: 'shadow-[0_8px_25px_-4px_rgba(143,10,27,0.28)] dark:shadow-[0_8px_25px_-4px_rgba(143,10,27,0.45)]',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name = '',
  size = 'md',
  className = '',
  imageClassName = '',
  ring = 'default',
  elevation = 'md',
  shape = 'circle',
  showZoomOnHover = false,
  onZoomClick,
  badge,
  alt,
}) => {
  const [hasError, setHasError] = useState(false);
  const sizeConfig = SIZE_CONFIGS[size] || SIZE_CONFIGS.md;
  const initials = getInitials(name);
  const gradient = getGradientForName(name);

  const isInteractive = Boolean(onZoomClick);
  const borderRadius =
    shape === 'square'
      ? 'rounded-xl sm:rounded-2xl'
      : shape === 'rounded'
      ? 'rounded-2xl sm:rounded-3xl'
      : 'rounded-full';

  return (
    <div
      className={`relative inline-block shrink-0 select-none ${sizeConfig.container} ${className}`}
      onClick={(e) => {
        if (onZoomClick) {
          e.stopPropagation();
          onZoomClick();
        }
      }}
    >
      <div
        className={`w-full h-full ${borderRadius} overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 ${RING_CONFIGS[ring]} ${ELEVATION_CONFIGS[elevation]} relative group/avatar transition-all duration-300 ${
          isInteractive ? 'cursor-pointer hover:scale-[1.02]' : ''
        }`}
      >
        {src && !hasError ? (
          <img
            src={src}
            alt={alt || name || 'User profile'}
            onError={() => setHasError(true)}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-105 ${imageClassName}`}
            loading="lazy"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white relative overflow-hidden`}
          >
            {/* Subtle gloss highlight on avatar */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/25 pointer-events-none" />
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/10 rounded-full blur-sm pointer-events-none" />

            {initials ? (
              <span className={`relative z-10 ${sizeConfig.text} text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] uppercase select-none`}>
                {initials}
              </span>
            ) : (
              <User className={`relative z-10 ${sizeConfig.icon} text-white/90 drop-shadow`} />
            )}
          </div>
        )}

        {/* Zoom Lightbox Trigger Overlay on Hover */}
        {(showZoomOnHover || isInteractive) && (
          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 flex items-center justify-center backdrop-blur-[1px] pointer-events-none">
            <div className="p-1.5 rounded-full bg-white/90 text-zinc-900 shadow-md">
              <ZoomIn className={sizeConfig.zoomIcon} />
            </div>
          </div>
        )}
      </div>

      {/* Optional Badge overlay (e.g. status indicator, level badge) */}
      {badge && (
        <div className="absolute -bottom-1 -right-1 z-20 pointer-events-none">
          {badge}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
