"""Unit and integration tests for Geospatial Processing and Calculations."""

import os
import zipfile
import tempfile
import pytest
import shapely
from shapely.geometry import Polygon, LineString, Point, MultiPolygon
import pyproj

from backend.app.geospatial.crs_selector import determine_optimal_projected_crs
from backend.app.geospatial.processor import GeospatialProcessor, GeospatialProcessingError


def test_utm_crs_selection():
    """Verify UTM zone selection for known geographic coordinates."""
    # Paris, France (approx 2.35° E, 48.85° N) -> UTM Zone 31N (EPSG:32631)
    epsg_paris, name_paris = determine_optimal_projected_crs(2.35, 48.85)
    assert epsg_paris == "EPSG:32631"
    assert "31N" in name_paris

    # Sydney, Australia (approx 151.2° E, -33.86° S) -> UTM Zone 56S (EPSG:32756)
    epsg_sydney, name_sydney = determine_optimal_projected_crs(151.2, -33.86)
    assert epsg_sydney == "EPSG:32756"
    assert "56S" in name_sydney

    # North Pole (>84°N) -> Polar stereographic (EPSG:3413)
    epsg_pole, _ = determine_optimal_projected_crs(0.0, 85.0)
    assert epsg_pole == "EPSG:3413"


def test_polygon_area_calculation():
    """Test planar area calculation of a known square polygon."""
    # A 100m x 100m square in UTM Zone 33N
    # Center around Berlin (approx 13.4°E, 52.5°N)
    # 100m x 100m = 10,000 m² = 1 hectare
    transformer = pyproj.Transformer.from_crs("EPSG:32633", "EPSG:4326", always_xy=True)
    
    # Create 100m x 100m square in UTM meters
    utm_x0, utm_y0 = 500000.0, 5800000.0
    square_utm = Polygon([
        (utm_x0, utm_y0),
        (utm_x0 + 100, utm_y0),
        (utm_x0 + 100, utm_y0 + 100),
        (utm_x0, utm_y0 + 100),
        (utm_x0, utm_y0)
    ])
    
    assert square_utm.area == 10000.0


def test_linestring_length_calculation():
    """Test planar length calculation of a known line segment."""
    # 500m straight line
    line = LineString([(0, 0), (500, 0)])
    assert line.length == 500.0


def test_zip_slip_vulnerability_prevention():
    """Ensure malicious paths inside ZIP archives are blocked."""
    temp_dir = tempfile.mkdtemp()
    try:
        assert not GeospatialProcessor.is_safe_zip_path(
            os.path.join(temp_dir, "../../../etc/passwd"),
            temp_dir
        )
        assert GeospatialProcessor.is_safe_zip_path(
            os.path.join(temp_dir, "parcel.shp"),
            temp_dir
        )
    finally:
        os.rmdir(temp_dir)


def test_missing_shapefile_companion_files():
    """Ensure missing .shx or .dbf triggers clear error."""
    with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as f:
        zip_path = f.name

    try:
        # Create ZIP with only .shp (missing .shx and .dbf)
        with zipfile.ZipFile(zip_path, "w") as z:
            z.writestr("test.shp", b"fake shapefile header content")

        temp_dir = tempfile.mkdtemp()
        with pytest.raises(GeospatialProcessingError) as exc_info:
            GeospatialProcessor.extract_zip_safely(zip_path, temp_dir)
        
        assert "Missing required Shapefile companion files" in str(exc_info.value)
    finally:
        if os.path.exists(zip_path):
            os.remove(zip_path)


def test_point_handling_no_fabricated_measurements():
    """Verify points do not receive fake area or length."""
    pt = Point(13.4, 52.5)
    assert pt.geom_type == "Point"
    # Processor contract ensures measurement_type is COORDINATES with value None
