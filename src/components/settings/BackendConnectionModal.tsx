import React, { useState } from 'react';
import { 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink,
  X
} from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, GeoMeasureApiClient } from '../../services/api';
import { ApiHealthStatus } from '../../types/geospatial';

interface BackendConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isBackendConnected: boolean;
  onRefreshHealth: () => Promise<void>;
}

export const BackendConnectionModal: React.FC<BackendConnectionModalProps> = ({
  isOpen,
  onClose,
  isBackendConnected,
  onRefreshHealth
}) => {
  const [urlInput, setUrlInput] = useState(getApiBaseUrl());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; data?: ApiHealthStatus; error?: string } | null>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);

  if (!isOpen) return null;

  const handleSaveAndTest = async () => {
    setTesting(true);
    setApiBaseUrl(urlInput);
    try {
      const res = await GeoMeasureApiClient.checkHealth();
      setTestResult({
        success: res.isOnline,
        data: res.data,
        error: res.error
      });
      await onRefreshHealth();
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message
      });
    } finally {
      setTesting(false);
    }
  };

  const copyCurl = () => {
    const curlCmd = `curl -X GET "${urlInput}/api/health" -H "accept: application/json"`;
    navigator.clipboard.writeText(curlCmd);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-[#E1E7EF] rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-[#E1E7EF] flex items-center justify-between bg-[#F4F7FB]/50">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-[#3563E9]" />
            <h3 className="text-sm font-bold text-[#14243A]">FastAPI Backend Configuration</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#6B778C] hover:text-[#14243A] p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status Indicator Banner */}
          <div className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
            isBackendConnected
              ? 'bg-[#16845B]/10 border-[#16845B]/20 text-[#16845B]'
              : 'bg-[#C98417]/10 border-[#C98417]/20 text-[#C98417]'
          }`}>
            <div className="flex items-center gap-2 font-semibold">
              {isBackendConnected ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>
                {isBackendConnected ? 'FastAPI Backend Online & Operational' : 'FastAPI Backend Unreachable'}
              </span>
            </div>
            <span className="font-mono text-[11px]">
              {isBackendConnected ? '200 OK' : 'Connection Refused'}
            </span>
          </div>

          {/* Configurable URL Input */}
          <div>
            <label className="block text-xs font-semibold text-[#14243A] mb-1">
              Backend API Base URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://localhost:8000"
                className="flex-1 px-3 py-1.5 bg-[#F4F7FB] border border-[#E1E7EF] rounded-md text-xs text-[#14243A] font-mono focus:outline-none focus:border-[#3563E9]"
              />
              <button
                onClick={handleSaveAndTest}
                disabled={testing}
                className="px-3 py-1.5 rounded-md bg-[#3563E9] hover:bg-[#284fc7] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>Test Connection</span>
              </button>
            </div>
            <p className="text-[11px] text-[#6B778C] mt-1">
              Default is <code className="font-mono">http://localhost:8000</code> when running locally or via Docker.
            </p>
          </div>

          {/* Health Diagnostics Output */}
          {testResult && (
            <div className="bg-[#F4F7FB] border border-[#E1E7EF] rounded-lg p-3 text-xs space-y-1 font-mono">
              <div className="font-semibold text-[#14243A] font-sans flex items-center justify-between">
                <span>Health Diagnostic Result:</span>
                <span className={testResult.success ? 'text-[#16845B]' : 'text-[#D64545]'}>
                  {testResult.success ? 'HEALTHY' : 'UNREACHABLE'}
                </span>
              </div>
              {testResult.success && testResult.data && (
                <div className="text-[11px] text-[#6B778C] space-y-0.5 pt-1">
                  <div>Service: <span className="text-[#14243A]">{testResult.data.service}</span></div>
                  <div>Version: <span className="text-[#14243A]">{testResult.data.version}</span></div>
                  <div>Database: <span className="text-[#16845B]">{testResult.data.database || 'Active'}</span></div>
                </div>
              )}
              {!testResult.success && (
                <div className="text-[11px] text-[#D64545] pt-1 font-sans">
                  {testResult.error || 'Connection failed. Is Uvicorn or Docker running?'}
                </div>
              )}
            </div>
          )}

          {/* Quick Terminal Command */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-[#14243A] mb-1">
              <span>Quick Start Command (Terminal)</span>
              <button
                onClick={copyCurl}
                className="text-[#3563E9] hover:underline flex items-center gap-1 text-[11px]"
              >
                {copiedCurl ? <Check className="w-3 h-3 text-[#16845B]" /> : <Copy className="w-3 h-3" />}
                <span>Copy cURL test</span>
              </button>
            </div>
            <div className="bg-[#14243A] text-[#8EA2BF] p-2.5 rounded-md font-mono text-[11px] overflow-x-auto">
              docker compose up --build
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#F4F7FB] border-t border-[#E1E7EF] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-[#14243A] hover:bg-[#1E314B] text-white text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
