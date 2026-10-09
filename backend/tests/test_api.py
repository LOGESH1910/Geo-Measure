"""Integration tests for FastAPI endpoints."""

import io
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_check_endpoint():
    """Verify health endpoint returns status 200 and expected schema."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "GeoMeasure Pro" in data["service"]


def test_upload_invalid_extension():
    """Verify non-kml/non-zip file is rejected with 400 Bad Request."""
    file_content = b"Some random text data"
    response = client.post(
        "/api/files/",
        files={"file": ("invalid.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


def test_upload_empty_file():
    """Verify 0-byte file is rejected."""
    response = client.post(
        "/api/files/",
        files={"file": ("empty.kml", io.BytesIO(b""), "application/vnd.google-earth.kml+xml")}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_upload_valid_kml():
    """Verify upload and processing of a valid KML file with Polygon."""
    kml_content = """<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Survey Lot 101</name>
      <description>Commercial zoned lot</description>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              13.400,52.510,0
              13.405,52.510,0
              13.405,52.515,0
              13.400,52.515,0
              13.400,52.510,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>
"""
    response = client.post(
        "/api/files/",
        files={"file": ("survey_lot.kml", io.BytesIO(kml_content.encode("utf-8")), "application/vnd.google-earth.kml+xml")}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["filename"] == "survey_lot.kml"
    assert data["feature_count"] == 1
    assert data["polygon_count"] == 1
    assert data["successful_measurements"] == 1
    assert "UTM Zone 33N" in data["measurement_crs"]
    assert len(data["features"]) == 1
    feat = data["features"][0]
    assert feat["geometry_type"] == "Polygon"
    assert feat["measurement_type"] == "AREA"
    assert feat["measurement_value"] > 0
    assert feat["measurement_unit"] == "m²"
    assert feat["secondary_value"] > 0
    assert feat["secondary_unit"] == "ha"

    # Test GET metadata
    file_id = data["id"]
    meta_res = client.get(f"/api/files/{file_id}/")
    assert meta_res.status_code == 200
    assert meta_res.json()["id"] == file_id

    # Test GET measurements
    meas_res = client.get(f"/api/files/{file_id}/measurements/")
    assert meas_res.status_code == 200
    assert meas_res.json()["total_count"] == 1


def test_get_nonexistent_file():
    """Verify 404 for invalid file ID."""
    response = client.get("/api/files/nonexistent-id-00000000/")
    assert response.status_code == 404
