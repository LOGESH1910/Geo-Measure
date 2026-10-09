import React from 'react';
import { 
  BookOpen, 
  Terminal, 
  Compass, 
  Database, 
  Layers, 
  ShieldCheck, 
  Cpu,
  Code2,
  ExternalLink
} from 'lucide-react';

export const DocumentationView: React.FC = () => {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#14243A]">
          GeoMeasure Pro Documentation & System Architecture
        </h1>
        <p className="text-sm text-[#6B778C] mt-1">
          Technical specification, API contracts, geospatial projection formulas, and execution guidelines.
        </p>
      </div>

      {/* 1. Geospatial Measurement Methodology */}
      <section className="bg-white border border-[#E1E7EF] rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#14243A]">
          <Compass className="w-5 h-5 text-[#3563E9]" />
          <h2>1. Geospatial Projection & Measurement Methodology</h2>
        </div>

        <p className="text-xs text-[#172033] leading-relaxed">
          Geographic Coordinate Systems (such as <code className="bg-[#F4F7FB] px-1.5 py-0.5 rounded font-mono text-[#3563E9]">EPSG:4326 (WGS 84)</code>) 
          express coordinates in angular degrees of latitude (<span className="italic">φ</span>) and longitude (<span className="italic">λ</span>). 
          Computing Euclidean distances or polygon areas directly on degrees (<span className="font-mono">dx² + dy²</span>) is geometrically invalid because:
        </p>

        <ul className="text-xs text-[#6B778C] space-y-2 list-disc pl-5">
          <li>
            <strong>Meridian Convergence:</strong> At the equator, 1 degree of longitude is ~111.32 km. At 60° latitude, 1 degree of longitude narrows to ~55.80 km (scaled by <span className="font-mono">cos(φ)</span>).
          </li>
          <li>
            <strong>Planar Distortion:</strong> Planar formulas (e.g. Shoelace algorithm) assume an orthogonal Cartesian coordinate space in meters (<span className="font-mono">m</span>), not spherical angles.
          </li>
        </ul>

        <div className="bg-[#F4F7FB] border border-[#E1E7EF] p-4 rounded-lg text-xs space-y-2">
          <h4 className="font-semibold text-[#14243A]">Automated Projected CRS Pipeline:</h4>
          <ol className="list-decimal pl-5 space-y-1.5 text-[#172033]">
            <li>Extract geographic centroid <span className="font-mono">(λ_center, φ_center)</span> from the feature geometries.</li>
            <li>Calculate optimal 6° UTM zone: <span className="font-mono">zone = floor((λ_center + 180) / 6) + 1</span>.</li>
            <li>Assign <span className="font-mono">EPSG:32600 + zone</span> (Northern Hemisphere) or <span className="font-mono">EPSG:32700 + zone</span> (Southern Hemisphere).</li>
            <li>Project geometries via <span className="font-mono">PyProj / GeoPandas</span> transformer into metric Cartesian space.</li>
            <li>Compute polygon area in <span className="font-mono">m²</span> and <span className="font-mono">hectares</span>; LineString length in <span className="font-mono">meters</span> and <span className="font-mono">km</span>.</li>
          </ol>
        </div>
      </section>

      {/* 2. Backend API Contract */}
      <section className="bg-white border border-[#E1E7EF] rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#14243A]">
          <Code2 className="w-5 h-5 text-[#16A6A1]" />
          <h2>2. FastAPI Backend Endpoints</h2>
        </div>

        <div className="space-y-4 text-xs font-mono">
          {/* Endpoint 1 */}
          <div className="border border-[#E1E7EF] rounded-lg p-3 bg-[#F4F7FB]/50">
            <div className="flex items-center gap-2 font-bold text-[#14243A]">
              <span className="px-2 py-0.5 rounded bg-[#3563E9] text-white text-[10px]">POST</span>
              <span>/api/files/</span>
            </div>
            <p className="text-xs font-sans text-[#6B778C] mt-1.5">
              Uploads and processes a multipart/form-data KML file or ZIP Shapefile archive. Validates companions (.shp, .shx, .dbf), projects CRS, and calculates planar measurements.
            </p>
          </div>

          {/* Endpoint 2 */}
          <div className="border border-[#E1E7EF] rounded-lg p-3 bg-[#F4F7FB]/50">
            <div className="flex items-center gap-2 font-bold text-[#14243A]">
              <span className="px-2 py-0.5 rounded bg-[#16845B] text-white text-[10px]">GET</span>
              <span>/api/files/{'{id}'}/</span>
            </div>
            <p className="text-xs font-sans text-[#6B778C] mt-1.5">
              Returns file metadata, feature counts, bounding box coordinates, and processing status.
            </p>
          </div>

          {/* Endpoint 3 */}
          <div className="border border-[#E1E7EF] rounded-lg p-3 bg-[#F4F7FB]/50">
            <div className="flex items-center gap-2 font-bold text-[#14243A]">
              <span className="px-2 py-0.5 rounded bg-[#16845B] text-white text-[10px]">GET</span>
              <span>/api/files/{'{id}'}/measurements/</span>
            </div>
            <p className="text-xs font-sans text-[#6B778C] mt-1.5">
              Returns list of individual feature measurements with pagination, geometry type filters, and properties.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Execution & Deployment */}
      <section className="bg-white border border-[#E1E7EF] rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#14243A]">
          <Terminal className="w-5 h-5 text-[#3563E9]" />
          <h2>3. Launching the Backend Stack</h2>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold text-[#14243A] mb-1.5">Method A: Docker Compose (Recommended)</h4>
            <div className="bg-[#14243A] text-[#8EA2BF] p-3 rounded-lg font-mono text-xs overflow-x-auto">
              <span className="text-[#3563E9]">$</span> docker compose up --build
            </div>
            <p className="text-[11px] text-[#6B778C] mt-1">
              Spins up PostgreSQL container, builds FastAPI with GDAL/PROJ C libraries, and launches the React client on port 3000.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#14243A] mb-1.5">Method B: Python Virtual Environment</h4>
            <div className="bg-[#14243A] text-[#8EA2BF] p-3 rounded-lg font-mono text-xs overflow-x-auto space-y-1">
              <div><span className="text-[#3563E9]">$</span> python3 -m venv venv && source venv/bin/activate</div>
              <div><span className="text-[#3563E9]">$</span> pip install -r backend/requirements.txt</div>
              <div><span className="text-[#3563E9]">$</span> uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload</div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#14243A] mb-1.5">Running Pytest Suite</h4>
            <div className="bg-[#14243A] text-[#8EA2BF] p-3 rounded-lg font-mono text-xs overflow-x-auto">
              <span className="text-[#3563E9]">$</span> pytest backend/tests/ -v
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
