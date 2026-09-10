import React, { useState, useCallback, useEffect } from 'react';
import { 
  DiagramData, 
  DiagramNode, 
  Viewport, 
  AssetItem 
} from './types';
import { DEFAULT_DIAGRAM, BLANK_DIAGRAM } from './utils/templates';
import { generatePlantUML, parsePlantUML, applyAutoLayout } from './utils/plantumlGenerator';
import { Navbar, WorkspaceViewMode, RenderEngineMode } from './components/Navbar';
import { AssetPanel } from './components/AssetPanel';
import { Canvas } from './components/Canvas';
import { CodePanel } from './components/CodePanel';
import { OfficialRenderView } from './components/OfficialRenderView';
import { ExportModal } from './components/ExportModal';

export default function App() {
  const [diagram, setDiagram] = useState<DiagramData>(() => {
    return JSON.parse(JSON.stringify(DEFAULT_DIAGRAM));
  });

  const [viewport, setViewport] = useState<Viewport>({ x: 40, y: 30, zoom: 1 });
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  
  // Layout and Engine view modes
  const [viewMode, setViewMode] = useState<WorkspaceViewMode>('split');
  const [renderEngine, setRenderEngine] = useState<RenderEngineMode>('interactive');

  // Asset Panel collapse state in canvas mode
  const [isAssetPanelCollapsed, setIsAssetPanelCollapsed] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [copiedPlantUML, setCopiedPlantUML] = useState<boolean>(false);

  // Undo / Redo History
  const [history, setHistory] = useState<DiagramData[]>([
    JSON.parse(JSON.stringify(DEFAULT_DIAGRAM))
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Push history state
  const pushHistory = useCallback((newDiagram: DiagramData) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(newDiagram);
    if (nextHistory.length > 40) nextHistory.shift();
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setDiagram(newDiagram);
  }, [history, historyIndex]);

  // Update active diagram
  const updateDiagram = useCallback((patch: Partial<DiagramData>) => {
    const updated: DiagramData = {
      ...diagram,
      ...patch
    };
    pushHistory(updated);
  }, [diagram, pushHistory]);

  // Undo / Redo handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setDiagram(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setDiagram(history[historyIndex + 1]);
    }
  };

  // Keyboard shortcuts for Undo / Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  // Blank New Diagram
  const handleNewDiagram = () => {
    const blank = JSON.parse(JSON.stringify(BLANK_DIAGRAM));
    setViewport({ x: 40, y: 30, zoom: 1 });
    pushHistory(blank);
  };

  // Reset to default starter template
  const handleResetStarter = () => {
    const starter = JSON.parse(JSON.stringify(DEFAULT_DIAGRAM));
    setViewport({ x: 40, y: 30, zoom: 1 });
    pushHistory(starter);
  };

  // Auto layout rearrangement
  const handleAutoLayout = () => {
    const clonedNodes = JSON.parse(JSON.stringify(diagram.nodes));
    applyAutoLayout(clonedNodes, diagram.edges);
    updateDiagram({ nodes: clonedNodes });
  };

  // Add node from asset toolbox (via click or drag drop)
  const handleAddNodeFromAsset = (asset: AssetItem, targetX?: number, targetY?: number) => {
    const spawnX = targetX !== undefined ? targetX : 240;
    const spawnY = targetY !== undefined ? targetY : 160;

    const newNode: DiagramNode = {
      id: `${asset.nodeType}_${Date.now()}`,
      type: asset.nodeType,
      category: asset.category,
      label: asset.label,
      sublabel: asset.sublabel,
      x: spawnX,
      y: spawnY,
      width: asset.width || 190,
      height: asset.height || 85,
      color: asset.defaultColor || 'sienna',
      data: asset.defaultData ? JSON.parse(JSON.stringify(asset.defaultData)) : undefined
    };

    updateDiagram({
      nodes: [...diagram.nodes, newNode]
    });
  };

  // Quick Copy PlantUML
  const handleQuickCopyPlantUML = () => {
    const code = generatePlantUML(diagram);
    navigator.clipboard.writeText(code);
    setCopiedPlantUML(true);
    setTimeout(() => setCopiedPlantUML(false), 2000);
  };

  // Apply code from CodePanel parser
  const handleApplyCode = (newCode: string) => {
    const parsed = parsePlantUML(newCode);
    if (parsed.nodes || parsed.edges) {
      updateDiagram({
        title: parsed.title || diagram.title,
        nodes: parsed.nodes || diagram.nodes,
        edges: parsed.edges || diagram.edges
      });
    }
  };

  const currentPlantUMLCode = generatePlantUML(diagram);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#faf5ee]">
      {/* 1-1 PlantUML Top Navigation Bar */}
      <Navbar
        title={diagram.title}
        onUpdateTitle={(newTitle) => updateDiagram({ title: newTitle })}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        renderEngine={renderEngine}
        onToggleRenderEngine={() => setRenderEngine(mode => mode === 'interactive' ? 'official-svg' : 'interactive')}
        onAutoLayout={handleAutoLayout}
        onNewDiagram={handleNewDiagram}
        onResetStarter={handleResetStarter}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenExport={() => setIsExportModalOpen(true)}
        onQuickCopyPlantUML={handleQuickCopyPlantUML}
        copiedPlantUML={copiedPlantUML}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 relative flex overflow-hidden">
        {/* MODE 1: SPLIT VIEW (Code on Left, Canvas/SVG on Right) */}
        {viewMode === 'split' && (
          <div className="w-full h-full flex overflow-hidden">
            {/* Left 45%: Full PlantUML Code Editor */}
            <div className="w-[42%] min-w-[360px] max-w-[650px] h-full">
              <CodePanel
                code={currentPlantUMLCode}
                onApplyCode={handleApplyCode}
                isSplitView={true}
              />
            </div>

            {/* Right 58%: Diagram Canvas or Official Server SVG */}
            <div className="flex-1 h-full relative overflow-hidden">
              {renderEngine === 'interactive' ? (
                <Canvas
                  diagram={diagram}
                  viewport={viewport}
                  onUpdateViewport={setViewport}
                  onUpdateNodes={(nodes) => updateDiagram({ nodes })}
                  onUpdateEdges={(edges) => updateDiagram({ edges })}
                  onAddNode={(node) => updateDiagram({ nodes: [...diagram.nodes, node] })}
                  snapToGrid={snapToGrid}
                  onToggleSnap={() => setSnapToGrid(!snapToGrid)}
                />
              ) : (
                <OfficialRenderView code={currentPlantUMLCode} />
              )}
            </div>
          </div>
        )}

        {/* MODE 2: VISUAL CANVAS ONLY (With Toolbox on Left) */}
        {viewMode === 'canvas' && (
          <div className="w-full h-full flex overflow-hidden relative">
            {/* Left Toolbox */}
            <AssetPanel
              onAddNodeFromAsset={handleAddNodeFromAsset}
              isCollapsed={isAssetPanelCollapsed}
              onToggleCollapse={() => setIsAssetPanelCollapsed(!isAssetPanelCollapsed)}
            />

            {/* Canvas or Official SVG */}
            <div className="flex-1 h-full relative overflow-hidden">
              {renderEngine === 'interactive' ? (
                <Canvas
                  diagram={diagram}
                  viewport={viewport}
                  onUpdateViewport={setViewport}
                  onUpdateNodes={(nodes) => updateDiagram({ nodes })}
                  onUpdateEdges={(edges) => updateDiagram({ edges })}
                  onAddNode={(node) => updateDiagram({ nodes: [...diagram.nodes, node] })}
                  snapToGrid={snapToGrid}
                  onToggleSnap={() => setSnapToGrid(!snapToGrid)}
                />
              ) : (
                <OfficialRenderView code={currentPlantUMLCode} />
              )}
            </div>
          </div>
        )}

        {/* MODE 3: CODE ONLY VIEW */}
        {viewMode === 'code' && (
          <div className="w-full h-full">
            <CodePanel
              code={currentPlantUMLCode}
              onApplyCode={handleApplyCode}
              isSplitView={true}
            />
          </div>
        )}
      </main>

      {/* Export & Download Dialog */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        diagram={diagram}
      />
    </div>
  );
}
