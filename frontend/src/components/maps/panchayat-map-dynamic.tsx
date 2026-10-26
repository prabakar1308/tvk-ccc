'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import type { PanchayatMapProps } from './panchayat-map';
import { MapPin } from 'lucide-react';

const DynamicLeafletMap = dynamic(() => import('./panchayat-map'), {
  ssr: false,
  loading: () => <MapLoadingSkeleton />,
});

function MapLoadingSkeleton() {
  return (
    <div className="w-full h-[500px] rounded-2xl bg-gray-100 dark:bg-zinc-800/50 flex flex-col items-center justify-center border border-dashed border-gray-300 dark:border-zinc-700 animate-pulse text-gray-500">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
        <MapPin className="w-6 h-6 text-primary animate-bounce" />
      </div>
      <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
        Loading interactive field map...
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Fetching OpenStreetMap road network and boundary layers
      </p>
    </div>
  );
}

export default function PanchayatMapDynamic(props: PanchayatMapProps & { geoJson?: any }) {
  return <DynamicLeafletMap {...props} />;
}
