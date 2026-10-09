import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  ArrowUpDown, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  FileSpreadsheet,
  FileCode,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { FeatureMeasurement, FileRecord } from '../../types/geospatial';

interface FeatureDataTableProps {
  file: FileRecord | null;
  selectedFeatureId: string | null;
  onSelectFeature: (featureId: string) => void;
  onNavigateToWorkspace: () => void;
}

export const FeatureDataTable: React.FC<FeatureDataTableProps> = ({
  file,
  selectedFeatureId,
  onSelectFeature,
  onNavigateToWorkspace
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [geometryFilter, setGeometryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState<'feature_id' | 'measurement_value' | 'geometry_type'>('feature_id');
  const [sortAsc, setSortAsc] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Column visibility state
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    featureId: true,
    geometryType: true,
    measurementType: true,
    primaryValue: true,
    secondaryValue: true,
    status: true,
    actions: true
  });

  const features = file?.features || [];

  const filteredAndSortedFeatures = useMemo(() => {
    return features
      .filter(f => {
        const matchesSearch = 
          searchTerm.trim() === '' ||
          f.feature_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (f.properties_data && JSON.stringify(f.properties_data).toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesGeometry = 
          geometryFilter === 'ALL' ||
          f.geometry_type.toLowerCase() === geometryFilter.toLowerCase() ||
          (geometryFilter === 'Polygon' && (f.geometry_type === 'Polygon' || f.geometry_type === 'MultiPolygon')) ||
          (geometryFilter === 'LineString' && (f.geometry_type === 'LineString' || f.geometry_type === 'MultiLineString')) ||
          (geometryFilter === 'Point' && (f.geometry_type === 'Point' || f.geometry_type === 'MultiPoint'));

        const matchesStatus = 
          statusFilter === 'ALL' || f.status === statusFilter;

        return matchesSearch && matchesGeometry && matchesStatus;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (valA === null || valA === undefined) valA = -1;
        if (valB === null || valB === undefined) valB = -1;

        if (typeof valA === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [features, searchTerm, geometryFilter, statusFilter, sortField, sortAsc]);

  // Paginated slice
  const totalPages = Math.ceil(filteredAndSortedFeatures.length / pageSize) || 1;
  const paginatedFeatures = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedFeatures.slice(start, start + pageSize);
  }, [filteredAndSortedFeatures, currentPage, pageSize]);

  const handleSort = (field: 'feature_id' | 'measurement_value' | 'geometry_type') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const toggleColumn = (key: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const exportCsv = () => {
    if (!file || features.length === 0) return;

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

    const rows = filteredAndSortedFeatures.map(f => [
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

  const exportGeoJson = () => {
    if (!file || features.length === 0) return;

    const geoJsonCollection = {
      type: "FeatureCollection",
      crs: {
        type: "name",
        properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" }
      },
      features: features
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
            status: f.status,
            source_crs: file.source_crs,
            measurement_crs: file.measurement_crs
          }
        }))
    };

    const blob = new Blob([JSON.stringify(geoJsonCollection, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.filename.replace(/\.[^/.]+$/, "")}_measured.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!file) {
    return (
      <div className="p-8 text-center text-[#6B778C]">
        <FileSpreadsheet className="w-12 h-12 text-[#C1C9D2] mx-auto mb-3" />
        <h3 className="text-base font-bold text-[#14243A]">No Dataset Loaded</h3>
        <p className="text-xs text-[#6B778C] mt-1">
          Upload a KML or Shapefile in Overview or select a sample dataset to view its feature table.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#14243A]">
            Feature Measurements Table
          </h2>
          <div className="flex items-center gap-2 text-xs text-[#6B778C] mt-0.5 font-mono">
            <span>{file.filename}</span>
            <span>·</span>
            <span>{file.feature_count} features total</span>
            <span>·</span>
            <span className="text-[#16845B]">{file.successful_measurements} measured</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Column Visibility Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowColumnsMenu(!showColumnsMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E1E7EF] bg-white hover:bg-[#F4F7FB] text-xs font-semibold text-[#14243A] transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#6B778C]" />
              <span>Columns</span>
            </button>

            {showColumnsMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-[#E1E7EF] rounded-lg shadow-lg p-2 z-30 space-y-1.5 text-xs">
                <div className="text-[10px] font-semibold text-[#6B778C] uppercase tracking-wider px-1">
                  Visible Columns
                </div>
                <label className="flex items-center gap-2 px-1 py-0.5 cursor-pointer hover:bg-[#F4F7FB] rounded">
                  <input
                    type="checkbox"
                    checked={visibleColumns.featureId}
                    onChange={() => toggleColumn('featureId')}
                    className="rounded text-[#3563E9]"
                  />
                  <span>Feature ID</span>
                </label>
                <label className="flex items-center gap-2 px-1 py-0.5 cursor-pointer hover:bg-[#F4F7FB] rounded">
                  <input
                    type="checkbox"
                    checked={visibleColumns.geometryType}
                    onChange={() => toggleColumn('geometryType')}
                    className="rounded text-[#3563E9]"
                  />
                  <span>Geometry</span>
                </label>
                <label className="flex items-center gap-2 px-1 py-0.5 cursor-pointer hover:bg-[#F4F7FB] rounded">
                  <input
                    type="checkbox"
                    checked={visibleColumns.measurementType}
                    onChange={() => toggleColumn('measurementType')}
                    className="rounded text-[#3563E9]"
                  />
                  <span>Measurement Type</span>
                </label>
                <label className="flex items-center gap-2 px-1 py-0.5 cursor-pointer hover:bg-[#F4F7FB] rounded">
                  <input
                    type="checkbox"
                    checked={visibleColumns.primaryValue}
                    onChange={() => toggleColumn('primaryValue')}
                    className="rounded text-[#3563E9]"
                  />
                  <span>Primary Value</span>
                </label>
                <label className="flex items-center gap-2 px-1 py-0.5 cursor-pointer hover:bg-[#F4F7FB] rounded">
                  <input
                    type="checkbox"
                    checked={visibleColumns.secondaryValue}
                    onChange={() => toggleColumn('secondaryValue')}
                    className="rounded text-[#3563E9]"
                  />
                  <span>Secondary Value</span>
                </label>
                <label className="flex items-center gap-2 px-1 py-0.5 cursor-pointer hover:bg-[#F4F7FB] rounded">
                  <input
                    type="checkbox"
                    checked={visibleColumns.status}
                    onChange={() => toggleColumn('status')}
                    className="rounded text-[#3563E9]"
                  />
                  <span>Status</span>
                </label>
              </div>
            )}
          </div>

          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E1E7EF] bg-white hover:bg-[#F4F7FB] text-xs font-semibold text-[#14243A] transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#3563E9]" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={exportGeoJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E1E7EF] bg-white hover:bg-[#F4F7FB] text-xs font-semibold text-[#14243A] transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-[#16A6A1]" />
            <span>Export GeoJSON</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E1E7EF] rounded-lg p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-[#6B778C] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Feature ID or property..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 bg-[#F4F7FB] border border-[#E1E7EF] rounded-md text-xs text-[#172033] focus:outline-none focus:border-[#3563E9]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={geometryFilter}
            onChange={(e) => {
              setGeometryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#F4F7FB] border border-[#E1E7EF] rounded-md px-3 py-1.5 text-xs text-[#172033] focus:outline-none focus:border-[#3563E9]"
          >
            <option value="ALL">All Geometry Types</option>
            <option value="Polygon">Polygons</option>
            <option value="LineString">LineStrings</option>
            <option value="Point">Points</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#F4F7FB] border border-[#E1E7EF] rounded-md px-3 py-1.5 text-xs text-[#172033] focus:outline-none focus:border-[#3563E9]"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success Only</option>
            <option value="UNSUPPORTED">Unsupported Only</option>
            <option value="ERROR">Errors Only</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-[#E1E7EF] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F7FB] border-b border-[#E1E7EF] text-[#6B778C] font-semibold sticky top-0 z-10">
              <tr>
                {visibleColumns.featureId && (
                  <th 
                    onClick={() => handleSort('feature_id')} 
                    className="py-3 px-4 cursor-pointer hover:text-[#14243A] select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Feature ID</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                )}
                {visibleColumns.geometryType && (
                  <th 
                    onClick={() => handleSort('geometry_type')} 
                    className="py-3 px-4 cursor-pointer hover:text-[#14243A] select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Geometry</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                )}
                {visibleColumns.measurementType && (
                  <th className="py-3 px-4">Measurement Type</th>
                )}
                {visibleColumns.primaryValue && (
                  <th 
                    onClick={() => handleSort('measurement_value')} 
                    className="py-3 px-4 text-right cursor-pointer hover:text-[#14243A] select-none"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Primary Value</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                )}
                {visibleColumns.secondaryValue && (
                  <th className="py-3 px-4 text-right">Secondary Value</th>
                )}
                {visibleColumns.status && (
                  <th className="py-3 px-4 text-center">Status</th>
                )}
                {visibleColumns.actions && (
                  <th className="py-3 px-4 text-center">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E7EF] text-[#172033]">
              {paginatedFeatures.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#6B778C]">
                    No features match the current filters.
                  </td>
                </tr>
              ) : (
                paginatedFeatures.map((feat) => {
                  const isSelected = feat.feature_id === selectedFeatureId;
                  return (
                    <tr
                      key={feat.id}
                      onClick={() => onSelectFeature(feat.feature_id)}
                      className={`hover:bg-[#F4F7FB] transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#3563E9]/5' : ''
                      }`}
                    >
                      {visibleColumns.featureId && (
                        <td className="py-3 px-4 font-mono font-semibold text-[#14243A]">
                          {feat.feature_id}
                        </td>
                      )}
                      {visibleColumns.geometryType && (
                        <td className="py-3 px-4 font-mono text-[#6B778C]">
                          {feat.geometry_type}
                        </td>
                      )}
                      {visibleColumns.measurementType && (
                        <td className="py-3 px-4 font-mono">
                          {feat.measurement_type}
                        </td>
                      )}
                      {visibleColumns.primaryValue && (
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                          {feat.measurement_value !== null ? (
                            <span>
                              {feat.measurement_value.toLocaleString()} {feat.measurement_unit}
                            </span>
                          ) : (
                            <span className="text-[#A0AEC0]">—</span>
                          )}
                        </td>
                      )}
                      {visibleColumns.secondaryValue && (
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-[#6B778C]">
                          {feat.secondary_value !== null ? (
                            <span>
                              {feat.secondary_value.toLocaleString()} {feat.secondary_unit}
                            </span>
                          ) : (
                            <span className="text-[#A0AEC0]">—</span>
                          )}
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            feat.status === 'SUCCESS'
                              ? 'bg-[#16845B]/10 text-[#16845B]'
                              : feat.status === 'UNSUPPORTED'
                              ? 'bg-[#C98417]/10 text-[#C98417]'
                              : 'bg-[#D64545]/10 text-[#D64545]'
                          }`}>
                            {feat.status === 'SUCCESS' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <AlertCircle className="w-3 h-3" />
                            )}
                            <span>{feat.status}</span>
                          </span>
                        </td>
                      )}
                      {visibleColumns.actions && (
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectFeature(feat.feature_id);
                              onNavigateToWorkspace();
                            }}
                            className="px-2.5 py-1 rounded bg-[#F4F7FB] hover:bg-[#EAF0F8] text-[#3563E9] font-medium text-xs transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View on Map</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 bg-[#F4F7FB] border-t border-[#E1E7EF] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B778C]">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-[#E1E7EF] rounded px-2 py-1 text-xs text-[#14243A]"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>
              Showing {filteredAndSortedFeatures.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredAndSortedFeatures.length)} of {filteredAndSortedFeatures.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage <= 1}
              className="px-2.5 py-1 rounded border border-[#E1E7EF] bg-white text-[#14243A] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F4F7FB] transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <span className="font-mono text-xs px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1 rounded border border-[#E1E7EF] bg-white text-[#14243A] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F4F7FB] transition-colors flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
