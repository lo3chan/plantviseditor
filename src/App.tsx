import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { 
  DiagramData, 
  DiagramNode, 
  Viewport, 
  AssetItem,
  SequenceParticipant,
  SequenceMessage,
  SequenceBlock,
  HistorySnapshot
} from './types';
import { DEFAULT_DIAGRAM, BLANK_DIAGRAM, UNIFIED_STARTER_PRESETS } from './utils/templates';
import { generatePlantUML, parsePlantUML, applyAutoLayout } from './utils/plantumlGenerator';
import { resolveOverlaps, resolveDiagramOverlaps, resolveEdgeLabelOverlaps, findVacantPosition } from './utils/overlapResolver';
import { Navbar, WorkspaceViewMode, RenderEngineMode } from './components/Navbar';
import { AssetPanel } from './components/AssetPanel';
import { Canvas } from './components/Canvas';
import { SequenceCanvas } from './components/SequenceCanvas';
import { CodePanel } from './components/CodePanel';
import { OfficialRenderView } from './components/OfficialRenderView';
import { ExportModal } from './components/ExportModal';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { 
  findPlantUMLLinesForElement, 
  findDiagramElementForCodeLine, 
  SelectedCanvasElement 
} from './utils/codeHighlightSync';

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

  // File drag & drop and toast notification states
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Undo / Redo History Stack with metadata
  const [history, setHistory] = useState<HistorySnapshot[]>([
    {
      id: 'hist_init',
      diagram: JSON.parse(JSON.stringify(DEFAULT_DIAGRAM)),
      action: 'Initial Diagram',
      timestamp: Date.now()
    }
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Push history state with grouping/coalescing and descriptive action names
  const pushHistory = useCallback((
    newDiagram: DiagramData, 
    customAction?: string, 
    forceCoalesce?: boolean
  ) => {
    let action = customAction;
    if (!action) {
      if (newDiagram.type === 'sequence' || (newDiagram.participants && newDiagram.participants.length > 0)) {
        const pLen = newDiagram.participants?.length || 0;
        const oldPLen = diagram.participants?.length || 0;
        const mLen = newDiagram.messages?.length || 0;
        const oldMLen = diagram.messages?.length || 0;
        if (pLen !== oldPLen) {
          action = pLen > oldPLen ? 'Added Lifeline' : 'Removed Lifeline';
        } else if (mLen !== oldMLen) {
          action = mLen > oldMLen ? 'Added Interaction Call' : 'Removed Interaction Call';
        } else {
          action = 'Updated Sequence Flow';
        }
      } else {
        const nLen = newDiagram.nodes.length;
        const oldNLen = diagram.nodes.length;
        if (nLen !== oldNLen) {
          action = nLen > oldNLen ? 'Added Element' : 'Removed Element';
        } else if (newDiagram.edges.length !== diagram.edges.length) {
          action = 'Updated Relationships';
        } else {
          action = 'Updated Diagram';
        }
      }
    }

    const now = Date.now();
    const currentItem = history[historyIndex];

    // Coalesce / debounce rapid identical updates (e.g., continuous moves or slider adjustments)
    const isSameAction = currentItem && currentItem.action === action;
    const isRecent = currentItem && (now - currentItem.timestamp < 1200);

    if ((forceCoalesce || (isSameAction && isRecent)) && historyIndex >= 0) {
      const updatedHistory = [...history];
      updatedHistory[historyIndex] = {
        ...currentItem,
        diagram: newDiagram,
        timestamp: now
      };
      setHistory(updatedHistory);
      setDiagram(newDiagram);
      return;
    }

    const snapshot: HistorySnapshot = {
      id: `hist_${now}_${Math.random().toString(36).slice(2, 6)}`,
      diagram: newDiagram,
      action: action || 'Diagram Edit',
      timestamp: now
    };

    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(snapshot);
    if (nextHistory.length > 50) nextHistory.shift();
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setDiagram(newDiagram);
  }, [diagram, history, historyIndex]);

  const diagramRef = useRef<DiagramData>(diagram);
  diagramRef.current = diagram;

  // Update active diagram with optional action label & history control options
  const updateDiagram = useCallback((
    patchOrFn: Partial<DiagramData> | ((prev: DiagramData) => Partial<DiagramData>), 
    actionName?: string,
    options?: { skipHistory?: boolean; coalesce?: boolean }
  ) => {
    const current = diagramRef.current;
    const patch = typeof patchOrFn === 'function' ? patchOrFn(current) : patchOrFn;
    const updated: DiagramData = {
      ...current,
      ...patch
    };
    diagramRef.current = updated;
    if (options?.skipHistory) {
      setDiagram(updated);
      return;
    }
    pushHistory(updated, actionName, options?.coalesce);
  }, [pushHistory]);

  // Undo / Redo handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setDiagram(history[historyIndex - 1].diagram);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setDiagram(history[historyIndex + 1].diagram);
    }
  };

  const handleJumpToHistory = (index: number) => {
    if (index >= 0 && index < history.length) {
      setHistoryIndex(index);
      setDiagram(history[index].diagram);
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
    pushHistory(blank, 'Blank Diagram');
  };

  // Reset to default starter template
  const handleResetStarter = () => {
    const starter = JSON.parse(JSON.stringify(DEFAULT_DIAGRAM));
    setViewport({ x: 40, y: 30, zoom: 1 });
    pushHistory(starter, 'Reset to Starter Template');
  };

  // Load preset template
  const handleSelectTemplate = (templateKey: string) => {
    const tpl = (UNIFIED_STARTER_PRESETS as any)[templateKey] || DEFAULT_DIAGRAM;
    const cloned = JSON.parse(JSON.stringify(tpl));
    setViewport({ x: 40, y: 30, zoom: 1 });
    pushHistory(cloned, `Preset: ${templateKey}`);
  };

  // Auto layout rearrangement with link label de-obscuring
  const handleAutoLayout = () => {
    const clonedNodes = JSON.parse(JSON.stringify(diagram.nodes));
    applyAutoLayout(clonedNodes, diagram.edges);
    const cleanEdges = resolveEdgeLabelOverlaps(clonedNodes, diagram.edges);
    updateDiagram({ nodes: clonedNodes, edges: cleanEdges }, 'Auto Layout Diagram');
  };

  // Anti-overlap rearrangement for both nodes and link labels
  const handleResolveOverlaps = () => {
    const { nodes: cleanNodes, edges: cleanEdges } = resolveDiagramOverlaps(
      diagram.nodes,
      diagram.edges,
      40
    );
    updateDiagram({ nodes: cleanNodes, edges: cleanEdges }, 'De-overlapped Elements & Link Labels');
  };

  // Add node from asset toolbox (via click or drag drop)
  const handleAddNodeFromAsset = (asset: AssetItem, targetX?: number, targetY?: number) => {
    // Check if we are in sequence mode, or if the asset is a sequence asset
    if (isSequenceMode || asset.category === 'sequence') {
      const currentParticipants = diagram.participants && diagram.participants.length > 0
        ? [...diagram.participants]
        : [
            { id: 'user', name: 'User', type: 'actor', color: 'sienna' },
            { id: 'app', name: 'AppService', type: 'participant', color: 'sand', stereotype: '«service»' }
          ];
      const currentMessages = diagram.messages || [];
      const currentBlocks = diagram.blocks || [];

      // 1. Sequence Message asset
      if (asset.id.startsWith('seq-msg-')) {
        const msgType = (asset.id.replace('seq-msg-', '') as 'sync' | 'reply' | 'async' | 'self') || 'sync';
        const fromP = currentParticipants[0]?.id || 'user';
        const toP = msgType === 'self' ? fromP : (currentParticipants[1]?.id || fromP);
        const nextOrder = currentMessages.length > 0 ? Math.max(...currentMessages.map(m => m.order)) + 1 : 1;
        const newMsg: SequenceMessage = {
          id: `msg_${Date.now()}`,
          from: fromP,
          to: toP,
          label: asset.label.includes('(') ? asset.label : `${asset.label}()`,
          type: msgType,
          order: nextOrder
        };
        updateDiagram({
          type: 'sequence',
          participants: currentParticipants,
          messages: [...currentMessages, newMsg]
        });
        return;
      }

      // 2. Sequence Block asset
      if (asset.id.startsWith('seq-block-')) {
        const blockType = asset.id.replace('seq-block-', '');
        const newBlock: SequenceBlock = {
          id: `block_${Date.now()}`,
          type: blockType,
          label: asset.label,
          condition: blockType === 'alt' ? 'status == 200' : blockType === 'loop' ? 'items.hasNext()' : undefined,
          startOrder: Math.max(1, currentMessages.length > 0 ? 1 : 1),
          endOrder: Math.max(1, currentMessages.length > 0 ? currentMessages.length : 1)
        };
        updateDiagram({
          type: 'sequence',
          participants: currentParticipants,
          messages: currentMessages,
          blocks: [...currentBlocks, newBlock]
        });
        return;
      }

      // 3. Sequence Note asset
      if (asset.id === 'seq-note') {
        if (currentMessages.length > 0) {
          const lastMsg = currentMessages[currentMessages.length - 1];
          const updatedMessages = currentMessages.map(m => m.id === lastMsg.id ? { ...m, noteText: 'Note: Verified state' } : m);
          updateDiagram({
            type: 'sequence',
            participants: currentParticipants,
            messages: updatedMessages
          });
        }
        return;
      }

      // 4. Participant Lifeline (From sequence category or ANY structural category)
      let pType = 'participant';
      if (asset.id === 'seq-actor' || asset.nodeType === 'actor' || asset.category === 'actor-agent') {
        pType = 'actor';
      } else if (asset.id === 'seq-database' || asset.nodeType === 'database' || asset.shape === 'cylinder') {
        pType = 'database';
      } else if (asset.id === 'seq-queue' || asset.nodeType === 'queue') {
        pType = 'queue';
      } else if (asset.id === 'seq-boundary' || asset.nodeType === 'boundary') {
        pType = 'boundary';
      } else if (asset.id === 'seq-control' || asset.nodeType === 'control') {
        pType = 'control';
      } else if (asset.id === 'seq-entity' || asset.nodeType === 'entity') {
        pType = 'entity';
      } else if (asset.id === 'seq-collections' || asset.nodeType === 'collections') {
        pType = 'collections';
      }

      const newParticipant: SequenceParticipant = {
        id: `p_${Date.now()}`,
        name: asset.label.replace(/[^a-zA-Z0-9_ ]/g, '').trim() || `Participant ${currentParticipants.length + 1}`,
        type: pType,
        shape: asset.shape || pType,
        color: asset.defaultColor || 'sand',
        stereotype: asset.sublabel ? `«${asset.sublabel.replace(/[«»]/g, '')}»` : undefined,
        x: targetX,
        y: targetY
      };

      const updatedParticipants = [...currentParticipants, newParticipant];
      if (targetX !== undefined) {
        updatedParticipants.sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
      }

      updateDiagram({
        type: 'sequence',
        participants: updatedParticipants,
        messages: currentMessages,
        blocks: currentBlocks
      });
      return;
    }

    const nodeWidth = asset.width || 190;
    const nodeHeight = asset.height || 85;
    const rawSpawnX = targetX !== undefined ? targetX : 240;
    const rawSpawnY = targetY !== undefined ? targetY : 160;

    // Guaranteed anti-collision spawning
    const { x: spawnX, y: spawnY } = findVacantPosition(
      diagram.nodes,
      rawSpawnX,
      rawSpawnY,
      nodeWidth,
      nodeHeight,
      36
    );

    const newNode: DiagramNode = {
      id: `${asset.nodeType}_${Date.now()}`,
      type: asset.nodeType,
      category: asset.category,
      label: asset.label,
      sublabel: asset.sublabel,
      x: spawnX,
      y: spawnY,
      width: nodeWidth,
      height: nodeHeight,
      color: asset.defaultColor || 'sienna',
      data: {
        ...(asset.defaultData ? JSON.parse(JSON.stringify(asset.defaultData)) : {}),
        ...(asset.shape ? { shape: asset.shape } : {}),
        ...(asset.description ? { description: asset.description } : {})
      }
    };

    updateDiagram((prev) => ({
      type: 'class',
      nodes: [...(prev.nodes || []), newNode],
      participants: [],
      messages: [],
      blocks: []
    }), `Added ${asset.label}`);
  };

  // Quick Copy PlantUML
  const handleQuickCopyPlantUML = () => {
    const code = generatePlantUML(diagram);
    navigator.clipboard.writeText(code);
    setCopiedPlantUML(true);
    setTimeout(() => setCopiedPlantUML(false), 2000);
  };

  // Apply code from CodePanel parser with overlap prevention for nodes and edge labels
  const handleApplyCode = (newCode: string) => {
    try {
      if (!newCode || !newCode.trim()) {
        setToastMessage({ text: 'PlantUML code is empty', type: 'error' });
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }

      const parsed = parsePlantUML(newCode);

      if (parsed.type === 'sequence') {
        updateDiagram({
          title: parsed.title || diagram.title,
          type: 'sequence',
          participants: parsed.participants || [],
          messages: parsed.messages || [],
          blocks: parsed.blocks || [],
          nodes: [],
          edges: [],
          settings: parsed.settings || diagram.settings
        }, 'Applied Sequence Script');
        return;
      }

      if (parsed.nodes !== undefined || parsed.edges !== undefined) {
        // Preserve positions of existing nodes where IDs match so canvas doesn't jump randomly
        const existingNodeMap = new Map<string, DiagramNode>((diagram.nodes || []).map(n => [n.id, n]));
        const initialNodes = (parsed.nodes || []).map(n => {
          const existing = existingNodeMap.get(n.id);
          if (existing) {
            return {
              ...n,
              x: existing.x,
              y: existing.y
            };
          }
          return n;
        });

        const resolvedNodes = resolveOverlaps(initialNodes, 36);
        const cleanEdges = resolveEdgeLabelOverlaps(resolvedNodes, parsed.edges || []);
        updateDiagram({
          title: parsed.title || diagram.title,
          type: parsed.type || 'class',
          nodes: resolvedNodes,
          edges: cleanEdges,
          participants: [],
          messages: [],
          blocks: [],
          settings: parsed.settings || diagram.settings
        }, 'Applied PlantUML Script');
      }
    } catch (err: any) {
      console.error('Failed to apply PlantUML code:', err);
      setToastMessage({ text: `Syntax parse error: ${err?.message || 'Invalid syntax'}`, type: 'error' });
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Import file handler supporting .puml, .plantuml, .iuml, .txt, and .json
  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      try {
        const trimmed = content.trim();
        // Check if file is JSON format
        if (file.name.endsWith('.json') || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
          const parsed = JSON.parse(trimmed);
          if (parsed && (Array.isArray(parsed.nodes) || Array.isArray(parsed.participants))) {
            const loadedDiagram: DiagramData = {
              title: parsed.title || file.name.replace(/\.[^/.]+$/, ''),
              type: parsed.type || (parsed.participants?.length ? 'sequence' : 'class'),
              nodes: parsed.nodes || [],
              edges: parsed.edges || [],
              participants: parsed.participants || [],
              messages: parsed.messages || [],
              blocks: parsed.blocks || [],
              settings: parsed.settings
            };
            pushHistory(loadedDiagram, `Imported ${file.name}`);
            setToastMessage({ text: `Successfully loaded "${file.name}"`, type: 'success' });
            setTimeout(() => setToastMessage(null), 3500);
            return;
          }
        }

        // Otherwise parse as PlantUML syntax
        handleApplyCode(content);
        setToastMessage({ text: `Imported PlantUML script "${file.name}"`, type: 'success' });
        setTimeout(() => setToastMessage(null), 3500);
      } catch (err: any) {
        console.error('File import error:', err);
        setToastMessage({ text: `Could not parse "${file.name}": ${err?.message || 'Invalid format'}`, type: 'error' });
        setTimeout(() => setToastMessage(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  // Window drag-and-drop event listeners
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
      setIsDraggingFile(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear if leaving the root window
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleImportFile(files[0]);
    }
  };

  const currentPlantUMLCode = generatePlantUML(diagram);

  // Synchronized Selection between Canvas and Code Editor
  const [selectedCanvasElement, setSelectedCanvasElement] = useState<SelectedCanvasElement | null>(null);

  // Compute line in PlantUML code corresponding to selected diagram element
  const highlightedCodeLine = useMemo(() => {
    if (!selectedCanvasElement) return null;
    return findPlantUMLLinesForElement(currentPlantUMLCode, selectedCanvasElement, diagram);
  }, [currentPlantUMLCode, selectedCanvasElement, diagram]);

  // When cursor moves in code editor, select the matching diagram node or connector
  const handleCursorLineChange = useCallback((lineNumber: number, lineText: string) => {
    const matched = findDiagramElementForCodeLine(lineText, diagram);
    if (matched) {
      setSelectedCanvasElement(matched);
    }
  }, [diagram]);

  const isSequenceMode = diagram.type === 'sequence' && (!diagram.nodes || diagram.nodes.length === 0);

  return (
    <div 
      className="flex flex-col w-screen h-screen overflow-hidden bg-[#faf5ee] relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 1-1 PlantUML Top Navigation Bar */}
      <Navbar
        title={diagram.title}
        onUpdateTitle={(newTitle) => updateDiagram({ title: newTitle })}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        renderEngine={renderEngine}
        onToggleRenderEngine={() => setRenderEngine(mode => mode === 'interactive' ? 'official-svg' : 'interactive')}
        onAutoLayout={handleAutoLayout}
        onResolveOverlaps={handleResolveOverlaps}
        onNewDiagram={handleNewDiagram}
        onResetStarter={handleResetStarter}
        onSelectTemplate={handleSelectTemplate}
        onImportFile={handleImportFile}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        history={history}
        historyIndex={historyIndex}
        onJumpToHistory={handleJumpToHistory}
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
                highlightedLine={highlightedCodeLine}
                onCursorLineChange={handleCursorLineChange}
              />
            </div>

            {/* Right 58%: Diagram Canvas or Official Server SVG */}
            <div className="flex-1 h-full relative overflow-hidden">
              {renderEngine === 'interactive' ? (
                isSequenceMode ? (
                  <SequenceCanvas
                    participants={diagram.participants || []}
                    messages={diagram.messages || []}
                    blocks={diagram.blocks || []}
                    onUpdateParticipants={(participants) => updateDiagram({ participants })}
                    onUpdateMessages={(messages) => updateDiagram({ messages })}
                    onUpdateBlocks={(blocks) => updateDiagram({ blocks })}
                    viewport={viewport}
                    snapToGrid={snapToGrid}
                    onToggleSnap={() => setSnapToGrid(!snapToGrid)}
                    selectedElementId={selectedCanvasElement?.id || null}
                    onSelectElement={setSelectedCanvasElement}
                  />
                ) : (
                  <Canvas
                    diagram={diagram}
                    viewport={viewport}
                    onUpdateViewport={setViewport}
                    onUpdateNodes={(nodes, options) => updateDiagram({ nodes }, options?.actionName, { skipHistory: options?.skipHistory, coalesce: options?.coalesce })}
                    onUpdateEdges={(edges) => updateDiagram({ edges })}
                    onAddNode={(node, edge) => updateDiagram(prev => ({
                      nodes: [...(prev.nodes || []), node],
                      edges: edge ? [...(prev.edges || []), edge] : prev.edges
                    }), edge ? `Added connected ${node.label}` : `Added ${node.label}`)}
                    snapToGrid={snapToGrid}
                    onToggleSnap={() => setSnapToGrid(!snapToGrid)}
                    onUpdateSettings={(settings) => updateDiagram({ settings: { ...(diagram.settings || { direction: 'TB', linetype: 'ortho', monochrome: false, handwritten: false, shadowing: false }), ...settings } })}
                    selectedElementId={selectedCanvasElement?.id || null}
                    onSelectElement={setSelectedCanvasElement}
                  />
                )
              ) : (
                <OfficialRenderView 
                  code={currentPlantUMLCode} 
                  settings={diagram.settings || { direction: 'TB', linetype: 'ortho', monochrome: false, handwritten: false, shadowing: false }}
                  onUpdateSettings={(settings) => updateDiagram({ settings: { ...(diagram.settings || { direction: 'TB', linetype: 'ortho', monochrome: false, handwritten: false, shadowing: false }), ...settings } })}
                  isSequenceDiagram={isSequenceMode}
                />
              )}
            </div>
          </div>
        )}

        {/* MODE 2: VISUAL CANVAS ONLY (With Toolbox on Left) */}
        {viewMode === 'canvas' && (
          <div className="w-full h-full flex overflow-hidden relative">
            {/* Left Structural Toolbox */}
            <AssetPanel
              onAddNodeFromAsset={handleAddNodeFromAsset}
              isCollapsed={isAssetPanelCollapsed}
              onToggleCollapse={() => setIsAssetPanelCollapsed(!isAssetPanelCollapsed)}
            />

            {/* Canvas or Official SVG */}
            <div className="flex-1 h-full relative overflow-hidden">
              {renderEngine === 'interactive' ? (
                isSequenceMode ? (
                  <SequenceCanvas
                    participants={diagram.participants || []}
                    messages={diagram.messages || []}
                    blocks={diagram.blocks || []}
                    onUpdateParticipants={(participants) => updateDiagram({ participants })}
                    onUpdateMessages={(messages) => updateDiagram({ messages })}
                    onUpdateBlocks={(blocks) => updateDiagram({ blocks })}
                    viewport={viewport}
                    snapToGrid={snapToGrid}
                    onToggleSnap={() => setSnapToGrid(!snapToGrid)}
                    selectedElementId={selectedCanvasElement?.id || null}
                    onSelectElement={setSelectedCanvasElement}
                  />
                ) : (
                  <Canvas
                    diagram={diagram}
                    viewport={viewport}
                    onUpdateViewport={setViewport}
                    onUpdateNodes={(nodes, options) => updateDiagram({ nodes }, options?.actionName, { skipHistory: options?.skipHistory, coalesce: options?.coalesce })}
                    onUpdateEdges={(edges) => updateDiagram({ edges })}
                    onAddNode={(node, edge) => updateDiagram(prev => ({
                      nodes: [...(prev.nodes || []), node],
                      edges: edge ? [...(prev.edges || []), edge] : prev.edges
                    }), edge ? `Added connected ${node.label}` : `Added ${node.label}`)}
                    snapToGrid={snapToGrid}
                    onToggleSnap={() => setSnapToGrid(!snapToGrid)}
                    onUpdateSettings={(settings) => updateDiagram({ settings: { ...(diagram.settings || { direction: 'TB', linetype: 'ortho', monochrome: false, handwritten: false, shadowing: false }), ...settings } })}
                    selectedElementId={selectedCanvasElement?.id || null}
                    onSelectElement={setSelectedCanvasElement}
                  />
                )
              ) : (
                <OfficialRenderView 
                  code={currentPlantUMLCode} 
                  settings={diagram.settings || { direction: 'TB', linetype: 'ortho', monochrome: false, handwritten: false, shadowing: false }}
                  onUpdateSettings={(settings) => updateDiagram({ settings: { ...(diagram.settings || { direction: 'TB', linetype: 'ortho', monochrome: false, handwritten: false, shadowing: false }), ...settings } })}
                  isSequenceDiagram={isSequenceMode}
                />
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
              highlightedLine={highlightedCodeLine}
              onCursorLineChange={handleCursorLineChange}
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

      {/* Toast Notification */}
      {toastMessage && (
        <div 
          id="app-toast-notification"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-xl bg-white border border-[#d8d0c8] text-xs font-medium text-[#3a302a] animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Full Window Drag & Drop File Overlay */}
      {isDraggingFile && (
        <div 
          id="dropzone-overlay"
          className="fixed inset-0 z-50 bg-[#3a302a]/40 backdrop-blur-xs flex items-center justify-center pointer-events-none animate-in fade-in duration-150"
        >
          <div className="bg-[#faf5ee] border-2 border-dashed border-[#c2652a] rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#fbf0ea] border border-[#f0c2a8] flex items-center justify-center text-[#c2652a] mb-4 animate-bounce">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#3a302a] mb-1">
              Drop Diagram File Here
            </h3>
            <p className="text-xs text-[#78706a] mb-2 leading-relaxed">
              Import a PlantUML script (<code className="bg-[#f2ece4] px-1 py-0.5 rounded text-[#c2652a] font-mono">.puml, .plantuml, .txt</code>) or a Studio Project Backup (<code className="bg-[#f2ece4] px-1 py-0.5 rounded text-[#c2652a] font-mono">.json</code>).
            </p>
            <span className="text-[11px] font-semibold text-[#c2652a] bg-[#fbf0ea] px-2.5 py-1 rounded-full border border-[#f0c2a8]">
              Release to load diagram immediately
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
