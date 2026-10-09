import React, { useState } from 'react';
import { 
  Download, 
  Layers, 
  FileSpreadsheet, 
  FileCode, 
  Compass,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { FileRecord, FeatureMeasurement } from '../../types/geospatial';
import { LeafletMap } from '../map/LeafletMap';
import { FeatureExplorer } from './FeatureExplorer';
import { FeatureInspector } from '../inspector/FeatureInspector';

interface GisWorkspaceViewProps {
  file: FileRecord | null;
  selectedFeatureId: string | null;
  onSelectFeature: (featureId: string) => void;
  onNavigateToTable: () => void;
}

export const GisWorkspaceView: React.FC<GisWorkspaceViewProps> = ({
  file,
  selectedFeatureId,
  onSelectFeature,
  onNavigateToTable
}) => {
  const [explorerCollapsed, setExplorerCollapsed] = useState(false);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);

  const selectedFeature: FeatureMeasurement | null = React.useMemo(() => {
    if (!file || !file.features) return null;
    return file.features.find(f => f.feature_id === selectedFeatureId) || file.features[0] || null;
  }, [file, selectedFeatureId]);

  const handleExportCsv = () => {
    if (!file || !file.features) return;
    const headers = [
      "Feature_ID",
      "Geometry_Type",
      "Measurement_Type",
      "Measurement_Value",
      "Unit",
      "Secondary_Value",
      "Secondary_Unit",
      "Status",
      "Source_CRS",
      "Measurement_CRS"
    ];

    const rows = file.features.map(f => [
      `"${f.feature_id}"`,
      `"${f.geometry_type}"`,
      `"${f.measurement_type}"`,
      f.measurement_value ?? "",
      `"${f.measurement_unit ?? ""}"`,
      f.secondary_value ?? "",
      `"${f.secondary_unit ?? ""}"`,
      `"${f.status}"`,
      `"${file.source_crs}"`,
      `"${file.measurement_crs}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.filename.replace(/\.[^/.]+$/, "")}_measurements.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportGeoJson = () => {
    if (!file || !file.features) return;
    const geoJsonCollection = {
      type: "FeatureCollection",
      crs: {
        type: "name",
        properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" }
      },
      features: file.features
        .filter(f => f.geojson_geometry !== null)
        .map(f => ({
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

    const blob = new Blob([JSON.stringify(geoJsonCollection, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.filename.replace(/\.[^/.]+$/, "")}_geomeasure.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center text-[#6B778C]">
        <div>
          <Compass className="w-12 h-12 text-[#C1C9D2] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#14243A]">No Dataset Loaded</h3>
          <p className="text-xs text-[#6B778C] mt-1 max-w-sm">
            Please upload a KML or Shapefile in the Overview screen, or load one of the benchmark datasets.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* File Header Bar */}
      <div className="h-12 bg-white border-b border-[#E1E7EF] px-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold text-xs text-[#14243A] truncate">
              {file.filename}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F4F7FB] border border-[#E1E7EF] text-[#6B778C]">
              {file.file_format}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-[#6B778C] font-mono border-l border-[#E1E7EF] pl-3">
            <span>{file.feature_count} features</span>
            <span>·</span>
            <span className="text-[#16845B] font-medium">{file.successful_measurements} measured</span>
            <span>·</span>
            <span className="truncate max-w-[200px]" title={file.measurement_crs}>
              {file.measurement_crs.split('(')[0]}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onNavigateToTable}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#14243A] bg-[#F4F7FB] hover:bg-[#EAF0F8] border border-[#E1E7EF] rounded-md transition-colors"
            title="Open Complete Data Grid"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#3563E9]" />
            <span className="hidden sm:inline">Data Table</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#14243A] bg-white hover:bg-[#F4F7FB] border border-[#E1E7EF] rounded-md transition-colors"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#3563E9]" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            onClick={handleExportGeoJson}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#14243A] bg-white hover:bg-[#F4F7FB] border border-[#E1E7EF] rounded-md transition-colors"
            title="Download GeoJSON"
          >
            <FileCode className="w-3.5 h-3.5 text-[#16A6A1]" />
            <span className="hidden sm:inline">GeoJSON</span>
          </button>
        </div>
      </div>

      {/* Coordinated 3-Area Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Panel: Feature Explorer */}
        <FeatureExplorer
          features={file.features || []}
          selectedFeatureId={selectedFeature?.feature_id || null}
          onSelectFeature={onSelectFeature}
          collapsed={explorerCollapsed}
          onToggleCollapse={() => setExplorerCollapsed(!explorerCollapsed)}
        />

        {/* Center Panel: Leaflet GIS Map */}
        <div className="flex-1 h-full relative overflow-hidden">
          <LeafletMap
            file={file}
            selectedFeatureId={selectedFeature?.feature_id || null}
            onSelectFeature={onSelectFeature}
          />
        </div>

        {/* Right Panel: Feature Details & Measurements Inspector */}
        {!inspectorCollapsed && (
          <FeatureInspector
            feature={selectedFeature}
            file={file}
            onClose={() => setInspectorCollapsed(true)}
          />
        )}
      </div>
    </div>
  );
};
