import React from 'react';
import { 
  Compass, 
  Layers, 
  History, 
  Table, 
  BookOpen, 
  Settings as SettingsIcon, 
  ChevronLeft, 
  ChevronRight, 
  UploadCloud,
  Server
} from 'lucide-react';
import { ActiveView } from '../../types/geospatial';

interface SidebarProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isBackendConnected: boolean;
  apiBaseUrl: string;
  onOpenBackendSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  collapsed,
  onToggleCollapse,
  isBackendConnected,
  apiBaseUrl,
  onOpenBackendSettings
}) => {
  const navItems = [
    { id: 'overview' as ActiveView, label: 'Overview', icon: Compass },
    { id: 'workspace' as ActiveView, label: 'GIS Workspace', icon: Layers },
    { id: 'table' as ActiveView, label: 'Feature Table', icon: Table },
    { id: 'history' as ActiveView, label: 'Analysis History', icon: History },
    { id: 'docs' as ActiveView, label: 'Documentation', icon: BookOpen },
    { id: 'settings' as ActiveView, label: 'API & Settings', icon: SettingsIcon }
  ];

  return (
    <aside
      className={`bg-[#14243A] text-white flex flex-col justify-between transition-all duration-200 z-20 shrink-0 border-r border-[#1E314B] ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#1E314B]">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-[#3563E9] flex items-center justify-center shrink-0 shadow-sm">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div className="truncate">
                <span className="font-bold text-base tracking-tight text-white block leading-tight">
                  GeoMeasure
                </span>
                <span className="text-[11px] text-[#8EA2BF] block leading-tight font-medium">
                  GIS Analysis Suite
                </span>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-8 h-8 rounded-lg bg-[#3563E9] flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5 text-white" />
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="text-[#8EA2BF] hover:text-white p-1 rounded-md transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Primary Action Button */}
        <div className="p-3">
          <button
            onClick={() => onNavigate('overview')}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#3563E9] hover:bg-[#284fc7] text-white text-xs font-semibold shadow-sm transition-all ${
              collapsed ? 'px-0' : ''
            }`}
            title="Upload New Dataset"
          >
            <UploadCloud className="w-4 h-4 shrink-0" />
            {!collapsed && <span>New Analysis</span>}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-[#1E314B] text-white font-semibold'
                    : 'text-[#9DAEC4] hover:bg-[#1A2C44] hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#3563E9]' : 'text-[#8EA2BF]'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Backend Status Box */}
      <div className="p-3 border-t border-[#1E314B]">
        <button
          onClick={onOpenBackendSettings}
          className="w-full text-left p-2.5 rounded-lg bg-[#111F32] hover:bg-[#1A2C44] border border-[#1E314B] transition-colors group"
        >
          <div className="flex items-center gap-2">
            <Server className={`w-3.5 h-3.5 shrink-0 ${isBackendConnected ? 'text-[#16A6A1]' : 'text-amber-400'}`} />
            {!collapsed && (
              <div className="truncate flex-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-white">
                  <span>FastAPI Engine</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    isBackendConnected ? 'text-[#16A6A1] bg-[#16A6A1]/10' : 'text-amber-400 bg-amber-400/10'
                  }`}>
                    {isBackendConnected ? 'Online' : 'Offline'}
                  </span>
                </div>
                <p className="text-[10px] text-[#8EA2BF] font-mono truncate mt-0.5">
                  {apiBaseUrl.replace('http://', '').replace('https://', '')}
                </p>
              </div>
            )}
          </div>
        </button>
      </div>
    </aside>
  );
};
