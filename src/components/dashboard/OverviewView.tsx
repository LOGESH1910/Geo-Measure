import React from 'react';
import { 
  Compass, 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  FileCheck,
  ArrowRight,
  TrendingUp,
  Download,
  Calendar
} from 'lucide-react';
import { FileRecord, ActiveView } from '../../types/geospatial';
import { FileUploadZone } from '../upload/FileUploadZone';

interface OverviewViewProps {
  files: FileRecord[];
  onFileProcessed: (fileRecord: FileRecord) => void;
  onSelectFile: (fileRecord: FileRecord) => void;
  onNavigate: (view: ActiveView) => void;
  isBackendConnected: boolean;
  onOpenBackendSettings: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  files,
  onFileProcessed,
  onSelectFile,
  onNavigate,
  isBackendConnected,
  onOpenBackendSettings
}) => {
  // Aggregate real workspace metrics from persistent records
  const totalFiles = files.length;
  const totalFeatures = files.reduce((acc, f) => acc + f.feature_count, 0);
  const totalSuccessful = files.reduce((acc, f) => acc + f.successful_measurements, 0);
  const totalFailed = files.reduce((acc, f) => acc + f.failed_measurements, 0);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14243A] tracking-tight">
            Geospatial Workspace
          </h1>
          <p className="text-xs text-[#6B778C] mt-1">
            Upload, inspect, and measure geographic datasets with projected planar precision.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('docs')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E1E7EF] bg-white hover:bg-[#F4F7FB] text-xs font-semibold text-[#14243A] transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#6B778C]" />
            <span>View Documentation</span>
          </button>
        </div>
      </div>

      {/* Workspace Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E1E7EF] rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-[#6B778C] uppercase tracking-wider">
            Files Processed
          </div>
          <div className="text-2xl font-bold text-[#14243A] mt-1 font-mono tabular-nums">
            {totalFiles}
          </div>
          <div className="text-[11px] text-[#6B778C] mt-0.5">
            KML & Shapefile archives
          </div>
        </div>

        <div className="bg-white border border-[#E1E7EF] rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-[#6B778C] uppercase tracking-wider">
            Features Analyzed
          </div>
          <div className="text-2xl font-bold text-[#3563E9] mt-1 font-mono tabular-nums">
            {totalFeatures}
          </div>
          <div className="text-[11px] text-[#6B778C] mt-0.5">
            Polygons, Lines, & Points
          </div>
        </div>

        <div className="bg-white border border-[#E1E7EF] rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-[#6B778C] uppercase tracking-wider">
            Successful Measurements
          </div>
          <div className="text-2xl font-bold text-[#16845B] mt-1 font-mono tabular-nums">
            {totalSuccessful}
          </div>
          <div className="text-[11px] text-[#16845B] mt-0.5">
            Planar metric calculations
          </div>
        </div>

        <div className="bg-white border border-[#E1E7EF] rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-[#6B778C] uppercase tracking-wider">
            Unsupported / Failed
          </div>
          <div className="text-2xl font-bold text-[#C98417] mt-1 font-mono tabular-nums">
            {totalFailed}
          </div>
          <div className="text-[11px] text-[#6B778C] mt-0.5">
            Heterogeneous collections
          </div>
        </div>
      </div>

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: File Upload */}
        <div className="lg:col-span-7">
          <FileUploadZone
            onFileProcessed={onFileProcessed}
            isBackendConnected={isBackendConnected}
            onOpenBackendSettings={onOpenBackendSettings}
          />
        </div>

        {/* Right Column: Recent Analyses Card */}
        <div className="lg:col-span-5 bg-white border border-[#E1E7EF] rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#14243A]">Recent Analyses</h3>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-[#3563E9] hover:underline font-semibold flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {files.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6B778C] border border-dashed border-[#E1E7EF] rounded-lg">
              No datasets analyzed yet. Upload a file or load a benchmark dataset to begin.
            </div>
          ) : (
            <div className="divide-y divide-[#E1E7EF]">
              {files.slice(0, 4).map((file) => (
                <div key={file.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between group">
                  <div className="truncate mr-3">
                    <button
                      onClick={() => {
                        onSelectFile(file);
                        onNavigate('workspace');
                      }}
                      className="text-xs font-semibold text-[#14243A] group-hover:text-[#3563E9] transition-colors truncate block text-left"
                    >
                      {file.filename}
                    </button>
                    <div className="text-[11px] text-[#6B778C] font-mono flex items-center gap-1 mt-0.5">
                      <span>{file.feature_count} features</span>
                      <span>·</span>
                      <span>{formatDate(file.created_at)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onSelectFile(file);
                      onNavigate('workspace');
                    }}
                    className="px-2.5 py-1 rounded bg-[#F4F7FB] group-hover:bg-[#3563E9] text-[#14243A] group-hover:text-white text-xs font-semibold transition-colors shrink-0 flex items-center gap-1"
                  >
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
