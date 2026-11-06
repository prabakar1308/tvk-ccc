'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import type { MapCoordinatePickerProps } from './map-coordinate-picker';

const DynamicMapCoordinatePicker = dynamic(() => import('./map-coordinate-picker'), {
  ssr: false,
});

export default function MapCoordinatePickerModal(props: MapCoordinatePickerProps) {
  if (!props.isOpen) return null;
  return <DynamicMapCoordinatePicker {...props} />;
}

