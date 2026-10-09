import React, { useState } from 'react';
import { 
  Info, 
  Copy, 
  Check, 
  Download, 
  Layers, 
  AlertTriangle, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { FeatureMeasurement, FileRecord } from '../../types/geospatial';

interface FeatureInspectorProps {
  feature: FeatureMeasurement | null;
  file: FileRecord | null;
  onClose?: () => void;
}

export const FeatureInspector: React.FC<FeatureInspectorProps> = ({
  feature,
  file,
  onClose
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showCrsExplanation, setShowCrsExplanation] = useState(false);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadGeoJson = () => {
    if (!feature || !feature.geojson_geometry) return;
    const geoJsonFeature = {
      type: "Feature",
      id: feature.feature_id,
      geometry: feature.geojson_geometry,
      properties: {
        ...feature.properties_data,
        measurement_type: feature.measurement_type,
        measurement_value: feature.measurement_value,
        measurement_unit: feature.measurement_unit,
        secondary_value: feature.secondary_value,
        secondary_unit: feature.secondary_unit,
        status: feature.status
      }
    };

    const blob = new Blob([JSON.stringify(geoJsonFeature, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${feature.feature_id.toLowerCase()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!feature) {
    return (
      <div className="w-80 border-l border-[#E1E7EF] bg-white h-full flex flex-col items-center justify-center p-6 text-center text-[#6B778C]">
        <Layers className="w-10 h-10 text-[#C1C9D2] mb-3 stroke-[1.5]" />
        <h4 className="text-sm font-semibold text-[#14243A]">No Feature Selected</h4>
        <p className="text-xs text-[#6B778C] mt-1 max-w-[200px]">
          Click any geometry on the map or select a row in the feature explorer to inspect measurements.
        </p>
      </div>
    );
  }

  return (
    <div className="w-84 border-l border-[#E1E7EF] bg-white h-full flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-[#E1E7EF] shrink-0 bg-[#F4F7FB]/50">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-[#6B778C] font-semibold tracking-wider">
            FEATURE INSPECTOR
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            feature.status === 'SUCCESS' 
              ? 'bg-[#16845B]/10 text-[#16845B]' 
              : feature.status === 'UNSUPPORTED'
              ? 'bg-[#C98417]/10 text-[#C98417]'
              : 'bg-[#D64545]/10 text-[#D64545]'
          }`}>
            {feature.status}
          </span>
        </div>

        <h3 className="text-sm font-bold text-[#14243A] mt-1 break-all">
          {feature.feature_id}
        </h3>
        
        <div className="flex items-center gap-2 mt-1 text-xs text-[#6B778C]">
          <span className="font-medium text-[#3563E9]">{feature.geometry_type}</span>
          <span>·</span>
          <span>{feature.measurement_type}</span>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Primary Measurement Card */}
        <div className="bg-[#F4F7FB] border border-[#E1E7EF] rounded-lg p-3.5">
          <div className="flex items-center justify-between text-xs text-[#6B778C] mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Calculated Measurement
            </span>
            <button
              onClick={() => copyToClipboard(
                feature.measurement_value?.toString() || 'N/A', 
                'metric'
              )}
              className="text-[#6B778C] hover:text-[#14243A] transition-colors p-1"
              title="Copy value"
            >
              {copiedKey === 'metric' ? <Check className="w-3.5 h-3.5 text-[#16845B]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {feature.measurement_type === 'AREA' && feature.measurement_value !== null && (
            <div>
              <div className="text-2xl font-bold font-mono text-[#14243A] tracking-tight tabular-nums">
                {feature.measurement_value.toLocaleString()} <span className="text-sm font-sans font-medium text-[#6B778C]">m²</span>
              </div>
              <div className="text-xs text-[#6B778C] mt-1 font-mono tabular-nums space-y-0.5">
                <div>≈ {feature.secondary_value?.toLocaleString()} <span className="font-sans">hectares (ha)</span></div>
                <div>≈ {(feature.measurement_value * 0.000247105).toFixed(3)} <span className="font-sans">acres (ac)</span></div>
                {feature.measurement_value >= 100000 && (
                  <div>≈ {(feature.measurement_value / 1000000).toFixed(4)} <span className="font-sans">km²</span></div>
                )}
                <div>≈ {(feature.measurement_value * 10.7639).toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="font-sans">sq ft</span></div>
              </div>
            </div>
          )}

          {feature.measurement_type === 'LENGTH' && feature.measurement_value !== null && (
            <div>
              <div className="text-2xl font-bold font-mono text-[#14243A] tracking-tight tabular-nums">
                {feature.measurement_value.toLocaleString()} <span className="text-sm font-sans font-medium text-[#6B778C]">m</span>
              </div>
              <div className="text-xs text-[#6B778C] mt-1 font-mono tabular-nums space-y-0.5">
                <div>≈ {feature.secondary_value?.toLocaleString()} <span className="font-sans">kilometers (km)</span></div>
                <div>≈ {(feature.measurement_value * 3.28084).toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="font-sans">feet (ft)</span></div>
                <div>≈ {(feature.measurement_value * 0.000621371).toFixed(3)} <span className="font-sans">miles (mi)</span></div>
              </div>
            </div>
          )}

          {feature.measurement_type === 'COORDINATES' && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-[#14243A]">Zero Planar Dimension (Point)</div>
              <p className="text-[11px] text-[#6B778C] leading-relaxed">
                Points have zero spatial area and zero length. Coordinates are stored in native geographic degrees:
              </p>
              {feature.geojson_geometry?.coordinates && (
                <div className="mt-2 p-2 bg-white rounded border border-[#E1E7EF] font-mono text-[11px] text-[#14243A] space-y-0.5">
                  <div>Lon: {feature.geojson_geometry.coordinates[0]?.toFixed(6)}°</div>
                  <div>Lat: {feature.geojson_geometry.coordinates[1]?.toFixed(6)}°</div>
                </div>
              )}
            </div>
          )}

          {feature.status === 'UNSUPPORTED' && (
            <div className="flex items-start gap-2 text-xs text-[#C98417]">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Unsupported Geometry</span>
                <span className="text-[11px] text-[#6B778C] mt-0.5 block">
                  {feature.status_message || 'This geometry type cannot be computed as a single planar metric.'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* CRS Projection & Geodesy Info */}
        <div className="border border-[#E1E7EF] rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#14243A]">Spatial Reference System</span>
            <button
              onClick={() => setShowCrsExplanation(!showCrsExplanation)}
              className="text-[#3563E9] hover:text-[#284fc7] p-0.5 rounded transition-colors"
              title="Why planar projection is required"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-2 space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-[#6B778C]">
              <span>Source CRS:</span>
              <span className="font-mono text-[#14243A] font-medium">{file?.source_crs || 'EPSG:4326'}</span>
            </div>
            <div className="flex justify-between items-center text-[#6B778C]">
              <span>Projected Planar:</span>
              <span className="font-mono text-[#16845B] font-medium truncate max-w-[170px]" title={file?.measurement_crs}>
                {file?.measurement_crs.split('(')[0].trim() || 'UTM Auto'}
              </span>
            </div>
          </div>

          {showCrsExplanation && (
            <div className="mt-2.5 pt-2.5 border-t border-[#E1E7EF] text-[11px] text-[#6B778C] leading-relaxed bg-[#F4F7FB] p-2 rounded">
              <strong className="text-[#14243A] block mb-1">Geospatial Projection Rule:</strong>
              Geographic coordinates (latitude and longitude in degrees) cannot be measured with Euclidean planar formulas. 
              The backend projects features into conformal UTM meters before computing planar areas and lengths to eliminate geometric distortion.
            </div>
          )}
        </div>

        {/* Properties Key-Value Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#14243A]">Feature Attributes</span>
            <span className="text-[10px] font-mono text-[#6B778C]">
              {feature.properties_data ? Object.keys(feature.properties_data).length : 0} properties
            </span>
          </div>

          {feature.properties_data && Object.keys(feature.properties_data).length > 0 ? (
            <div className="border border-[#E1E7EF] rounded-lg overflow-hidden divide-y divide-[#E1E7EF] text-xs">
              {Object.entries(feature.properties_data).map(([key, value]) => (
                <div key={key} className="p-2 hover:bg-[#F4F7FB] transition-colors">
                  <div className="text-[10px] text-[#6B778C] font-semibold uppercase tracking-wider">
                    {key}
                  </div>
                  <div className="text-xs text-[#14243A] font-medium mt-0.5 break-words font-mono">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 border border-dashed border-[#E1E7EF] rounded-lg text-xs text-[#6B778C]">
              No attributes attached to this feature.
            </div>
          )}
        </div>

        {/* Action Export Button */}
        <div className="pt-2">
          <button
            onClick={handleDownloadGeoJson}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-[#E1E7EF] bg-white hover:bg-[#F4F7FB] text-xs font-medium text-[#14243A] transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#3563E9]" />
            <span>Export Feature as GeoJSON</span>
          </button>
        </div>
      </div>
    </div>
  );
};
