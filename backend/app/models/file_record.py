"""SQLAlchemy models for files and feature measurements."""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    DateTime,
    Text,
    ForeignKey,
    JSON,
    Index
)
from sqlalchemy.orm import relationship
from backend.app.db.session import Base


class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String(255), nullable=False)
    file_format = Column(String(50), nullable=False)  # KML, SHAPEFILE_ZIP
    file_size_bytes = Column(Integer, nullable=False, default=0)
    
    feature_count = Column(Integer, nullable=False, default=0)
    polygon_count = Column(Integer, nullable=False, default=0)
    linestring_count = Column(Integer, nullable=False, default=0)
    point_count = Column(Integer, nullable=False, default=0)
    other_count = Column(Integer, nullable=False, default=0)
    
    successful_measurements = Column(Integer, nullable=False, default=0)
    failed_measurements = Column(Integer, nullable=False, default=0)
    
    source_crs = Column(String(100), nullable=False, default="EPSG:4326")
    measurement_crs = Column(String(100), nullable=False, default="EPSG:3857")
    
    status = Column(String(50), nullable=False, default="COMPLETED")  # COMPLETED, FAILED, PROCESSING
    error_message = Column(Text, nullable=True)
    
    # Bounding Box (WGS84 min_x, min_y, max_x, max_y)
    bbox_min_x = Column(Float, nullable=True)
    bbox_min_y = Column(Float, nullable=True)
    bbox_max_x = Column(Float, nullable=True)
    bbox_max_y = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    features = relationship(
        "FeatureMeasurement",
        back_populates="file",
        cascade="all, delete-orphan",
        order_by="FeatureMeasurement.created_at"
    )

    __table_args__ = (
        Index("ix_uploaded_files_created_at", "created_at"),
        Index("ix_uploaded_files_status", "status"),
    )


class FeatureMeasurement(Base):
    __tablename__ = "feature_measurements"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    file_id = Column(String(36), ForeignKey("uploaded_files.id", ondelete="CASCADE"), nullable=False)
    
    feature_id = Column(String(100), nullable=False)
    geometry_type = Column(String(50), nullable=False)  # Polygon, LineString, Point, etc.
    
    measurement_type = Column(String(50), nullable=False)  # AREA, LENGTH, COORDINATES, NONE
    measurement_value = Column(Float, nullable=True)  # Primary value (sq meters or meters)
    measurement_unit = Column(String(20), nullable=True)  # m², m
    
    secondary_value = Column(Float, nullable=True)  # ha or km
    secondary_unit = Column(String(20), nullable=True)  # ha, km
    
    status = Column(String(50), nullable=False, default="SUCCESS")  # SUCCESS, UNSUPPORTED, ERROR
    status_message = Column(Text, nullable=True)
    
    properties_data = Column(JSON, nullable=True)
    geojson_geometry = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    file = relationship("UploadedFile", back_populates="features")

    __table_args__ = (
        Index("ix_feature_measurements_file_id", "file_id"),
        Index("ix_feature_measurements_geom_type", "geometry_type"),
        Index("ix_feature_measurements_status", "status"),
    )
