import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { 
  Maximize2, 
  Layers as LayersIcon, 
  Compass, 
  MapPin, 
  ZoomIn, 
  ZoomOut,
  Ruler,
  Check,
  X,
  Filter
} from 'lucide-react';
import { FileRecord, FeatureMeasurement } from '../../types/geospatial';

interface LeafletMapProps {
  file: FileRecord | null;
  selectedFeatureId: string | null;
  onSelectFeature: (featureId: string) => void;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  file,
  selectedFeatureId,
  onSelectFeature
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const rulerLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeBaseLayer, setActiveBaseLayer] = useState<'osm' | 'satellite' | 'carto'>('osm');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Layer filters
  const [showPolygons, setShowPolygons] = useState(true);
  const [showLines, setShowLines] = useState(true);
  const [showPoints, setShowPoints] = useState(true);

  // Interactive ruler tool state
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<L.LatLng[]>([]);
  const [measuredDistanceMeters, setMeasuredDistanceMeters] = useState<number>(0);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCenter: [number, number] = [48.148, 11.568];
    const initialZoom = 14;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false
    });

    // Add scale control
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    // Initial tile layer (OSM)
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Layer group for interactive ruler
    const rulerGroup = L.layerGroup().addTo(map);
    rulerLayerGroupRef.current = rulerGroup;

    currentTileLayerRef.current = osmLayer;
    mapInstanceRef.current = map;

    // Track mouse coordinates
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setMouseCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    map.on('mouseout', () => {
      setMouseCoords(null);
    });

    // Setup ResizeObserver for smooth resizing when panels collapse/expand
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Base Layer Switching
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    let url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let maxZoom = 19;

    if (activeBaseLayer === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 18;
    } else if (activeBaseLayer === 'carto') {
      url = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      maxZoom = 19;
    }

    const newLayer = L.tileLayer(url, { maxZoom }).addTo(map);
    currentTileLayerRef.current = newLayer;
  }, [activeBaseLayer]);

  // 3. Render Geometries & Synchronize Selection & Apply Visibility Filters
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !file) return;

    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
      geoJsonLayerRef.current = null;
    }

    if (!file.features || file.features.length === 0) return;

    // Filter features based on layer visibility toggles
    const activeFeatures = file.features.filter(f => {
      if (!f.geojson_geometry) return false;
      const type = f.geometry_type;
      if ((type === 'Polygon' || type === 'MultiPolygon') && !showPolygons) return false;
      if ((type === 'LineString' || type === 'MultiLineString') && !showLines) return false;
      if ((type === 'Point' || type === 'MultiPoint') && !showPoints) return false;
      return true;
    });

    const geoJsonData: any = {
      type: "FeatureCollection",
      features: activeFeatures.map(f => ({
        type: "Feature",
        id: f.feature_id,
        geometry: f.geojson_geometry,
        properties: {
          ...f.properties_data,
          feature_id: f.feature_id,
          geometry_type: f.geometry_type,
          measurement_type: f.measurement_type,
          measurement_value: f.measurement_value,
          measurement_unit: f.measurement_unit,
          secondary_value: f.secondary_value,
          secondary_unit: f.secondary_unit,
          status: f.status
        }
      }))
    };

    const layer = L.geoJSON(geoJsonData, {
      style: (feature) => {
        const isSelected = feature?.properties?.feature_id === selectedFeatureId;
        const geomType = feature?.geometry?.type;

        if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
          return {
            color: isSelected ? '#16A6A1' : '#14243A',
            weight: isSelected ? 3.5 : 2,
            opacity: 1,
            fillColor: isSelected ? '#3563E9' : '#3563E9',
            fillOpacity: isSelected ? 0.6 : 0.35
          };
        }

        // LineString
        return {
          color: isSelected ? '#16A6A1' : '#3563E9',
          weight: isSelected ? 5.5 : 3.5,
          opacity: 0.95
        };
      },
      pointToLayer: (feature, latlng) => {
        const isSelected = feature.properties.feature_id === selectedFeatureId;
        const markerHtml = `
          <div class="relative flex items-center justify-center">
            <div class="w-5 h-5 rounded-full ${
              isSelected ? 'bg-[#16A6A1] ring-4 ring-[#16A6A1]/40' : 'bg-[#3563E9] ring-2 ring-white'
            } shadow-md flex items-center justify-center text-white text-[10px] font-bold">
              ●
            </div>
          </div>
        `;
        const customIcon = L.divIcon({
          html: markerHtml,
          className: 'custom-leaflet-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        return L.marker(latlng, { icon: customIcon });
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties;
        const fId = props.feature_id;

        layer.on('click', (e) => {
          if (isMeasuring) return; // Prevent selection while ruler tool is active
          L.DomEvent.stopPropagation(e);
          onSelectFeature(fId);
        });

        let measureSummary = '';
        if (props.measurement_type === 'AREA' && props.measurement_value !== null) {
          measureSummary = `${props.measurement_value.toLocaleString()} ${props.measurement_unit} (${props.secondary_value} ${props.secondary_unit})`;
        } else if (props.measurement_type === 'LENGTH' && props.measurement_value !== null) {
          measureSummary = `${props.measurement_value.toLocaleString()} ${props.measurement_unit} (${props.secondary_value} ${props.secondary_unit})`;
        } else if (props.measurement_type === 'COORDINATES') {
          measureSummary = 'Coordinates only';
        } else {
          measureSummary = props.status;
        }

        layer.bindTooltip(
          `<div class="text-xs">
            <div class="font-semibold text-[#14243A]">${fId}</div>
            <div class="text-[#6B778C] font-mono text-[11px]">${props.geometry_type} · ${measureSummary}</div>
          </div>`,
          { sticky: true, opacity: 0.95 }
        );
      }
    });

    layer.addTo(map);
    geoJsonLayerRef.current = layer;

    // Fit map bounds to dataset
    try {
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
      }
    } catch (e) {
      console.warn("Could not calculate dataset bounds:", e);
    }
  }, [file, selectedFeatureId, onSelectFeature, showPolygons, showLines, showPoints, isMeasuring]);

  // 4. Interactive Ruler Tool
  const handleMapClickForMeasuring = useCallback((e: L.LeafletMouseEvent) => {
    if (!isMeasuring) return;

    setMeasurePoints(prev => {
      const updated = [...prev, e.latlng];
      // Calculate total geodesic distance along points
      let totalDist = 0;
      for (let i = 0; i < updated.length - 1; i++) {
        totalDist += updated[i].distanceTo(updated[i + 1]);
      }
      setMeasuredDistanceMeters(totalDist);

      // Render ruler points and path
      if (rulerLayerGroupRef.current) {
        rulerLayerGroupRef.current.clearLayers();
        if (updated.length > 1) {
          L.polyline(updated, {
            color: '#D64545',
            weight: 3,
            dashArray: '6, 6'
          }).addTo(rulerLayerGroupRef.current);
        }
        updated.forEach((pt, idx) => {
          L.circleMarker(pt, {
            radius: 5,
            color: '#D64545',
            fillColor: '#ffffff',
            fillOpacity: 1,
            weight: 2
          }).addTo(rulerLayerGroupRef.current!).bindTooltip(`Point ${idx + 1}`, { permanent: false });
        });
      }

      return updated;
    });
  }, [isMeasuring]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isMeasuring) {
      map.on('click', handleMapClickForMeasuring);
    } else {
      map.off('click', handleMapClickForMeasuring);
      if (rulerLayerGroupRef.current) {
        rulerLayerGroupRef.current.clearLayers();
      }
      setMeasurePoints([]);
      setMeasuredDistanceMeters(0);
    }

    return () => {
      map.off('click', handleMapClickForMeasuring);
    };
  }, [isMeasuring, handleMapClickForMeasuring]);

  const toggleRuler = () => {
    setIsMeasuring(prev => !prev);
  };

  const clearMeasurement = () => {
    setMeasurePoints([]);
    setMeasuredDistanceMeters(0);
    rulerLayerGroupRef.current?.clearLayers();
  };

  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    const layer = geoJsonLayerRef.current;
    if (map && layer) {
      try {
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
        }
      } catch (e) {
        console.warn(e);
      }
    }
  };

  return (
    <div className={`relative w-full h-full bg-[#E5E9EC] overflow-hidden select-none ${isMeasuring ? 'cursor-crosshair' : ''}`}>
      {/* Map DOM Node */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Map Controls - Top Right */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {/* Layer Switcher */}
        <div className="relative">
          <button
            onClick={() => { setShowLayerMenu(!showLayerMenu); setShowFilterMenu(false); }}
            className="w-9 h-9 rounded-md bg-white border border-[#E1E7EF] shadow-sm flex items-center justify-center text-[#14243A] hover:bg-[#F4F7FB] transition-colors"
            title="Switch Base Map Layer"
          >
            <LayersIcon className="w-4 h-4" />
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 top-11 w-44 bg-white border border-[#E1E7EF] rounded-lg shadow-lg p-1.5 z-30">
              <div className="px-2 py-1 text-[10px] font-semibold text-[#6B778C] uppercase tracking-wider">
                Base Layer
              </div>
              <button
                onClick={() => { setActiveBaseLayer('osm'); setShowLayerMenu(false); }}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors ${
                  activeBaseLayer === 'osm' ? 'bg-[#3563E9]/10 text-[#3563E9] font-semibold' : 'text-[#172033] hover:bg-[#F4F7FB]'
                }`}
              >
                OpenStreetMap Standard
              </button>
              <button
                onClick={() => { setActiveBaseLayer('carto'); setShowLayerMenu(false); }}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors ${
                  activeBaseLayer === 'carto' ? 'bg-[#3563E9]/10 text-[#3563E9] font-semibold' : 'text-[#172033] hover:bg-[#F4F7FB]'
                }`}
              >
                Carto Positron (Light)
              </button>
              <button
                onClick={() => { setActiveBaseLayer('satellite'); setShowLayerMenu(false); }}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors ${
                  activeBaseLayer === 'satellite' ? 'bg-[#3563E9]/10 text-[#3563E9] font-semibold' : 'text-[#172033] hover:bg-[#F4F7FB]'
                }`}
              >
                Esri World Satellite
              </button>
            </div>
          )}
        </div>

        {/* Geometry Visibility Filter */}
        <div className="relative">
          <button
            onClick={() => { setShowFilterMenu(!showFilterMenu); setShowLayerMenu(false); }}
            className={`w-9 h-9 rounded-md border shadow-sm flex items-center justify-center transition-colors ${
              (!showPolygons || !showLines || !showPoints)
                ? 'bg-[#3563E9] text-white border-[#3563E9]'
                : 'bg-white border-[#E1E7EF] text-[#14243A] hover:bg-[#F4F7FB]'
            }`}
            title="Filter visible geometries on map"
          >
            <Filter className="w-4 h-4" />
          </button>

          {showFilterMenu && (
            <div className="absolute right-0 top-11 w-44 bg-white border border-[#E1E7EF] rounded-lg shadow-lg p-2 z-30 space-y-2 text-xs">
              <div className="text-[10px] font-semibold text-[#6B778C] uppercase tracking-wider">
                Visible Layers
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-[#14243A]">
                <input
                  type="checkbox"
                  checked={showPolygons}
                  onChange={(e) => setShowPolygons(e.target.checked)}
                  className="rounded text-[#3563E9]"
                />
                <span>Polygons</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-[#14243A]">
                <input
                  type="checkbox"
                  checked={showLines}
                  onChange={(e) => setShowLines(e.target.checked)}
                  className="rounded text-[#3563E9]"
                />
                <span>LineStrings</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-[#14243A]">
                <input
                  type="checkbox"
                  checked={showPoints}
                  onChange={(e) => setShowPoints(e.target.checked)}
                  className="rounded text-[#3563E9]"
                />
                <span>Points</span>
              </label>
            </div>
          )}
        </div>

        {/* Interactive Ruler Tool Button */}
        <button
          onClick={toggleRuler}
          className={`w-9 h-9 rounded-md border shadow-sm flex items-center justify-center transition-colors ${
            isMeasuring 
              ? 'bg-[#D64545] text-white border-[#D64545]' 
              : 'bg-white border-[#E1E7EF] text-[#14243A] hover:bg-[#F4F7FB]'
          }`}
          title={isMeasuring ? "Exit Measuring Tool" : "Interactive Distance Ruler"}
        >
          <Ruler className="w-4 h-4" />
        </button>

        {/* Fit Bounds Button */}
        <button
          onClick={handleFitBounds}
          className="w-9 h-9 rounded-md bg-white border border-[#E1E7EF] shadow-sm flex items-center justify-center text-[#14243A] hover:bg-[#F4F7FB] transition-colors"
          title="Fit view to all features"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Zoom Controls */}
        <div className="flex flex-col bg-white border border-[#E1E7EF] rounded-md shadow-sm overflow-hidden">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-9 h-9 flex items-center justify-center text-[#14243A] hover:bg-[#F4F7FB] border-b border-[#E1E7EF] transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-9 h-9 flex items-center justify-center text-[#14243A] hover:bg-[#F4F7FB] transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Ruler Active Banner - Top Center */}
      {isMeasuring && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-[#14243A] text-white px-4 py-2 rounded-lg shadow-lg border border-[#2D3E53] flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-semibold">
            <Ruler className="w-4 h-4 text-red-400" />
            <span>Click map points to measure distance</span>
          </div>

          <div className="font-mono text-red-300 font-bold tabular-nums pl-2 border-l border-white/20">
            {measuredDistanceMeters >= 1000 ? (
              <span>{(measuredDistanceMeters / 1000).toFixed(3)} km</span>
            ) : (
              <span>{measuredDistanceMeters.toFixed(1)} m</span>
            )}
            <span className="text-[10px] text-white/60 ml-1 font-sans">({measurePoints.length} pts)</span>
          </div>

          <button
            onClick={clearMeasurement}
            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[11px] transition-colors"
          >
            Clear
          </button>

          <button
            onClick={toggleRuler}
            className="px-2 py-0.5 rounded bg-[#D64545] hover:bg-red-600 text-white text-[11px] font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      )}

      {/* Dataset Overlay Badge - Top Left */}
      {file && (
        <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-sm border border-[#E1E7EF] rounded-lg shadow-sm px-3 py-2 flex items-center gap-3">
          <div>
            <div className="text-xs font-semibold text-[#14243A] flex items-center gap-1.5">
              <span>{file.filename}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#F4F7FB] text-[#6B778C] rounded border border-[#E1E7EF]">
                {file.file_format}
              </span>
            </div>
            <div className="text-[11px] text-[#6B778C] font-mono mt-0.5">
              <span>{file.feature_count} features</span>
              <span className="mx-1">·</span>
              <span>{file.measurement_crs.split('(')[0].trim()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Cursor Coordinates - Bottom Right */}
      {mouseCoords && (
        <div className="absolute bottom-2 right-2 z-20 bg-white/90 backdrop-blur-sm border border-[#E1E7EF] rounded px-2.5 py-1 text-[10px] font-mono text-[#14243A] shadow-xs tabular-nums">
          <span>Lng: {mouseCoords.lng.toFixed(5)}°</span>
          <span className="mx-1.5 text-[#C1C9D2]">|</span>
          <span>Lat: {mouseCoords.lat.toFixed(5)}°</span>
        </div>
      )}
    </div>
  );
};
