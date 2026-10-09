"""Pydantic schemas for request and response validation."""

from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    min_x: Optional[float] = None
    min_y: Optional[float] = None
    max_x: Optional[float] = None
    max_y: Optional[float] = None


class FeatureMeasurementBase(BaseModel):
    feature_id: str
    geometry_type: str
    measurement_type: str
    measurement_value: Optional[float] = None
    measurement_unit: Optional[str] = None
    secondary_value: Optional[float] = None
    secondary_unit: Optional[str] = None
    status: str
    status_message: Optional[str] = None
    properties_data: Optional[Dict[str, Any]] = None
    geojson_geometry: Optional[Dict[str, Any]] = None


class FeatureMeasurementResponse(FeatureMeasurementBase):
    id: str
    file_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class FileResponse(BaseModel):
    id: str
    filename: str
    file_format: str
    file_size_bytes: int
    feature_count: int
    polygon_count: int
    linestring_count: int
    point_count: int
    other_count: int
    successful_measurements: int
    failed_measurements: int
    crs: str = Field(..., description="Source coordinate reference system")
    source_crs: str
    measurement_crs: str
    status: str
    error_message: Optional[str] = None
    bbox: Optional[BoundingBox] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FileWithFeaturesResponse(FileResponse):
    features: List[FeatureMeasurementResponse] = []


class MeasurementsListResponse(BaseModel):
    file_id: str
    filename: str
    total_count: int
    page: int
    page_size: int
    features: List[FeatureMeasurementResponse]
