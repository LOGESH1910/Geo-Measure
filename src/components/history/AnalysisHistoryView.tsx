import React, { useState } from 'react';
import { 
  History, 
  Search, 
  ExternalLink, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Layers,
  FileCode,
  Download
} from 'lucide-react';
import { FileRecord } from '../../types/geospatial';

interface AnalysisHistoryViewProps {
  files: FileRecord[];
  onSelectFile: (file: FileRecord) => void;
  onDeleteFile: (fileId: string) => void;
  onNavigateToWorkspace: () => void;
}

export const AnalysisHistoryView: React.FC<AnalysisHistoryViewProps> = ({
  files,
  onSelectFile,
  onDeleteFile,
  onNavigateToWorkspace
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFiles = files.filter(f => 
    f.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.source_crs.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.measurement_crs.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const handleDownloadSummaryJson = (file: FileRecord) => {
    const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.filename.replace(/\.[^/.]+$/, "")}_summary.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#14243A]">
            Analysis History
          </h2>
          <p className="text-xs text-[#6B778C] mt-0.5">
            Audit log of all uploaded KML surveys, Shapefiles, and calculated planar measurements.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-72">
          <Search className="w-3.5 h-3.5 text-[#6B778C] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search dataset history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E1E7EF] rounded-md text-xs text-[#172033] focus:outline-none focus:border-[#3563E9]"
          />
        </div>
      </div>

      {/* History Grid / Table */}
      <div className="bg-white border border-[#E1E7EF] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F7FB] border-b border-[#E1E7EF] text-[#6B778C] font-semibold">
              <tr>
                <th className="py-3 px-4">Dataset Filename</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Upload Timestamp</th>
                <th className="py-3 px-4 text-center">Features</th>
                <th className="py-3 px-4">Measurement CRS</th>
                <th className="py-3 px-4 text-center">Measurement Success</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E7EF] text-[#172033]">
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#6B778C]">
                    No past analysis records found.
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-[#F4F7FB] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#14243A]">{file.filename}</div>
                      <div className="text-[10px] text-[#6B778C] font-mono mt-0.5">ID: {file.id}</div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-[#F4F7FB] border border-[#E1E7EF] text-[10px]">
                        {file.file_format}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#6B778C]">
                      {formatDate(file.created_at)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-medium">
                      {file.feature_count}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#16845B] text-[11px] max-w-xs truncate" title={file.measurement_crs}>
                      {file.measurement_crs}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1 font-mono text-xs">
                        <span className="text-[#16845B] font-semibold">{file.successful_measurements}</span>
                        <span className="text-[#A0AEC0]">/</span>
                        <span className="text-[#6B778C]">{file.feature_count}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            onSelectFile(file);
                            onNavigateToWorkspace();
                          }}
                          className="px-2.5 py-1 rounded bg-[#3563E9] text-white hover:bg-[#284fc7] font-medium text-xs transition-colors inline-flex items-center gap-1"
                          title="Open in GIS Workspace"
                        >
                          <Layers className="w-3 h-3" />
                          <span>Open</span>
                        </button>

                        <button
                          onClick={() => handleDownloadSummaryJson(file)}
                          className="p-1 rounded text-[#6B778C] hover:text-[#14243A] hover:bg-[#F4F7FB] transition-colors"
                          title="Download Summary JSON"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`Delete record for '${file.filename}'?`)) {
                              onDeleteFile(file.id);
                            }
                          }}
                          className="p-1 rounded text-[#6B778C] hover:text-[#D64545] hover:bg-red-50 transition-colors"
                          title="Delete Dataset Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
