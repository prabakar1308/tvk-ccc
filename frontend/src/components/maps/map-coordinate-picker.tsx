'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Check,
  X,
  Crosshair,
  Layers,
  Search,
  ZoomIn,
  ZoomOut,
  Navigation,
  Globe,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export interface MapCoordinatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (lat: number, lng: number) => void;
  initialLat?: number | null;
  initialLng?: number | null;
  title?: string;
  subtitle?: string;
  locale?: string;
  entityType?: 'panchayat' | 'village';
}

const DEFAULT_CENTER: [number, number] = [11.564, 79.682]; // Kurinjipadi / Cuddalore baseline

export default function MapCoordinatePicker({
  isOpen,
  onClose,
  onConfirm,
  initialLat,
  initialLng,
  title = 'Select Location on Map',
  subtitle,
  locale = 'en',
  entityType = 'village',
}: MapCoordinatePickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  const hasInitial =
    typeof initialLat === 'number' &&
    !isNaN(initialLat) &&
    typeof initialLng === 'number' &&
    !isNaN(initialLng) &&
    initialLat !== 0 &&
    initialLng !== 0;

  const [selectedLat, setSelectedLat] = useState<number>(hasInitial ? (initialLat as number) : DEFAULT_CENTER[0]);
  const [selectedLng, setSelectedLng] = useState<number>(hasInitial ? (initialLng as number) : DEFAULT_CENTER[1]);
  const [inputLat, setInputLat] = useState<string>(hasInitial ? String(initialLat) : String(DEFAULT_CENTER[0]));
  const [inputLng, setInputLng] = useState<string>(hasInitial ? String(initialLng) : String(DEFAULT_CENTER[1]));
  const [mapType, setMapType] = useState<'osm' | 'satellite'>('osm');
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Sync internal state when opened or initial values change
  useEffect(() => {
    if (isOpen) {
      const lat = hasInitial ? (initialLat as number) : DEFAULT_CENTER[0];
      const lng = hasInitial ? (initialLng as number) : DEFAULT_CENTER[1];
      setSelectedLat(lat);
      setSelectedLng(lng);
      setInputLat(lat.toFixed(6));
      setInputLng(lng.toFixed(6));
    }
  }, [isOpen, initialLat, initialLng, hasInitial]);

  // Initialize or re-center map when modal opens
  useEffect(() => {
    if (!isOpen) {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (_) {}
        mapInstanceRef.current = null;
      }
      return;
    }

    let isMounted = true;
    let timerId: NodeJS.Timeout;

    async function initMap() {
      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      // Ensure container is clear
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (_) {}
        mapInstanceRef.current = null;
      }

      const centerPoint: [number, number] = [selectedLat, selectedLng];

      const map = L.map(mapContainerRef.current, {
        center: centerPoint,
        zoom: hasInitial ? 15 : 13.5,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Layer 1: OpenStreetMap
      const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      });

      // Layer 2: Esri Satellite
      const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri World Imagery',
          maxZoom: 18,
        }
      );

      const activeLayer = mapType === 'satellite' ? satelliteLayer : osmLayer;
      activeLayer.addTo(map);
      tileLayerRef.current = { osmLayer, satelliteLayer, current: activeLayer };

      // Custom TVK Marker Pin
      const pinIcon = L.divIcon({
        className: 'tvk-picker-pin',
        html: `
          <div style="position: relative; width: 38px; height: 46px;">
            <div style="
              width: 38px;
              height: 38px;
              background: linear-gradient(135deg, #8F0A1B 0%, #B81930 100%);
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid #ffffff;
              box-shadow: 0 4px 14px rgba(0,0,0,0.4);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                transform: rotate(45deg);
                width: 14px;
                height: 14px;
                background: #FFC72C;
                border-radius: 50%;
                border: 2px solid #8F0A1B;
              "></div>
            </div>
            <div style="
              position: absolute;
              bottom: 2px;
              left: 19px;
              width: 8px;
              height: 3px;
              background: rgba(0,0,0,0.3);
              border-radius: 50%;
              transform: translateX(-50%);
              filter: blur(1px);
            "></div>
          </div>
        `,
        iconSize: [38, 46],
        iconAnchor: [19, 44],
        popupAnchor: [0, -42],
      });

      const marker = L.marker(centerPoint, {
        draggable: true,
        icon: pinIcon,
        autoPan: true,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; text-align: center; padding: 4px 6px;">
          <strong style="color: #8F0A1B; display: block; margin-bottom: 2px;">
            ${entityType === 'panchayat' ? (locale === 'ta' ? 'ஊராட்சி மையம்' : 'Panchayat Center') : (locale === 'ta' ? 'கிராம அமைவிடம்' : 'Village Location')}
          </strong>
          <span style="font-family: monospace; font-size: 11px; color: #555;">
            ${centerPoint[0].toFixed(5)}, ${centerPoint[1].toFixed(5)}
          </span>
        </div>
      `);

      // Update on marker drag
      marker.on('dragend', (e: any) => {
        const latLng = e.target.getLatLng();
        const lat = Number(latLng.lat.toFixed(6));
        const lng = Number(latLng.lng.toFixed(6));
        setSelectedLat(lat);
        setSelectedLng(lng);
        setInputLat(String(lat));
        setInputLng(String(lng));
        marker.setPopupContent(`
          <div style="font-family: inherit; font-size: 12px; text-align: center; padding: 4px 6px;">
            <strong style="color: #8F0A1B; display: block; margin-bottom: 2px;">
              ${entityType === 'panchayat' ? (locale === 'ta' ? 'ஊராட்சி மையம்' : 'Panchayat Center') : (locale === 'ta' ? 'கிராம அமைவிடம்' : 'Village Location')}
            </strong>
            <span style="font-family: monospace; font-size: 11px; color: #555;">
              ${lat.toFixed(5)}, ${lng.toFixed(5)}
            </span>
          </div>
        `);
      });

      // Update on map click
      map.on('click', (e: any) => {
        const lat = Number(e.latlng.lat.toFixed(6));
        const lng = Number(e.latlng.lng.toFixed(6));
        setSelectedLat(lat);
        setSelectedLng(lng);
        setInputLat(String(lat));
        setInputLng(String(lng));
        marker.setLatLng(e.latlng);
        marker.setPopupContent(`
          <div style="font-family: inherit; font-size: 12px; text-align: center; padding: 4px 6px;">
            <strong style="color: #8F0A1B; display: block; margin-bottom: 2px;">
              ${entityType === 'panchayat' ? (locale === 'ta' ? 'ஊராட்சி மையம்' : 'Panchayat Center') : (locale === 'ta' ? 'கிராம அமைவிடம்' : 'Village Location')}
            </strong>
            <span style="font-family: monospace; font-size: 11px; color: #555;">
              ${lat.toFixed(5)}, ${lng.toFixed(5)}
            </span>
          </div>
        `);
      });

      markerRef.current = marker;
      mapInstanceRef.current = map;

      // Invalidate size after modal animation finishes
      timerId = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    }

    initMap();

    return () => {
      isMounted = false;
      clearTimeout(timerId);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (_) {}
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Handle tile layer change
  const toggleMapLayer = () => {
    if (!tileLayerRef.current || !mapInstanceRef.current) return;
    const { osmLayer, satelliteLayer } = tileLayerRef.current;
    const map = mapInstanceRef.current;

    if (mapType === 'osm') {
      map.removeLayer(osmLayer);
      map.addLayer(satelliteLayer);
      setMapType('satellite');
      tileLayerRef.current.current = satelliteLayer;
    } else {
      map.removeLayer(satelliteLayer);
      map.addLayer(osmLayer);
      setMapType('osm');
      tileLayerRef.current.current = osmLayer;
    }
  };

  // Jump marker when manual input changes
  const handleApplyInputs = () => {
    const lat = parseFloat(inputLat);
    const lng = parseFloat(inputLng);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setSelectedLat(lat);
      setSelectedLng(lng);
      if (mapInstanceRef.current && markerRef.current) {
        const point: [number, number] = [lat, lng];
        markerRef.current.setLatLng(point);
        mapInstanceRef.current.setView(point, 15);
      }
    }
  };

  // Use browser geolocation
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(locale === 'ta' ? 'உங்கள் உலாவியில் ஜிபிஎஸ் ஆதரவு இல்லை' : 'Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setSelectedLat(lat);
        setSelectedLng(lng);
        setInputLat(String(lat));
        setInputLng(String(lng));
        if (mapInstanceRef.current && markerRef.current) {
          const point: [number, number] = [lat, lng];
          markerRef.current.setLatLng(point);
          mapInstanceRef.current.setView(point, 16);
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        alert(locale === 'ta' ? 'ஜிபிஎஸ் இருப்பிடத்தைப் பெற முடியவில்லை' : 'Unable to retrieve your current location');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Quick Nominatim Geocoding Search
  const handleSearchPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const q = encodeURIComponent(`${searchQuery.trim()}, Tamil Nadu, India`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
        headers: { 'Accept-Language': locale === 'ta' ? 'ta,en' : 'en' },
      });
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = Number(parseFloat(data[0].lat).toFixed(6));
        const lng = Number(parseFloat(data[0].lon).toFixed(6));
        setSelectedLat(lat);
        setSelectedLng(lng);
        setInputLat(String(lat));
        setInputLng(String(lng));
        if (mapInstanceRef.current && markerRef.current) {
          const point: [number, number] = [lat, lng];
          markerRef.current.setLatLng(point);
          mapInstanceRef.current.setView(point, 15);
        }
      } else {
        alert(locale === 'ta' ? 'இடம் கிடைக்கவில்லை. வரைபடத்தில் கைமுறையாக தேர்வு செய்யவும்.' : 'Location not found. Please click directly on the map.');
      }
    } catch (err) {
      console.warn('Search geocoding error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedLat, selectedLng);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[760px] max-w-[96vw] max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-2xl border-gray-200 dark:border-zinc-800">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-gray-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8F0A1B] to-[#B81930] text-white flex items-center justify-center shadow-xs">
                <MapPin className="w-5 h-5 text-[#FFC72C]" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {subtitle ||
                    (locale === 'ta'
                      ? 'வரைபடத்தில் கிளிக் செய்து அல்லது பின்னை இழுத்து சரியான அட்சரேகை/தீர்க்கரேகையைத் தேர்வு செய்யவும்.'
                      : 'Click anywhere on the map or drag the pin to set precise coordinates.')}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Place Search & Map Layer Toggle Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5">
            <form onSubmit={handleSearchPlace} className="flex items-center gap-1.5 flex-1 min-w-[200px]">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={locale === 'ta' ? 'ஊர் / இடத்தை தேடுக...' : 'Search place, village or town...'}
                  className="h-8.5 pl-8 text-xs rounded-lg"
                />
              </div>
              <Button type="submit" size="sm" variant="secondary" disabled={isSearching} className="h-8.5 px-3 text-xs font-semibold cursor-pointer">
                {isSearching ? (locale === 'ta' ? 'தேடுகிறது...' : 'Searching...') : (locale === 'ta' ? 'தேடு' : 'Search')}
              </Button>
            </form>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
                className="h-8.5 text-xs font-medium px-2.5 rounded-lg cursor-pointer text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              >
                <Crosshair className={`w-3.5 h-3.5 mr-1.5 ${isLocating ? 'animate-spin' : ''}`} />
                {locale === 'ta' ? 'என் இருப்பிடம்' : 'My GPS'}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleMapLayer}
                className="h-8.5 text-xs font-medium px-2.5 rounded-lg cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                {mapType === 'osm' ? (locale === 'ta' ? 'செயற்கைக்கோள்' : 'Satellite') : (locale === 'ta' ? 'சாலை வரைபடம்' : 'Road Map')}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Map Canvas */}
        <div className="relative flex-1 min-h-[350px] sm:min-h-[420px] w-full bg-zinc-100 dark:bg-zinc-900">
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-10" />

          {/* Quick Helper Overlay */}
          <div className="absolute bottom-3 left-3 z-[400] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-200/80 dark:border-zinc-800 text-[11px] shadow-sm font-medium text-gray-700 dark:text-zinc-300 pointer-events-none flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#B81930] shrink-0" />
            <span>
              {locale === 'ta'
                ? 'குறிப்பு: வரைபடத்தில் எங்கு கிளிக் செய்தாலும் பின் நகரும்'
                : 'Tip: Click anywhere or drag pin to position'}
            </span>
          </div>
        </div>

        {/* Footer with Lat/Lng Fine-tuning Inputs & Confirm */}
        <DialogFooter className="px-5 py-3.5 bg-gray-50/80 dark:bg-zinc-900/80 border-t border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Coordinates Fine-tuning */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-muted-foreground uppercase">Lat:</span>
              <Input
                type="number"
                step="any"
                value={inputLat}
                onChange={(e) => setInputLat(e.target.value)}
                onBlur={handleApplyInputs}
                className="h-8 w-28 text-xs font-mono font-semibold rounded-lg bg-white dark:bg-zinc-800"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-muted-foreground uppercase">Lng:</span>
              <Input
                type="number"
                step="any"
                value={inputLng}
                onChange={(e) => setInputLng(e.target.value)}
                onBlur={handleApplyInputs}
                className="h-8 w-28 text-xs font-mono font-semibold rounded-lg bg-white dark:bg-zinc-800"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-9 px-3.5 text-xs font-bold rounded-xl cursor-pointer"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              {locale === 'ta' ? 'ரத்து' : 'Cancel'}
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              className="h-9 px-4 text-xs font-bold rounded-xl bg-gradient-to-r from-[#8F0A1B] to-[#B81930] hover:opacity-95 text-white shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 mr-1.5 text-[#FFC72C]" />
              {locale === 'ta' ? 'அமைவிடத்தை உறுதிப்படுத்து' : 'Use this Location'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

