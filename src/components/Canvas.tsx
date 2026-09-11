import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Minus, 
  Maximize, 
  Grid, 
  Trash2, 
  Edit3, 
  ArrowRight,
  Move,
  ArrowDownUp,
  ArrowLeftRight,
  Palette,
  PenTool
} from 'lucide-react';
import { 
  DiagramData, 
  DiagramNode, 
  DiagramEdge, 
  PortPosition, 
  Viewport, 
  AssetItem,
  GlobalCanvasSettings
} from '../types';
import { SelectedCanvasElement } from '../utils/codeHighlightSync';
import { DiagramNodeView } from './DiagramNode';
import { QuickActionBar } from './QuickActionBar';
import { EdgeToolbar } from './EdgeToolbar';
import { QuickBranchPopup } from './QuickBranchPopup';
import { ElementInspector } from './ElementInspector';

interface CanvasProps {
  diagram: DiagramData;
  viewport: Viewport;
  onUpdateViewport: (viewport: Viewport) => void;
  onUpdateNodes: (nodes: DiagramNode[], options?: { actionName?: string; skipHistory?: boolean; coalesce?: boolean }) => void;
  onUpdateEdges: (edges: DiagramEdge[]) => void;
  onAddNode: (node: DiagramNode, edge?: DiagramEdge) => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  onUpdateSettings?: (settings: Partial<GlobalCanvasSettings>) => void;
  selectedElementId?: string | null;
  onSelectElement?: (element: SelectedCanvasElement | null) => void;
}

export function getFriendlyRelationLabel(arrowType?: DiagramEdge['arrowType'], style?: DiagramEdge['style']): string {
  switch (arrowType) {
    case 'inheritance':
      return 'Inheritance';
    case 'realization':
      return 'Realization';
    case 'composition':
      return 'Composition';
    case 'aggregation':
      return 'Aggregation';
    case 'dependency':
      return 'Dependency';
    case 'crows-foot-one':
      return 'One-to-One (1:1)';
    case 'crows-foot-many':
    case 'crows-foot-many-many':
      return 'One-to-Many (1:N)';
    case 'crows-foot-zero-many':
    case 'crows-foot-zero-zero':
      return 'Zero-to-Many (0:N)';
    case 'crows-foot-zero-one':
    case 'crows-foot-opt-opt':
      return 'Zero-to-One (0:1)';
    case 'socket-ball':
      return 'Socket & Ball';
    case 'lollipop':
      return 'Interface';
    case 'nesting':
      return 'Nesting';
    case 'cancellation':
      return 'Cancellation';
    case 'bi-arrow':
      return 'Bidirectional';
    case 'none':
      return style === 'dotted' ? 'Annotation' : 'Link';
    case 'arrow':
    default:
      return style === 'dashed' ? 'Dependency' : 'Association';
  }
}

function getMarkerEnd(arrowType?: DiagramEdge['arrowType'], isSelected?: boolean): string | undefined {
  switch (arrowType) {
    case 'inheritance':
      return 'url(#arrow-inheritance)';
    case 'realization':
      return 'url(#arrow-realization)';
    case 'composition':
      return 'url(#arrow-composition)';
    case 'aggregation':
      return 'url(#arrow-aggregation)';
    case 'dependency':
      return 'url(#arrow-dependency)';
    case 'socket-ball':
      return 'url(#arrow-socket-ball)';
    case 'lollipop':
      return 'url(#arrow-lollipop)';
    case 'nesting':
      return 'url(#arrow-nesting)';
    case 'cancellation':
      return 'url(#arrow-cancellation)';
    case 'crows-foot-many':
    case 'crows-foot-many-many':
      return 'url(#crows-foot-many)';
    case 'crows-foot-zero-many':
    case 'crows-foot-zero-zero':
      return 'url(#crows-foot-zero-many)';
    case 'crows-foot-one':
      return 'url(#crows-foot-one)';
    case 'crows-foot-zero-one':
    case 'crows-foot-opt-opt':
      return 'url(#crows-foot-zero-one)';
    case 'none':
      return undefined;
    case 'arrow':
    default:
      return isSelected ? 'url(#arrow-head-selected)' : 'url(#arrow-head)';
  }
}

function getMarkerStart(arrowType?: DiagramEdge['arrowType'], isSelected?: boolean): string | undefined {
  if (arrowType === 'crows-foot-many' || arrowType === 'crows-foot-zero-many') {
    return 'url(#crows-foot-one-start)';
  }
  if (arrowType === 'bi-arrow') {
    return isSelected ? 'url(#arrow-head-start-selected)' : 'url(#arrow-head-start)';
  }
  return undefined;
}

export const Canvas: React.FC<CanvasProps> = ({
  diagram,
  viewport,
  onUpdateViewport,
  onUpdateNodes,
  onUpdateEdges,
  onAddNode,
  snapToGrid,
  onToggleSnap,
  onUpdateSettings,
  selectedElementId,
  onSelectElement
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodes = diagram.nodes || [];
  const edges = diagram.edges || [];

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [edgeLabelText, setEdgeLabelText] = useState('');
  const selectedEdge = selectedEdgeId ? edges.find(e => e.id === selectedEdgeId) : null;

  // Selection handlers notifying onSelectElement
  const selectNode = useCallback((node: DiagramNode | null) => {
    if (node) {
      setSelectedNodeId(node.id);
      setSelectedEdgeId(null);
      onSelectElement?.({ type: 'node', id: node.id, label: node.label });
    } else {
      setSelectedNodeId(null);
      if (!selectedEdgeId) onSelectElement?.(null);
    }
  }, [onSelectElement, selectedEdgeId]);

  const selectEdge = useCallback((edge: DiagramEdge | null) => {
    if (edge) {
      setSelectedEdgeId(edge.id);
      setSelectedNodeId(null);
      onSelectElement?.({ type: 'edge', id: edge.id, source: edge.source, target: edge.target, label: edge.label });
    } else {
      setSelectedEdgeId(null);
      if (!selectedNodeId) onSelectElement?.(null);
    }
  }, [onSelectElement, selectedNodeId]);

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setEditingEdgeId(null);
    setQuickBranchPopup(null);
    onSelectElement?.(null);
  }, [onSelectElement]);

  // Sync external selectedElementId if changed
  useEffect(() => {
    if (selectedElementId === null) {
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    } else if (selectedElementId) {
      const isNode = nodes.some(n => n.id === selectedElementId);
      if (isNode) {
        setSelectedNodeId(selectedElementId);
        setSelectedEdgeId(null);
      } else {
        const isEdge = edges.some(e => e.id === selectedElementId);
        if (isEdge) {
          setSelectedEdgeId(selectedElementId);
          setSelectedNodeId(null);
        }
      }
    }
  }, [selectedElementId, nodes, edges]);

  // Node Dragging State
  const [draggingNode, setDraggingNode] = useState<{
    id: string;
    startX: number;
    startY: number;
    initialNodeX: number;
    initialNodeY: number;
    childOffsets?: Array<{ id: string; initialX: number; initialY: number }>;
  } | null>(null);

  // Node Resizing State
  const [resizingNode, setResizingNode] = useState<{
    id: string;
    startX: number;
    startY: number;
    initialWidth: number;
    initialHeight: number;
    direction: 'se' | 'e' | 's';
  } | null>(null);

  // Pan State
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Connection Dragging State
  const [connecting, setConnecting] = useState<{
    sourceId: string;
    port: PortPosition;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Quick Branch Popover State from '+' button
  const [quickBranchPopup, setQuickBranchPopup] = useState<{
    sourceNodeId: string;
    x: number;
    y: number;
  } | null>(null);

  // Inspector Drawer State
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Helper: Grid Snap
  const snap = (val: number) => {
    if (!snapToGrid) return Math.round(val);
    const GRID = 16;
    return Math.round(val / GRID) * GRID;
  };

  // Convert screen coordinates to canvas space
  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - viewport.x) / viewport.zoom,
      y: (clientY - rect.top - viewport.y) / viewport.zoom
    };
  }, [viewport]);

  // Handle Drag & Drop from AssetPanel
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const assetJson = e.dataTransfer.getData('application/plantuml-asset');
    if (!assetJson) return;

    try {
      const asset: AssetItem = JSON.parse(assetJson);
      const pos = screenToCanvas(e.clientX, e.clientY);

      const newNode: DiagramNode = {
        id: `${asset.nodeType}_${Date.now()}`,
        type: asset.nodeType,
        category: asset.category,
        label: asset.label,
        sublabel: asset.sublabel,
        x: snap(pos.x - (asset.width || 150) / 2),
        y: snap(pos.y - (asset.height || 60) / 2),
        width: asset.width || 150,
        height: asset.height || 60,
        color: asset.defaultColor || 'sienna',
        data: {
          ...(asset.defaultData ? JSON.parse(JSON.stringify(asset.defaultData)) : {}),
          ...(asset.shape ? { shape: asset.shape } : {}),
          ...(asset.description ? { description: asset.description } : {})
        }
      };

      onAddNode(newNode);
      setSelectedNodeId(newNode.id);
    } catch (err) {
      console.error('Error parsing dropped asset:', err);
    }
  };

  // Start Canvas Pan or Deselect
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.altKey || e.shiftKey || (e.target === containerRef.current)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
    }
    if (e.target === containerRef.current) {
      clearSelection();
    }
  };

  // Start Node Dragging
  const handleNodeMouseDown = (node: DiagramNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);

    const isContainer = node.type === 'package' || 
      node.type === 'frame' || 
      node.type === 'folder' || 
      node.type === 'cloud' || 
      node.type === 'node' || 
      node.category === 'container' || 
      Boolean(node.data?.isContainer) ||
      node.data?.containerType === 'frame' ||
      node.type.includes('boundary');

    // If dragging a container, locate enclosed child nodes to move together
    let childOffsets: Array<{ id: string; initialX: number; initialY: number }> | undefined = undefined;
    if (isContainer) {
      const children = diagram.nodes.filter(n => 
        n.id !== node.id && 
        n.x >= node.x && 
        n.x + n.width <= node.x + node.width && 
        n.y >= node.y && 
        n.y + n.height <= node.y + node.height
      );
      if (children.length > 0) {
        childOffsets = children.map(c => ({ id: c.id, initialX: c.x, initialY: c.y }));
      }
    }

    setDraggingNode({
      id: node.id,
      startX: e.clientX,
      startY: e.clientY,
      initialNodeX: node.x,
      initialNodeY: node.y,
      childOffsets
    });
  };

  // Start Resizing Node
  const handleStartResize = (nodeId: string, direction: 'se' | 'e' | 's', e: React.MouseEvent) => {
    e.stopPropagation();
    const node = diagram.nodes.find(n => n.id === nodeId);
    if (!node) return;
    setResizingNode({
      id: nodeId,
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: node.width,
      initialHeight: node.height,
      direction
    });
  };

  // Start Connection Drag from Port
  const handleStartConnection = (nodeId: string, port: PortPosition, e: React.MouseEvent) => {
    e.stopPropagation();
    const pos = screenToCanvas(e.clientX, e.clientY);
    setConnecting({
      sourceId: nodeId,
      port,
      currentX: pos.x,
      currentY: pos.y
    });
  };

  // Mouse Move on Canvas
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      onUpdateViewport({
        ...viewport,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    if (resizingNode) {
      const deltaX = (e.clientX - resizingNode.startX) / viewport.zoom;
      const deltaY = (e.clientY - resizingNode.startY) / viewport.zoom;

      const newWidth = ['se', 'e'].includes(resizingNode.direction)
        ? Math.max(80, snap(resizingNode.initialWidth + deltaX))
        : resizingNode.initialWidth;

      const newHeight = ['se', 's'].includes(resizingNode.direction)
        ? Math.max(50, snap(resizingNode.initialHeight + deltaY))
        : resizingNode.initialHeight;

      onUpdateNodes(diagram.nodes.map(n => 
        n.id === resizingNode.id ? { ...n, width: newWidth, height: newHeight } : n
      ), { skipHistory: true });
      return;
    }

    if (draggingNode) {
      const deltaX = (e.clientX - draggingNode.startX) / viewport.zoom;
      const deltaY = (e.clientY - draggingNode.startY) / viewport.zoom;

      const newX = snap(draggingNode.initialNodeX + deltaX);
      const newY = snap(draggingNode.initialNodeY + deltaY);
      const effectiveDeltaX = newX - draggingNode.initialNodeX;
      const effectiveDeltaY = newY - draggingNode.initialNodeY;

      onUpdateNodes(diagram.nodes.map(n => {
        if (n.id === draggingNode.id) {
          return { ...n, x: newX, y: newY };
        }
        const child = draggingNode.childOffsets?.find(c => c.id === n.id);
        if (child) {
          return { ...n, x: snap(child.initialX + effectiveDeltaX), y: snap(child.initialY + effectiveDeltaY) };
        }
        return n;
      }), { skipHistory: true });
      return;
    }

    if (connecting) {
      const pos = screenToCanvas(e.clientX, e.clientY);
      setConnecting({
        ...connecting,
        currentX: pos.x,
        currentY: pos.y
      });
    }
  };

  // Mouse Up on Canvas
  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (resizingNode) {
      const target = diagram.nodes.find(n => n.id === resizingNode.id);
      const hasResized = target && (
        target.width !== resizingNode.initialWidth ||
        target.height !== resizingNode.initialHeight
      );
      if (hasResized) {
        onUpdateNodes(diagram.nodes, { 
          actionName: `Resized ${target?.label || 'Element'}` 
        });
      }
      setResizingNode(null);
    }

    if (draggingNode) {
      const target = diagram.nodes.find(n => n.id === draggingNode.id);
      const hasMoved = target && (
        Math.abs(target.x - draggingNode.initialNodeX) > 2 ||
        Math.abs(target.y - draggingNode.initialNodeY) > 2
      );
      if (hasMoved) {
        onUpdateNodes(diagram.nodes, { 
          actionName: `Moved ${target?.label || 'Element'}` 
        });
      }
      setDraggingNode(null);
    }

    if (connecting) {
      // Check if dropped onto a target node
      const pos = screenToCanvas(e.clientX, e.clientY);
      const targetNode = diagram.nodes.find(n => 
        n.id !== connecting.sourceId &&
        pos.x >= n.x && pos.x <= n.x + n.width &&
        pos.y >= n.y && pos.y <= n.y + n.height
      );

      if (targetNode) {
        const sourceNode = diagram.nodes.find(n => n.id === connecting.sourceId);
        let targetHandle: PortPosition = 'left';
        if (sourceNode) {
          const dx = (targetNode.x + targetNode.width / 2) - (sourceNode.x + sourceNode.width / 2);
          const dy = (targetNode.y + targetNode.height / 2) - (sourceNode.y + sourceNode.height / 2);
          if (Math.abs(dx) >= Math.abs(dy)) {
            targetHandle = dx >= 0 ? 'left' : 'right';
          } else {
            targetHandle = dy >= 0 ? 'top' : 'bottom';
          }
        }

        // Create new edge with intelligent ports
        const newEdge: DiagramEdge = {
          id: `edge_${connecting.sourceId}_${targetNode.id}_${Date.now()}`,
          source: connecting.sourceId,
          target: targetNode.id,
          sourceHandle: connecting.port,
          targetHandle,
          style: 'solid',
          arrowType: 'arrow'
        };
        onUpdateEdges([...diagram.edges, newEdge]);
        setSelectedEdgeId(newEdge.id);
      }

      setConnecting(null);
    }
  };

  // Zoom with Wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(Math.max(viewport.zoom * zoomFactor, 0.3), 2.5);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newX = mouseX - (mouseX - viewport.x) * (newZoom / viewport.zoom);
      const newY = mouseY - (mouseY - viewport.y) * (newZoom / viewport.zoom);

      onUpdateViewport({ x: newX, y: newY, zoom: newZoom });
    }
  };

  // Quick Action Handlers
  const selectedNode = diagram.nodes.find(n => n.id === selectedNodeId);

  const handleUpdateSelectedNode = (patch: Partial<DiagramNode>) => {
    if (!selectedNodeId) return;
    onUpdateNodes(diagram.nodes.map(n => n.id === selectedNodeId ? { ...n, ...patch } : n));
  };

  // Modular Type Morphing: seamlessly replace node archetype
  const handleMorphNode = (nodeId: string, asset: AssetItem) => {
    onUpdateNodes(diagram.nodes.map(n => {
      if (n.id !== nodeId) return n;
      return {
        ...n,
        type: asset.nodeType,
        category: asset.category,
        shape: asset.shape || 'rectangle',
        width: Math.max(n.width, asset.width || 190),
        height: Math.max(n.height, asset.height || 85),
        sublabel: asset.sublabel || n.sublabel,
        data: {
          ...(asset.defaultData ? JSON.parse(JSON.stringify(asset.defaultData)) : {}),
          ...(n.data || {})
        }
      };
    }));
  };

  // Modular Verbal Linking: connect to any existing node directly
  const handleConnectToNode = (targetId: string, arrowType: DiagramEdge['arrowType'] = 'crows-foot-many', verb?: string) => {
    if (!selectedNodeId || selectedNodeId === targetId) return;
    const newEdge: DiagramEdge = {
      id: `edge_${selectedNodeId}_${targetId}_${Date.now()}`,
      source: selectedNodeId,
      target: targetId,
      sourceHandle: 'right',
      targetHandle: 'left',
      arrowType: arrowType,
      label: verb || undefined,
      style: arrowType === 'dependency' || arrowType === 'realization' ? 'dashed' : 'solid'
    };
    onUpdateEdges([...diagram.edges, newEdge]);
    setSelectedEdgeId(newEdge.id);
    setSelectedNodeId(null);
  };

  const handleDuplicateSelected = () => {
    if (!selectedNode) return;
    const newNode: DiagramNode = {
      ...selectedNode,
      id: `${selectedNode.type}_copy_${Date.now()}`,
      x: selectedNode.x + 40,
      y: selectedNode.y + 40,
      label: `${selectedNode.label} (Copy)`
    };
    onAddNode(newNode);
    setSelectedNodeId(newNode.id);
  };

  const handleDeleteSelected = () => {
    if (selectedNodeId) {
      onUpdateNodes(diagram.nodes.filter(n => n.id !== selectedNodeId));
      onUpdateEdges(diagram.edges.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
      setSelectedNodeId(null);
    } else if (selectedEdgeId) {
      onUpdateEdges(diagram.edges.filter(e => e.id !== selectedEdgeId));
      setSelectedEdgeId(null);
      setEditingEdgeId(null);
    }
  };

  // Fast connect / branch out new node
  const handleAddConnectedNode = (
    direction: 'right' | 'down' = 'right',
    sourceNodeId?: string,
    options?: {
      type?: string;
      label?: string;
      category?: string;
      color?: string;
      arrowType?: DiagramEdge['arrowType'];
      relationshipVerb?: string;
    }
  ) => {
    const source = sourceNodeId 
      ? diagram.nodes.find(n => n.id === sourceNodeId) 
      : selectedNode;
    if (!source) return;

    const offsetX = direction === 'right' ? source.width + 80 : 0;
    const offsetY = direction === 'down' ? source.height + 60 : 0;

    const targetType = options?.type || source.type;
    const targetCategory = options?.category || source.category;
    const defaultLabel = options?.label || (
      targetType === 'class' ? 'NewClass' :
      targetType === 'interface' ? 'NewInterface' :
      targetType === 'database' ? 'Database' :
      targetType === 'queue' ? 'MessageQueue' :
      targetType === 'cloud' ? 'CloudService' :
      targetType === 'note' ? 'Note' :
      `${source.label} Child`
    );

    const newNode: DiagramNode = {
      id: `node_${Date.now()}`,
      type: targetType,
      category: targetCategory,
      label: defaultLabel,
      x: snap(source.x + offsetX),
      y: snap(source.y + offsetY),
      width: targetType === 'note' ? 180 : source.width,
      height: targetType === 'note' ? 80 : source.height,
      color: options?.color || source.color || 'sienna',
      data: targetType === source.type && source.data 
        ? JSON.parse(JSON.stringify(source.data)) 
        : targetType === 'note'
          ? { description: 'Connected UML note' }
          : undefined
    };

    const newEdge: DiagramEdge = {
      id: `edge_${source.id}_${newNode.id}_${Date.now()}`,
      source: source.id,
      target: newNode.id,
      sourceHandle: direction === 'right' ? 'right' : 'bottom',
      targetHandle: direction === 'right' ? 'left' : 'top',
      label: options?.relationshipVerb || undefined,
      style: options?.arrowType === 'dependency' ? 'dashed' : 'solid',
      arrowType: options?.arrowType || 'arrow'
    };

    onAddNode(newNode, newEdge);
    setSelectedNodeId(newNode.id);
    setQuickBranchPopup(null);
  };

  // Attach UML Note (note right of X .. Note)
  const handleAddNoteToSelected = () => {
    if (!selectedNode) return;
    const noteNode: DiagramNode = {
      id: `note_${Date.now()}`,
      type: 'note',
      label: 'Note',
      x: snap(selectedNode.x + selectedNode.width + 48),
      y: snap(selectedNode.y),
      width: 170,
      height: 80,
      color: 'gold',
      data: {
        noteText: 'UML note element'
      }
    };

    const noteEdge: DiagramEdge = {
      id: `edge_note_${Date.now()}`,
      source: selectedNode.id,
      target: noteNode.id,
      sourceHandle: 'right',
      targetHandle: 'left',
      style: 'dotted',
      arrowType: 'none'
    };

    onAddNode(noteNode, noteEdge);
    setSelectedNodeId(noteNode.id);
  };

  // Wrap selected node in a Package boundary
  const handleWrapInPackage = () => {
    if (!selectedNode) return;
    const padX = 36;
    const padTop = 44;
    const padBottom = 32;
    const pkgNode: DiagramNode = {
      id: `package_${Date.now()}`,
      type: 'package',
      label: 'Package',
      category: 'container',
      x: snap(selectedNode.x - padX),
      y: snap(selectedNode.y - padTop),
      width: snap(selectedNode.width + padX * 2),
      height: snap(selectedNode.height + padTop + padBottom),
      color: 'sand'
    };

    // Place package at the beginning of the array so it's behind the child node
    onUpdateNodes([pkgNode, ...diagram.nodes]);
    selectNode(pkgNode);
  };

  // Wrap selected node in a Frame boundary
  const handleWrapInFrame = () => {
    if (!selectedNode) return;
    const padX = 36;
    const padTop = 44;
    const padBottom = 32;
    const frameNode: DiagramNode = {
      id: `frame_${Date.now()}`,
      type: 'frame',
      label: 'Frame',
      category: 'container',
      shape: 'frame',
      x: snap(selectedNode.x - padX),
      y: snap(selectedNode.y - padTop),
      width: snap(selectedNode.width + padX * 2),
      height: snap(selectedNode.height + padTop + padBottom),
      color: 'slate',
      data: { isContainer: true, containerType: 'frame', shape: 'frame' }
    };

    // Place frame at the beginning of the array so it's behind the child node
    onUpdateNodes([frameNode, ...diagram.nodes]);
    selectNode(frameNode);
  };

  // Keyboard Delete / Duplicate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedEdgeId, diagram]);

  // Edge Calculations helper
  const getNodeCenter = (nodeId: string) => {
    const node = diagram.nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return {
      x: node.x + node.width / 2,
      y: node.y + node.height / 2
    };
  };

  const getOptimalPorts = (
    srcNode: DiagramNode,
    tgtNode: DiagramNode,
    specifiedSrcPort?: PortPosition,
    specifiedTgtPort?: PortPosition,
    directionHint?: 'up' | 'down' | 'left' | 'right'
  ): { srcPort: PortPosition; tgtPort: PortPosition } => {
    if (specifiedSrcPort && specifiedTgtPort) {
      return { srcPort: specifiedSrcPort, tgtPort: specifiedTgtPort };
    }

    // Special handling for reflexive self-referencing loops
    if (srcNode.id === tgtNode.id) {
      return {
        srcPort: specifiedSrcPort || 'right',
        tgtPort: specifiedTgtPort || 'top'
      };
    }

    if (directionHint) {
      switch (directionHint) {
        case 'up':
          return {
            srcPort: specifiedSrcPort || 'top',
            tgtPort: specifiedTgtPort || 'bottom'
          };
        case 'down':
          return {
            srcPort: specifiedSrcPort || 'bottom',
            tgtPort: specifiedTgtPort || 'top'
          };
        case 'left':
          return {
            srcPort: specifiedSrcPort || 'left',
            tgtPort: specifiedTgtPort || 'right'
          };
        case 'right':
          return {
            srcPort: specifiedSrcPort || 'right',
            tgtPort: specifiedTgtPort || 'left'
          };
      }
    }

    const srcCenter = { x: srcNode.x + srcNode.width / 2, y: srcNode.y + srcNode.height / 2 };
    const tgtCenter = { x: tgtNode.x + tgtNode.width / 2, y: tgtNode.y + tgtNode.height / 2 };

    const dx = tgtCenter.x - srcCenter.x;
    const dy = tgtCenter.y - srcCenter.y;

    const wRatio = (srcNode.width + tgtNode.width) / 2 || 1;
    const hRatio = (srcNode.height + tgtNode.height) / 2 || 1;

    let computedSrcPort: PortPosition = 'right';
    let computedTgtPort: PortPosition = 'left';

    if (Math.abs(dx) / wRatio >= Math.abs(dy) / hRatio) {
      if (dx >= 0) {
        computedSrcPort = 'right';
        computedTgtPort = 'left';
      } else {
        computedSrcPort = 'left';
        computedTgtPort = 'right';
      }
    } else {
      if (dy >= 0) {
        computedSrcPort = 'bottom';
        computedTgtPort = 'top';
      } else {
        computedSrcPort = 'top';
        computedTgtPort = 'bottom';
      }
    }

    return {
      srcPort: specifiedSrcPort || computedSrcPort,
      tgtPort: specifiedTgtPort || computedTgtPort
    };
  };

  const getPortCoord = (nodeOrId: string | DiagramNode, port?: PortPosition) => {
    const node = typeof nodeOrId === 'string' ? diagram.nodes.find(n => n.id === nodeOrId) : nodeOrId;
    if (!node) return { x: 0, y: 0 };
    switch (port) {
      case 'top':
        return { x: node.x + node.width / 2, y: node.y };
      case 'right':
        return { x: node.x + node.width, y: node.y + node.height / 2 };
      case 'bottom':
        return { x: node.x + node.width / 2, y: node.y + node.height };
      case 'left':
        return { x: node.x, y: node.y + node.height / 2 };
      default:
        return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
    }
  };

  // Memoize computed edge paths, markers, and non-overlapping label / cardinality positions
  const computedEdges = useMemo(() => {
    return edges.map(edge => {
      const srcNode = nodes.find(n => n.id === edge.source);
      const tgtNode = nodes.find(n => n.id === edge.target);
      if (!srcNode || !tgtNode) return null;

      const isSelfLoop = edge.source === edge.target;
      const { srcPort, tgtPort } = getOptimalPorts(
        srcNode, 
        tgtNode, 
        edge.sourceHandle, 
        edge.targetHandle, 
        edge.directionHint
      );
      const src = getPortCoord(srcNode, srcPort);
      const tgt = getPortCoord(tgtNode, tgtPort);

      const isOrtho = diagram.settings?.linetype === 'ortho';

      let pathData = '';
      if (isSelfLoop) {
        // Aesthetic self-referencing loop curved outside the top-right corner
        const loopOffset = 50;
        const cp1 = { x: src.x + loopOffset, y: src.y };
        const cp2 = { x: tgt.x, y: tgt.y - loopOffset };
        pathData = `M ${src.x} ${src.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${tgt.x} ${tgt.y}`;
      } else if (isOrtho) {
        const stub = 22;
        const getStub = (pt: { x: number; y: number }, port: PortPosition, s: number) => {
          switch (port) {
            case 'top': return { x: pt.x, y: pt.y - s };
            case 'bottom': return { x: pt.x, y: pt.y + s };
            case 'left': return { x: pt.x - s, y: pt.y };
            case 'right': return { x: pt.x + s, y: pt.y };
            default: return pt;
          }
        };

        const sExit = getStub(src, srcPort, stub);
        const tEntry = getStub(tgt, tgtPort, stub);

        const pts: { x: number; y: number }[] = [{ x: src.x, y: src.y }, sExit];

        const isSrcHoriz = srcPort === 'left' || srcPort === 'right';
        const isTgtHoriz = tgtPort === 'left' || tgtPort === 'right';

        if (isSrcHoriz && isTgtHoriz) {
          const midX = (sExit.x + tEntry.x) / 2;
          pts.push({ x: midX, y: sExit.y }, { x: midX, y: tEntry.y });
        } else if (!isSrcHoriz && !isTgtHoriz) {
          const midY = (sExit.y + tEntry.y) / 2;
          pts.push({ x: sExit.x, y: midY }, { x: tEntry.x, y: midY });
        } else if (isSrcHoriz && !isTgtHoriz) {
          pts.push({ x: tEntry.x, y: sExit.y });
        } else {
          pts.push({ x: sExit.x, y: tEntry.y });
        }

        pts.push(tEntry, { x: tgt.x, y: tgt.y });

        // Clean consecutive duplicates
        const cleanPts: { x: number; y: number }[] = [];
        for (let i = 0; i < pts.length; i++) {
          if (i > 0 && Math.abs(pts[i].x - pts[i - 1].x) < 0.1 && Math.abs(pts[i].y - pts[i - 1].y) < 0.1) continue;
          cleanPts.push(pts[i]);
        }
        pathData = cleanPts.map((p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
      } else {
        const dist = Math.hypot(tgt.x - src.x, tgt.y - src.y);
        const d = Math.max(32, Math.min(dist * 0.45, 150));

        const getControlPoint = (pt: { x: number; y: number }, port: PortPosition, delta: number) => {
          switch (port) {
            case 'top': return { x: pt.x, y: pt.y - delta };
            case 'bottom': return { x: pt.x, y: pt.y + delta };
            case 'left': return { x: pt.x - delta, y: pt.y };
            case 'right': return { x: pt.x + delta, y: pt.y };
            default: return { x: pt.x, y: pt.y };
          }
        };

        const cp1 = getControlPoint(src, srcPort, d);
        const cp2 = getControlPoint(tgt, tgtPort, d);
        pathData = `M ${src.x} ${src.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${tgt.x} ${tgt.y}`;
      }

      // Multiplicity positions: floating clean above the line and safe from node borders & arrowheads
      let sourceCardPos: { x: number; y: number } | null = null;
      if (edge.cardinalitySource) {
        if (srcPort === 'right') sourceCardPos = { x: src.x + 14, y: src.y - 13 };
        else if (srcPort === 'left') sourceCardPos = { x: src.x - 14, y: src.y - 13 };
        else if (srcPort === 'bottom') sourceCardPos = { x: src.x + 12, y: src.y + 13 };
        else sourceCardPos = { x: src.x + 12, y: src.y - 13 };
      }

      let targetCardPos: { x: number; y: number } | null = null;
      if (edge.cardinalityTarget) {
        if (tgtPort === 'left') targetCardPos = { x: tgt.x - 22, y: tgt.y - 13 };
        else if (tgtPort === 'right') targetCardPos = { x: tgt.x + 22, y: tgt.y - 13 };
        else if (tgtPort === 'top') targetCardPos = { x: tgt.x + 12, y: tgt.y - 20 };
        else targetCardPos = { x: tgt.x + 12, y: tgt.y + 20 };
      }

      // Sibling edges parallel offset
      const siblingEdges = diagram.edges.filter(
        e => (e.source === edge.source && e.target === edge.target) || (e.source === edge.target && e.target === edge.source)
      );
      const siblingIndex = siblingEdges.findIndex(e => e.id === edge.id);
      let autoNormalShift = 0;
      if (siblingEdges.length > 1 && !edge.labelOffset) {
        if (siblingIndex % 2 === 1) autoNormalShift = Math.ceil(siblingIndex / 2) * 28;
        else if (siblingIndex > 0) autoNormalShift = -Math.ceil(siblingIndex / 2) * 28;
      }

      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = -dy / dist;
      const ny = dx / dist;
      const midX = (src.x + tgt.x) / 2;
      const midY = (src.y + tgt.y) / 2;

      // Label dimensions
      const labelText = edge.label || getFriendlyRelationLabel(edge.arrowType, edge.style);
      const badgeW = Math.max(48, labelText.length * 7.5 + 20);
      const badgeH = 26;

      let labelX = midX + nx * autoNormalShift;
      let labelY = midY + ny * autoNormalShift;

      if (isSelfLoop) {
        labelX = src.x + 36;
        labelY = tgt.y - 18;
      } else if (edge.labelOffset) {
        labelX = midX + edge.labelOffset.x;
        labelY = midY + edge.labelOffset.y;
      } else {
        // Anti-collision testing against ALL nodes in diagram
        const testOverlap = (cx: number, cy: number, pad = 8) => {
          const left = cx - badgeW / 2 - pad;
          const right = cx + badgeW / 2 + pad;
          const top = cy - badgeH / 2 - pad;
          const bottom = cy + badgeH / 2 + pad;
          return nodes.some(n => !(
            right <= n.x ||
            left >= n.x + n.width ||
            bottom <= n.y ||
            top >= n.y + n.height
          ));
        };

        // If default position collides with any node or distance is cramped:
        if (testOverlap(labelX, labelY) || dist < badgeW + 36) {
          const normalDeltas = [26, -26, 46, -46, 68, -68, 92, -92];
          const alongFractions = [0.5, 0.35, 0.65, 0.22, 0.78];
          let bestCandidate: { x: number; y: number } | null = null;
          let bestPenalty = Infinity;

          for (const frac of alongFractions) {
            const bx = src.x + dx * frac;
            const by = src.y + dy * frac;
            for (const norm of normalDeltas) {
              const cx = bx + nx * (norm + autoNormalShift);
              const cy = by + ny * (norm + autoNormalShift);
              if (!testOverlap(cx, cy)) {
                const penalty = Math.hypot(cx - midX, cy - midY);
                if (penalty < bestPenalty) {
                  bestPenalty = penalty;
                  bestCandidate = { x: cx, y: cy };
                }
              }
            }
          }

          // Fallback: clear above top or below bottom of endpoints
          if (!bestCandidate) {
            const topClearY = Math.min(srcNode.y, tgtNode.y) - 18;
            const bottomClearY = Math.max(srcNode.y + srcNode.height, tgtNode.y + tgtNode.height) + 18;
            if (!testOverlap(midX, topClearY)) {
              bestCandidate = { x: midX, y: topClearY };
            } else if (!testOverlap(midX, bottomClearY)) {
              bestCandidate = { x: midX, y: bottomClearY };
            }
          }

          if (bestCandidate) {
            labelX = bestCandidate.x;
            labelY = bestCandidate.y;
          }
        }
      }

      return {
        edge,
        srcNode,
        tgtNode,
        src,
        tgt,
        srcPort,
        tgtPort,
        pathData,
        sourceCardPos,
        targetCardPos,
        labelPos: { x: labelX, y: labelY },
        badgeW,
        badgeH,
        labelText
      };
    }).filter(Boolean) as Array<{
      edge: DiagramEdge;
      srcNode: DiagramNode;
      tgtNode: DiagramNode;
      src: { x: number; y: number };
      tgt: { x: number; y: number };
      srcPort: PortPosition;
      tgtPort: PortPosition;
      pathData: string;
      sourceCardPos: { x: number; y: number } | null;
      targetCardPos: { x: number; y: number } | null;
      labelPos: { x: number; y: number };
      badgeW: number;
      badgeH: number;
      labelText: string;
    }>;
  }, [diagram.edges, diagram.nodes, diagram.settings]);

  return (
    <div
      ref={containerRef}
      id="diagram-canvas-root"
      className="relative w-full h-full overflow-hidden canvas-bg cursor-default"
      style={{
        backgroundColor: '#faf5ee',
        backgroundImage: `
          linear-gradient(335deg, rgba(194, 101, 42, 0.04) ${23 * viewport.zoom}px, transparent ${23 * viewport.zoom}px),
          linear-gradient(155deg, rgba(194, 101, 42, 0.04) ${23 * viewport.zoom}px, transparent ${23 * viewport.zoom}px),
          linear-gradient(335deg, rgba(194, 101, 42, 0.04) ${23 * viewport.zoom}px, transparent ${23 * viewport.zoom}px),
          linear-gradient(155deg, rgba(194, 101, 42, 0.04) ${23 * viewport.zoom}px, transparent ${23 * viewport.zoom}px)
        `,
        backgroundSize: `${58 * viewport.zoom}px ${58 * viewport.zoom}px`,
        backgroundPosition: `${0 * viewport.zoom + viewport.x}px ${2 * viewport.zoom + viewport.y}px, ${4 * viewport.zoom + viewport.x}px ${35 * viewport.zoom + viewport.y}px, ${29 * viewport.zoom + viewport.x}px ${31 * viewport.zoom + viewport.y}px, ${34 * viewport.zoom + viewport.x}px ${6 * viewport.zoom + viewport.y}px`
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Zoom / Pan Transformed Layer */}
      <div
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
          filter: diagram.settings?.monochrome ? 'grayscale(100%) contrast(105%)' : undefined,
          fontFamily: diagram.settings?.handwritten ? 'Comic Sans MS, Caveat, cursive, sans-serif' : undefined
        }}
      >
        {/* SVG Layer for Edges and Connectors */}
        <svg className="absolute top-0 left-0 w-[5000px] h-[5000px] overflow-visible pointer-events-none">
          <defs>
            {/* Standard Arrow Marker (End) */}
            <marker
              id="arrow-head"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#A80036" />
            </marker>

            {/* Standard Arrow Marker (Start) */}
            <marker
              id="arrow-head-start"
              viewBox="0 0 10 10"
              refX="2"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto"
            >
              <path d="M 9 1.5 L 0 5 L 9 8.5 z" fill="#A80036" />
            </marker>

            {/* Selected Arrow Marker (End) */}
            <marker
              id="arrow-head-selected"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#C2652A" />
            </marker>

            {/* Selected Arrow Marker (Start) */}
            <marker
              id="arrow-head-start-selected"
              viewBox="0 0 10 10"
              refX="2"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto"
            >
              <path d="M 9 1.5 L 0 5 L 9 8.5 z" fill="#C2652A" />
            </marker>

            {/* Inheritance White Triangle */}
            <marker
              id="arrow-inheritance"
              viewBox="0 0 12 12"
              refX="11"
              refY="6"
              markerWidth="10"
              markerHeight="10"
              orient="auto"
            >
              <polygon points="0,1 11,6 0,11" fill="#ffffff" stroke="#A80036" strokeWidth="1.5" />
            </marker>

            {/* Composition Filled Diamond */}
            <marker
              id="arrow-composition"
              viewBox="0 0 16 12"
              refX="14"
              refY="6"
              markerWidth="12"
              markerHeight="10"
              orient="auto"
            >
              <polygon points="1,6 8,1 15,6 8,11" fill="#A80036" stroke="#A80036" strokeWidth="1" />
            </marker>

            {/* Aggregation Hollow Diamond */}
            <marker
              id="arrow-aggregation"
              viewBox="0 0 16 12"
              refX="14"
              refY="6"
              markerWidth="12"
              markerHeight="10"
              orient="auto"
            >
              <polygon points="1,6 8,1 15,6 8,11" fill="#ffffff" stroke="#A80036" strokeWidth="1.5" />
            </marker>

            {/* Dependency Open Arrow */}
            <marker
              id="arrow-dependency"
              viewBox="0 0 12 12"
              refX="10"
              refY="6"
              markerWidth="9"
              markerHeight="9"
              orient="auto"
            >
              <polyline points="2,1 10,6 2,11" fill="none" stroke="#A80036" strokeWidth="1.8" />
            </marker>

            {/* Crow's Foot: One or Many (|{) */}
            <marker
              id="crows-foot-many"
              viewBox="0 0 20 16"
              refX="18"
              refY="8"
              markerWidth="16"
              markerHeight="14"
              orient="auto"
            >
              <line x1="4" y1="2" x2="4" y2="14" stroke="#A80036" strokeWidth="1.8" />
              <line x1="4" y1="8" x2="18" y2="1" stroke="#A80036" strokeWidth="1.8" />
              <line x1="4" y1="8" x2="18" y2="8" stroke="#A80036" strokeWidth="1.8" />
              <line x1="4" y1="8" x2="18" y2="15" stroke="#A80036" strokeWidth="1.8" />
            </marker>

            {/* Crow's Foot: Zero or Many (o{) */}
            <marker
              id="crows-foot-zero-many"
              viewBox="0 0 24 16"
              refX="22"
              refY="8"
              markerWidth="18"
              markerHeight="14"
              orient="auto"
            >
              <circle cx="5" cy="8" r="3.5" fill="#faf5ee" stroke="#A80036" strokeWidth="1.6" />
              <line x1="10" y1="8" x2="22" y2="1" stroke="#A80036" strokeWidth="1.8" />
              <line x1="10" y1="8" x2="22" y2="8" stroke="#A80036" strokeWidth="1.8" />
              <line x1="10" y1="8" x2="22" y2="15" stroke="#A80036" strokeWidth="1.8" />
            </marker>

            {/* Crow's Foot: Exactly One (||) */}
            <marker
              id="crows-foot-one"
              viewBox="0 0 16 16"
              refX="14"
              refY="8"
              markerWidth="13"
              markerHeight="13"
              orient="auto"
            >
              <line x1="6" y1="2" x2="6" y2="14" stroke="#A80036" strokeWidth="1.8" />
              <line x1="11" y1="2" x2="11" y2="14" stroke="#A80036" strokeWidth="1.8" />
            </marker>

            {/* Crow's Foot: Zero or One (o|) */}
            <marker
              id="crows-foot-zero-one"
              viewBox="0 0 20 16"
              refX="18"
              refY="8"
              markerWidth="15"
              markerHeight="14"
              orient="auto"
            >
              <circle cx="5" cy="8" r="3.5" fill="#faf5ee" stroke="#A80036" strokeWidth="1.6" />
              <line x1="13" y1="2" x2="13" y2="14" stroke="#A80036" strokeWidth="1.8" />
            </marker>

            {/* Crow's Foot: Source crossbars (|| start) */}
            <marker
              id="crows-foot-one-start"
              viewBox="0 0 16 16"
              refX="2"
              refY="8"
              markerWidth="13"
              markerHeight="13"
              orient="auto"
            >
              <line x1="6" y1="2" x2="6" y2="14" stroke="#A80036" strokeWidth="1.8" />
              <line x1="11" y1="2" x2="11" y2="14" stroke="#A80036" strokeWidth="1.8" />
            </marker>

            {/* Realization Triangle Dotted */}
            <marker
              id="arrow-realization"
              viewBox="0 0 12 12"
              refX="11"
              refY="6"
              markerWidth="10"
              markerHeight="10"
              orient="auto"
            >
              <polygon points="0,1 11,6 0,11" fill="#ffffff" stroke="#A80036" strokeWidth="1.5" />
            </marker>

            {/* Socket & Ball (-0) */}
            <marker
              id="arrow-socket-ball"
              viewBox="0 0 16 16"
              refX="12"
              refY="8"
              markerWidth="14"
              markerHeight="14"
              orient="auto"
            >
              <path d="M 4 2 A 6 6 0 0 1 4 14" fill="none" stroke="#A80036" strokeWidth="1.8" />
              <circle cx="9" cy="8" r="3" fill="#A80036" />
            </marker>

            {/* Lollipop Interface ( ()-- ) */}
            <marker
              id="arrow-lollipop"
              viewBox="0 0 14 14"
              refX="10"
              refY="7"
              markerWidth="12"
              markerHeight="12"
              orient="auto"
            >
              <circle cx="7" cy="7" r="4.5" fill="#ffffff" stroke="#A80036" strokeWidth="1.8" />
            </marker>

            {/* Nesting (+--) */}
            <marker
              id="arrow-nesting"
              viewBox="0 0 16 16"
              refX="12"
              refY="8"
              markerWidth="13"
              markerHeight="13"
              orient="auto"
            >
              <circle cx="8" cy="8" r="5" fill="#ffffff" stroke="#A80036" strokeWidth="1.5" />
              <line x1="8" y1="5" x2="8" y2="11" stroke="#A80036" strokeWidth="1.5" />
              <line x1="5" y1="8" x2="11" y2="8" stroke="#A80036" strokeWidth="1.5" />
            </marker>

            {/* Cancellation (x--) */}
            <marker
              id="arrow-cancellation"
              viewBox="0 0 14 14"
              refX="10"
              refY="7"
              markerWidth="11"
              markerHeight="11"
              orient="auto"
            >
              <line x1="3" y1="3" x2="11" y2="11" stroke="#ef4444" strokeWidth="2" />
              <line x1="11" y1="3" x2="3" y2="11" stroke="#ef4444" strokeWidth="2" />
            </marker>
          </defs>

          {/* Render Connections */}
          {computedEdges.map(({ edge, pathData }) => {
            const isSelected = selectedEdgeId === edge.id;

            return (
              <g key={edge.id} className="pointer-events-auto cursor-pointer group">
                {/* Thick invisible path for easy clicking */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="16"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectEdge(edge);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEdgeLabelText(edge.label || '');
                    setEditingEdgeId(edge.id);
                  }}
                />

                {/* Visible Path */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={isSelected ? '#c2652a' : (edge.color || '#A80036')}
                  strokeWidth={isSelected ? 2.5 : 1.8}
                  strokeDasharray={edge.style === 'dashed' ? '6,4' : edge.style === 'dotted' ? '2,4' : undefined}
                  markerStart={getMarkerStart(edge.arrowType)}
                  markerEnd={getMarkerEnd(edge.arrowType, isSelected)}
                />
              </g>
            );
          })}

          {/* Active Connection Line being dragged */}
          {connecting && (
            <path
              d={`M ${getPortCoord(connecting.sourceId, connecting.port).x} ${getPortCoord(connecting.sourceId, connecting.port).y} L ${connecting.currentX} ${connecting.currentY}`}
              fill="none"
              stroke="#c2652a"
              strokeWidth="2.5"
              strokeDasharray="4,4"
              markerEnd="url(#arrow-head)"
            />
          )}
        </svg>

        {/* HTML Nodes Layer */}
        <div className="absolute top-0 left-0 pointer-events-auto">
          {diagram.nodes.map(node => (
            <div
              key={node.id}
              onMouseDown={(e) => handleNodeMouseDown(node, e)}
            >
              <DiagramNodeView
                node={node}
                isSelected={selectedNodeId === node.id}
                onSelect={(e) => {
                  e.stopPropagation();
                  selectNode(node);
                }}
                onUpdate={(patch) => {
                  onUpdateNodes(diagram.nodes.map(n => n.id === node.id ? { ...n, ...patch } : n));
                }}
                onStartConnection={handleStartConnection}
                onQuickAddChild={(id) => {
                  const targetNode = diagram.nodes.find(n => n.id === id);
                  if (!targetNode) return;
                  setSelectedNodeId(id);
                  setSelectedEdgeId(null);
                  setQuickBranchPopup({
                    sourceNodeId: id,
                    x: targetNode.x + targetNode.width + 16,
                    y: targetNode.y
                  });
                }}
                onStartResize={handleStartResize}
              />
            </div>
          ))}

          {/* Floating Quick Action Bar for selected node */}
          {selectedNode && (
            <QuickActionBar
              x={selectedNode.x + selectedNode.width / 2}
              y={selectedNode.y - 8}
              node={selectedNode}
              allNodes={diagram.nodes}
              onMorphNode={(asset) => handleMorphNode(selectedNode.id, asset)}
              onUpdateNode={(patch) => handleUpdateSelectedNode(patch)}
              onConnectToNode={handleConnectToNode}
              onDuplicate={handleDuplicateSelected}
              onAddConnectedNode={(dir) => handleAddConnectedNode(dir, selectedNode.id)}
              onAddNote={handleAddNoteToSelected}
              onWrapInPackage={handleWrapInPackage}
              onWrapInFrame={handleWrapInFrame}
              onDelete={handleDeleteSelected}
              onOpenInspector={() => setIsInspectorOpen(true)}
            />
          )}

          {/* Floating Quick Branch Popup from '+' button */}
          {quickBranchPopup && (() => {
            const src = diagram.nodes.find(n => n.id === quickBranchPopup.sourceNodeId);
            if (!src) return null;
            return (
              <QuickBranchPopup
                sourceNode={src}
                x={quickBranchPopup.x}
                y={quickBranchPopup.y}
                onBranch={(dir, opts) => handleAddConnectedNode(dir, src.id, opts)}
                onClose={() => setQuickBranchPopup(null)}
              />
            );
          })()}

          {/* Floating Relationship Toolbar for selected edge */}
          {selectedEdge && (() => {
            const srcNode = diagram.nodes.find(n => n.id === selectedEdge.source);
            const tgtNode = diagram.nodes.find(n => n.id === selectedEdge.target);
            const { srcPort, tgtPort } = srcNode && tgtNode 
              ? getOptimalPorts(srcNode, tgtNode, selectedEdge.sourceHandle, selectedEdge.targetHandle)
              : { srcPort: selectedEdge.sourceHandle || 'right', tgtPort: selectedEdge.targetHandle || 'left' };
            const src = getPortCoord(selectedEdge.source, srcPort);
            const tgt = getPortCoord(selectedEdge.target, tgtPort);
            const midX = (src.x + tgt.x) / 2;
            const midY = (src.y + tgt.y) / 2;

            return (
              <EdgeToolbar
                edge={selectedEdge}
                nodes={diagram.nodes}
                sourceNodeLabel={srcNode?.label}
                targetNodeLabel={tgtNode?.label}
                position={{ x: midX, y: midY }}
                onUpdateEdge={(updated) => {
                  onUpdateEdges(diagram.edges.map(e => e.id === selectedEdge.id ? { ...e, ...updated } : e));
                }}
                onDeleteEdge={() => {
                  onUpdateEdges(diagram.edges.filter(e => e.id !== selectedEdge.id));
                  setSelectedEdgeId(null);
                }}
                onClose={() => setSelectedEdgeId(null)}
              />
            );
          })()}

        </div>

        {/* HTML Overlay for Edge Multiplicity & Labels (Z-20: Always floats cleanly above nodes) */}
        <div className="absolute top-0 left-0 w-[5000px] h-[5000px] pointer-events-none z-20">
          {computedEdges.map(({ edge, sourceCardPos, targetCardPos, labelPos }) => {
            const isSelected = selectedEdgeId === edge.id;
            const isEditing = editingEdgeId === edge.id;

            return (
              <React.Fragment key={`edge-overlay-${edge.id}`}>
                {/* Source Cardinality (e.g. "1", "0..*") */}
                {edge.cardinalitySource && sourceCardPos && (
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-20"
                    style={{ left: `${sourceCardPos.x}px`, top: `${sourceCardPos.y}px` }}
                  >
                    <span className="text-[10px] font-mono font-bold text-[#A80036] bg-white/95 px-1 py-0.2 rounded border border-[#A80036]/30 shadow-2xs">
                      {edge.cardinalitySource}
                    </span>
                  </div>
                )}

                {/* Target Cardinality (e.g. "*", "1..*") */}
                {edge.cardinalityTarget && targetCardPos && (
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-20"
                    style={{ left: `${targetCardPos.x}px`, top: `${targetCardPos.y}px` }}
                  >
                    <span className="text-[10px] font-mono font-bold text-[#A80036] bg-white/95 px-1 py-0.2 rounded border border-[#A80036]/30 shadow-2xs">
                      {edge.cardinalityTarget}
                    </span>
                  </div>
                )}

                {/* Edge Label Badge - Compact, Crisp, Guaranteed Unobscured */}
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto select-none z-20"
                  style={{ left: `${labelPos.x}px`, top: `${labelPos.y}px` }}
                >
                  {isEditing ? (
                    <input
                      autoFocus
                      value={edgeLabelText}
                      onChange={(e) => setEdgeLabelText(e.target.value)}
                      onBlur={() => {
                        onUpdateEdges(diagram.edges.map(ed => 
                          ed.id === edge.id ? { ...ed, label: edgeLabelText.trim() || undefined } : ed
                        ));
                        setEditingEdgeId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onUpdateEdges(diagram.edges.map(ed => 
                            ed.id === edge.id ? { ...ed, label: edgeLabelText.trim() || undefined } : ed
                          ));
                          setEditingEdgeId(null);
                        }
                        if (e.key === 'Escape') setEditingEdgeId(null);
                      }}
                      placeholder={getFriendlyRelationLabel(edge.arrowType, edge.style)}
                      className="text-[11px] font-semibold text-center bg-white border-2 border-[#c2652a] rounded-full px-3 py-0.5 outline-none shadow-md text-[#1c1917] min-w-[90px]"
                    />
                  ) : (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEdgeId(edge.id);
                        setSelectedNodeId(null);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEdgeLabelText(edge.label || '');
                        setEditingEdgeId(edge.id);
                      }}
                      className={`group/badge inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border shadow-2xs whitespace-nowrap transition-all select-none cursor-pointer ${
                        isSelected 
                          ? 'bg-white text-[#c2652a] border-[#c2652a] font-bold shadow-md ring-2 ring-[#c2652a]/20 scale-105 z-30' 
                          : 'bg-white/95 text-[#2c2420] border-[#d8d0c8] hover:border-[#c2652a] hover:shadow-xs hover:bg-white'
                      }`}
                      title={`Double-click to edit label • Click to configure ${getFriendlyRelationLabel(edge.arrowType, edge.style)}`}
                    >
                      {edge.label ? (
                        <span className="text-[11px] font-semibold text-[#181818]">
                          {edge.label}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-[#5a5048] group-hover/badge:text-[#c2652a]">
                          {getFriendlyRelationLabel(edge.arrowType, edge.style)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Floating Canvas Controls Dock (Bottom Right) */}
      <aside className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-md border border-[#d8d0c8]/80 shadow-md rounded-xl p-1.5 z-20 text-xs select-none">
        <button
          id="btn-zoom-out"
          onClick={() => onUpdateViewport({ ...viewport, zoom: Math.max(viewport.zoom * 0.85, 0.3) })}
          className="p-1.5 rounded-lg hover:bg-[#faf5ee] text-[#3a302a] hover:text-[#c2652a] transition-colors"
          title="Zoom Out"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <span 
          onClick={() => onUpdateViewport({ ...viewport, zoom: 1 })}
          className="px-1.5 font-mono text-[11px] text-[#78706a] hover:text-[#c2652a] cursor-pointer"
          title="Click to reset to 100%"
        >
          {Math.round(viewport.zoom * 100)}%
        </span>

        <button
          id="btn-zoom-in"
          onClick={() => onUpdateViewport({ ...viewport, zoom: Math.min(viewport.zoom * 1.15, 2.5) })}
          className="p-1.5 rounded-lg hover:bg-[#faf5ee] text-[#3a302a] hover:text-[#c2652a] transition-colors"
          title="Zoom In"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-[#d8d0c8]/60 mx-0.5" />

        <button
          id="btn-center-view"
          onClick={() => onUpdateViewport({ x: 60, y: 40, zoom: 1 })}
          className="p-1.5 rounded-lg hover:bg-[#faf5ee] text-[#3a302a] hover:text-[#c2652a] transition-colors"
          title="Reset Canvas Position"
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>

        <button
          id="btn-snap-grid"
          onClick={onToggleSnap}
          className={`p-1.5 rounded-lg transition-colors ${
            snapToGrid ? 'bg-[#A80036]/10 text-[#A80036]' : 'text-[#78706a] hover:bg-[#faf5ee]'
          }`}
          title={snapToGrid ? 'Grid Snap: ON' : 'Grid Snap: OFF'}
        >
          <Grid className="w-3.5 h-3.5" />
        </button>

        {onUpdateSettings && (
          <>
            <div className="w-[1px] h-4 bg-[#d8d0c8]/60 mx-0.5" />

            {/* Layout Direction Toggle: TB (Top to Bottom) vs LR (Left to Right) */}
            <button
              id="btn-diagram-direction"
              onClick={() => {
                const currentDir = diagram.settings?.direction || 'TB';
                onUpdateSettings({ direction: currentDir === 'TB' ? 'LR' : 'TB' });
              }}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-mono ${
                diagram.settings?.direction === 'LR' ? 'bg-[#A80036]/10 text-[#A80036] font-bold' : 'text-[#78706a] hover:bg-[#faf5ee]'
              }`}
              title={diagram.settings?.direction === 'LR' ? 'Direction: Left-to-Right (click for Top-to-Bottom)' : 'Direction: Top-to-Bottom (click for Left-to-Right)'}
            >
              {diagram.settings?.direction === 'LR' ? (
                <>
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>LR</span>
                </>
              ) : (
                <>
                  <ArrowDownUp className="w-3.5 h-3.5" />
                  <span>TB</span>
                </>
              )}
            </button>

            {/* Handwritten (PlantUML skinparam handwritten) */}
            <button
              id="btn-toggle-handwritten"
              onClick={() => {
                onUpdateSettings({ handwritten: !diagram.settings?.handwritten });
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                diagram.settings?.handwritten ? 'bg-[#A80036]/10 text-[#A80036]' : 'text-[#78706a] hover:bg-[#faf5ee]'
              }`}
              title={diagram.settings?.handwritten ? 'Handwritten Skin: ON' : 'Handwritten Skin: OFF'}
            >
              <PenTool className="w-3.5 h-3.5" />
            </button>

            {/* Monochrome mode */}
            <button
              id="btn-toggle-monochrome"
              onClick={() => {
                onUpdateSettings({ monochrome: !diagram.settings?.monochrome });
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                diagram.settings?.monochrome ? 'bg-[#A80036]/10 text-[#A80036]' : 'text-[#78706a] hover:bg-[#faf5ee]'
              }`}
              title={diagram.settings?.monochrome ? 'Monochrome: ON' : 'Monochrome: OFF'}
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </aside>

      {/* Mini Pan hint indicator */}
      <div className="absolute bottom-4 left-4 pointer-events-none text-[11px] text-[#78706a]/70 flex items-center gap-1 bg-[#faf5ee]/80 px-2 py-1 rounded-md border border-[#d8d0c8]/40 backdrop-blur-xs">
        <Move className="w-3 h-3" />
        <span>Drag canvas to pan • Wheel to zoom</span>
      </div>

      {/* Floating Element Properties Inspector Drawer */}
      <ElementInspector
        node={selectedNode}
        isOpen={isInspectorOpen && Boolean(selectedNode)}
        onClose={() => setIsInspectorOpen(false)}
        onUpdateNode={handleUpdateSelectedNode}
        onDeleteNode={handleDeleteSelected}
        onMorphNode={selectedNode ? (asset) => handleMorphNode(selectedNode.id, asset) : undefined}
      />
    </div>
  );
};
