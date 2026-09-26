'use client';

import { useTranslations } from 'next-intl';

export default function AnalyticsPage() {
  const t = useTranslations('UnderConstruction');
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold uppercase tracking-wide text-primary">{t('analyticsTitle')}</h1>
          <p className="text-muted-foreground mt-1 text-lg font-medium">{t('analyticsDesc')}</p>
        </div>
      </div>
      
      <div className="p-8 text-center border rounded-lg bg-card mt-8">
        <h2 className="text-2xl font-semibold mb-4">{t('title')}</h2>
        <p className="text-muted-foreground">{t('analyticsMsg')}</p>
      </div>
    </div>
  );
}
