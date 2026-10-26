'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import {
  RotateCcw,
  MapPin,
  Store,
  Building2,
  Users,
  Eye,
  EyeOff,
  Edit3,
  Check,
  X,
  Copy,
  RefreshCw,
  Crosshair,
  Sliders
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  KNOWN_KILAI_COORDINATES,
  generateDynamicAreaBoundary
} from '@/lib/area-translations';
import { kilaiApi } from '@/services/api/kilais';

export interface PanchayatMapProps {
  center: [number, number];
  boundaryCoords: [number, number][];
  title: string;
  subtitle?: string;
  englishTitle?: string;
  tamilTitle?: string;
  kilaiCount?: number;
  boothCount?: number;
  cadreCount?: number;
  kilais?: Array<{
    id: string;
    name: string;
    tamilName?: string;
    secretaryName?: string;
    latitude?: number;
    longitude?: number;
    booths?: any[];
  }>;
  locale?: string;
  height?: string;
}

export default function PanchayatMap({
  center,
  boundaryCoords,
  title,
  subtitle,
  englishTitle,
  tamilTitle,
  kilaiCount = 0,
  boothCount = 0,
  cadreCount = 0,
  kilais = [],
  locale = 'en',
  height = '520px',
}: PanchayatMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  const centerLabelMarkerRef = useRef<any>(null);
  const editMarkersLayerRef = useRef<any>(null);
  const kilaiLayerGroupRef = useRef<any>(null);

  const enName = englishTitle || title;
  const taName = tamilTitle || subtitle || '';
  const areaKey = enName.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Map layer type: OpenStreetMap Standard, Esri Satellite, or OSM HOT
  const [mapType, setMapType] = useState<'osm' | 'satellite' | 'hot'>('osm');
  const [showKilaiPins, setShowKilaiPins] = useState<boolean>(true);
  const [isEditingBoundary, setIsEditingBoundary] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Center & Boundary state (supports local customization)
  const [activeCenter, setActiveCenter] = useState<[number, number]>(center);
  const [activeBoundary, setActiveBoundary] = useState<[number, number][]>(boundaryCoords || []);

  // Lat/Long Configuration Modal State
  const [isCoordsModalOpen, setIsCoordsModalOpen] = useState<boolean>(false);
  const [inputLat, setInputLat] = useState<string>(String(center[0]));
  const [inputLng, setInputLng] = useState<string>(String(center[1]));
  const [inputRadiusKm, setInputRadiusKm] = useState<number>(1.2);
  const [coordsText, setCoordsText] = useState<string>('');
  const [isPickingLocation, setIsPickingLocation] = useState<boolean>(false);

  // Load custom local center & boundary if saved previously
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedGeo = localStorage.getItem(`tvk_panchayat_geo_${areaKey}`);
      if (savedGeo) {
        try {
          const parsed = JSON.parse(savedGeo);
          if (parsed.center && Array.isArray(parsed.center)) {
            setActiveCenter(parsed.center);
            setInputLat(String(parsed.center[0]));
            setInputLng(String(parsed.center[1]));
          }
          if (parsed.boundaryCoords && Array.isArray(parsed.boundaryCoords)) {
            setActiveBoundary(parsed.boundaryCoords);
            setCoordsText(parsed.boundaryCoords.map((c: any) => `${c[0]}, ${c[1]}`).join('\n'));
            return;
          }
        } catch {
          // ignore parsing error
        }
      }
    }
    setActiveCenter(center);
    setInputLat(String(center[0]));
    setInputLng(String(center[1]));
    setActiveBoundary(boundaryCoords || []);
    if (boundaryCoords) {
      setCoordsText(boundaryCoords.map((c) => `${c[0]}, ${c[1]}`).join('\n'));
    }
  }, [center, boundaryCoords, areaKey]);

  // Helper to format polygon array to text
  const formatCoordsToText = (coords: [number, number][]) => {
    return coords.map(([lat, lng]) => `${lat}, ${lng}`).join('\n');
  };

  // Helper to parse text to polygon array
  const parseTextToCoords = (text: string): [number, number][] => {
    const lines = text.trim().split('\n');
    const result: [number, number][] = [];
    for (const line of lines) {
      const parts = line.split(/[,\s]+/).map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
      if (parts.length >= 2) {
        result.push([parts[0], parts[1]]);
      }
    }
    if (result.length > 2 && (result[0][0] !== result[result.length - 1][0] || result[0][1] !== result[result.length - 1][1])) {
      result.push(result[0]); // Ensure closed polygon
    }
    return result;
  };

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      // Fix default Leaflet icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if ((mapContainerRef.current as any)._leaflet_id) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }

      // Initialize map instance
      const map = L.map(mapContainerRef.current, {
        center: activeCenter,
        zoom: 14.5,
        zoomSnap: 0.25,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Default Layer: Official OpenStreetMap Standard (100% Free, Zero API Key / Watermarks)
      const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      });

      osmLayer.addTo(map);
      tileLayerRef.current = osmLayer;

      // Render Boundary Polygon
      if (activeBoundary && activeBoundary.length > 2) {
        const polygon = L.polygon(activeBoundary as any, {
          color: '#EA4335',
          weight: 2.5,
          opacity: 0.95,
          dashArray: '6, 6', // Red dotted demarcation
          fillColor: '#EA4335',
          fillOpacity: 0.05,
        }).addTo(map);

        polygonRef.current = polygon;
        map.fitBounds(polygon.getBounds(), { padding: [28, 28], maxZoom: 15.25 });
      }

      // Center Village Label
      const updateCenterMarker = (pos: [number, number]) => {
        if (centerLabelMarkerRef.current) {
          map.removeLayer(centerLabelMarkerRef.current);
        }

        const centerLabelHtml = `
          <div style="text-align: center; pointer-events: auto; transform: translate(-50%, -50%); white-space: nowrap; cursor: pointer;">
            <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 15px; font-weight: 700; color: #D93025; text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 0 6px #ffffff, 0 0 10px #ffffff; line-height: 1.15; letter-spacing: -0.2px;">
              ${enName}
            </div>
            ${taName && taName !== enName ? `
            <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 14px; font-weight: 600; color: #D93025; text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 0 6px #ffffff, 0 0 10px #ffffff; line-height: 1.15; margin-top: 1px;">
              ${taName}
            </div>` : ''}
          </div>
        `;

        const centerLabelIcon = L.divIcon({
          className: 'village-map-center-label',
          html: centerLabelHtml,
          iconSize: [120, 40],
          iconAnchor: [60, 20],
        });

        const labelMarker = L.marker(pos, { icon: centerLabelIcon }).addTo(map);

        const popupHtml = `
          <div style="font-family: inherit; min-width: 200px; padding: 4px;">
            <div style="font-size: 15px; font-weight: 700; color: #D93025; margin-bottom: 2px;">
              ${enName}
            </div>
            ${taName ? `<div style="font-size: 13px; font-weight: 600; color: #64748B; margin-bottom: 8px;">${taName}</div>` : ''}
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 6px; text-align: center;">
              <div>
                <div style="font-size: 14px; font-weight: 700; color: #1E293B;">${kilaiCount}</div>
                <div style="font-size: 10px; font-weight: 600; color: #64748B;">${locale === 'ta' ? 'கிளைகள்' : 'Kilais'}</div>
              </div>
              <div>
                <div style="font-size: 14px; font-weight: 700; color: #1E293B;">${boothCount}</div>
                <div style="font-size: 10px; font-weight: 600; color: #64748B;">${locale === 'ta' ? 'சாவடிகள்' : 'Booths'}</div>
              </div>
              <div>
                <div style="font-size: 14px; font-weight: 700; color: #1E293B;">${cadreCount}</div>
                <div style="font-size: 10px; font-weight: 600; color: #64748B;">${locale === 'ta' ? 'நிர்வாகிகள்' : 'Cadres'}</div>
              </div>
            </div>
            <div style="margin-top: 8px; font-size: 10px; color: #64748B; font-family: monospace; text-align: center;">
              ${pos[0].toFixed(5)}, ${pos[1].toFixed(5)}
            </div>
          </div>
        `;
        labelMarker.bindPopup(popupHtml);
        centerLabelMarkerRef.current = labelMarker;
      };

      updateCenterMarker(activeCenter);

      // Map Click Handler (for "Pick on Map" mode)
      map.on('click', (e: any) => {
        if (isPickingLocation) {
          const lat = Number(e.latlng.lat.toFixed(6));
          const lng = Number(e.latlng.lng.toFixed(6));
          setInputLat(String(lat));
          setInputLng(String(lng));
          setIsPickingLocation(false);
          setIsCoordsModalOpen(true);
        }
      });

      // Layer groups
      const kilaiGroup = L.layerGroup();
      kilaiGroup.addTo(map);
      kilaiLayerGroupRef.current = kilaiGroup;

      const editGroup = L.layerGroup();
      editGroup.addTo(map);
      editMarkersLayerRef.current = editGroup;

      mapInstanceRef.current = map;
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }
    };
  }, [enName, taName, kilaiCount, boothCount, cadreCount, locale]);

  // Update polygon geometry when activeBoundary changes
  useEffect(() => {
    if (!polygonRef.current || !activeBoundary || activeBoundary.length < 3) return;
    polygonRef.current.setLatLngs(activeBoundary);
  }, [activeBoundary]);

  // Update center marker when activeCenter changes
  useEffect(() => {
    if (!mapInstanceRef.current || !activeCenter) return;
    if (centerLabelMarkerRef.current) {
      centerLabelMarkerRef.current.setLatLng(activeCenter);
    }
  }, [activeCenter]);

  // Render Kilais with verified ground coordinates & interactive positioning
  useEffect(() => {
    if (!mapInstanceRef.current || !kilaiLayerGroupRef.current) return;

    async function updateKilaiPins() {
      const L = (await import('leaflet')).default;
      const group = kilaiLayerGroupRef.current;
      group.clearLayers();

      if (!showKilaiPins || !kilais || kilais.length === 0) return;

      kilais.forEach((k: any, idx: number) => {
        let lat = k.latitude ? Number(k.latitude) : undefined;
        let lng = k.longitude ? Number(k.longitude) : undefined;

        // Check local storage custom position
        if (typeof window !== 'undefined') {
          const savedLoc = localStorage.getItem(`tvk_kilai_loc_${k.id || k.name}`);
          if (savedLoc) {
            try {
              const parsed = JSON.parse(savedLoc);
              lat = parsed[0];
              lng = parsed[1];
            } catch {}
          }
        }

        // If not in DB or local storage, resolve verified coordinates by hamlet name
        if (!lat || !lng) {
          const normName = (k.name || '').toLowerCase().trim();
          const known = KNOWN_KILAI_COORDINATES[normName];
          if (known) {
            lat = known[0];
            lng = known[1];
          }
        }

        // Fallback: place close to village settlement center
        if (!lat || !lng) {
          const angle = (idx * 2 * Math.PI) / kilais.length;
          const dist = 0.0035 + (idx % 2) * 0.002;
          lat = activeCenter[0] + Math.sin(angle) * dist;
          lng = activeCenter[1] + Math.cos(angle) * dist * 1.1;
        }

        const kilaiIconHtml = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; cursor: ${isEditingBoundary ? 'move' : 'pointer'};">
            <div style="width: 26px; height: 26px; border-radius: 50%; background: #8F0A1B; border: 2.5px solid #FFD200; box-shadow: 0 3px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: bold;">
              ${idx + 1}
            </div>
          </div>
        `;

        const kilaiIcon = L.divIcon({
          className: 'kilai-map-pin',
          html: kilaiIconHtml,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const kilaiMarker = L.marker([lat, lng], {
          icon: kilaiIcon,
          draggable: isEditingBoundary,
        });

        // In edit mode, allow dragging Kilai pins to their exact real locations
        if (isEditingBoundary) {
          kilaiMarker.on('dragend', async (e: any) => {
            const newPos = e.target.getLatLng();
            const latNum = Number(newPos.lat.toFixed(6));
            const lngNum = Number(newPos.lng.toFixed(6));
            if (typeof window !== 'undefined') {
              localStorage.setItem(
                `tvk_kilai_loc_${k.id || k.name}`,
                JSON.stringify([latNum, lngNum])
              );
            }
            const displayName = locale === 'ta' && k.tamilName ? k.tamilName : k.name;
            setToastMessage(`📍 ${displayName}: [${latNum}, ${lngNum}] saved!`);
            setTimeout(() => setToastMessage(null), 3000);

            // Persist to PostgreSQL backend if k.id is valid
            if (k.id && k.id.length > 5) {
              try {
                await kilaiApi.update(k.id, {
                  latitude: latNum,
                  longitude: lngNum,
                });
              } catch (err) {
                console.warn('Could not sync kilai coordinate to backend:', err);
              }
            }
          });
        }

        const displayName = locale === 'ta' && k.tamilName ? k.tamilName : k.name;
        const subName = locale === 'ta' ? k.name : (k.tamilName || '');

        kilaiMarker.bindTooltip(
          `<strong>${displayName}</strong>${subName && subName !== displayName ? ` (${subName})` : ''}${k.secretaryName ? `<br/>Secretary: ${k.secretaryName}` : ''}${isEditingBoundary ? '<br/><span style="color:#EA4335;font-size:10px;">(Drag to reposition)</span>' : ''}`,
          { direction: 'top', offset: [0, -14] }
        );

        group.addLayer(kilaiMarker);
      });
    }

    updateKilaiPins();
  }, [showKilaiPins, kilais, activeCenter, locale, isEditingBoundary]);

  // Interactive Boundary Vertex Handles (Visual Edit Mode)
  useEffect(() => {
    if (!mapInstanceRef.current || !editMarkersLayerRef.current) return;

    async function updateEditHandles() {
      const L = (await import('leaflet')).default;
      const group = editMarkersLayerRef.current;
      group.clearLayers();

      if (!isEditingBoundary || !activeBoundary || activeBoundary.length === 0) return;

      activeBoundary.forEach((coord, idx) => {
        const handleIconHtml = `
          <div style="width: 14px; height: 14px; background: #FFFFFF; border: 2.5px solid #EA4335; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.4); cursor: move;"></div>
        `;

        const handleIcon = L.divIcon({
          className: 'boundary-vertex-handle',
          html: handleIconHtml,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const handleMarker = L.marker(coord, {
          icon: handleIcon,
          draggable: true,
        });

        handleMarker.on('drag', (e: any) => {
          const newPos = e.target.getLatLng();
          setActiveBoundary((prev) => {
            const next = [...prev];
            next[idx] = [Number(newPos.lat.toFixed(5)), Number(newPos.lng.toFixed(5))];
            return next;
          });
        });

        group.addLayer(handleMarker);
      });
    }

    updateEditHandles();
  }, [isEditingBoundary, activeBoundary]);

  // Switch Tile Layer
  const switchMapType = async (nextType: 'osm' | 'satellite' | 'hot') => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const L = (await import('leaflet')).default;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    let newLayer: any;
    if (nextType === 'satellite') {
      newLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
          maxZoom: 19,
        }
      );
    } else if (nextType === 'hot') {
      newLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        {
          attribution: '&copy; OpenStreetMap contributors, Humanitarian OpenStreetMap Team',
          maxZoom: 19,
          subdomains: 'abc',
        }
      );
    } else {
      newLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      });
    }

    newLayer.addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
    setMapType(nextType);
  };

  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    if (polygonRef.current) {
      mapInstanceRef.current.fitBounds(polygonRef.current.getBounds(), { padding: [28, 28], maxZoom: 15.25 });
    } else {
      mapInstanceRef.current.setView(activeCenter, 14.75);
    }
  };

  // Save visually dragged boundary
  const handleSaveBoundary = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        `tvk_panchayat_geo_${areaKey}`,
        JSON.stringify({ center: activeCenter, boundaryCoords: activeBoundary })
      );
    }
    setIsEditingBoundary(false);
    setToastMessage(locale === 'ta' ? '✅ எல்லை சேமிக்கப்பட்டது!' : '✅ Boundary saved successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Reset to original surveyed coordinates
  const handleResetToDefault = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`tvk_panchayat_geo_${areaKey}`);
    }
    setActiveCenter(center);
    setInputLat(String(center[0]));
    setInputLng(String(center[1]));
    setActiveBoundary(boundaryCoords || []);
    setCoordsText(boundaryCoords ? formatCoordsToText(boundaryCoords) : '');
    setIsEditingBoundary(false);
    setIsCoordsModalOpen(false);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, 14.75);
    }
  };

  // Copy coordinates as JSON
  const handleCopyCoordinates = () => {
    const formatted = JSON.stringify(activeBoundary, null, 2);
    navigator.clipboard.writeText(formatted);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  // Generate boundary from explicit Lat/Long
  const handleGenerateFromLatLong = () => {
    const lat = parseFloat(inputLat);
    const lng = parseFloat(inputLng);
    if (isNaN(lat) || isNaN(lng)) return;

    const newCenter: [number, number] = [lat, lng];
    const generated = generateDynamicAreaBoundary(newCenter, enName, [], inputRadiusKm);

    setActiveCenter(newCenter);
    setActiveBoundary(generated);
    setCoordsText(formatCoordsToText(generated));

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(newCenter, 14.75);
    }
  };

  // Apply & Save custom coordinates from dialog
  const handleApplyCustomGeo = () => {
    const lat = parseFloat(inputLat);
    const lng = parseFloat(inputLng);
    if (isNaN(lat) || isNaN(lng)) return;

    const newCenter: [number, number] = [lat, lng];
    let newCoords = parseTextToCoords(coordsText);

    if (newCoords.length < 3) {
      newCoords = generateDynamicAreaBoundary(newCenter, enName, [], inputRadiusKm);
    }

    setActiveCenter(newCenter);
    setActiveBoundary(newCoords);

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        `tvk_panchayat_geo_${areaKey}`,
        JSON.stringify({ center: newCenter, boundaryCoords: newCoords })
      );
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(newCenter, 14.75);
      if (polygonRef.current) {
        polygonRef.current.setLatLngs(newCoords);
        mapInstanceRef.current.fitBounds(polygonRef.current.getBounds(), { padding: [28, 28], maxZoom: 15.25 });
      }
    }

    setIsCoordsModalOpen(false);
    setToastMessage(locale === 'ta' ? '✅ எல்லை & மையம் புதுப்பிக்கப்பட்டது!' : '✅ Custom Lat/Long & boundary applied!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white dark:bg-zinc-900 group">
      {/* Map Canvas */}
      <div
        ref={mapContainerRef}
        style={{ height, width: '100%', minHeight: '420px' }}
        className="z-0"
      />

      {/* Picking Location Banner */}
      {isPickingLocation && (
        <div className="absolute top-3 left-3 z-[400] bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2 animate-bounce">
          <Crosshair className="w-3.5 h-3.5" />
          <span>
            {locale === 'ta'
              ? 'வரைபடத்தில் கிளிக் செய்து அட்சரேகை/தீர்க்கரேகையை அமைக்கவும்'
              : 'Click anywhere on the map to set Lat/Long coordinates'}
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setIsPickingLocation(false)}
            className="text-white hover:bg-white/20 h-6 px-1.5 text-xs ml-2"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Editing Mode Banner */}
      {isEditingBoundary && !isPickingLocation && (
        <div className="absolute top-3 left-3 z-[400] bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2">
          <Edit3 className="w-3.5 h-3.5 animate-pulse" />
          <span>
            {locale === 'ta'
              ? 'எல்லை திருத்தும் பயன்முறை: புள்ளிகள் & கிளைகளை இழுத்து மாற்றவும்'
              : 'Edit Mode: Drag boundary vertices & Kilai pins to adjust positions'}
          </span>
        </div>
      )}

      {/* Toast Notification Alert */}
      {(toastMessage || copiedNotification) && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[500] bg-zinc-900/90 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xl border border-zinc-700/60 flex items-center gap-2 backdrop-blur-md transition-all">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage || (locale === 'ta' ? 'அச்சுரேகை தரவு நகலெடுக்கப்பட்டது!' : 'Coordinates copied to clipboard!')}</span>
        </div>
      )}

      {/* Floating Controls Toolbar */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-2 flex-wrap justify-end">
        {/* Toggle Kilai Pins */}
        {!isEditingBoundary && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setShowKilaiPins(!showKilaiPins)}
            className={`font-semibold shadow-md text-xs border h-8 px-3 transition-colors ${
              showKilaiPins
                ? 'bg-primary text-white border-primary hover:bg-primary/90'
                : 'bg-white/95 backdrop-blur-md hover:bg-white text-gray-800 border-gray-200/80'
            }`}
          >
            {showKilaiPins ? (
              <>
                <EyeOff className="w-3.5 h-3.5 mr-1.5" />
                {locale === 'ta' ? 'கிளைகளை மறை' : 'Hide Kilais'}
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 mr-1.5 text-primary" />
                {locale === 'ta' ? 'கிளைகளைக் காட்டு' : 'Show Kilais'}
              </>
            )}
          </Button>
        )}

        {/* Set Lat/Long & Boundary Configuration Dialog Button */}
        {!isEditingBoundary && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              setInputLat(String(activeCenter[0]));
              setInputLng(String(activeCenter[1]));
              setCoordsText(formatCoordsToText(activeBoundary));
              setIsCoordsModalOpen(true);
            }}
            className="bg-white/95 backdrop-blur-md hover:bg-white text-gray-800 font-semibold shadow-md text-xs border border-gray-200/80 h-8 px-3"
            title="Set exact Latitude & Longitude or paste boundary coordinates"
          >
            <Sliders className="w-3.5 h-3.5 mr-1.5 text-primary" />
            {locale === 'ta' ? 'அமைவிடம் (Lat/Long)' : 'Set Lat/Long'}
          </Button>
        )}

        {/* Edit Boundary Mode Toggle / Actions */}
        {!isEditingBoundary ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setIsEditingBoundary(true)}
            className="bg-white/95 backdrop-blur-md hover:bg-white text-gray-800 font-semibold shadow-md text-xs border border-gray-200/80 h-8 px-3"
            title="Drag boundary vertices and kilai pins interactively"
          >
            <Edit3 className="w-3.5 h-3.5 mr-1.5 text-primary" />
            {locale === 'ta' ? 'எல்லையை திருத்து' : 'Edit Boundary'}
          </Button>
        ) : (
          <div className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-gray-200/80 shadow-md p-1 rounded-lg">
            <Button
              type="button"
              size="sm"
              onClick={handleSaveBoundary}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-7 px-2.5 shadow-xs"
            >
              <Check className="w-3 h-3 mr-1" />
              {locale === 'ta' ? 'சேமி' : 'Save'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCopyCoordinates}
              className="text-gray-700 hover:text-gray-900 font-semibold text-xs h-7 px-2 border-gray-200"
              title="Copy Coordinates as JSON"
            >
              <Copy className="w-3 h-3 mr-1 text-primary" />
              {copiedNotification ? (locale === 'ta' ? 'நகலெடுக்கப்பட்டது!' : 'Copied!') : (locale === 'ta' ? 'நகல்' : 'Copy')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleResetToDefault}
              className="text-amber-700 hover:text-amber-800 font-semibold text-xs h-7 px-2 border-amber-200"
              title="Reset to original surveyed boundary"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              {locale === 'ta' ? 'மீட்டமை' : 'Reset'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setIsEditingBoundary(false)}
              className="text-gray-600 hover:text-gray-900 font-semibold text-xs h-7 px-2"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Tile Layer Selector (OpenStreetMap vs Satellite vs Detailed HOT) */}
        {!isEditingBoundary && (
          <div className="inline-flex items-center rounded-lg bg-white/95 backdrop-blur-md border border-gray-200/80 shadow-md p-0.5">
            <button
              type="button"
              onClick={() => switchMapType('osm')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                mapType === 'osm'
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              {locale === 'ta' ? 'வரைபடம்' : 'OpenStreetMap'}
            </button>
            <button
              type="button"
              onClick={() => switchMapType('satellite')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                mapType === 'satellite'
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              {locale === 'ta' ? 'செயற்கைக்கோள்' : 'Satellite'}
            </button>
            <button
              type="button"
              onClick={() => switchMapType('hot')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                mapType === 'hot'
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              {locale === 'ta' ? 'விரிவான சாலை' : 'Detailed'}
            </button>
          </div>
        )}

        {/* Fit Area Button */}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleResetView}
          className="bg-white/95 backdrop-blur-md hover:bg-white text-gray-800 font-semibold shadow-md text-xs border border-gray-200/80 h-8 px-3"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-primary" />
          {locale === 'ta' ? 'பொருத்து' : 'Fit Area'}
        </Button>
      </div>

      {/* Set Lat/Long & Boundary Configuration Modal */}
      {isCoordsModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                    {locale === 'ta' ? 'புவிசார் அமைவிடம் & எல்லை அமைப்பு' : 'Set Lat/Long & Boundary'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {enName} {taName ? `• ${taName}` : ''}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsCoordsModalOpen(false)}
                className="text-gray-500 hover:text-gray-900"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Centroid Lat & Long Inputs */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-900 dark:text-zinc-200">
                {locale === 'ta' ? 'மைய அட்சரேகை & தீர்க்கரேகை (Center Lat/Long)' : 'Centroid Coordinates'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-semibold text-gray-500 block mb-1">
                    {locale === 'ta' ? 'அட்சரேகை (Latitude)' : 'Latitude'}
                  </span>
                  <input
                    type="text"
                    value={inputLat}
                    onChange={(e) => setInputLat(e.target.value)}
                    placeholder="e.g. 11.699549"
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-gray-500 block mb-1">
                    {locale === 'ta' ? 'தீர்க்கரேகை (Longitude)' : 'Longitude'}
                  </span>
                  <input
                    type="text"
                    value={inputLng}
                    onChange={(e) => setInputLng(e.target.value)}
                    placeholder="e.g. 79.762369"
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Radius & Pick Point Helpers */}
              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {locale === 'ta' ? 'சுற்றளவு ஆரம்:' : 'Radius:'}
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.4"
                    max="5.0"
                    value={inputRadiusKm}
                    onChange={(e) => setInputRadiusKm(parseFloat(e.target.value) || 1.2)}
                    className="w-16 px-2 py-1 text-xs border rounded-md font-mono"
                  />
                  <span className="text-xs text-muted-foreground">km</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsCoordsModalOpen(false);
                      setIsPickingLocation(true);
                    }}
                    className="text-xs h-7 border-dashed border-primary text-primary hover:bg-primary/5"
                  >
                    <Crosshair className="w-3 h-3 mr-1" />
                    {locale === 'ta' ? 'வரைபடத்தில் தேர்ந்தெடு' : 'Pick on Map'}
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={handleGenerateFromLatLong}
                    className="text-xs h-7 bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    {locale === 'ta' ? 'எல்லையை உருவாக்கு' : 'Generate Boundary'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Boundary Polygon Coords Text Area */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-900 dark:text-zinc-200">
                  {locale === 'ta' ? 'வருவாய் எல்லைப் புள்ளிகள் (Polygon Lat, Long)' : 'Boundary Perimeter Points'}
                </label>
                <span className="text-[11px] text-muted-foreground">
                  {parseTextToCoords(coordsText).length} {locale === 'ta' ? 'புள்ளிகள்' : 'points'}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {locale === 'ta'
                  ? 'வரிசைக்கு ஒரு புள்ளியாக அட்சரேகை மற்றும் தீர்க்கரேகையை உள்ளிடவும் (e.g. 11.6995, 79.7623)'
                  : 'Enter or paste latitude and longitude pairs per line (e.g. 11.6995, 79.7623)'}
              </p>
              <textarea
                rows={6}
                value={coordsText}
                onChange={(e) => setCoordsText(e.target.value)}
                placeholder="11.6995, 79.7623&#10;11.7020, 79.7650&#10;..."
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetToDefault}
                className="text-xs text-amber-700 hover:text-amber-800 border-amber-200"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                {locale === 'ta' ? 'இயல்புநிலைக்கு மீட்டமை' : 'Reset to Default'}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCoordsModalOpen(false)}
                  className="text-xs"
                >
                  {locale === 'ta' ? 'ரத்து' : 'Cancel'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApplyCustomGeo}
                  className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-md"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  {locale === 'ta' ? 'பயன்படுத்து & சேமி' : 'Apply & Save'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar Info Strip */}
      <div className="absolute bottom-3 left-3 right-3 z-[400] pointer-events-none">
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-gray-200/80 dark:border-zinc-800 shadow-lg rounded-xl p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                {enName} {taName && taName !== enName ? `• ${taName}` : ''}
              </p>
              <p className="text-[11px] font-medium text-muted-foreground mt-0.5 font-mono">
                {locale === 'ta'
                  ? 'வருவாய் எல்லை & புவிசார் மையம்'
                  : 'Revenue Boundary & Centroid'}
                : [{activeCenter[0].toFixed(5)}, {activeCenter[1].toFixed(5)}]
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 dark:text-zinc-300">
            <span className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-md border border-green-200 dark:border-green-800/50">
              <Store className="w-3 h-3" /> {kilaiCount} {locale === 'ta' ? 'கிளைகள்' : 'Kilais'}
            </span>
            <span className="inline-flex items-center gap-1 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 px-2.5 py-1 rounded-md border border-orange-200 dark:border-orange-800/50">
              <Building2 className="w-3 h-3" /> {boothCount} {locale === 'ta' ? 'சாவடிகள்' : 'Booths'}
            </span>
            <span className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 px-2.5 py-1 rounded-md border border-purple-200 dark:border-purple-800/50">
              <Users className="w-3 h-3" /> {cadreCount} {locale === 'ta' ? 'நிர்வாகிகள்' : 'Cadres'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
