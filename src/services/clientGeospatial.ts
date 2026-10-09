/**
 * Client-Side Geospatial Engine & Projection Calculator
 * Implements WGS84 to Transverse Mercator (UTM) projection and Shoelace planar calculations.
 * Used for standalone validation and when FastAPI backend is being configured.
 */

import JSZip from 'jszip';
import { FileRecord, FeatureMeasurement } from '../types/geospatial';

// WGS84 Ellipsoid Constants
const WGS84_A = 6378137.0; // semi-major axis
const WGS84_F = 1 / 298.257223563; // flattening
const WGS84_B = WGS84_A * (1 - WGS84_F); // semi-minor axis
const WGS84_E2 = (WGS84_A * WGS84_A - WGS84_B * WGS84_B) / (WGS84_A * WGS84_A); // eccentricity squared
const UTM_K0 = 0.9996; // scale factor

/**
 * Projects WGS84 (lon, lat in degrees) to UTM (x, y in meters)
 */
export function projectToUtm(lonDeg: number, latDeg: number, zone: number): [number, number] {
  const latRad = (latDeg * Math.PI) / 180.0;
  const lonRad = (lonDeg * Math.PI) / 180.0;

  const centralLonDeg = (zone - 1) * 6 - 180 + 3;
  const centralLonRad = (centralLonDeg * Math.PI) / 180.0;

  const N = WGS84_A / Math.sqrt(1 - WGS84_E2 * Math.sin(latRad) * Math.sin(latRad));
  const T = Math.tan(latRad) * Math.tan(latRad);
  const C = (WGS84_E2 / (1 - WGS84_E2)) * Math.cos(latRad) * Math.cos(latRad);
  const A = Math.cos(latRad) * (lonRad - centralLonRad);

  // Meridian distance M
  const e4 = WGS84_E2 * WGS84_E2;
  const e6 = e4 * WGS84_E2;
  const M = WGS84_A * (
    (1 - WGS84_E2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * latRad -
    (3 * WGS84_E2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * Math.sin(2 * latRad) +
    (15 * e4 / 256 + 45 * e6 / 1024) * Math.sin(4 * latRad) -
    (35 * e6 / 3072) * Math.sin(6 * latRad)
  );

  const x = UTM_K0 * N * (
    A +
    (1 - T + C) * Math.pow(A, 3) / 6 +
    (5 - 18 * T + T * T + 72 * C - 58 * (WGS84_E2 / (1 - WGS84_E2))) * Math.pow(A, 5) / 120
  ) + 500000.0; // False Easting

  let y = UTM_K0 * (
    M +
    N * Math.tan(latRad) * (
      Math.pow(A, 2) / 2 +
      (5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4) / 24 +
      (61 - 58 * T + T * T + 600 * C - 330 * (WGS84_E2 / (1 - WGS84_E2))) * Math.pow(A, 6) / 720
    )
  );

  if (latDeg < 0) {
    y += 10000000.0; // False Northing for southern hemisphere
  }

  return [x, y];
}

/**
 * Calculates planar area in square meters using Shoelace formula on projected coordinates
 */
export function calculatePlanarPolygonArea(coords: [number, number][], zone: number): number {
  if (coords.length < 3) return 0;
  
  const projectedPts = coords.map(([lon, lat]) => projectToUtm(lon, lat, zone));
  let areaSum = 0;
  
  for (let i = 0; i < projectedPts.length - 1; i++) {
    const [x1, y1] = projectedPts[i];
    const [x2, y2] = projectedPts[i + 1];
    areaSum += (x1 * y2 - x2 * y1);
  }

  return Math.abs(areaSum) / 2.0;
}

/**
 * Calculates planar length in meters along projected coordinates
 */
export function calculatePlanarLineLength(coords: [number, number][], zone: number): number {
  if (coords.length < 2) return 0;

  const projectedPts = coords.map(([lon, lat]) => projectToUtm(lon, lat, zone));
  let totalLength = 0;

  for (let i = 0; i < projectedPts.length - 1; i++) {
    const [x1, y1] = projectedPts[i];
    const [x2, y2] = projectedPts[i + 1];
    const dx = x2 - x1;
    const dy = y2 - y1;
    totalLength += Math.sqrt(dx * dx + dy * dy);
  }

  return totalLength;
}

/**
 * Parses client-uploaded KML text
 */
export function parseKmlString(kmlText: string, filename: string): FileRecord {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(kmlText, 'text/xml');

  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error(`XML parsing error in KML file: ${parserError.textContent?.slice(0, 100)}`);
  }

  const placemarks = Array.from(xmlDoc.querySelectorAll('Placemark'));
  if (placemarks.length === 0) {
    throw new Error('No Placemark elements found in the uploaded KML.');
  }

  const fileId = `kml_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const features: FeatureMeasurement[] = [];

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  let polygonCount = 0;
  let linestringCount = 0;
  let pointCount = 0;
  let otherCount = 0;

  placemarks.forEach((pm, index) => {
    const name = pm.querySelector('name')?.textContent || `Feature ${index + 1}`;
    const description = pm.querySelector('description')?.textContent || '';
    
    // Extract properties
    const properties: Record<string, any> = {
      name,
      description
    };

    const extendedData = pm.querySelectorAll('ExtendedData Data');
    extendedData.forEach(d => {
      const key = d.getAttribute('name');
      const val = d.querySelector('value')?.textContent;
      if (key && val) properties[key] = val;
    });

    // Check Geometry
    const polyEl = pm.querySelector('Polygon coordinates');
    const lineEl = pm.querySelector('LineString coordinates');
    const pointEl = pm.querySelector('Point coordinates');

    if (polyEl && polyEl.textContent) {
      const rawCoords = polyEl.textContent.trim().split(/\s+/);
      const coords: [number, number][] = [];
      rawCoords.forEach(str => {
        const parts = str.split(',').map(Number);
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          coords.push([parts[0], parts[1]]);
          minX = Math.min(minX, parts[0]);
          maxX = Math.max(maxX, parts[0]);
          minY = Math.min(minY, parts[1]);
          maxY = Math.max(maxY, parts[1]);
        }
      });

      if (coords.length >= 3) {
        polygonCount++;
        features.push({
          id: `feat_${fileId}_${index + 1}`,
          file_id: fileId,
          feature_id: name.toUpperCase().replace(/\s+/g, '_'),
          geometry_type: 'Polygon',
          measurement_type: 'AREA',
          measurement_value: null, // Will calculate after zone detection
          measurement_unit: 'm²',
          secondary_value: null,
          secondary_unit: 'ha',
          status: 'SUCCESS',
          status_message: 'Planar area calculated via UTM projection.',
          properties_data: properties,
          geojson_geometry: {
            type: 'Polygon',
            coordinates: [coords]
          },
          created_at: new Date().toISOString()
        });
      }
    } else if (lineEl && lineEl.textContent) {
      const rawCoords = lineEl.textContent.trim().split(/\s+/);
      const coords: [number, number][] = [];
      rawCoords.forEach(str => {
        const parts = str.split(',').map(Number);
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          coords.push([parts[0], parts[1]]);
          minX = Math.min(minX, parts[0]);
          maxX = Math.max(maxX, parts[0]);
          minY = Math.min(minY, parts[1]);
          maxY = Math.max(maxY, parts[1]);
        }
      });

      if (coords.length >= 2) {
        linestringCount++;
        features.push({
          id: `feat_${fileId}_${index + 1}`,
          file_id: fileId,
          feature_id: name.toUpperCase().replace(/\s+/g, '_'),
          geometry_type: 'LineString',
          measurement_type: 'LENGTH',
          measurement_value: null,
          measurement_unit: 'm',
          secondary_value: null,
          secondary_unit: 'km',
          status: 'SUCCESS',
          status_message: 'Planar length calculated via UTM projection.',
          properties_data: properties,
          geojson_geometry: {
            type: 'LineString',
            coordinates: coords
          },
          created_at: new Date().toISOString()
        });
      }
    } else if (pointEl && pointEl.textContent) {
      const parts = pointEl.textContent.trim().split(',').map(Number);
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        pointCount++;
        minX = Math.min(minX, parts[0]);
        maxX = Math.max(maxX, parts[0]);
        minY = Math.min(minY, parts[1]);
        maxY = Math.max(maxY, parts[1]);

        features.push({
          id: `feat_${fileId}_${index + 1}`,
          file_id: fileId,
          feature_id: name.toUpperCase().replace(/\s+/g, '_'),
          geometry_type: 'Point',
          measurement_type: 'COORDINATES',
          measurement_value: null,
          measurement_unit: 'deg',
          secondary_value: null,
          secondary_unit: null,
          status: 'SUCCESS',
          status_message: 'Point coordinates recorded; planar area and length not applicable.',
          properties_data: properties,
          geojson_geometry: {
            type: 'Point',
            coordinates: [parts[0], parts[1]]
          },
          created_at: new Date().toISOString()
        });
      }
    } else {
      otherCount++;
      features.push({
        id: `feat_${fileId}_${index + 1}`,
        file_id: fileId,
        feature_id: name.toUpperCase().replace(/\s+/g, '_'),
        geometry_type: 'Unknown',
        measurement_type: 'NONE',
        measurement_value: null,
        measurement_unit: null,
        secondary_value: null,
        secondary_unit: null,
        status: 'UNSUPPORTED',
        status_message: 'Unsupported or unreadable geometry structure.',
        properties_data: properties,
        geojson_geometry: null,
        created_at: new Date().toISOString()
      });
    }
  });

  if (features.length === 0) {
    throw new Error('No valid geometry coordinates found in KML placemarks.');
  }

  // Calculate UTM Zone from centroid
  const centerLon = (minX + maxX) / 2;
  const centerLat = (minY + maxY) / 2;
  const zone = Math.max(1, Math.min(60, Math.floor((centerLon + 180) / 6) + 1));
  const isNorth = centerLat >= 0;
  const epsgCode = isNorth ? 32600 + zone : 32700 + zone;
  const crsLabel = `WGS 84 / UTM Zone ${zone}${isNorth ? 'N' : 'S'} (EPSG:${epsgCode})`;

  // Calculate planar measurements for all features
  features.forEach(feat => {
    if (feat.geometry_type === 'Polygon' && feat.geojson_geometry) {
      const ring = feat.geojson_geometry.coordinates[0];
      const areaM2 = calculatePlanarPolygonArea(ring, zone);
      feat.measurement_value = Math.round(areaM2 * 100) / 100;
      feat.secondary_value = Math.round((areaM2 / 10000) * 10000) / 10000;
    } else if (feat.geometry_type === 'LineString' && feat.geojson_geometry) {
      const pts = feat.geojson_geometry.coordinates;
      const lenM = calculatePlanarLineLength(pts, zone);
      feat.measurement_value = Math.round(lenM * 100) / 100;
      feat.secondary_value = Math.round((lenM / 1000) * 10000) / 10000;
    }
  });

  return {
    id: fileId,
    filename,
    file_format: 'KML',
    file_size_bytes: kmlText.length,
    feature_count: features.length,
    polygon_count: polygonCount,
    linestring_count: linestringCount,
    point_count: pointCount,
    other_count: otherCount,
    successful_measurements: features.filter(f => f.status === 'SUCCESS').length,
    failed_measurements: features.filter(f => f.status !== 'SUCCESS').length,
    crs: 'EPSG:4326 (WGS 84)',
    source_crs: 'EPSG:4326',
    measurement_crs: crsLabel,
    status: 'COMPLETED',
    error_message: null,
    bbox: {
      min_x: minX,
      min_y: minY,
      max_x: maxX,
      max_y: maxY
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    features
  };
}

/**
 * Validates companion files in a Shapefile ZIP archive
 */
export async function validateShapefileZip(file: File): Promise<{ isValid: boolean; filesFound: string[]; error?: string }> {
  try {
    const zip = await JSZip.loadAsync(file);
    const filenames = Object.keys(zip.files).filter(name => !name.startsWith('__MACOSX/'));
    
    const shpFile = filenames.find(f => f.toLowerCase().endsWith('.shp'));
    if (!shpFile) {
      return { isValid: false, filesFound: filenames, error: "No Shapefile (.shp) found in the ZIP archive." };
    }

    const baseName = shpFile.replace(/\.[^/.]+$/, "");
    const hasShx = filenames.some(f => f.toLowerCase() === `${baseName.toLowerCase()}.shx`);
    const hasDbf = filenames.some(f => f.toLowerCase() === `${baseName.toLowerCase()}.dbf`);

    if (!hasShx || !hasDbf) {
      const missing = [];
      if (!hasShx) missing.push('.shx (index file)');
      if (!hasDbf) missing.push('.dbf (attribute table)');
      return {
        isValid: false,
        filesFound: filenames,
        error: `Missing required Shapefile companion files: ${missing.join(', ')}`
      };
    }

    return { isValid: true, filesFound: filenames };
  } catch (err: any) {
    return { isValid: false, filesFound: [], error: `Corrupt or unreadable ZIP archive: ${err.message}` };
  }
}
