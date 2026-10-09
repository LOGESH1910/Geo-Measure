/**
 * Geospatial Type Definitions for GeoMeasure Pro
 */

export type GeometryType = 
  | 'Polygon' 
  | 'MultiPolygon' 
  | 'LineString' 
  | 'MultiLineString' 
  | 'Point' 
  | 'MultiPoint' 
  | 'GeometryCollection'
  | string;

export type MeasurementType = 'AREA' | 'LENGTH' | 'COORDINATES' | 'NONE';

export type MeasurementStatus = 'SUCCESS' | 'UNSUPPORTED' | 'ERROR';

export type ProcessingStatus = 'COMPLETED' | 'PROCESSING' | 'FAILED';

export interface BoundingBox {
  min_x: number;
  min_y: number;
  max_x: number;
  max_y: number;
}

export interface GeoJsonGeometry {
  type: GeometryType;
  coordinates: any;
}

export interface FeatureMeasurement {
  id: string;
  file_id: string;
  feature_id: string;
  geometry_type: GeometryType;
  measurement_type: MeasurementType;
  measurement_value: number | null; // m² for area, m for length
  measurement_unit: string | null;  // m², m, deg
  secondary_value: number | null;   // ha for area, km for length
  secondary_unit: string | null;    // ha, km
  status: MeasurementStatus;
  status_message: string | null;
  properties_data: Record<string, any> | null;
  geojson_geometry: GeoJsonGeometry | null;
  created_at: string;
}

export interface FileRecord {
  id: string;
  filename: string;
  file_format: 'KML' | 'SHAPEFILE_ZIP' | string;
  file_size_bytes: number;
  feature_count: number;
  polygon_count: number;
  linestring_count: number;
  point_count: number;
  other_count: number;
  successful_measurements: number;
  failed_measurements: number;
  crs: string;
  source_crs: string;
  measurement_crs: string;
  status: ProcessingStatus;
  error_message: string | null;
  bbox: BoundingBox | null;
  created_at: string;
  updated_at: string;
  features?: FeatureMeasurement[];
}

export interface ApiHealthStatus {
  status: string;
  service: string;
  version: string;
  database?: string;
}

export interface MeasurementsListResponse {
  file_id: string;
  filename: string;
  total_count: number;
  page: number;
  page_size: number;
  features: FeatureMeasurement[];
}

export type ActiveView = 
  | 'overview' 
  | 'workspace' 
  | 'history' 
  | 'table' 
  | 'docs' 
  | 'settings';
