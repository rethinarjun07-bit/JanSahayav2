"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers,
  Crosshair,
  Maximize2,
  Minimize2,
  Ruler,
  Navigation,
  Eye,
  EyeOff,
  Flame,
  X,
  ExternalLink,
  ChevronDown,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  MousePointer,
} from "lucide-react";
import { sound } from "@/lib/sound";

export interface MapChallengeItem {
  id: string;
  title: string;
  category: string;
  severity: string;
  urgencyScore?: number;
  latitude: number;
  longitude: number;
  district: string;
  state?: string;
  status: string;
  address?: string;
  mediaUrls?: string | string[];
  upvotesCount?: number;
  citizenCountAffected?: number;
  mergedCount?: number;
}

export interface LeafletMapProps {
  challenges: MapChallengeItem[];
  selectedLocation?: { lat: number; lng: number } | null;
  onLocationSelect?: (coords: { lat: number; lng: number; district?: string }) => void;
  interactiveSelect?: boolean;
  center?: [number, number];
  zoom?: number;
  height?: string;
  showAdvancedTools?: boolean;
}

export function isValidCoordinate(lat: unknown, lng: unknown): boolean {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return false;
  const nLat = Number(lat);
  const nLng = Number(lng);
  return (
    Number.isFinite(nLat) &&
    Number.isFinite(nLng) &&
    !Number.isNaN(nLat) &&
    !Number.isNaN(nLng) &&
    nLat >= -90 &&
    nLat <= 90 &&
    nLng >= -180 &&
    nLng <= 180
  );
}

// Category visual palettes & icons
export const CATEGORY_META: Record<string, { color: string; bg: string; icon: string }> = {
  "Disaster Management": { color: "#ea580c", bg: "#ffedd5", icon: "🚨" },
  "Flood & Inundation": { color: "#0284c7", bg: "#e0f2fe", icon: "🌊" },
  "Mining & Geology": { color: "#ea580c", bg: "#ffedd5", icon: "⛏️" },
  "Mining Subsidence & Underground Fires": { color: "#ea580c", bg: "#ffedd5", icon: "🔥" },
  "Water & Sanitation": { color: "#0284c7", bg: "#e0f2fe", icon: "💧" },
  "Drought & Groundwater Depletion": { color: "#d97706", bg: "#fef3c7", icon: "☀️" },
  "Environment & Forestry": { color: "#059669", bg: "#d1fae5", icon: "🌲" },
  "Agriculture & Rural Development": { color: "#16a34a", bg: "#dcfce7", icon: "🌾" },
  "Infrastructure & Municipal": { color: "#475569", bg: "#f1f5f9", icon: "🏗️" },
  "Health & Hazardous Waste": { color: "#dc2626", bg: "#fee2e2", icon: "☣️" },
};

const JHARKHAND_KEY_HUBS = [
  { name: "Statewide Overview", coords: [23.6102, 85.2799] as [number, number], zoom: 8 },
  { name: "Ranchi (Capital Command)", coords: [23.3441, 85.3096] as [number, number], zoom: 12 },
  { name: "Dhanbad (Coalfields & IIT ISM)", coords: [23.7957, 86.4304] as [number, number], zoom: 12 },
  { name: "East Singhbhum (Jamshedpur/Tata)", coords: [22.8046, 86.2029] as [number, number], zoom: 12 },
  { name: "Bokaro (Steel City & Damodar)", coords: [23.6693, 86.1511] as [number, number], zoom: 12 },
  { name: "Latehar (Forest & Betla Belt)", coords: [23.7423, 84.5021] as [number, number], zoom: 12 },
  { name: "Hazaribagh (Plateau & Mines)", coords: [23.9925, 85.3637] as [number, number], zoom: 12 },
  { name: "Deoghar (Santhal Pargana)", coords: [24.4826, 86.6975] as [number, number], zoom: 12 },
  { name: "Palamu / Garhwa (Dryland Basin)", coords: [24.0384, 84.0706] as [number, number], zoom: 12 },
  { name: "Dumka (Tribal Regional Hub)", coords: [24.2677, 87.2484] as [number, number], zoom: 12 },
];

type BaseLayerType = "streets" | "satellite" | "topo" | "dark";

const TILE_SERVERS: Record<BaseLayerType, { url: string; attribution: string; maxZoom: number }> = {
  streets: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri, Maxar, Earthstar Geographics",
    maxZoom: 19,
  },
  topo: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenTopoMap contributors",
    maxZoom: 17,
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; CARTO &copy; OpenStreetMap",
    maxZoom: 19,
  },
};

export default function LeafletMap({
  challenges = [],
  selectedLocation,
  onLocationSelect,
  interactiveSelect = false,
  center = [23.6102, 85.2799],
  zoom = 8,
  height = "560px",
  showAdvancedTools = true,
}: LeafletMapProps) {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseTileLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bufferZonesLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const measurementLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null);

  // States
  const [activeBaseLayer, setActiveBaseLayer] = useState<BaseLayerType>("streets");
  const [showBufferZones, setShowBufferZones] = useState<boolean>(true);
  const [bufferMode, setBufferMode] = useState<"multi" | "standard" | "max">("multi");
  const [showBufferMenu, setShowBufferMenu] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("All");
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);
  const [showHubMenu, setShowHubMenu] = useState<boolean>(false);
  const [showLegend, setShowLegend] = useState<boolean>(false);
  const [wheelZoomEnabled, setWheelZoomEnabled] = useState<boolean>(false);

  // Measurement tool states
  const [isMeasuring, setIsMeasuring] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [measurePoints, setMeasurePoints] = useState<any[]>([]);
  const [measuredDistance, setMeasuredDistance] = useState<number | null>(null);
  const [locatingUser, setLocatingUser] = useState<boolean>(false);

  // Filter visible challenges by map category filter
  const visibleChallenges = useMemo(() => {
    if (activeCategoryFilter === "All") return challenges;
    return challenges.filter((c) => c.category === activeCategoryFilter);
  }, [challenges, activeCategoryFilter]);

  // Aggregate stats for visible pins
  const mapStats = useMemo(() => {
    const total = visibleChallenges.length;
    const critical = visibleChallenges.filter((c) => c.severity === "CRITICAL").length;
    const citizens = visibleChallenges.reduce((sum, c) => sum + (c.citizenCountAffected || 240), 0);
    return { total, critical, citizens };
  }, [visibleChallenges]);

  const onLocationSelectRef = useRef(onLocationSelect);
  onLocationSelectRef.current = onLocationSelect;
  const interactiveSelectRef = useRef(interactiveSelect);
  interactiveSelectRef.current = interactiveSelect;
  const visibleChallengesRef = useRef(visibleChallenges);
  visibleChallengesRef.current = visibleChallenges;
  const isMeasuringRef = useRef(isMeasuring);
  isMeasuringRef.current = isMeasuring;

  // Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === "undefined") return;

    import("leaflet").then((L) => {
      LRef.current = L;

      if (!mapContainerRef.current) return;

      // Clean container if already initialized
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((mapContainerRef.current as any)._leaflet_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapContainerRef.current as any)._leaflet_id = null;
        mapContainerRef.current.innerHTML = "";
      }

      const initLat = isValidCoordinate(center?.[0], center?.[1]) ? Number(center[0]) : 23.6102;
      const initLng = isValidCoordinate(center?.[0], center?.[1]) ? Number(center[1]) : 85.2799;
      const initZoom = Number.isFinite(Number(zoom)) ? Number(zoom) : 8;

      const map = L.map(mapContainerRef.current, {
        center: [initLat, initLng],
        zoom: initZoom,
        zoomControl: false,
        scrollWheelZoom: false, // Prevents uncontrolled zooming when moving mouse or scrolling page
        doubleClickZoom: true,
        touchZoom: true,
        boxZoom: true,
        dragging: true,
      });

      // Google Maps style: allow Ctrl + Wheel to zoom smoothly without scroll traps
      const mapContainerEl = mapContainerRef.current;
      if (mapContainerEl) {
        mapContainerEl.addEventListener(
          "wheel",
          (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              if (e.deltaY < 0) {
                map.zoomIn(1);
              } else if (e.deltaY > 0) {
                map.zoomOut(1);
              }
            }
          },
          { passive: false }
        );
      }

      // Defensive wrap for flyTo and setView
      const origFlyTo = map.flyTo.bind(map);
      map.flyTo = function (targetCenter: any, targetZoom: any, options: any) {
        try {
          const lat = Array.isArray(targetCenter) ? targetCenter[0] : targetCenter?.lat;
          const lng = Array.isArray(targetCenter) ? targetCenter[1] : targetCenter?.lng;
          if (!isValidCoordinate(lat, lng)) {
            console.warn("Leaflet flyTo skipped invalid coordinates:", targetCenter);
            return map;
          }
          return origFlyTo(targetCenter, targetZoom, options);
        } catch (e) {
          console.warn("Leaflet flyTo suppressed error:", e);
          return map;
        }
      };

      const origSetView = map.setView.bind(map);
      map.setView = function (centerPoint: any, zoomLevel: any, options: any) {
        try {
          const lat = Array.isArray(centerPoint) ? centerPoint[0] : centerPoint?.lat;
          const lng = Array.isArray(centerPoint) ? centerPoint[1] : centerPoint?.lng;
          if (!isValidCoordinate(lat, lng)) {
            console.warn("Leaflet setView skipped invalid coordinates:", centerPoint);
            return map;
          }
          return origSetView(centerPoint, zoomLevel, options);
        } catch (e) {
          console.warn("Leaflet setView suppressed error:", e);
          return map;
        }
      };

      L.control.zoom({ position: "topright" }).addTo(map);

      // Base Layer
      const baseTile = L.tileLayer(TILE_SERVERS[activeBaseLayer].url, {
        attribution: TILE_SERVERS[activeBaseLayer].attribution,
        maxZoom: TILE_SERVERS[activeBaseLayer].maxZoom,
      }).addTo(map);
      baseTileLayerRef.current = baseTile;

      // Layer groups
      const bufferZonesLayer = L.layerGroup().addTo(map);
      bufferZonesLayerRef.current = bufferZonesLayer;

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;

      const measurementLayer = L.layerGroup().addTo(map);
      measurementLayerRef.current = measurementLayer;

      mapInstanceRef.current = map;

      // Map Click Event
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on("click", (e: any) => {
        if (isMeasuringRef.current) {
          handleMeasureClick(e.latlng);
          return;
        }

        if (interactiveSelectRef.current && onLocationSelectRef.current) {
          const cLat = Number(e.latlng.lat);
          const cLng = Number(e.latlng.lng);
          if (isValidCoordinate(cLat, cLng)) {
            onLocationSelectRef.current({
              lat: Number(cLat.toFixed(4)),
              lng: Number(cLng.toFixed(4)),
            });
          }
          return;
        }

        // Map Exploration Click: Show problem(s) in this area
        const clickLat = Number(e.latlng.lat);
        const clickLng = Number(e.latlng.lng);
        if (!isValidCoordinate(clickLat, clickLng)) return;

        const challengesList = visibleChallengesRef.current || [];
        const nearby = challengesList
          .map((ch) => {
            const distMeters = map.distance([clickLat, clickLng], [Number(ch.latitude), Number(ch.longitude)]);
            return {
              ...ch,
              distanceKm: distMeters / 1000,
            };
          })
          .filter((ch) => Number.isFinite(ch.distanceKm) && ch.distanceKm <= 35)
          .sort((a, b) => a.distanceKm - b.distanceKm);

        const areaPopupContent = nearby.length > 0
          ? `
            <div style="font-family: system-ui, -apple-system, sans-serif; width: 280px; overflow: hidden;">
              <div style="padding: 12px 14px; background: #ffffff;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
                  <span style="font-size: 11px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 5px;">
                    📍 Sector Focus
                  </span>
                  <span style="font-size: 10px; font-weight: 800; background: #fee2e2; color: #dc2626; padding: 2px 6px; border-radius: 4px;">
                    ${nearby.length} Incident${nearby.length > 1 ? "s" : ""} Nearby
                  </span>
                </div>
                <p style="margin: 0 0 8px 0; font-size: 11px; color: #64748b;">
                  Active hazards within 35 km of this area:
                </p>
                <div style="display: flex; flex-direction: column; gap: 6px; max-height: 180px; overflow-y: auto;">
                  ${nearby.slice(0, 3).map((item) => `
                    <div style="padding: 6px 8px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
                      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
                        <span style="font-size: 10px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 170px;">
                          ${item.title}
                        </span>
                        <span style="font-size: 9px; font-weight: 800; color: #dc2626;">
                          ${item.severity}
                        </span>
                      </div>
                      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #64748b;">
                        <span>📍 ${item.district} (~${item.distanceKm.toFixed(1)} km)</span>
                        <a href="/challenges/${item.id}" style="color: #0284c7; font-weight: 700; text-decoration: none;">
                          Inspect &rarr;
                        </a>
                      </div>
                    </div>
                  `).join("")}
                </div>
                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 10px; color: #64748b;">Lat: ${clickLat.toFixed(3)}, Lng: ${clickLng.toFixed(3)}</span>
                  <a href="/challenges/new?lat=${clickLat.toFixed(4)}&lng=${clickLng.toFixed(4)}" style="background: #003366; color: white; padding: 4px 8px; border-radius: 5px; font-size: 10px; font-weight: 700; text-decoration: none;">
                    + Post Here
                  </a>
                </div>
              </div>
            </div>
          `
          : `
            <div style="font-family: system-ui, -apple-system, sans-serif; width: 260px; padding: 12px 14px; background: #ffffff;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                <span style="font-size: 14px;">🟢</span>
                <span style="font-size: 12px; font-weight: 800; color: #0f172a;">Sector Monitored</span>
              </div>
              <p style="margin: 0 0 8px 0; font-size: 11px; color: #64748b; line-height: 1.4;">
                No active disaster incidents reported within a 35 km radius of coordinates [${clickLat.toFixed(3)}, ${clickLng.toFixed(3)}].
              </p>
              <div style="display: flex; justify-content: flex-end; margin-top: 6px;">
                <a href="/challenges/new?lat=${clickLat.toFixed(4)}&lng=${clickLng.toFixed(4)}" style="background: #003366; color: white; padding: 5px 10px; border-radius: 6px; font-size: 10px; font-weight: 700; text-decoration: none;">
                  + Report Issue in this Area &rarr;
                </a>
              </div>
            </div>
          `;

        L.popup({ maxWidth: 300, className: "custom-leaflet-popup", autoPan: false })
          .setLatLng([clickLat, clickLng])
          .setContent(areaPopupContent)
          .openOn(map);
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn("Leaflet cleanup error suppressed:", e);
        }
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedLat = selectedLocation?.lat;
  const selectedLng = selectedLocation?.lng;

  // Pan to selected location when changed from outside
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedLocation) return;
    const lat = Number(selectedLocation.lat);
    const lng = Number(selectedLocation.lng);
    if (!isValidCoordinate(lat, lng)) return;

    try {
      const curCenter = map.getCenter();
      if (curCenter && isValidCoordinate(curCenter.lat, curCenter.lng)) {
        const dist = map.distance(curCenter, [lat, lng]);
        if (Number.isFinite(dist) && dist > 300) {
          const currentZoom = Number.isFinite(map.getZoom()) ? map.getZoom() : 12;
          map.flyTo([lat, lng], Math.max(currentZoom, 12), { duration: 0.8 });
        }
      } else {
        map.setView([lat, lng], 12);
      }
    } catch (err) {
      console.warn("Leaflet pan/flyTo suppressed error:", err);
    }
  }, [selectedLocation, selectedLat, selectedLng]);

  const centerLat = center?.[0];
  const centerLng = center?.[1];

  // Center & zoom sync
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !center) return;
    const cLat = Number(center[0]);
    const cLng = Number(center[1]);
    if (!isValidCoordinate(cLat, cLng)) return;
    const validZoom = Number.isFinite(Number(zoom)) ? Number(zoom) : 8;
    try {
      map.setView([cLat, cLng], validZoom);
    } catch (err) {
      console.warn("Leaflet setView error suppressed:", err);
    }
  }, [center, centerLat, centerLng, zoom]);

  // Update Base Tile Layer when changed
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = LRef.current;
    if (!map || !L) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    const config = TILE_SERVERS[activeBaseLayer];
    const newTile = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
    }).addTo(map);

    baseTileLayerRef.current = newTile;
  }, [activeBaseLayer]);

  // Sync wheel zoom toggle state
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.scrollWheelZoom) return;
    if (wheelZoomEnabled) {
      map.scrollWheelZoom.enable();
    } else {
      map.scrollWheelZoom.disable();
    }
  }, [wheelZoomEnabled]);

  // Handle Measurement tool clicks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMeasureClick = (latlng: any) => {
    const map = mapInstanceRef.current;
    const mLayer = measurementLayerRef.current;
    const L = LRef.current;
    if (!map || !mLayer || !L) return;

    setMeasurePoints((prev) => {
      if (prev.length === 0) {
        mLayer.clearLayers();
        const startIcon = L.divIcon({
          className: "ruler-point-a",
          html: `<div style="background: #2563eb; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.5);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        L.marker(latlng, { icon: startIcon }).addTo(mLayer);
        return [latlng];
      } else {
        const p1 = prev[0];
        const p2 = latlng;
        const distMeters = map.distance(p1, p2);
        setMeasuredDistance(distMeters);

        const endIcon = L.divIcon({
          className: "ruler-point-b",
          html: `<div style="background: #ef4444; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.5);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        L.marker(latlng, { icon: endIcon }).addTo(mLayer);

        L.polyline([p1, p2], {
          color: "#2563eb",
          dashArray: "6, 8",
          weight: 3.5,
          opacity: 0.9,
        }).addTo(mLayer);

        const distKm = (distMeters / 1000).toFixed(2);
        const midLat = (p1.lat + p2.lat) / 2;
        const midLng = (p1.lng + p2.lng) / 2;

        L.popup({ closeButton: false, offset: [0, -10] })
          .setLatLng([midLat, midLng])
          .setContent(`
            <div style="font-family: system-ui; font-size: 11px; font-weight: 700; color: #1e3a8a; padding: 3px 6px; text-align: center;">
              📏 Geodesic Distance: ${distKm} km
              <div style="font-size: 9px; color: #64748b; font-weight: normal; margin-top: 2px;">
                ~${(Number(distKm) * 2.2).toFixed(0)} min emergency vehicle transit
              </div>
            </div>
          `)
          .openOn(map);

        return [p1, p2];
      }
    });
  };

  const clearMeasurement = () => {
    if (measurementLayerRef.current) {
      measurementLayerRef.current.clearLayers();
    }
    setMeasurePoints([]);
    setMeasuredDistance(null);
    setIsMeasuring(false);
  };

  // Locate User GPS
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    sound.playClick();
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingUser(false);
        const { latitude, longitude, accuracy } = pos.coords;
        const map = mapInstanceRef.current;
        const L = LRef.current;
        if (!map || !L) return;

        map.flyTo([latitude, longitude], 13, { duration: 1.5 });

        const userIcon = L.divIcon({
          className: "user-geo-pin",
          html: `
            <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
              <div class="radar-pulse-ring" style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(37, 99, 235, 0.35);"></div>
              <div style="width: 16px; height: 16px; border-radius: 50%; background: #2563eb; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const mLayer = measurementLayerRef.current;
        if (mLayer) {
          L.marker([latitude, longitude], { icon: userIcon })
            .addTo(mLayer)
            .bindPopup(`<b>Your Geotag Sector</b><br>Accuracy radius: ~${Math.round(accuracy)}m`)
            .openPopup();
        }
      },
      () => {
        setLocatingUser(false);
        alert("Could not retrieve current location.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Fit all active pins into view
  const handleFitAllPins = () => {
    sound.playClick();
    const map = mapInstanceRef.current;
    const L = LRef.current;
    if (!map || !L || visibleChallenges.length === 0) return;

    const validCoords = visibleChallenges
      .filter((c) => isValidCoordinate(c.latitude, c.longitude))
      .map((c) => [Number(c.latitude), Number(c.longitude)]);

    if (validCoords.length > 0) {
      try {
        const bounds = L.latLngBounds(validCoords);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      } catch (e) {
        console.warn("fitBounds error:", e);
      }
    }
  };

  // Fly to specific hub
  const handleFlyToHub = (coords: [number, number], zoomLevel: number) => {
    sound.playClick();
    const map = mapInstanceRef.current;
    if (!map || !isValidCoordinate(coords[0], coords[1])) return;
    try {
      map.flyTo(coords, zoomLevel, { duration: 1.2 });
    } catch (e) {
      console.warn("flyTo hub error:", e);
    }
    setShowHubMenu(false);
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    sound.playClick();
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.invalidateSize();
        } catch (e) {
          console.warn("invalidateSize error:", e);
        }
      }
    }, 300);
  };

  // Update Markers & Buffer Zones
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const bufferZonesLayer = bufferZonesLayerRef.current;
    const L = LRef.current;
    if (!map || !markersLayer || !bufferZonesLayer || !L) return;

    markersLayer.clearLayers();
    bufferZonesLayer.clearLayers();

    // 1. Plot Selected Location Pin (during challenge submission intake)
    if (selectedLocation && isValidCoordinate(selectedLocation.lat, selectedLocation.lng)) {
      const pinLat = Number(selectedLocation.lat);
      const pinLng = Number(selectedLocation.lng);
      const pinIcon = L.divIcon({
        className: "custom-selected-pin",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div class="radar-pulse-ring" style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(249, 115, 22, 0.4); top: -8px;"></div>
            <div style="background-color: #ea580c; width: 30px; height: 30px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.6); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 13px; z-index: 2;">
              📍
            </div>
            <div style="width: 2px; height: 8px; background: #ea580c;"></div>
          </div>
        `,
        iconSize: [30, 38],
        iconAnchor: [15, 38],
      });

      try {
        L.marker([pinLat, pinLng], { icon: pinIcon })
          .addTo(markersLayer)
          .bindPopup(`
            <div style="font-size: 12px; font-weight: bold; color: #0f172a; padding: 2px 4px;">
              📍 Selected Incident Pin<br/>
              <span style="font-size: 10px; font-weight: normal; color: #64748b;">
                Lat: ${pinLat}, Lng: ${pinLng}
              </span>
            </div>
          `, { autoPan: false })
          .openPopup();
      } catch (err) {
        console.warn("Marker creation error suppressed:", err);
      }
    }

    // 2. Plot Visible Challenges
    visibleChallenges.forEach((challenge) => {
      if (!isValidCoordinate(challenge.latitude, challenge.longitude)) return;
      const cLat = Number(challenge.latitude);
      const cLng = Number(challenge.longitude);

      const meta = CATEGORY_META[challenge.category] || {
        color: "#2563eb",
        bg: "#eff6ff",
        icon: "🚨",
      };
      const isCritical = challenge.severity === "CRITICAL";
      const isHigh = challenge.severity === "HIGH";

      // Draw Advanced Risk Buffer Zones (Multi-tier Vulnerability Corridors)
      if (showBufferZones && (isCritical || isHigh)) {
        const createBufferZone = (radiusMeters: number, isCore: boolean) => {
          const strokeColor = isCore ? (isCritical ? "#dc2626" : meta.color) : "#ea580c";
          const fillColor = isCore ? (isCritical ? "#fee2e2" : meta.color) : "#ffedd5";
          const fillOpacity = isCore ? (isCritical ? 0.22 : 0.15) : 0.08;
          const weight = isCore ? (isCritical ? 2.5 : 1.5) : 1;

          const circle = L.circle([cLat, cLng], {
            radius: radiusMeters,
            color: strokeColor,
            fillColor: fillColor,
            fillOpacity: fillOpacity,
            weight: weight,
            dashArray: isCritical ? "5, 5" : "3, 3",
            interactive: true,
          }).addTo(bufferZonesLayer);

          // Interactive buffer click: Show Advanced Hazard Corridor Telemetry Card
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          circle.on("click", (e: any) => {
            if (e?.originalEvent) {
              L.DomEvent.stopPropagation(e.originalEvent);
              L.DomEvent.preventDefault(e.originalEvent);
            }

            const exposedCount = Math.round((challenge.citizenCountAffected || 350) * (radiusMeters / 1200));
            const bufferTitle = isCore
              ? (isCritical ? "🔥 Core Disaster Epicenter" : "Primary Hazard Corridor")
              : "Secondary Advisory Perimeter";

            const popupHtml = `
              <div style="font-family: system-ui, -apple-system, sans-serif; width: 285px; overflow: hidden;">
                <div style="padding: 12px 14px; background: #ffffff;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                    <span style="font-size: 9px; font-weight: 800; background: ${isCritical ? '#fee2e2' : '#ffedd5'}; color: ${isCritical ? '#dc2626' : '#ea580c'}; padding: 2px 7px; border-radius: 4px;">
                      🛡️ ${bufferTitle.toUpperCase()}
                    </span>
                    <span style="font-size: 9px; font-weight: 800; color: #64748b;">
                      ~${(radiusMeters / 1000).toFixed(1)} km Buffer
                    </span>
                  </div>

                  <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.35;">
                    ${challenge.title}
                  </h4>

                  <div style="font-size: 11px; color: #475569; display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px;">
                    <div>📍 <b>${challenge.district}</b> · ${challenge.address || "Sector Focus"}</div>
                    <div>👥 Population in Buffer: <b>~${exposedCount}+ citizens exposed</b></div>
                    <div style="font-size: 10px; color: #475569; background: #f8fafc; padding: 5px 7px; border-radius: 6px; border: 1px solid #e2e8f0;">
                      ⚡ <b>Mitigation Directive:</b> ${
                        isCritical
                          ? "High-alert containment corridor: Deploy SDRF & initiate resident advisory."
                          : "Monitoring buffer: Standard civic response & barrier checks."
                      }
                    </div>
                  </div>

                  <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid #f1f5f9;">
                    <span style="font-size: 10px; font-weight: 700; color: #0284c7;">
                      Urgency: ${challenge.urgencyScore || 70}/100
                    </span>
                    <a href="/challenges/${challenge.id}" style="background: #003366; color: white; padding: 5px 10px; border-radius: 6px; font-size: 10px; font-weight: 700; text-decoration: none;">
                      Inspect Problem &rarr;
                    </a>
                  </div>
                </div>
              </div>
            `;

            L.popup({ maxWidth: 295, className: "custom-leaflet-popup", autoPan: false })
              .setLatLng(e.latlng)
              .setContent(popupHtml)
              .openOn(map);
          });

          // Safe Hover Tooltip
          try {
            circle.bindTooltip(
              `<b>${isCore ? (isCritical ? "🔥 Core Impact Zone" : "Hazard Buffer") : "Outer Advisory Perimeter"}</b><br/>~${(radiusMeters / 1000).toFixed(1)} km radius · ~${Math.round((challenge.citizenCountAffected || 350) * (radiusMeters / 1200))}+ exposed`,
              { sticky: true, className: "buffer-tooltip" }
            );
          } catch {
            // Tooltip suppressed safely
          }
        };

        if (bufferMode === "multi") {
          // Inner core zone
          createBufferZone(isCritical ? 1400 : 900, true);
          // Outer staging perimeter for critical hazards
          if (isCritical) {
            createBufferZone(2800, false);
          }
        } else if (bufferMode === "max") {
          createBufferZone(isCritical ? 4200 : 2500, true);
        } else {
          // Standard
          createBufferZone(isCritical ? 2000 : 1200, true);
        }
      }

      // Marker Icon
      const markerHtml = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; cursor: pointer; user-select: none;">
          ${
            isCritical
              ? `<div class="radar-pulse-ring" style="
                  position: absolute;
                  top: -7px;
                  left: -7px;
                  width: 48px;
                  height: 48px;
                  border-radius: 50%;
                  border: 2px solid ${meta.color};
                  background: ${meta.color}25;
                  pointer-events: none;
                "></div>`
              : ""
          }

          <div style="
            position: relative;
            background-color: ${meta.color};
            width: ${isCritical ? "28px" : "24px"};
            height: ${isCritical ? "28px" : "24px"};
            border-radius: 50%;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: ${isCritical ? "13px" : "11px"};
            font-weight: 800;
          ">
            ${meta.icon}
          </div>

          ${
            challenge.mergedCount && challenge.mergedCount > 1
              ? `<span style="
                  position: absolute;
                  top: -2px;
                  right: -2px;
                  background: #7c3aed;
                  color: white;
                  font-size: 9px;
                  font-weight: 800;
                  padding: 1px 4px;
                  border-radius: 10px;
                  border: 1px solid white;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                  pointer-events: none;
                ">
                  ${challenge.mergedCount}
                </span>`
              : ""
          }
        </div>
      `;

      const customIcon = L.divIcon({
        className: "interactive-hazard-marker",
        html: markerHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18],
      });

      // Rich Card Popup Content
      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; width: 260px; overflow: hidden;">
          <div style="padding: 12px 14px; background: #ffffff;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span style="
                font-size: 9px;
                font-weight: 800;
                text-transform: uppercase;
                background-color: ${meta.bg};
                color: ${meta.color};
                padding: 2px 7px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                gap: 3px;
              ">
                ${meta.icon} ${challenge.category}
              </span>

              <span style="
                font-size: 9px;
                font-weight: 800;
                text-transform: uppercase;
                padding: 2px 6px;
                border-radius: 4px;
                background: ${isCritical ? "#fee2e2" : isHigh ? "#ffedd5" : "#f1f5f9"};
                color: ${isCritical ? "#dc2626" : isHigh ? "#ea580c" : "#475569"};
              ">
                ${challenge.severity}
              </span>
            </div>

            <h4 style="
              margin: 0 0 6px 0;
              font-size: 13px;
              font-weight: 700;
              line-height: 1.35;
              color: #0f172a;
            ">
              ${challenge.title}
            </h4>

            <div style="font-size: 11px; color: #475569; display: flex; flex-direction: column; gap: 3px; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 4px;">
                <span>📍</span>
                <b>${challenge.district}</b>: ${challenge.address || "Sector Focus"}
              </div>
              <div style="display: flex; align-items: center; gap: 4px; color: #64748b; font-size: 10px;">
                <span>👥</span>
                <span>Urgency Index: <b>${challenge.urgencyScore || 65} / 100</b></span>
              </div>
            </div>

            <div style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding-top: 8px;
              border-top: 1px solid #f1f5f9;
            ">
              <span style="font-size: 10px; font-weight: 700; color: #0284c7;">
                👍 ${challenge.upvotesCount || 12} endorsements
              </span>

              <a
                href="/challenges/${challenge.id}"
                style="
                  background: #003366;
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 6px;
                  padding: 5px 10px;
                  font-size: 10px;
                  font-weight: 700;
                  display: flex;
                  align-items: center;
                  gap: 3px;
                "
              >
                Inspect Problem &rarr;
              </a>
            </div>
          </div>
        </div>
      `;

      try {
        const marker = L.marker([cLat, cLng], { icon: customIcon, keyboard: false });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        marker.on("click", (e: any) => {
          if (e?.originalEvent) {
            L.DomEvent.stopPropagation(e.originalEvent);
            L.DomEvent.preventDefault(e.originalEvent);
          }
        });
        marker
          .addTo(markersLayer)
          .bindPopup(popupContent, { maxWidth: 280, className: "custom-leaflet-popup", autoPan: false });
      } catch (err) {
        console.warn("Marker bindPopup error:", err);
      }
    });
  }, [visibleChallenges, selectedLocation, showBufferZones, bufferMode]);

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden shadow-xl border border-slate-200 transition-all ${
        isFullscreen ? "fixed inset-0 z-[100] rounded-none border-none h-screen w-screen" : "z-0 isolate"
      }`}
      style={{ height: isFullscreen ? "100vh" : height }}
    >
      {/* 1. TOP-LEFT HUD CONTROLS */}
      {showAdvancedTools && (
        <div className="absolute top-3.5 left-3.5 z-[1000] flex flex-wrap items-center gap-2">
          {/* Quick-Hop Navigation Hubs Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setShowHubMenu(!showHubMenu);
                setShowLayerMenu(false);
              }}
              className="bg-white/95 hover:bg-slate-50 text-slate-800 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200/80 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-gov-navy" />
              <span>Jharkhand Sectors</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-slate-400" />
            </button>

            {showHubMenu && (
              <div className="absolute top-full left-0 mt-1.5 w-60 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 text-xs space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">
                  Fly to District Operations Hub:
                </div>
                {JHARKHAND_KEY_HUBS.map((hub) => (
                  <button
                    key={hub.name}
                    type="button"
                    onClick={() => handleFlyToHub(hub.coords, hub.zoom)}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-100 text-slate-800 font-semibold flex items-center justify-between transition-colors"
                  >
                    <span>{hub.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Basemap Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setShowLayerMenu(!showLayerMenu);
                setShowHubMenu(false);
              }}
              className="bg-white/95 hover:bg-slate-50 text-slate-800 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200/80 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span className="capitalize">{activeBaseLayer} View</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-slate-400" />
            </button>

            {showLayerMenu && (
              <div className="absolute top-full left-0 mt-1.5 w-48 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 text-xs space-y-1">
                {(["streets", "satellite", "topo", "dark"] as BaseLayerType[]).map((layer) => (
                  <button
                    key={layer}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setActiveBaseLayer(layer);
                      setShowLayerMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl capitalize font-semibold transition-colors ${
                      activeBaseLayer === layer
                        ? "bg-gov-navy text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {layer === "streets" && "🗺️ Standard Streets"}
                    {layer === "satellite" && "🛰️ High-Res Satellite"}
                    {layer === "topo" && "⛰️ Elevation Topo"}
                    {layer === "dark" && "🌙 Dark Operations"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Advanced Risk Buffer Control Center Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setShowBufferMenu(!showBufferMenu);
                setShowHubMenu(false);
                setShowLayerMenu(false);
              }}
              title="Configure Hazard Risk Corridors"
              className={`backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                showBufferZones
                  ? "bg-amber-50 text-amber-900 border-amber-300"
                  : "bg-white/95 text-slate-700 border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>Risk Buffers</span>
              <span className={`px-1.5 py-0.2 text-[9px] rounded-md font-extrabold ${
                showBufferZones ? "bg-amber-200 text-amber-900" : "bg-slate-200 text-slate-600"
              }`}>
                {showBufferZones ? (bufferMode === "multi" ? "Multi-Tier" : bufferMode === "max" ? "4.2km" : "Standard") : "Off"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-slate-400" />
            </button>

            {showBufferMenu && (
              <div className="absolute top-full left-0 mt-1.5 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 p-2.5 z-50 text-xs space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Hazard Buffer Analysis
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBufferZones(!showBufferZones);
                      setShowBufferMenu(false);
                    }}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      showBufferZones ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    }`}
                  >
                    {showBufferZones ? "Turn Off" : "Turn On"}
                  </button>
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setShowBufferZones(true);
                      setBufferMode("multi");
                      setShowBufferMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl font-semibold transition-colors flex items-center justify-between ${
                      showBufferZones && bufferMode === "multi" ? "bg-amber-500 text-white" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div>
                      <div className="font-bold">🎯 Multi-Tier Corridors</div>
                      <div className={`text-[10px] ${showBufferZones && bufferMode === "multi" ? "text-amber-100" : "text-slate-500"}`}>
                        Core 1.4km + Staging 2.8km perimeter
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setShowBufferZones(true);
                      setBufferMode("standard");
                      setShowBufferMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl font-semibold transition-colors flex items-center justify-between ${
                      showBufferZones && bufferMode === "standard" ? "bg-amber-500 text-white" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div>
                      <div className="font-bold">📏 Standard Buffer (1.5 - 2.0km)</div>
                      <div className={`text-[10px] ${showBufferZones && bufferMode === "standard" ? "text-amber-100" : "text-slate-500"}`}>
                        Standard disaster radius zone
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setShowBufferZones(true);
                      setBufferMode("max");
                      setShowBufferMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl font-semibold transition-colors flex items-center justify-between ${
                      showBufferZones && bufferMode === "max" ? "bg-amber-500 text-white" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div>
                      <div className="font-bold">⚡ Max Extent (4.2km)</div>
                      <div className={`text-[10px] ${showBufferZones && bufferMode === "max" ? "text-amber-100" : "text-slate-500"}`}>
                        Extended evacuation & fallout zone
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Geodesic Distance Measurement Ruler */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              if (isMeasuring) {
                clearMeasurement();
              } else {
                setIsMeasuring(true);
                alert("Distance Ruler Activated: Click any two locations on the map to calculate geodesic distance and emergency transit duration.");
              }
            }}
            className={`backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border text-xs font-bold flex items-center gap-1.5 transition-colors ${
              isMeasuring
                ? "bg-blue-600 text-white border-blue-700 shadow-inner"
                : "bg-white/95 text-slate-700 border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isMeasuring ? "Exit Ruler" : "Measure Distance"}</span>
          </button>

          {/* Wheel Zoom Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setWheelZoomEnabled(!wheelZoomEnabled);
            }}
            title={
              wheelZoomEnabled
                ? "Wheel Zoom is Active (Scroll wheel directly zooms map)"
                : "Wheel Zoom is Protected (Hold Ctrl + Scroll to zoom, or click to enable free wheel zoom)"
            }
            className={`backdrop-blur-md px-2.5 py-1.5 rounded-xl shadow-md border text-xs font-bold flex items-center gap-1 transition-colors ${
              wheelZoomEnabled
                ? "bg-indigo-50 text-indigo-900 border-indigo-300"
                : "bg-white/95 text-slate-700 border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            <MousePointer className={`w-3.5 h-3.5 ${wheelZoomEnabled ? "text-indigo-600" : "text-slate-500"}`} />
            <span className="hidden sm:inline">Zoom: {wheelZoomEnabled ? "Wheel Free" : "Ctrl/Pinch"}</span>
          </button>

          {/* Fit All Pins */}
          <button
            type="button"
            onClick={handleFitAllPins}
            title="Recalibrate camera to show all disaster pins"
            className="bg-white/95 hover:bg-slate-50 backdrop-blur-md px-2.5 py-1.5 rounded-xl shadow-md border border-slate-200/80 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden lg:inline">Fit All</span>
          </button>

          {/* Locate My Sector */}
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={locatingUser}
            title="Fly to current GPS coordinates"
            className="bg-white/95 hover:bg-slate-50 backdrop-blur-md px-2.5 py-1.5 rounded-xl shadow-md border border-slate-200/80 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
          >
            <Crosshair className={`w-3.5 h-3.5 text-blue-600 ${locatingUser ? "animate-spin" : ""}`} />
            <span className="hidden lg:inline">My GPS</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Expand to Fullscreen Command Center"}
            className="bg-white/95 hover:bg-slate-50 backdrop-blur-md p-1.5 rounded-xl shadow-md border border-slate-200/80 text-slate-700 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* 2. MEASUREMENT ACTIVE BANNER HUD */}
      {isMeasuring && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] bg-blue-900/90 text-white px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-md text-xs font-bold flex items-center gap-3 border border-blue-400/50 animate-in fade-in">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>
            {measurePoints.length === 0
              ? "Click map to set Point A"
              : measurePoints.length === 1
              ? "Click destination on map to complete measurement"
              : `Measured Distance: ${(measuredDistance! / 1000).toFixed(2)} km`}
          </span>
          <button
            type="button"
            onClick={clearMeasurement}
            className="p-1 hover:bg-blue-800 rounded-full transition-colors ml-1"
            title="Cancel measurement"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. BOTTOM-LEFT HUD: ACTIVE INCIDENT STATS & CATEGORY FILTER */}
      <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2 max-w-xs sm:max-w-sm pointer-events-auto">
        {/* Incident Summary Pill */}
        <div className="bg-slate-950/90 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-slate-800 text-xs flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="font-extrabold">{mapStats.total}</span>
            <span className="text-slate-400 text-[11px]">Incidents</span>
          </div>

          <div className="h-3.5 w-px bg-slate-800" />

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-extrabold text-red-300">{mapStats.critical}</span>
            <span className="text-slate-400 text-[11px]">Critical</span>
          </div>

          <div className="h-3.5 w-px bg-slate-800" />

          <div className="text-[11px] text-slate-300">
            ~<strong className="text-white font-mono">{mapStats.citizens.toLocaleString()}</strong> Exposed
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowLegend(!showLegend);
            }}
            className="ml-auto text-[11px] text-amber-400 font-bold hover:underline"
          >
            {showLegend ? "Hide" : "Legend"}
          </button>
        </div>

        {/* Expandable Category Legend & On-Map Filter */}
        {showLegend && (
          <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-2xl border border-slate-200 text-xs space-y-2 max-h-56 overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
              <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                Hazard Filter
              </span>
              {activeCategoryFilter !== "All" && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setActiveCategoryFilter("All");
                  }}
                  className="text-[10px] text-blue-600 font-bold hover:underline"
                >
                  Reset Filter
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-1">
              {Object.entries(CATEGORY_META).map(([catKey, meta]) => {
                const count = challenges.filter((c) => c.category === catKey).length;
                const isSelected = activeCategoryFilter === catKey;

                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setActiveCategoryFilter(isSelected ? "All" : catKey);
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] text-left transition-all ${
                      isSelected
                        ? "bg-slate-950 text-white font-bold"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate pr-2">
                      <span>{meta.icon}</span>
                      <span className="truncate">{catKey}</span>
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. INTERACTIVE SELECT MODE HINT */}
      {interactiveSelect && (
        <div className="absolute top-4 right-4 z-[1000] bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-2 rounded-2xl shadow-xl border border-orange-300 text-xs font-bold flex items-center gap-2 pointer-events-none animate-bounce">
          <span>📍</span>
          <span>Click anywhere on the map to pin incident coordinates</span>
        </div>
      )}

      {/* Actual Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full" id="leaflet-map-container" />
    </div>
  );
}
