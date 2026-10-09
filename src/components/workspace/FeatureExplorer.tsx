import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  Square, 
  Share2, 
  CircleDot, 
  AlertCircle,
  CheckCircle2,
  ListFilter
} from 'lucide-react';
import { FeatureMeasurement } from '../../types/geospatial';

interface FeatureExplorerProps {
  features: FeatureMeasurement[];
  selectedFeatureId: string | null;
  onSelectFeature: (featureId: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const FeatureExplorer: React.FC<FeatureExplorerProps> = ({
  features,
  selectedFeatureId,
  onSelectFeature,
  collapsed,
  onToggleCollapse
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [geometryFilter, setGeometryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredFeatures = useMemo(() => {
    return features.filter(f => {
      // Search
      const matchesSearch = 
        searchTerm.trim() === '' ||
        f.feature_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.properties_data && JSON.stringify(f.properties_data).toLowerCase().includes(searchTerm.toLowerCase()));

      // Geometry filter
      const matchesGeometry = 
        geometryFilter === 'ALL' ||
        f.geometry_type.toLowerCase() === geometryFilter.toLowerCase() ||
        (geometryFilter === 'Polygon' && (f.geometry_type === 'Polygon' || f.geometry_type === 'MultiPolygon')) ||
        (geometryFilter === 'LineString' && (f.geometry_type === 'LineString' || f.geometry_type === 'MultiLineString')) ||
        (geometryFilter === 'Point' && (f.geometry_type === 'Point' || f.geometry_type === 'MultiPoint'));

      // Status filter
      const matchesStatus = 
        statusFilter === 'ALL' || f.status === statusFilter;

      return matchesSearch && matchesGeometry && matchesStatus;
    });
  }, [features, searchTerm, geometryFilter, statusFilter]);

  if (collapsed) {
    return (
      <div className="w-12 border-r border-[#E1E7EF] bg-white h-full flex flex-col items-center py-4 select-none">
        <button
          onClick={onToggleCollapse}
          className="p-2 text-[#6B778C] hover:text-[#14243A] hover:bg-[#F4F7FB] rounded-md transition-colors"
          title="Expand Feature Explorer"
        >
          <ListFilter className="w-5 h-5" />
        </button>
        <div className="mt-8 [writing-mode:vertical-rl] rotate-180 text-xs font-semibold tracking-wider text-[#6B778C]">
          FEATURE EXPLORER ({features.length})
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 border-r border-[#E1E7EF] bg-white h-full flex flex-col select-none">
      {/* Header */}
      <div className="p-3 border-b border-[#E1E7EF]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#14243A] uppercase tracking-wide">
            Feature Explorer
          </span>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-mono text-[#6B778C]">
              {filteredFeatures.length} / {features.length}
            </span>
            <button
              onClick={onToggleCollapse}
              className="text-[#6B778C] hover:text-[#14243A] text-xs p-1"
              title="Collapse Panel"
            >
              ◀
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#6B778C] absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search features..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#F4F7FB] border border-[#E1E7EF] rounded-md text-xs text-[#172033] focus:outline-none focus:border-[#3563E9] transition-colors"
          />
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-1.5 mt-2">
          <select
            value={geometryFilter}
            onChange={(e) => setGeometryFilter(e.target.value)}
            className="flex-1 bg-[#F4F7FB] border border-[#E1E7EF] rounded px-2 py-1 text-[11px] text-[#172033] focus:outline-none focus:border-[#3563E9]"
          >
            <option value="ALL">All Geometries</option>
            <option value="Polygon">Polygons</option>
            <option value="LineString">LineStrings</option>
            <option value="Point">Points</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-28 bg-[#F4F7FB] border border-[#E1E7EF] rounded px-2 py-1 text-[11px] text-[#172033] focus:outline-none focus:border-[#3563E9]"
          >
            <option value="ALL">All Status</option>
            <option value="SUCCESS">Success</option>
            <option value="UNSUPPORTED">Unsupported</option>
            <option value="ERROR">Error</option>
          </select>
        </div>
      </div>

      {/* Feature List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#E1E7EF]">
        {filteredFeatures.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#6B778C]">
            No features match the filter criteria.
          </div>
        ) : (
          filteredFeatures.map((feat) => {
            const isSelected = feat.feature_id === selectedFeatureId;
            return (
              <button
                key={feat.id}
                onClick={() => onSelectFeature(feat.feature_id)}
                className={`w-full text-left p-3 transition-colors flex flex-col gap-1 ${
                  isSelected
                    ? 'bg-[#3563E9]/10 border-l-2 border-[#3563E9]'
                    : 'hover:bg-[#F4F7FB]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold truncate ${
                    isSelected ? 'text-[#3563E9]' : 'text-[#14243A]'
                  }`}>
                    {feat.feature_id}
                  </span>
                  <span className="text-[10px] font-mono text-[#6B778C] uppercase">
                    {feat.geometry_type}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#6B778C] font-mono">
                  {feat.measurement_type === 'AREA' && feat.measurement_value !== null ? (
                    <span className="tabular-nums">
                      {feat.measurement_value.toLocaleString()} {feat.measurement_unit}
                    </span>
                  ) : feat.measurement_type === 'LENGTH' && feat.measurement_value !== null ? (
                    <span className="tabular-nums">
                      {feat.measurement_value.toLocaleString()} {feat.measurement_unit}
                    </span>
                  ) : feat.measurement_type === 'COORDINATES' ? (
                    <span>Point (Coords)</span>
                  ) : (
                    <span className="text-amber-600">Unsupported</span>
                  )}

                  {feat.status === 'SUCCESS' ? (
                    <CheckCircle2 className="w-3 h-3 text-[#16845B]" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-[#C98417]" />
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
