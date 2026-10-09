"""API routes for geospatial file upload, inspection, and measurement."""

import os
import tempfile
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.models.file_record import UploadedFile, FeatureMeasurement
from backend.app.schemas.file import (
    FileResponse,
    FileWithFeaturesResponse,
    MeasurementsListResponse,
    FeatureMeasurementResponse,
    BoundingBox
)
from backend.app.geospatial.processor import GeospatialProcessor, GeospatialProcessingError
from backend.app.core.config import settings

router = APIRouter(prefix="/files", tags=["Files & Measurements"])


def _to_file_response(record: UploadedFile) -> FileResponse:
    bbox = None
    if record.bbox_min_x is not None:
        bbox = BoundingBox(
            min_x=record.bbox_min_x,
            min_y=record.bbox_min_y,
            max_x=record.bbox_max_x,
            max_y=record.bbox_max_y
        )

    return FileResponse(
        id=record.id,
        filename=record.filename,
        file_format=record.file_format,
        file_size_bytes=record.file_size_bytes,
        feature_count=record.feature_count,
        polygon_count=record.polygon_count,
        linestring_count=record.linestring_count,
        point_count=record.point_count,
        other_count=record.other_count,
        successful_measurements=record.successful_measurements,
        failed_measurements=record.failed_measurements,
        crs=record.source_crs,
        source_crs=record.source_crs,
        measurement_crs=record.measurement_crs,
        status=record.status,
        error_message=record.error_message,
        bbox=bbox,
        created_at=record.created_at,
        updated_at=record.updated_at
    )


@router.post("/", response_model=FileWithFeaturesResponse, status_code=status.HTTP_201_CREATED)
async def upload_and_process_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload and process a KML file or ZIP Shapefile archive.
    Performs validation, CRS projection, and accurate planar area/length calculations.
    """
    # 1. Validate file presence and filename
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file has no filename.")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".kml", ".zip"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Only .kml and .zip Shapefiles are supported."
        )

    # 2. Stream to temporary file and enforce size limits
    temp_fd, temp_path = tempfile.mkstemp(suffix=ext, prefix="upload_")
    total_bytes = 0

    try:
        with os.fdopen(temp_fd, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                total_bytes += len(chunk)
                if total_bytes > settings.MAX_UPLOAD_SIZE_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail=f"File exceeds maximum upload size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)}MB."
                    )
                buffer.write(chunk)

        if total_bytes == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")

        # 3. Geospatial Processing with GeoPandas & Shapely
        try:
            result = GeospatialProcessor.process_file(temp_path, file.filename)
        except GeospatialProcessingError as gpe:
            raise HTTPException(status_code=422, detail=str(gpe))
        except Exception as ex:
            raise HTTPException(status_code=500, detail=f"Unexpected geospatial processing error: {str(ex)}")

        # 4. Save to Database
        file_record = UploadedFile(
            id=str(uuid.uuid4()),
            filename=file.filename,
            file_format=result["file_format"],
            file_size_bytes=total_bytes,
            feature_count=result["feature_count"],
            polygon_count=result["polygon_count"],
            linestring_count=result["linestring_count"],
            point_count=result["point_count"],
            other_count=result["other_count"],
            successful_measurements=result["successful_measurements"],
            failed_measurements=result["failed_measurements"],
            source_crs=result["source_crs"],
            measurement_crs=result["measurement_crs"],
            status=result["status"],
            bbox_min_x=result["bbox"]["min_x"],
            bbox_min_y=result["bbox"]["min_y"],
            bbox_max_x=result["bbox"]["max_x"],
            bbox_max_y=result["bbox"]["max_y"]
        )
        db.add(file_record)
        db.flush()

        features_models = []
        for feat in result["features"]:
            feat_rec = FeatureMeasurement(
                id=str(uuid.uuid4()),
                file_id=file_record.id,
                feature_id=feat["feature_id"],
                geometry_type=feat["geometry_type"],
                measurement_type=feat["measurement_type"],
                measurement_value=feat["measurement_value"],
                measurement_unit=feat["measurement_unit"],
                secondary_value=feat["secondary_value"],
                secondary_unit=feat["secondary_unit"],
                status=feat["status"],
                status_message=feat["status_message"],
                properties_data=feat["properties_data"],
                geojson_geometry=feat["geojson_geometry"]
            )
            features_models.append(feat_rec)
            db.add(feat_rec)

        db.commit()
        db.refresh(file_record)

        base_res = _to_file_response(file_record)
        return FileWithFeaturesResponse(
            **base_res.model_dump(),
            features=[FeatureMeasurementResponse.model_validate(f) for f in features_models]
        )

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.get("/", response_model=List[FileResponse])
def list_uploaded_files(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve list of analyzed files."""
    query = db.query(UploadedFile)
    if search:
        query = query.filter(UploadedFile.filename.ilike(f"%{search}%"))
    
    records = query.order_by(UploadedFile.created_at.desc()).offset(skip).limit(limit).all()
    return [_to_file_response(r) for r in records]


@router.get("/{file_id}/", response_model=FileResponse)
def get_file_metadata(file_id: str, db: Session = Depends(get_db)):
    """Retrieve file metadata and processing summary by ID."""
    record = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"File with ID '{file_id}' not found.")
    return _to_file_response(record)


@router.get("/{file_id}/measurements/", response_model=MeasurementsListResponse)
def get_file_measurements(
    file_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    geometry_type: Optional[str] = Query(None, description="Filter by geometry type"),
    status: Optional[str] = Query(None, description="Filter by status (SUCCESS, UNSUPPORTED, ERROR)"),
    db: Session = Depends(get_db)
):
    """Retrieve feature measurements for a specific file with optional filtering."""
    file_record = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail=f"File with ID '{file_id}' not found.")

    query = db.query(FeatureMeasurement).filter(FeatureMeasurement.file_id == file_id)

    if geometry_type:
        query = query.filter(FeatureMeasurement.geometry_type.ilike(f"%{geometry_type}%"))
    if status:
        query = query.filter(FeatureMeasurement.status == status.upper())

    total_count = query.count()
    offset = (page - 1) * page_size
    items = query.order_by(FeatureMeasurement.created_at.asc()).offset(offset).limit(page_size).all()

    return MeasurementsListResponse(
        file_id=file_id,
        filename=file_record.filename,
        total_count=total_count,
        page=page,
        page_size=page_size,
        features=[FeatureMeasurementResponse.model_validate(item) for item in items]
    )


@router.delete("/{file_id}/", status_code=status.HTTP_204_NO_CONTENT)
def delete_file_record(file_id: str, db: Session = Depends(get_db)):
    """Delete an uploaded file and all its associated measurements."""
    file_record = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail=f"File with ID '{file_id}' not found.")

    db.delete(file_record)
    db.commit()
    return None
