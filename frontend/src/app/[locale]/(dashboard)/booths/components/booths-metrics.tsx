'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Users, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface BoothsMetricsProps {
  booths: any[] | undefined;
  onScrollToData?: () => void;
}

export function BoothsMetricsComponent({ booths, onScrollToData }: BoothsMetricsProps) {
  const t = useTranslations('Booths');

  const { totalBooths, totalVoters, agentCoverage } = React.useMemo(() => {
    const totalBooths = booths?.length || 0;
    const totalVoters =
      booths?.reduce((acc: number, curr: any) => acc + (curr.totalCount || 0), 0) || 0;
    const agentCoverage = totalBooths
      ? Math.round(
          (booths!.filter((b: any) => (b.latestAgents?.length || b.agents?.length) > 0).length /
            totalBooths) *
            100
        )
      : 0;
    return { totalBooths, totalVoters, agentCoverage };
  }, [booths]);

  return (
    <div className="grid gap-6 sm:grid-cols-3">
      <Card
        className="border-2 border-primary/20 dark:border-primary/30 shadow-md bg-white dark:bg-zinc-900 rounded-xl transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1 cursor-pointer"
        onClick={onScrollToData}
      >
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-md text-primary">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t('totalBooths')}
            </p>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mt-1">
              {totalBooths}
            </h2>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-primary/20 dark:border-primary/30 shadow-md bg-white dark:bg-zinc-900 rounded-xl transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 bg-manjal/20 rounded-md text-amber-600 dark:text-manjal">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t('totalVoters')}
            </p>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mt-1">
              {totalVoters.toLocaleString()}
            </h2>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-primary/20 dark:border-primary/30 shadow-md bg-white dark:bg-zinc-900 rounded-xl transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-md text-primary">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t('agentCoverage')}
            </p>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mt-1">
              {agentCoverage}%
            </h2>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const BoothsMetrics = React.memo(BoothsMetricsComponent);

