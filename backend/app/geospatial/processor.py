"""Geospatial file processor using GeoPandas, Shapely, and PyProj."""

import os
import shutil
import zipfile
import tempfile
import json
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import shapely
from shapely.geometry import mapping, shape
from shapely.ops import transform
import pyproj

from backend.app.geospatial.crs_selector import determine_optimal_projected_crs


class GeospatialProcessingError(Exception):
    """Custom exception for geospatial processing failures."""
    pass


class GeospatialProcessor:
    """Processes KML and Zipped Shapefiles, computes projected planar measurements."""

    @staticmethod
    def is_safe_zip_path(target_path: str, destination_dir: str) -> bool:
        """Prevents Zip Slip directory traversal vulnerability."""
        dest_abs = os.path.abspath(destination_dir)
        target_abs = os.path.abspath(target_path)
        return os.path.commonpath([dest_abs, target_abs]) == dest_abs

    @classmethod
    def extract_zip_safely(cls, zip_path: str, extract_dir: str) -> List[str]:
        """
        Safely extracts ZIP archive contents, validating against path traversal
        and checking for required shapefile companion files.
        """
        with zipfile.ZipFile(zip_path, 'r') as archive:
            # Check for zip bomb / excessive file count
            if len(archive.infolist()) > 500:
                raise GeospatialProcessingError("Archive contains too many files (>500).")
            
            total_uncompressed_size = sum(file_info.file_size for file_info in archive.infolist())
            if total_uncompressed_size > 200 * 1024 * 1024:  # 200 MB
                raise GeospatialProcessingError("Archive uncompressed size exceeds 200MB limit.")

            for file_info in archive.infolist():
                destination = os.path.join(extract_dir, file_info.filename)
                if not cls.is_safe_zip_path(destination, extract_dir):
                    raise GeospatialProcessingError(f"Malicious path detected in archive: {file_info.filename}")
                archive.extract(file_info, extract_dir)

        # Look for .shp file
        shp_files = list(Path(extract_dir).rglob("*.shp"))
        if not shp_files:
            raise GeospatialProcessingError("No Shapefile (.shp) found in the ZIP archive.")

        main_shp = shp_files[0]
        base_stem = main_shp.stem
        parent_dir = main_shp.parent

        # Verify companion files
        has_shx = (parent_dir / f"{base_stem}.shx").exists() or (parent_dir / f"{base_stem.lower()}.shx").exists()
        has_dbf = (parent_dir / f"{base_stem}.dbf").exists() or (parent_dir / f"{base_stem.lower()}.dbf").exists()
        
        if not (has_shx and has_dbf):
            missing = []
            if not has_shx:
                missing.append(".shx (index file)")
            if not has_dbf:
                missing.append(".dbf (attribute table)")
            raise GeospatialProcessingError(f"Missing required Shapefile companion files: {', '.join(missing)}")

        return [str(main_shp)]

    @classmethod
    def read_dataset(cls, file_path: str) -> Tuple[List[Dict[str, Any]], str]:
        """
        Reads geospatial features and metadata from Shapefile or KML.
        Returns a list of feature dictionaries and source CRS string.
        """
        ext = os.path.splitext(file_path)[1].lower()
        
        # Try reading with GeoPandas / Fiona first
        try:
            import geopandas as gpd
            if ext == ".kml":
                import fiona
                # Enable KML driver in fiona if available
                fiona.drvsupport.supported_drivers['KML'] = 'rw'
                fiona.drvsupport.supported_drivers['LIBKML'] = 'rw'
            
            gdf = gpd.read_file(file_path)
            
            source_crs = "EPSG:4326"
            if gdf.crs:
                source_crs = str(gdf.crs)
            
            features = []
            for idx, row in gdf.iterrows():
                geom = row.geometry
                props = {k: v for k, v in row.items() if k != "geometry" and v is not None}
                # Sanitize properties to JSON-serializable primitives
                clean_props = {}
                for k, v in props.items():
                    try:
                        json.dumps({k: v})
                        clean_props[k] = v
                    except (TypeError, OverflowError):
                        clean_props[k] = str(v)

                features.append({
                    "id": str(idx),
                    "geometry": geom,
                    "properties": clean_props
                })
            return features, source_crs

        except Exception as e:
            # Fallback for KML via fast XML parsing if geopandas KML driver is missing
            if ext == ".kml":
                return cls._parse_kml_fallback(file_path)
            raise GeospatialProcessingError(f"Failed to read dataset: {str(e)}")

    @classmethod
    def _parse_kml_fallback(cls, file_path: str) -> Tuple[List[Dict[str, Any]], str]:
        """Fallback KML parser using xml.etree and shapely."""
        import xml.etree.ElementTree as ET
        from shapely.geometry import Point, LineString, Polygon

        tree = ET.parse(file_path)
        root = tree.getroot()
        
        # Strip XML namespaces for easier matching
        for elem in root.iter():
            if '}' in elem.tag:
                elem.tag = elem.tag.split('}', 1)[1]

        placemarks = root.findall(".//Placemark")
        features = []

        for idx, pm in enumerate(placemarks):
            name_el = pm.find("name")
            desc_el = pm.find("description")
            props = {
                "name": name_el.text if name_el is not None and name_el.text else f"Feature {idx + 1}",
                "description": desc_el.text if desc_el is not None else ""
            }

            # ExtendedData properties if any
            ext_data = pm.find(".//ExtendedData")
            if ext_data is not None:
                for data in ext_data.findall(".//Data"):
                    k = data.get("name")
                    val_el = data.find("value")
                    if k and val_el is not None and val_el.text:
                        props[k] = val_el.text

            geom = None
            poly = pm.find(".//Polygon")
            line = pm.find(".//LineString")
            pt = pm.find(".//Point")

            if poly is not None:
                coords_el = poly.find(".//coordinates")
                if coords_el is not None and coords_el.text:
                    pts = []
                    for raw in coords_el.text.strip().split():
                        parts = raw.split(",")
                        if len(parts) >= 2:
                            pts.append((float(parts[0]), float(parts[1])))
                    if len(pts) >= 3:
                        geom = Polygon(pts)
            elif line is not None:
                coords_el = line.find(".//coordinates")
                if coords_el is not None and coords_el.text:
                    pts = []
                    for raw in coords_el.text.strip().split():
                        parts = raw.split(",")
                        if len(parts) >= 2:
                            pts.append((float(parts[0]), float(parts[1])))
                    if len(pts) >= 2:
                        geom = LineString(pts)
            elif pt is not None:
                coords_el = pt.find(".//coordinates")
                if coords_el is not None and coords_el.text:
                    parts = coords_el.text.strip().split(",")
                    if len(parts) >= 2:
                        geom = Point(float(parts[0]), float(parts[1]))

            if geom is not None:
                features.append({
                    "id": str(idx),
                    "geometry": geom,
                    "properties": props
                })

        return features, "EPSG:4326"

    @classmethod
    def process_file(cls, file_path: str, filename: str) -> Dict[str, Any]:
        """
        Complete processing workflow:
        1. Extract archive or parse file
        2. Detect CRS
        3. Project geometries to optimal projected CRS
        4. Calculate planar measurements
        5. Return structured analysis payload
        """
        temp_dir = tempfile.mkdtemp(prefix="geomeasure_")
        try:
            ext = os.path.splitext(filename)[1].lower()
            if ext == ".zip":
                shapefile_paths = cls.extract_zip_safely(file_path, temp_dir)
                target_file = shapefile_paths[0]
                file_format = "SHAPEFILE_ZIP"
            elif ext == ".kml":
                target_file = file_path
                file_format = "KML"
            else:
                raise GeospatialProcessingError(f"Unsupported file format: {ext}. Only .kml and .zip Shapefiles are supported.")

            raw_features, source_crs = cls.read_dataset(target_file)
            
            if not raw_features:
                raise GeospatialProcessingError("No readable geographic features were found in the uploaded file.")

            # Compute bounding box and centroid in WGS84 for optimal CRS selection
            # Setup transformation from source_crs to WGS84 (EPSG:4326)
            try:
                src_proj = pyproj.CRS(source_crs)
            except Exception:
                src_proj = pyproj.CRS("EPSG:4326")
                source_crs = "EPSG:4326"

            wgs84_proj = pyproj.CRS("EPSG:4326")
            to_wgs84_transformer = None
            if src_proj != wgs84_proj:
                to_wgs84_transformer = pyproj.Transformer.from_crs(src_proj, wgs84_proj, always_xy=True).transform

            wgs84_features = []
            all_min_x, all_min_y, all_max_x, all_max_y = float("inf"), float("inf"), float("-inf"), float("-inf")

            for feat in raw_features:
                geom = feat["geometry"]
                if geom is None or geom.is_empty:
                    continue

                if to_wgs84_transformer:
                    try:
                        geom_wgs84 = transform(to_wgs84_transformer, geom)
                    except Exception:
                        geom_wgs84 = geom
                else:
                    geom_wgs84 = geom

                bounds = geom_wgs84.bounds
                all_min_x = min(all_min_x, bounds[0])
                all_min_y = min(all_min_y, bounds[1])
                all_max_x = max(all_max_x, bounds[2])
                all_max_y = max(all_max_y, bounds[3])

                wgs84_features.append({
                    "id": feat["id"],
                    "geometry": geom_wgs84,
                    "properties": feat["properties"]
                })

            if not wgs84_features:
                raise GeospatialProcessingError("All features had empty or invalid geometries.")

            center_lon = (all_min_x + all_max_x) / 2.0
            center_lat = (all_min_y + all_max_y) / 2.0

            # Determine optimal projected CRS (UTM or Polar)
            projected_crs_code, projected_crs_name = determine_optimal_projected_crs(center_lon, center_lat)
            projected_proj = pyproj.CRS(projected_crs_code)
            
            # Transformer from WGS84 to Projected planar CRS
            wgs84_to_proj = pyproj.Transformer.from_crs(wgs84_proj, projected_proj, always_xy=True).transform

            # Process each feature and calculate planar measurements
            feature_results = []
            polygon_count = 0
            linestring_count = 0
            point_count = 0
            other_count = 0
            successful_measurements = 0
            failed_measurements = 0

            for idx, feat in enumerate(wgs84_features):
                geom = feat["geometry"]
                geom_type = geom.geom_type
                props = feat["properties"]

                # Ensure valid geometry
                if not geom.is_valid:
                    try:
                        geom = shapely.make_valid(geom)
                        geom_type = geom.geom_type
                    except Exception:
                        pass

                measurement_type = "NONE"
                measurement_value = None
                measurement_unit = None
                secondary_value = None
                secondary_unit = None
                status = "SUCCESS"
                status_message = None

                try:
                    # Transform geometry to projected CRS for planar calculation
                    geom_proj = transform(wgs84_to_proj, geom)

                    if geom_type in ["Polygon", "MultiPolygon"]:
                        polygon_count += 1
                        measurement_type = "AREA"
                        # Planar area in square meters
                        area_sq_m = round(geom_proj.area, 2)
                        measurement_value = area_sq_m
                        measurement_unit = "m²"
                        # Secondary in hectares
                        secondary_value = round(area_sq_m / 10000.0, 4)
                        secondary_unit = "ha"
                        status = "SUCCESS"
                        successful_measurements += 1

                    elif geom_type in ["LineString", "MultiLineString"]:
                        linestring_count += 1
                        measurement_type = "LENGTH"
                        # Planar length in meters
                        length_m = round(geom_proj.length, 2)
                        measurement_value = length_m
                        measurement_unit = "m"
                        # Secondary in kilometers
                        secondary_value = round(length_m / 1000.0, 4)
                        secondary_unit = "km"
                        status = "SUCCESS"
                        successful_measurements += 1

                    elif geom_type in ["Point", "MultiPoint"]:
                        point_count += 1
                        measurement_type = "COORDINATES"
                        # Point has no area and no length!
                        measurement_value = None
                        measurement_unit = "deg"
                        status = "SUCCESS"
                        status_message = "Point coordinates recorded; area and length not applicable."
                        successful_measurements += 1

                    else:
                        other_count += 1
                        measurement_type = "NONE"
                        status = "UNSUPPORTED"
                        status_message = f"Geometry type '{geom_type}' is not supported for automatic planar measurement."
                        failed_measurements += 1

                except Exception as ex:
                    status = "ERROR"
                    status_message = f"Projection or measurement calculation failed: {str(ex)}"
                    failed_measurements += 1

                feature_results.append({
                    "feature_id": f"feat_{idx + 1}",
                    "geometry_type": geom_type,
                    "measurement_type": measurement_type,
                    "measurement_value": measurement_value,
                    "measurement_unit": measurement_unit,
                    "secondary_value": secondary_value,
                    "secondary_unit": secondary_unit,
                    "status": status,
                    "status_message": status_message,
                    "properties_data": props,
                    "geojson_geometry": mapping(geom)
                })

            return {
                "filename": filename,
                "file_format": file_format,
                "feature_count": len(feature_results),
                "polygon_count": polygon_count,
                "linestring_count": linestring_count,
                "point_count": point_count,
                "other_count": other_count,
                "successful_measurements": successful_measurements,
                "failed_measurements": failed_measurements,
                "source_crs": source_crs,
                "measurement_crs": f"{projected_crs_name} ({projected_crs_code})",
                "bbox": {
                    "min_x": round(all_min_x, 6),
                    "min_y": round(all_min_y, 6),
                    "max_x": round(all_max_x, 6),
                    "max_y": round(all_max_y, 6)
                },
                "status": "COMPLETED",
                "features": feature_results
            }

        finally:
            # Safely remove extracted files
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir, ignore_errors=True)
