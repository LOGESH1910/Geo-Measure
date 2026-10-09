# GeoMeasure Pro — Geospatial File Analysis & Measurement Workspace

> **Understand every feature. Measure every boundary.**

GeoMeasure Pro is a high-performance geospatial analysis web application engineered for GIS analysts, surveyors, civil engineers, and infrastructure planners. It allows users to upload **KML** files and **ZIP archives containing Shapefiles**, inspect geographic features, interact with geometries on an interactive Leaflet map, and calculate mathematically accurate projected planar measurements (polygon areas, line lengths, and geodetic point coordinates).

---

## 1. System Architecture

```
                       +-----------------------------------+
                       |         React + Vite SPA          |
                       | (TypeScript, Leaflet, Tailwind v4)|
                       +-----------------+-----------------+
                                         | HTTP / Multipart
                                         v
                       +-----------------------------------+
                       |       FastAPI Backend Engine      |
                       |       (Python 3.12+, Uvicorn)     |
                       +-----------------+-----------------+
                                         |
            +----------------------------+----------------------------+
            |                                                         |
            v                                                         v
+-------------------------+                               +-------------------------+
|   Geospatial Processor  |                               |   PostgreSQL / SQLite   |
| (GeoPandas, Shapely,    |                               |  (SQLAlchemy + Alembic  |
|  PyProj UTM Projection) |                               |   Relational Storage)   |
+-------------------------+                               +-------------------------+
```

### Key Components

- **Interactive GIS Workspace (`/src/components/workspace/`):**
  - **Left Panel (Feature Explorer):** Searchable, filterable list of all dataset geometries with type indicators and quick measurements.
  - **Center Panel (Interactive Leaflet Map):** Multi-basemap support (OpenStreetMap, Esri Satellite, Carto Positron), auto-bounding box framing, scale bar, and visual selection highlighting.
  - **Right Panel (Feature Inspector):** Displays calculated planar area ($m^2$, $ha$, $km^2$) or length ($m$, $km$), coordinates for points, source vs. projected CRS breakdown, educational projection explanation, and full feature properties.
  - **Real-Time Synchronization:** Selecting a feature in the table, explorer, or map updates all views simultaneously.

- **FastAPI Python Backend (`/backend/`):**
  - **`app/geospatial/crs_selector.py`:** Automatically determines the optimal Universal Transverse Mercator (UTM) 6-degree zone or polar stereographic projection based on the dataset centroid.
  - **`app/geospatial/processor.py`:** Safe ZIP extraction (prevents Zip Slip path traversal and checks for required companion files `.shp`, `.shx`, `.dbf`, `.prj`), Shapely geometry validation and projection, planar metric calculations, and graceful handling of unsupported geometry types.
  - **`app/api/routes/files.py`:** Endpoints for multipart upload, metadata summary, paginated feature measurements, and history management.
  - **`app/models/file_record.py`:** Relational database schema with CASCADE relationships.

---

## 2. API Contract & Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/files/` | Upload and process a `.kml` or `.zip` Shapefile (multipart/form-data) |
| `GET` | `/api/files/{id}/` | Retrieve file metadata, bounding box, CRS, and measurement summary |
| `GET` | `/api/files/{id}/measurements/` | Retrieve individual feature measurements with pagination and filters |
| `GET` | `/api/files/` | List all processed files in database history |
| `DELETE` | `/api/files/{id}/` | Delete file record and associated feature measurements |
| `GET` | `/api/health` | Service health status and readiness check |

Interactive OpenAPI Swagger documentation is available at `http://localhost:8000/docs` and ReDoc at `http://localhost:8000/redoc`.

---

## 3. Geospatial Projection & Measurement Methodology

### Why Angular Degrees Cannot Calculate Metric Areas
Geographic Coordinate Systems (such as `EPSG:4326 (WGS 84)`) represent positions in angular degrees of longitude ($\lambda$) and latitude ($\phi$).
1. **Meridian Convergence:** The distance spanned by 1 degree of longitude is ~111.32 km at the equator, but shrinks to $111.32 \cdot \cos(\phi)$ km away from the equator (only ~55.8 km at 60° latitude).
2. **Euclidean Invalidity:** The planar Shoelace formula $\frac{1}{2} \left|\sum (x_i y_{i+1} - x_{i+1} y_i)\right|$ assumes an orthogonal metric Cartesian grid. Applying it directly to degrees produces nonsensical square degrees ($\text{deg}^2$), which cannot be multiplied by a constant conversion factor.

### The UTM Projection Solution
GeoMeasure Pro calculates the dataset centroid:
$$\text{zone} = \left\lfloor \frac{\lambda_{\text{center}} + 180^\circ}{6^\circ} \right\rfloor + 1$$
$$\text{EPSG} = 32600 + \text{zone} \quad (\text{North}) \quad \text{or} \quad 32700 + \text{zone} \quad (\text{South})$$

The geometries are transformed using **PyProj / GeoPandas** to this conformal metric system before calculating planar metrics:
- **Polygons:** Planar area in $m^2$, converted to hectares ($ha = m^2 / 10,000$) and $km^2$.
- **LineStrings:** Planar length in meters ($m$), converted to kilometers ($km = m / 1,000$).
- **Points:** Point coordinates are preserved without fabricating meaningless areas or lengths.
- **Unsupported Geometries:** `GeometryCollection` or unsupported topologies are cleanly recorded with explanatory error status instead of crashing the batch.

---

## 4. How to Run the Project

### Option A: Docker Compose (All Services)
Runs PostgreSQL, FastAPI backend, and React frontend in coordinated containers:

```bash
docker compose up --build
```
- Frontend UI: `http://localhost:3000`
- FastAPI Backend: `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`

---

### Option B: Local Development

#### 1. Start the FastAPI Backend:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Start the Frontend Dev Server:
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

### Running the Pytest Test Suite
GeoMeasure Pro includes tests covering valid KML and ZIP Shapefile uploads, invalid archives, missing companion files, polygon area accuracy, linestring lengths, points handling, and API endpoints:

```bash
pytest backend/tests/ -v
```

---

## 5. Security & Safety Controls

1. **Zip Slip Traversal Prevention:** Verifies that uncompressed file paths strictly resolve within the isolated temporary target folder using `os.path.commonpath`.
2. **Decompression Bomb Guard:** Enforces limits on uncompressed archive byte size (< 200 MB) and file member counts (< 500 files).
3. **Shapefile Companion Integrity:** Validates that every `.shp` is accompanied by its corresponding `.shx` index file and `.dbf` attribute table.
4. **Temporary Directory Cleanup:** Uses Python `tempfile.mkdtemp` with `shutil.rmtree` in `finally` blocks to guarantee zero orphaned files on disk.
5. **Payload Size Enforcements:** Validates request chunk streams to stop files larger than 50 MB before exhausting memory.
