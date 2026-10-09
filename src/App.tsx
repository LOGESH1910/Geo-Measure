/**
 * GeoMeasure Pro — Main Application
 * Coordinates GIS Workspace, Feature Explorer, Leaflet Map, and FastAPI Integration.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { OverviewView } from './components/dashboard/OverviewView';
import { GisWorkspaceView } from './components/workspace/GisWorkspaceView';
import { FeatureDataTable } from './components/tables/FeatureDataTable';
import { AnalysisHistoryView } from './components/history/AnalysisHistoryView';
import { DocumentationView } from './components/documentation/DocumentationView';
import { BackendConnectionModal } from './components/settings/BackendConnectionModal';

import { FileRecord, ActiveView } from './types/geospatial';
import { SAMPLE_DATASETS } from './data/sampleDatasets';
import { GeoMeasureApiClient, getApiBaseUrl } from './services/api';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('workspace');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [files, setFiles] = useState<FileRecord[]>(SAMPLE_DATASETS);
  const [currentFile, setCurrentFile] = useState<FileRecord | null>(SAMPLE_DATASETS[0]);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(
    SAMPLE_DATASETS[0].features?.[0]?.feature_id || null
  );

  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [showBackendModal, setShowBackendModal] = useState<boolean>(false);
  const [apiBaseUrl, setApiBaseUrlState] = useState<string>(getApiBaseUrl());

  // 1. Check Backend Connectivity
  const checkHealth = useCallback(async () => {
    const health = await GeoMeasureApiClient.checkHealth();
    setIsBackendConnected(health.isOnline);
    setApiBaseUrlState(getApiBaseUrl());

    if (health.isOnline) {
      try {
        const backendFiles = await GeoMeasureApiClient.listFiles();
        if (backendFiles && backendFiles.length > 0) {
          // Merge with sample files without duplication
          const combined = [
            ...backendFiles,
            ...SAMPLE_DATASETS.filter(s => !backendFiles.some(b => b.id === s.id))
          ];
          setFiles(combined);
        }
      } catch (e) {
        console.warn("Could not retrieve backend file list:", e);
      }
    } else {
      // Load local cached records
      const cached = GeoMeasureApiClient.getLocalCachedFiles();
      setFiles(cached);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    // Periodic gentle ping check every 45s
    const interval = setInterval(checkHealth, 45000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // 2. Handle File Selection
  const handleSelectFile = (file: FileRecord) => {
    setCurrentFile(file);
    if (file.features && file.features.length > 0) {
      setSelectedFeatureId(file.features[0].feature_id);
    } else {
      setSelectedFeatureId(null);
    }
  };

  // 3. Handle File Upload / Processing
  const handleFileProcessed = (newFile: FileRecord) => {
    setFiles(prev => [newFile, ...prev.filter(f => f.id !== newFile.id)]);
    setCurrentFile(newFile);
    if (newFile.features && newFile.features.length > 0) {
      setSelectedFeatureId(newFile.features[0].feature_id);
    }
    setActiveView('workspace');
  };

  // 4. Handle Delete File
  const handleDeleteFile = async (fileId: string) => {
    if (isBackendConnected) {
      try {
        await GeoMeasureApiClient.deleteFile(fileId);
      } catch (e) {
        console.warn("Backend delete call failed:", e);
      }
    }
    GeoMeasureApiClient.removeFromLocalCache(fileId);
    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (currentFile?.id === fileId) {
      const remaining = files.filter(f => f.id !== fileId);
      if (remaining.length > 0) {
        handleSelectFile(remaining[0]);
      } else {
        setCurrentFile(null);
        setSelectedFeatureId(null);
      }
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F4F7FB] text-[#172033]">
      {/* Persistent Left Sidebar */}
      <Sidebar
        activeView={activeView}
        onNavigate={(view) => {
          if (view === 'settings') {
            setShowBackendModal(true);
          } else {
            setActiveView(view);
          }
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isBackendConnected={isBackendConnected}
        apiBaseUrl={apiBaseUrl}
        onOpenBackendSettings={() => setShowBackendModal(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header Bar */}
        <TopBar
          currentFile={currentFile}
          activeView={activeView}
          isBackendConnected={isBackendConnected}
          onOpenBackendSettings={() => setShowBackendModal(true)}
          onSelectSample={(sample) => {
            handleSelectFile(sample);
            setActiveView('workspace');
          }}
          onNavigate={setActiveView}
        />

        {/* View Router */}
        <main className="flex-1 overflow-y-auto">
          {activeView === 'overview' && (
            <OverviewView
              files={files}
              onFileProcessed={handleFileProcessed}
              onSelectFile={handleSelectFile}
              onNavigate={setActiveView}
              isBackendConnected={isBackendConnected}
              onOpenBackendSettings={() => setShowBackendModal(true)}
            />
          )}

          {activeView === 'workspace' && (
            <GisWorkspaceView
              file={currentFile}
              selectedFeatureId={selectedFeatureId}
              onSelectFeature={setSelectedFeatureId}
              onNavigateToTable={() => setActiveView('table')}
            />
          )}

          {activeView === 'table' && (
            <FeatureDataTable
              file={currentFile}
              selectedFeatureId={selectedFeatureId}
              onSelectFeature={setSelectedFeatureId}
              onNavigateToWorkspace={() => setActiveView('workspace')}
            />
          )}

          {activeView === 'history' && (
            <AnalysisHistoryView
              files={files}
              onSelectFile={handleSelectFile}
              onDeleteFile={handleDeleteFile}
              onNavigateToWorkspace={() => setActiveView('workspace')}
            />
          )}

          {activeView === 'docs' && (
            <DocumentationView />
          )}
        </main>
      </div>

      {/* Backend Settings & Diagnostics Modal */}
      <BackendConnectionModal
        isOpen={showBackendModal}
        onClose={() => setShowBackendModal(false)}
        isBackendConnected={isBackendConnected}
        onRefreshHealth={checkHealth}
      />
    </div>
  );
}
