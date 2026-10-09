import React from 'react';
import { 
  Server, 
  FolderOpen, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle,
  Download,
  FileCode
} from 'lucide-react';
import { FileRecord, ActiveView } from '../../types/geospatial';
import { SAMPLE_DATASETS } from '../../data/sampleDatasets';

interface TopBarProps {
  currentFile: FileRecord | null;
  activeView: ActiveView;
  isBackendConnected: boolean;
  onOpenBackendSettings: () => void;
  onSelectSample: (sample: FileRecord) => void;
  onNavigate: (view: ActiveView) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentFile,
  activeView,
  isBackendConnected,
  onOpenBackendSettings,
  onSelectSample,
  onNavigate
}) => {
  const getBreadcrumb = () => {
    switch (activeView) {
      case 'overview':
        return 'Overview';
      case 'workspace':
        return currentFile ? currentFile.filename : 'Workspace';
      case 'table':
        return 'Feature Table';
      case 'history':
        return 'Analysis History';
      case 'docs':
        return 'Documentation';
      case 'settings':
        return 'API & Settings';
      default:
        return 'Workspace';
    }
  };

  return (
    <header className="h-14 bg-white border-b border-[#E1E7EF] px-6 flex items-center justify-between gap-6 shrink-0 z-10">
      {/* Zone 1: Breadcrumb Trail */}
      <div className="flex items-center gap-2 text-xs text-[#6B778C] truncate">
        <span className="font-semibold text-[#14243A]">GeoMeasure</span>
        <span aria-hidden="true" className="text-[#C1C9D2]">/</span>
        <span className="text-[#172033] font-medium truncate">{getBreadcrumb()}</span>
        {currentFile && activeView === 'workspace' && (
          <>
            <span aria-hidden="true" className="text-[#C1C9D2]">·</span>
            <span className="text-[11px] font-mono text-[#6B778C]">{currentFile.file_format}</span>
          </>
        )}
      </div>

      {/* Zone 2 & 3: Contextual Tools & Actions */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Sample Datasets Dropdown Menu */}
        <div className="relative group">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#172033] bg-[#F4F7FB] hover:bg-[#EAF0F8] border border-[#E1E7EF] rounded-md transition-colors"
            title="Load verified test GIS datasets"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#3563E9]" />
            <span>Load Sample Data</span>
          </button>
          
          <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-[#E1E7EF] rounded-lg shadow-lg p-1.5 hidden group-hover:block hover:block z-50">
            <div className="px-2 py-1 text-[11px] font-semibold text-[#6B778C] uppercase tracking-wider">
              Benchmark Datasets
            </div>
            {SAMPLE_DATASETS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => onSelectSample(sample)}
                className="w-full text-left p-2 rounded-md hover:bg-[#F4F7FB] transition-colors flex flex-col gap-0.5"
              >
                <span className="text-xs font-semibold text-[#14243A] truncate">{sample.filename}</span>
                <span className="text-[10px] text-[#6B778C] flex items-center gap-1">
                  <span>{sample.feature_count} features</span>
                  <span>·</span>
                  <span>{sample.source_crs.split(' ')[0]}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Backend Connection Badge */}
        <button
          onClick={onOpenBackendSettings}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
            isBackendConnected
              ? 'bg-[#16845B]/10 text-[#16845B] border-[#16845B]/20 hover:bg-[#16845B]/20'
              : 'bg-[#C98417]/10 text-[#C98417] border-[#C98417]/20 hover:bg-[#C98417]/20'
          }`}
          title="Click to view FastAPI connection details and startup instructions"
        >
          {isBackendConnected ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5" />
          )}
          <span>{isBackendConnected ? 'FastAPI Connected' : 'Backend Disconnected'}</span>
        </button>

        {/* Help & Docs Shortcut */}
        <button
          onClick={() => onNavigate('docs')}
          className="p-1.5 text-[#6B778C] hover:text-[#172033] hover:bg-[#F4F7FB] rounded-md transition-colors"
          title="Open GIS & API Documentation"
          aria-label="Documentation"
        >
          <BookOpen className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
