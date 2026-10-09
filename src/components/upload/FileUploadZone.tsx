import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileCheck, 
  AlertTriangle, 
  Loader2, 
  Archive, 
  Map, 
  CheckCircle2,
  FolderOpen,
  ArrowRight,
  Server
} from 'lucide-react';
import { FileRecord } from '../../types/geospatial';
import { GeoMeasureApiClient } from '../../services/api';
import { parseKmlString, validateShapefileZip } from '../../services/clientGeospatial';
import { SAMPLE_DATASETS } from '../../data/sampleDatasets';

interface FileUploadZoneProps {
  onFileProcessed: (fileRecord: FileRecord) => void;
  isBackendConnected: boolean;
  onOpenBackendSettings: () => void;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileProcessed,
  isBackendConnected,
  onOpenBackendSettings
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStage, setUploadStage] = useState<'idle' | 'validating' | 'uploading' | 'projecting' | 'done'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (file: File) => {
    setErrorMessage(null);
    setSelectedFileName(file.name);
    setUploadStage('validating');

    // 1. Validate file extension
    const nameLower = file.name.toLowerCase();
    const isKml = nameLower.endsWith('.kml');
    const isZip = nameLower.endsWith('.zip');

    if (!isKml && !isZip) {
      setErrorMessage(`Invalid file format '${file.name}'. Only .kml files or .zip archives containing Shapefiles are supported.`);
      setUploadStage('idle');
      return;
    }

    // 2. Validate file size
    if (file.size === 0) {
      setErrorMessage("The uploaded file is empty (0 bytes). Please select a valid geographic file.");
      setUploadStage('idle');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 50MB.`);
      setUploadStage('idle');
      return;
    }

    // 3. For Zip, validate companion files
    if (isZip) {
      const zipValidation = await validateShapefileZip(file);
      if (!zipValidation.isValid) {
        setErrorMessage(zipValidation.error || "ZIP archive does not contain a valid Shapefile.");
        setUploadStage('idle');
        return;
      }
    }

    // 4. Send to FastAPI backend if connected, or execute client-side processing
    if (isBackendConnected) {
      try {
        setUploadStage('uploading');
        // Real API request to POST /api/files/
        const result = await GeoMeasureApiClient.uploadFile(file);
        setUploadStage('projecting');
        setTimeout(() => {
          setUploadStage('done');
          onFileProcessed(result);
        }, 600);
      } catch (err: any) {
        setErrorMessage(`Backend processing error: ${err.message}`);
        setUploadStage('idle');
      }
    } else {
      // Backend is offline: Provide transparent client-side calculation for KML or prompt
      if (isKml) {
        setUploadStage('projecting');
        try {
          const text = await file.text();
          const parsedRecord = parseKmlString(text, file.name);
          setUploadStage('done');
          GeoMeasureApiClient.saveToLocalCache(parsedRecord);
          onFileProcessed(parsedRecord);
        } catch (err: any) {
          setErrorMessage(`KML parsing failed: ${err.message}`);
          setUploadStage('idle');
        }
      } else {
        // Zip shapefiles require Python GeoPandas backend
        setErrorMessage(
          "FastAPI Backend is required to decompress and process binary Shapefiles (.shp/.dbf). Please start the backend or test using the sample datasets below."
        );
        setUploadStage('idle');
      }
    }
  };

  return (
    <div className="bg-white border border-[#E1E7EF] rounded-xl p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-bold text-[#14243A]">Upload Geographic Dataset</h2>
        <p className="text-xs text-[#6B778C] mt-0.5">
          Drag and drop your KML survey or ZIP archive containing Shapefile companion files (.shp, .shx, .dbf).
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
          isDragging 
            ? 'border-[#3563E9] bg-[#3563E9]/5 scale-[0.99]' 
            : 'border-[#C1C9D2] hover:border-[#3563E9] hover:bg-[#F4F7FB]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".kml,.zip"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {uploadStage === 'idle' && (
          <>
            <div className="w-12 h-12 rounded-xl bg-[#EAF0F8] flex items-center justify-center text-[#3563E9] mb-3 shadow-inner">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-[#14243A]">
              Choose file or drag & drop here
            </div>
            <div className="text-xs text-[#6B778C] mt-1 max-w-sm">
              Supports <strong className="text-[#172033]">.KML</strong> and <strong className="text-[#172033]">.ZIP</strong> Shapefiles (up to 50 MB)
            </div>
            <div className="mt-4 px-3 py-1.5 rounded-md bg-[#14243A] hover:bg-[#1E314B] text-white text-xs font-semibold shadow-sm transition-colors">
              Browse Files
            </div>
          </>
        )}

        {uploadStage !== 'idle' && uploadStage !== 'done' && (
          <div className="flex flex-col items-center py-4">
            <Loader2 className="w-8 h-8 text-[#3563E9] animate-spin mb-3" />
            <div className="text-sm font-semibold text-[#14243A]">
              {uploadStage === 'validating' && 'Validating file format & companion files...'}
              {uploadStage === 'uploading' && 'Uploading dataset to FastAPI backend...'}
              {uploadStage === 'projecting' && 'Selecting UTM zone and calculating planar metrics...'}
            </div>
            <p className="text-xs font-mono text-[#6B778C] mt-1">
              {selectedFileName}
            </p>
          </div>
        )}

        {uploadStage === 'done' && (
          <div className="flex flex-col items-center py-4">
            <CheckCircle2 className="w-8 h-8 text-[#16845B] mb-2" />
            <div className="text-sm font-semibold text-[#14243A]">Analysis Complete</div>
            <p className="text-xs text-[#6B778C] mt-1">Loading workspace view...</p>
          </div>
        )}
      </div>

      {/* Error Feedback */}
      {errorMessage && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-[#D64545]">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Upload Failed</span>
            <span className="mt-0.5 block leading-relaxed">{errorMessage}</span>
            {!isBackendConnected && (
              <button
                onClick={onOpenBackendSettings}
                className="mt-2 text-xs font-semibold text-[#3563E9] hover:underline flex items-center gap-1"
              >
                <span>View FastAPI Setup Instructions</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick Test Datasets Footer */}
      <div className="mt-6 pt-4 border-t border-[#E1E7EF]">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-[#14243A] flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5 text-[#3563E9]" />
            <span>Benchmark Datasets (Instant Inspection)</span>
          </span>
          <span className="text-[11px] text-[#6B778C]">Pre-calculated UTM planar models</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {SAMPLE_DATASETS.map((sample) => (
            <div
              key={sample.id}
              className="p-3 rounded-lg border border-[#E1E7EF] hover:border-[#3563E9] hover:bg-[#F4F7FB] transition-all flex flex-col justify-between group"
            >
              <div 
                onClick={() => onFileProcessed(sample)}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#14243A] group-hover:text-[#3563E9] transition-colors truncate">
                    {sample.filename.replace('.kml', '').replace('.zip', '')}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#EAF0F8] text-[#3563E9] rounded font-semibold">
                    {sample.file_format}
                  </span>
                </div>
                <div className="text-[11px] text-[#6B778C] font-mono mt-1">
                  <span>{sample.feature_count} features</span>
                  <span className="mx-1">·</span>
                  <span>{sample.polygon_count} polys</span>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-[#E1E7EF] flex items-center justify-between text-[11px]">
                <button
                  onClick={() => onFileProcessed(sample)}
                  className="text-[#3563E9] hover:underline font-semibold"
                >
                  Inspect Now
                </button>
                {sample.file_format === 'KML' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      import('../../data/sampleFilesRaw').then(m => m.downloadSampleKml(sample.filename));
                    }}
                    className="text-[#6B778C] hover:text-[#14243A] flex items-center gap-1 transition-colors"
                    title="Download raw .kml file to test manual drag-and-drop"
                  >
                    <span>Get .kml</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
