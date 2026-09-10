import React, { useState } from 'react';
import { 
  Undo2, 
  Redo2, 
  RotateCcw, 
  Copy, 
  Check, 
  Code, 
  Download,
  FilePlus,
  Columns,
  Maximize2,
  Sparkles,
  Layers,
  Eye,
  FileCode2,
  Cpu
} from 'lucide-react';

export type WorkspaceViewMode = 'split' | 'canvas' | 'code';
export type RenderEngineMode = 'interactive' | 'official-svg';

interface NavbarProps {
  title: string;
  onUpdateTitle: (title: string) => void;
  viewMode: WorkspaceViewMode;
  onChangeViewMode: (mode: WorkspaceViewMode) => void;
  renderEngine: RenderEngineMode;
  onToggleRenderEngine: () => void;
  onAutoLayout: () => void;
  onNewDiagram: () => void;
  onResetStarter: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenExport: () => void;
  onQuickCopyPlantUML: () => void;
  copiedPlantUML: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  title,
  onUpdateTitle,
  viewMode,
  onChangeViewMode,
  renderEngine,
  onToggleRenderEngine,
  onAutoLayout,
  onNewDiagram,
  onResetStarter,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenExport,
  onQuickCopyPlantUML,
  copiedPlantUML
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim()) {
      onUpdateTitle(tempTitle.trim());
    }
  };

  return (
    <header className="h-14 w-full border-b border-[#d8d0c8]/60 bg-[#faf5ee]/95 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Diagram Title */}
      <div className="flex items-center gap-3 min-w-[280px]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#c2652a] text-white flex items-center justify-center font-bold text-sm shadow-sm">
            PU
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold tracking-wider text-[#c2652a] uppercase">PlantUML Studio</span>
              <span className="text-[9px] bg-[#c2652a]/10 text-[#c2652a] font-mono px-1.5 py-0.2 rounded font-semibold">
                1:1 Engine
              </span>
            </div>
            {isEditingTitle ? (
              <input
                type="text"
                autoFocus
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSubmit();
                  if (e.key === 'Escape') {
                    setTempTitle(title);
                    setIsEditingTitle(false);
                  }
                }}
                className="font-serif text-sm font-medium text-[#3a302a] bg-white border border-[#c2652a] rounded px-1.5 py-0.5 outline-none"
              />
            ) : (
              <h1 
                onClick={() => {
                  setTempTitle(title);
                  setIsEditingTitle(true);
                }}
                className="font-serif text-sm font-medium text-[#3a302a] leading-tight hover:text-[#c2652a] cursor-pointer flex items-center gap-1 group max-w-[280px] truncate"
                title="Click to rename"
              >
                <span className="truncate">{title}</span>
                <span className="text-[10px] text-[#78706a] opacity-0 group-hover:opacity-100 transition-opacity">✎</span>
              </h1>
            )}
          </div>
        </div>
      </div>

      {/* Center: View Layout Modes (Split, Canvas, Code) & Engine Toggle */}
      <div className="flex items-center gap-2.5">
        {/* Workspace Layout Switcher */}
        <div className="flex items-center bg-[#f2ece4] p-1 rounded-xl border border-[#d8d0c8]/60 shadow-inner">
          <button
            id="btn-view-split"
            onClick={() => onChangeViewMode('split')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'split'
                ? 'bg-white text-[#c2652a] shadow-xs font-semibold'
                : 'text-[#605850] hover:text-[#3a302a] hover:bg-white/50'
            }`}
            title="Side-by-side Code & Diagram view"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split View</span>
          </button>

          <button
            id="btn-view-canvas"
            onClick={() => onChangeViewMode('canvas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'canvas'
                ? 'bg-white text-[#c2652a] shadow-xs font-semibold'
                : 'text-[#605850] hover:text-[#3a302a] hover:bg-white/50'
            }`}
            title="Interactive Visual Canvas view"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Visual Canvas</span>
          </button>

          <button
            id="btn-view-code"
            onClick={() => onChangeViewMode('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'code'
                ? 'bg-white text-[#c2652a] shadow-xs font-semibold'
                : 'text-[#605850] hover:text-[#3a302a] hover:bg-white/50'
            }`}
            title="Pure PlantUML Script Code view"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Code Only</span>
          </button>
        </div>

        {/* Engine Render Mode Toggle (Interactive 2D Canvas vs Official PlantUML Server SVG) */}
        {viewMode !== 'code' && (
          <button
            id="btn-toggle-engine"
            onClick={onToggleRenderEngine}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              renderEngine === 'official-svg'
                ? 'bg-[#e2ebe0] text-[#2e4c27] border-[#6e8a67]'
                : 'bg-white text-[#605850] border-[#d8d0c8]/70 hover:border-[#c2652a]'
            }`}
            title={renderEngine === 'official-svg' ? 'Viewing Official PlantUML Server SVG. Click to switch to Interactive Canvas.' : 'Viewing Interactive Canvas. Click to view Official PlantUML Server SVG.'}
          >
            <Eye className="w-3.5 h-3.5 text-[#c2652a]" />
            <span>{renderEngine === 'official-svg' ? 'Official SVG' : 'Interactive 2D'}</span>
          </button>
        )}

        {/* Auto Layout Button */}
        {viewMode !== 'code' && renderEngine === 'interactive' && (
          <button
            id="btn-auto-layout"
            onClick={onAutoLayout}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-[#faf5ee] border border-[#d8d0c8]/70 text-[#605850] hover:text-[#3a302a] transition-colors cursor-pointer"
            title="Automatically rearrange nodes based on relationships"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#c2652a]" />
            <span>Auto Layout</span>
          </button>
        )}
      </div>

      {/* Right: History, Clear/Reset & Export Actions */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-[#f2ece4] rounded-lg border border-[#d8d0c8]/50 p-0.5">
          <button
            id="btn-undo"
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
              canUndo ? 'text-[#3a302a] hover:bg-white hover:text-[#c2652a]' : 'text-[#78706a]/40 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-redo"
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
              canRedo ? 'text-[#3a302a] hover:bg-white hover:text-[#c2652a]' : 'text-[#78706a]/40 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* New Clean Diagram */}
        <button
          id="btn-new-diagram"
          onClick={onNewDiagram}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#605850] hover:text-[#3a302a] bg-white hover:bg-[#f6f0e8] border border-[#d8d0c8]/60 transition-colors cursor-pointer"
          title="Start with a blank canvas"
        >
          <FilePlus className="w-3.5 h-3.5 text-[#78706a]" />
          <span>New</span>
        </button>

        {/* Reset Starter */}
        <button
          id="btn-reset-starter"
          onClick={onResetStarter}
          className="p-1.5 rounded-lg text-xs text-[#605850] hover:text-[#3a302a] hover:bg-[#f2ece4] border border-[#d8d0c8]/50 transition-colors cursor-pointer"
          title="Reset to default PlantUML starter script"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Quick Copy PlantUML code */}
        <button
          id="btn-quick-copy"
          onClick={onQuickCopyPlantUML}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#605850] hover:text-[#3a302a] bg-[#f2ece4] hover:bg-white border border-[#d8d0c8]/50 transition-all cursor-pointer"
          title="Quick copy PlantUML code to clipboard"
        >
          {copiedPlantUML ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[#78706a]" />
              <span>Copy PUML</span>
            </>
          )}
        </button>

        {/* Export & Download Button */}
        <button
          id="btn-export-dialog"
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#c2652a] text-white hover:bg-[#a95420] shadow-xs hover:shadow transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
