'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface BoothsPaginationProps {
  currentPage: number;
  totalPages: number;
  totalEntries: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function BoothsPagination({
  currentPage,
  totalPages,
  totalEntries,
  itemsPerPage,
  onPageChange,
}: BoothsPaginationProps) {
  const t = useTranslations('Booths');

  if (totalPages <= 0) return null;

  const startEntry = totalEntries === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(currentPage * itemsPerPage, totalEntries);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border border-primary/10 bg-white dark:bg-zinc-900 rounded-xl mt-6 shadow-sm">
      <div className="text-sm text-muted-foreground font-medium text-center sm:text-left">
        {t('showing')} {startEntry} {t('to')} {endEntry} {t('of')} {totalEntries} {t('entries')}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="bg-card hover:bg-primary hover:text-primary-foreground border-primary/20 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {t('previous')}
        </Button>
        <div className="text-sm font-semibold text-primary px-2">
          {t('page')} {currentPage} {t('of')} {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="bg-card hover:bg-primary hover:text-primary-foreground border-primary/20 transition-colors"
        >
          {t('next')}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

