import React, { useState, useRef, useEffect } from 'react';
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
  Cpu,
  LayoutTemplate,
  ChevronDown,
  History,
  ShieldCheck,
  FolderOpen,
  Upload,
  GitBranch
} from 'lucide-react';
import { HistorySnapshot } from '../types';

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
  onResolveOverlaps?: () => void;
  onNewDiagram: () => void;
  onResetStarter: () => void;
  onSelectTemplate?: (templateKey: string) => void;
  onImportFile?: (file: File) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  history?: HistorySnapshot[];
  historyIndex?: number;
  onJumpToHistory?: (index: number) => void;
  onOpenExport: () => void;
  onQuickCopyPlantUML: () => void;
  copiedPlantUML: boolean;
  isSequenceDiagram?: boolean;
  onToggleDiagramMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  title,
  onUpdateTitle,
  viewMode,
  onChangeViewMode,
  renderEngine,
  onToggleRenderEngine,
  onAutoLayout,
  onResolveOverlaps,
  onNewDiagram,
  onResetStarter,
  onSelectTemplate,
  onImportFile,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  history,
  historyIndex = 0,
  onJumpToHistory,
  onOpenExport,
  onQuickCopyPlantUML,
  copiedPlantUML,
  isSequenceDiagram = false,
  onToggleDiagramMode
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const templateMenuRef = useRef<HTMLDivElement>(null);
  const historyMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportFile) {
      onImportFile(file);
    }
    // reset input so same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (templateMenuRef.current && !templateMenuRef.current.contains(e.target as Node)) {
        setIsTemplateMenuOpen(false);
      }
      if (historyMenuRef.current && !historyMenuRef.current.contains(e.target as Node)) {
        setIsHistoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      <div className="flex items-center gap-2 shrink-0 flex-nowrap">
        {/* Workspace Layout Switcher */}
        <div className="flex items-center bg-[#f2ece4] p-0.5 rounded-xl border border-[#d8d0c8]/60 shadow-inner h-8 shrink-0">
          <button
            id="btn-view-split"
            onClick={() => onChangeViewMode('split')}
            className={`h-7 whitespace-nowrap shrink-0 flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
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
            className={`h-7 whitespace-nowrap shrink-0 flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
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
            className={`h-7 whitespace-nowrap shrink-0 flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
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
            className={`h-8 whitespace-nowrap shrink-0 flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
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
            className="h-8 whitespace-nowrap shrink-0 flex items-center gap-1 px-2.5 rounded-lg text-xs font-medium bg-white hover:bg-[#faf5ee] border border-[#d8d0c8]/70 text-[#605850] hover:text-[#3a302a] transition-colors cursor-pointer"
            title="Automatically rearrange nodes based on relationships"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#c2652a]" />
            <span>Auto Layout</span>
          </button>
        )}

        {/* De-Overlap / Anti-Collision Button */}
        {viewMode !== 'code' && renderEngine === 'interactive' && onResolveOverlaps && (
          <button
            id="btn-resolve-overlap"
            onClick={onResolveOverlaps}
            className="h-8 whitespace-nowrap shrink-0 flex items-center gap-1 px-2.5 rounded-lg text-xs font-medium bg-white hover:bg-[#faf5ee] border border-[#d8d0c8]/70 text-[#605850] hover:text-[#3a302a] transition-colors cursor-pointer"
            title="Automatically space out and eliminate overlapping elements"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>De-Overlap</span>
          </button>
        )}

        {/* Diagram Architecture / Sequence Mode Toggle */}
        {onToggleDiagramMode && (
          <button
            id="btn-toggle-diagram-mode"
            onClick={onToggleDiagramMode}
            className={`h-8 whitespace-nowrap shrink-0 flex items-center gap-1.5 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              isSequenceDiagram
                ? 'bg-[#fef3c7] text-[#92400e] border-[#f59e0b] shadow-xs'
                : 'bg-white text-[#605850] border-[#d8d0c8]/70 hover:border-[#c2652a] hover:text-[#3a302a]'
            }`}
            title={isSequenceDiagram ? 'Currently in Sequence Timeline view. Click to switch to 2D Architecture Canvas.' : 'Currently in 2D Architecture Canvas. Click to switch to Sequence Timeline view.'}
          >
            <GitBranch className="w-3.5 h-3.5 text-[#c2652a] shrink-0" />
            <span className="whitespace-nowrap font-semibold">{isSequenceDiagram ? 'Sequence Timeline' : 'Architecture Canvas'}</span>
          </button>
        )}
      </div>

      {/* Right: History, Clear/Reset & Export Actions */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo & History Tab Dropdown */}
        <div className="flex items-center bg-[#f2ece4] rounded-lg border border-[#d8d0c8]/50 p-0.5 relative" ref={historyMenuRef}>
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

          <div className="w-[1px] h-3.5 bg-[#d8d0c8] mx-0.5" />

          {/* History Tab Dropdown */}
          <button
            id="btn-history-dropdown"
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              isHistoryOpen ? 'bg-white text-[#c2652a] shadow-xs' : 'text-[#605850] hover:text-[#3a302a] hover:bg-white/80'
            }`}
            title="View revision history stack"
          >
            <History className="w-3.5 h-3.5 text-[#c2652a]" />
            <span className="hidden sm:inline font-sans">History</span>
            {history && history.length > 0 && (
              <span className="text-[10px] bg-[#c2652a]/15 text-[#c2652a] font-mono px-1 rounded font-bold">
                {historyIndex + 1}/{history.length}
              </span>
            )}
            <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${isHistoryOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* History Dropdown Popover */}
          {isHistoryOpen && history && history.length > 0 && (
            <div className="absolute right-0 top-full mt-1.5 w-80 bg-white border border-[#d8d0c8] rounded-xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#f0eae2] mb-1.5">
                <div className="flex items-center gap-1.5">
                  <History className="w-4 h-4 text-[#c2652a]" />
                  <span className="text-xs font-bold text-[#3a302a] font-serif">Revision History</span>
                </div>
                <span className="text-[10px] font-mono font-semibold bg-[#f2ece4] text-[#78706a] px-1.5 py-0.5 rounded">
                  {history.length} step{history.length === 1 ? '' : 's'}
                </span>
              </div>

              {/* Quick Jump Buttons */}
              <div className="flex items-center justify-between px-1 mb-1.5 gap-1 text-[11px]">
                <button
                  onClick={() => {
                    if (onJumpToHistory) onJumpToHistory(0);
                    setIsHistoryOpen(false);
                  }}
                  disabled={historyIndex === 0}
                  className="flex-1 py-1 px-2 rounded bg-[#f6f0e8] hover:bg-[#ebdccf] text-[#605850] disabled:opacity-40 disabled:cursor-not-allowed text-center transition-colors cursor-pointer font-medium text-[10px]"
                >
                  ⏮ Jump to Initial
                </button>
                <button
                  onClick={() => {
                    if (onJumpToHistory) onJumpToHistory(history.length - 1);
                    setIsHistoryOpen(false);
                  }}
                  disabled={historyIndex === history.length - 1}
                  className="flex-1 py-1 px-2 rounded bg-[#f6f0e8] hover:bg-[#ebdccf] text-[#605850] disabled:opacity-40 disabled:cursor-not-allowed text-center transition-colors cursor-pointer font-medium text-[10px]"
                >
                  ⏭ Jump to Latest
                </button>
              </div>

              {/* History Items List */}
              <div className="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1">
                {[...history].map((item, originalIndex) => {
                  const isCurrent = originalIndex === historyIndex;
                  const isFuture = originalIndex > historyIndex;
                  const timeFormatted = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                  return (
                    <button
                      key={item.id || `hist-${originalIndex}`}
                      onClick={() => {
                        if (onJumpToHistory) onJumpToHistory(originalIndex);
                        setIsHistoryOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                        isCurrent
                          ? 'bg-[#c2652a]/10 border border-[#c2652a]/60 shadow-2xs'
                          : isFuture
                          ? 'hover:bg-[#faf5ee] text-[#78706a] opacity-75'
                          : 'hover:bg-[#faf5ee] text-[#3a302a]'
                      }`}
                    >
                      <div className="mt-1 shrink-0">
                        {isCurrent ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#c2652a] ring-4 ring-[#c2652a]/20" />
                        ) : (
                          <div className={`w-2 h-2 rounded-full ${isFuture ? 'bg-gray-300' : 'bg-[#a99c90]'}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`font-semibold truncate ${isCurrent ? 'text-[#c2652a]' : 'text-[#3a302a]'}`}>
                            {item.action || `Revision #${originalIndex + 1}`}
                          </span>
                          <span className="text-[9px] font-mono text-gray-400 shrink-0">
                            {timeFormatted}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>Step #{originalIndex + 1}</span>
                          {isCurrent && (
                            <span className="bg-[#c2652a] text-white px-1 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider">
                              Current
                            </span>
                          )}
                          {isFuture && (
                            <span className="text-gray-400 italic text-[9px]">
                              (Redoable)
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer with keyboard shortcuts */}
              <div className="mt-2 pt-1.5 border-t border-[#f0eae2] text-[10px] text-gray-400 flex items-center justify-between px-1 font-mono">
                <span>Undo: Ctrl+Z</span>
                <span>Redo: Ctrl+Y</span>
              </div>
            </div>
          )}
        </div>

        {/* Templates & Presets Dropdown */}
        {onSelectTemplate && (
          <div className="relative" ref={templateMenuRef}>
            <button
              id="btn-templates-dropdown"
              onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#605850] hover:text-[#3a302a] bg-white hover:bg-[#f6f0e8] border border-[#d8d0c8]/60 transition-colors cursor-pointer"
              title="Load standard PlantUML templates"
            >
              <LayoutTemplate className="w-3.5 h-3.5 text-[#c2652a]" />
              <span>Presets</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {isTemplateMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-[#d8d0c8] rounded-xl shadow-lg p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2 py-1">
                  PlantUML Standard Libraries
                </div>
                <button
                  onClick={() => {
                    onSelectTemplate('domain_and_er');
                    setIsTemplateMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-[#faf5ee] text-[#3a302a] flex flex-col gap-0.5 transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-[#8a4518]">Domain Model & ER</span>
                  <span className="text-[10px] text-gray-500">OOP classes, spots, ER entities & crow's foot</span>
                </button>
                <button
                  onClick={() => {
                    onSelectTemplate('cloud_c4_archimate');
                    setIsTemplateMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-[#faf5ee] text-[#3a302a] flex flex-col gap-0.5 transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-[#08427B]">C4 Banking Architecture</span>
                  <span className="text-[10px] text-gray-500">Official &lt;C4/C4_Container&gt; Person, System, Container</span>
                </button>
                <button
                  onClick={() => {
                    onSelectTemplate('archimate_enterprise');
                    setIsTemplateMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-[#faf5ee] text-[#3a302a] flex flex-col gap-0.5 transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-emerald-800">ArchiMate Enterprise</span>
                  <span className="text-[10px] text-gray-500">Business, Application & Technology layers</span>
                </button>
                <button
                  onClick={() => {
                    onSelectTemplate('state_machine_workflow');
                    setIsTemplateMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-[#faf5ee] text-[#3a302a] flex flex-col gap-0.5 transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-[#c2652a]">State Machine & Workflow</span>
                  <span className="text-[10px] text-gray-500">History [H], entry/do/exit actions & flow final</span>
                </button>
                <button
                  onClick={() => {
                    onSelectTemplate('salt_wireframe');
                    setIsTemplateMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-[#faf5ee] text-[#3a302a] flex flex-col gap-0.5 transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-[#486581]">Salt GUI Wireframe</span>
                  <span className="text-[10px] text-gray-500">Interactive forms, windows, tabs & data grids</span>
                </button>
                <button
                  onClick={() => {
                    onSelectTemplate('embedded_engines');
                    setIsTemplateMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-[#faf5ee] text-[#3a302a] flex flex-col gap-0.5 transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-[#0f766e]">Sub-Engines (Ditaa, Math, WBS)</span>
                  <span className="text-[10px] text-gray-500">ASCII vector art, LaTeX &lt;math&gt;, JSON &amp; WBS packages</span>
                </button>
                <button
                  onClick={() => {
                    onSelectTemplate('sequence_auth');
                    setIsTemplateMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-[#faf5ee] text-[#3a302a] flex flex-col gap-0.5 transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-[#A80036]">Sequence Auth Flow</span>
                  <span className="text-[10px] text-gray-500">Lifelines, activations, messages & alt frames</span>
                </button>
                <div className="h-px bg-gray-100 my-1" />
                <button
                  onClick={() => {
                    onSelectTemplate('blank');
                    setIsTemplateMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-gray-50 text-gray-700 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Blank Canvas</span>
                  <span className="text-[10px] text-gray-400">Empty</span>
                </button>
              </div>
            )}
          </div>
        )}

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

        {/* Import Diagram File (.puml, .txt, .json) */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".puml,.plantuml,.iuml,.txt,.json"
          className="hidden"
          aria-label="Upload Diagram File"
        />
        <button
          id="btn-import-file"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#605850] hover:text-[#3a302a] bg-white hover:bg-[#f6f0e8] border border-[#d8d0c8]/60 transition-colors cursor-pointer"
          title="Open or import a PlantUML (.puml, .txt) or Project JSON file"
        >
          <FolderOpen className="w-3.5 h-3.5 text-[#78706a]" />
          <span>Import</span>
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
