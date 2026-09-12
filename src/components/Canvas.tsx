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
  X,
  Scissors,
  Copy,
  ClipboardPaste,
  CopyPlus,
  ArrowUp,
  ArrowDown,
  ZoomIn,
  ZoomOut,
  BoxSelect
} from 'lucide-react';
import { 
  DiagramData, 
  DiagramNode, 
  DiagramEdge, 
  PortPosition, 
  Viewport, 
  AssetItem,
  GlobalCanvasSettings,
  NodeShape,
  SequenceBlock
} from '../types';
import { SelectedCanvasElement } from '../utils/codeHighlightSync';
import { DiagramNodeView } from './DiagramNode';
import { QuickActionBar } from './QuickActionBar';
import { EdgeToolbar } from './EdgeToolbar';
import { QuickBranchPopup } from './QuickBranchPopup';
import { isMultiplicity } from '../utils/overlapResolver';
import { getOptimalNodeDimensions } from '../utils/nodeSizing';
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
  onSelectElements?: (elements: SelectedCanvasElement[]) => void;
  onUpdateDiagram?: (updater: Partial<DiagramData> | ((prev: DiagramData) => Partial<DiagramData>), actionName?: string) => void;
  isPlainWhite?: boolean;
  onTogglePlainWhite?: () => void;
}

function getFriendlyRelationLabel(arrowType?: DiagramEdge['arrowType'], style?: DiagramEdge['style']): string {
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

function getMarkerEnd(arrowType?: DiagramEdge['arrowType'], isSelected?: boolean, edge?: DiagramEdge): string | undefined {
  if (edge?.targetMarker) return `url(#${edge.targetMarker})`;
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
    case 'crows-foot-many-one':
      return 'url(#crows-foot-many)';
    case 'crows-foot-zero-many':
    case 'crows-foot-zero-zero':
    case 'crows-foot-zero-many-one':
      return 'url(#crows-foot-zero-many)';
    case 'crows-foot-one':
      return 'url(#crows-foot-one)';
    case 'crows-foot-zero-one':
    case 'crows-foot-opt-opt':
    case 'crows-foot-many-zero-one':
      return 'url(#crows-foot-zero-one)';
    case 'none':
      return undefined;
    case 'arrow':
    default:
      return isSelected ? 'url(#arrow-head-selected)' : 'url(#arrow-head)';
  }
}

function getMarkerStart(arrowType?: DiagramEdge['arrowType'], isSelected?: boolean, edge?: DiagramEdge): string | undefined {
  if (edge?.sourceMarker) return `url(#${edge.sourceMarker})`;
  if (arrowType === 'crows-foot-many' || arrowType === 'crows-foot-zero-many' || arrowType === 'crows-foot-one' || arrowType === 'crows-foot-zero-one') {
    return 'url(#crows-foot-one-start)';
  }
  if (arrowType === 'crows-foot-many-many' || arrowType === 'crows-foot-many-zero-one' || arrowType === 'crows-foot-many-one') {
    return 'url(#crows-foot-many-start)';
  }
  if (arrowType === 'crows-foot-zero-zero' || arrowType === 'crows-foot-zero-many-one') {
    return 'url(#crows-foot-zero-many-start)';
  }
  if (arrowType === 'crows-foot-opt-opt') {
    return 'url(#crows-foot-zero-one-start)';
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
  onSelectElement,
  onSelectElements,
  onUpdateDiagram,
  isPlainWhite: propIsPlainWhite,
  onTogglePlainWhite: propOnTogglePlainWhite
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Derive robust node list, synthesizing sequence participants if not present in diagram.nodes
  const nodes = useMemo(() => {
    const rawNodes = diagram.nodes || [];
    const existingIds = new Set(rawNodes.map(n => n.id));
    
    const missingParticipants: DiagramNode[] = [];
    let nextX = rawNodes.length > 0 ? Math.max(...rawNodes.map(n => n.x + n.width)) + 80 : 80;

    if (diagram.participants && diagram.participants.length > 0) {
      diagram.participants.forEach(p => {
        if (!existingIds.has(p.id)) {
          existingIds.add(p.id);
          let resolvedShape: NodeShape = 'rectangle';
          if (p.type === 'actor') resolvedShape = 'actor';
          else if (p.type === 'database') resolvedShape = 'cylinder';
          else if (p.type === 'collections') resolvedShape = 'collections';

          missingParticipants.push({
            id: p.id,
            type: p.type || 'participant',
            category: 'sequence',
            label: ('label' in p ? (p as any).label : p.name) || p.id,
            sublabel: ('sublabel' in p ? (p as any).sublabel : p.stereotype),
            x: nextX,
            y: 60,
            width: 140,
            height: 70,
            color: p.color || 'sand',
            data: { shape: resolvedShape }
          });
          nextX += 220;
        }
      });
    }

    if (diagram.messages && diagram.messages.length > 0) {
      diagram.messages.forEach(m => {
        [m.from, m.to].forEach(id => {
          if (id && !existingIds.has(id)) {
            existingIds.add(id);
            missingParticipants.push({
              id,
              type: 'participant',
              category: 'sequence',
              label: id,
              x: nextX,
              y: 60,
              width: 140,
              height: 70,
              color: 'sand',
              data: { shape: 'rectangle' }
            });
            nextX += 220;
          }
        });
      });
    }

    if (missingParticipants.length > 0) {
      return [...rawNodes, ...missingParticipants];
    }
    return rawNodes;
  }, [diagram.nodes, diagram.participants, diagram.messages]);

  // Auto-promote synthesized sequence participants into diagram.nodes
  useEffect(() => {
    if (nodes.length > (diagram.nodes?.length || 0)) {
      onUpdateNodes(nodes, { skipHistory: true });
    }
  }, [nodes, diagram.nodes, onUpdateNodes]);

  const edges = diagram.edges || [];

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [edgeLabelText, setEdgeLabelText] = useState('');
  const [hoveredDropTargetId, setHoveredDropTargetId] = useState<string | null>(null);

  // Plain White Background state & toggle
  const [internalPlainWhite, setInternalPlainWhite] = useState<boolean>(() => {
    try {
      return localStorage.getItem('plantvis_canvas_plain_white') === 'true';
    } catch {
      return false;
    }
  });

  const isPlainWhite = propIsPlainWhite !== undefined ? propIsPlainWhite : internalPlainWhite;
  const handleTogglePlainWhite = useCallback(() => {
    if (propOnTogglePlainWhite) {
      propOnTogglePlainWhite();
    } else {
      setInternalPlainWhite(prev => {
        const next = !prev;
        try {
          localStorage.setItem('plantvis_canvas_plain_white', String(next));
        } catch {
          // ignore
        }
        return next;
      });
    }
  }, [propOnTogglePlainWhite]);

  const selectedMessage = diagram.messages?.find(m => m.id === selectedEdgeId);
  const selectedEdge = selectedEdgeId ? (
    edges.find(e => e.id === selectedEdgeId) ||
    (selectedMessage ? {
      id: selectedMessage.id,
      source: selectedMessage.from,
      target: selectedMessage.to,
      label: selectedMessage.label,
      style: (selectedMessage.type === 'reply' ? 'dashed' : 'solid') as any,
      arrowType: 'arrow' as any,
      data: { isSequenceMessage: true, order: selectedMessage.order }
    } : null)
  ) : null;

  const selectedBlock = diagram.blocks?.find(b => b.id === selectedBlockId);

  // Selection handlers notifying onSelectElement
  const selectNode = useCallback((node: DiagramNode | null, isMulti = false) => {
    if (node) {
      if (isMulti) {
        setSelectedNodeIds(prev => {
          const next = prev.includes(node.id) ? prev.filter(id => id !== node.id) : [...prev, node.id];
          setSelectedNodeId(next[next.length - 1] || null);
          return next;
        });
      } else {
        setSelectedNodeId(node.id);
        setSelectedNodeIds([node.id]);
        setSelectedEdgeId(null);
        setSelectedBlockId(null);
        onSelectElement?.({ type: 'node', id: node.id, label: node.label });
      }
    } else {
      setSelectedNodeId(null);
      setSelectedNodeIds([]);
      if (!selectedEdgeId && !selectedBlockId) onSelectElement?.(null);
    }
  }, [onSelectElement, selectedEdgeId, selectedBlockId]);

  const selectEdge = useCallback((edge: DiagramEdge | null) => {
    if (edge) {
      setSelectedEdgeId(edge.id);
      setSelectedNodeId(null);
      setSelectedNodeIds([]);
      setSelectedBlockId(null);
      onSelectElement?.({ type: 'edge', id: edge.id, source: edge.source, target: edge.target, label: edge.label });
    } else {
      setSelectedEdgeId(null);
      if (!selectedNodeId && !selectedBlockId) onSelectElement?.(null);
    }
  }, [onSelectElement, selectedNodeId, selectedBlockId]);

  const selectBlock = useCallback((block: SequenceBlock | null) => {
    if (block) {
      setSelectedBlockId(block.id);
      setSelectedNodeId(null);
      setSelectedNodeIds([]);
      setSelectedEdgeId(null);
      onSelectElement?.({
        type: 'block' as any,
        id: block.id,
        label: `${block.type.toUpperCase()}${block.condition ? ` [${block.condition}]` : ''}`
      });
    } else {
      setSelectedBlockId(null);
      if (!selectedNodeId && !selectedEdgeId) onSelectElement?.(null);
    }
  }, [onSelectElement, selectedNodeId, selectedEdgeId]);

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedNodeIds([]);
    setSelectedEdgeId(null);
    setSelectedBlockId(null);
    setEditingEdgeId(null);
    setQuickBranchPopup(null);
    onSelectElement?.(null);
  }, [onSelectElement]);

  const lastReportedIdsRef = useRef<string>('');

  // Notify parent of all selected elements for multi-element code sync
  useEffect(() => {
    const elements: SelectedCanvasElement[] = [];

    if (selectedNodeIds.length > 0) {
      for (const id of selectedNodeIds) {
        const n = nodes.find(node => node.id === id);
        elements.push({ type: 'node', id, label: n?.label || id });
      }
    } else if (selectedNodeId) {
      const n = nodes.find(node => node.id === selectedNodeId);
      elements.push({ type: 'node', id: selectedNodeId, label: n?.label || selectedNodeId });
    }

    if (selectedEdgeId) {
      const e = edges.find(edge => edge.id === selectedEdgeId);
      const msg = diagram.messages?.find(m => m.id === selectedEdgeId);
      elements.push({
        type: 'edge',
        id: selectedEdgeId,
        source: e?.source || msg?.from,
        target: e?.target || msg?.to,
        label: e?.label || msg?.label
      });
    }

    if (selectedBlockId) {
      const b = diagram.blocks?.find(block => block.id === selectedBlockId);
      elements.push({
        type: 'block',
        id: selectedBlockId,
        label: b ? `${b.type.toUpperCase()}${b.condition ? ` [${b.condition}]` : ''}` : selectedBlockId
      });
    }

    const currentKey = elements.map(e => e.id).join(',');
    if (currentKey !== lastReportedIdsRef.current) {
      lastReportedIdsRef.current = currentKey;
      onSelectElements?.(elements);
    }
  }, [selectedNodeIds, selectedNodeId, selectedEdgeId, selectedBlockId, nodes, edges, diagram.messages, diagram.blocks, onSelectElements]);

  // Sync external selectedElementId if changed
  useEffect(() => {
    if (selectedElementId === null) {
      if (selectedNodeIds.length <= 1) {
        setSelectedNodeId(null);
        setSelectedNodeIds([]);
        setSelectedEdgeId(null);
        setSelectedBlockId(null);
      }
    } else if (selectedElementId) {
      const isNode = nodes.some(n => n.id === selectedElementId);
      if (isNode) {
        setSelectedNodeId(selectedElementId);
        setSelectedNodeIds(prev => prev.includes(selectedElementId) ? prev : [selectedElementId]);
        setSelectedEdgeId(null);
        setSelectedBlockId(null);
      } else {
        const isEdge = edges.some(e => e.id === selectedElementId) || diagram.messages?.some(m => m.id === selectedElementId);
        if (isEdge) {
          setSelectedEdgeId(selectedElementId);
          setSelectedNodeId(null);
          setSelectedNodeIds([]);
          setSelectedBlockId(null);
        } else {
          const isBlock = diagram.blocks?.some(b => b.id === selectedElementId);
          if (isBlock) {
            setSelectedBlockId(selectedElementId);
            setSelectedNodeId(null);
            setSelectedNodeIds([]);
            setSelectedEdgeId(null);
          }
        }
      }
    }
  }, [selectedElementId, nodes, edges, diagram.messages, diagram.blocks]);

  // Node Dragging State
  const [draggingNode, setDraggingNode] = useState<{
    id: string;
    startX: number;
    startY: number;
    initialNodeX: number;
    initialNodeY: number;
    childOffsets?: Array<{ id: string; initialX: number; initialY: number }>;
    multiOffsets?: Array<{ id: string; initialX: number; initialY: number }>;
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

  // Draw.io Control States: Spacebar Hand Tool, Marquee Rubberband, Right-Click Drag, Context Menu & Clipboard
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isAdditive: boolean;
  } | null>(null);
  const [isRightDragging, setIsRightDragging] = useState(false);
  const rightMouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    targetNodeId?: string;
  } | null>(null);
  const clipboardRef = useRef<DiagramNode[]>([]);

  // Connection Dragging State
  const [connecting, setConnecting] = useState<{
    sourceId: string;
    port: PortPosition;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Quick Branch Popover State from connector circle double click
  const [quickBranchPopup, setQuickBranchPopup] = useState<{
    sourceNodeId: string;
    x: number;
    y: number;
    direction: 'right' | 'down' | 'left' | 'up';
  } | null>(null);

  // Edge Label Dragging State
  const [draggingEdgeLabel, setDraggingEdgeLabel] = useState<{
    edgeId: string;
    startX: number;
    startY: number;
    initialOffsetX: number;
    initialOffsetY: number;
  } | null>(null);

  // Sequence Message Dragging State (Vertical Reordering & Horizontal Left/Right Shift)
  const [draggingMessage, setDraggingMessage] = useState<{
    id: string;
    startX: number;
    startY: number;
    initialOrder: number;
    currentOrder: number;
    dragX: number;
    dragY: number;
    shiftFromId?: string;
    shiftToId?: string;
    endpoint?: 'from' | 'to';
    initialLabelOffsetX: number;
  } | null>(null);

  // Sequence Block Dragging & Resizing State
  const [draggingBlock, setDraggingBlock] = useState<{
    id: string;
    startY: number;
    initialStartOrder: number;
    initialEndOrder: number;
    mode: 'move' | 'resize-bottom';
    dragSteps: number;
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

  // Start Canvas Pan, Marquee Selection, or Deselect (Draw.io Scheme)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Middle click (button 1) always pans
    if (e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      return;
    }

    // Right click (button 2) starts Draw.io pan; if dragged > 4px, suppresses context menu
    if (e.button === 2) {
      rightMouseDownPos.current = { x: e.clientX, y: e.clientY };
      setIsRightDragging(false);
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      return;
    }

    const target = e.target as HTMLElement | SVGElement | null;
    const isInteractive = target?.closest?.(
      '[data-node-id], [data-port], button, input, textarea, [data-interactive], [data-drag-handle], #drawio-context-menu'
    );
    if (isInteractive) return;

    // Left click (button 0)
    if (e.button === 0) {
      setContextMenu(null);

      // Spacebar Hand Tool panning
      if (isSpacePressed) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
        return;
      }

      // Draw.io Marquee selection on empty canvas
      const pos = screenToCanvas(e.clientX, e.clientY);
      setMarquee({
        startX: pos.x,
        startY: pos.y,
        currentX: pos.x,
        currentY: pos.y,
        isAdditive: e.shiftKey
      });
    }
  };

  // Start Node Dragging (Draw.io Alt+Drag Duplicate, Selection, Multi-Drag)
  const handleNodeMouseDown = (node: DiagramNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setContextMenu(null);

    // Draw.io: Alt + Drag duplicates node and begins dragging the duplicate immediately
    if (e.altKey) {
      const cloneId = `${node.type}_clone_${Date.now()}`;
      const clonedNode: DiagramNode = {
        ...node,
        id: cloneId,
        label: `${node.label}`
      };
      onAddNode(clonedNode);
      setSelectedNodeId(cloneId);
      setSelectedNodeIds([cloneId]);
      onSelectElement?.({ type: 'node', id: cloneId, label: clonedNode.label });

      setDraggingNode({
        id: cloneId,
        startX: e.clientX,
        startY: e.clientY,
        initialNodeX: clonedNode.x,
        initialNodeY: clonedNode.y
      });
      return;
    }

    // Right-click on node: select node for Draw.io context menu
    if (e.button === 2) {
      if (!selectedNodeIds.includes(node.id)) {
        setSelectedNodeId(node.id);
        setSelectedNodeIds([node.id]);
        onSelectElement?.({ type: 'node', id: node.id, label: node.label });
      }
      return;
    }

    const isMulti = e.shiftKey || e.ctrlKey || e.metaKey;
    let nextSelected = selectedNodeIds;

    if (isMulti) {
      nextSelected = selectedNodeIds.includes(node.id)
        ? selectedNodeIds.filter(id => id !== node.id)
        : [...selectedNodeIds, node.id];
      setSelectedNodeIds(nextSelected);
      setSelectedNodeId(nextSelected[nextSelected.length - 1] || null);
    } else {
      if (!selectedNodeIds.includes(node.id)) {
        nextSelected = [node.id];
        setSelectedNodeIds([node.id]);
        setSelectedNodeId(node.id);
      }
    }

    setSelectedEdgeId(null);
    setSelectedBlockId(null);
    onSelectElement?.({ type: 'node', id: node.id, label: node.label });

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
      const isChild = (n: DiagramNode) => {
        if (n.id === node.id) return false;
        if (n.data?.parentId === node.id) return true;
        return (
          n.x >= node.x && 
          n.x + n.width <= node.x + node.width && 
          n.y >= node.y && 
          n.y + n.height <= node.y + node.height
        );
      };
      const children = diagram.nodes.filter(isChild);
      if (children.length > 0) {
        childOffsets = children.map(c => ({ id: c.id, initialX: c.x, initialY: c.y }));
      }
    }

    // Multi-selected nodes offsets
    const multiNodes = diagram.nodes.filter(n => nextSelected.includes(n.id));
    const multiOffsets = multiNodes.length > 1
      ? multiNodes.map(n => ({ id: n.id, initialX: n.x, initialY: n.y }))
      : undefined;

    setDraggingNode({
      id: node.id,
      startX: e.clientX,
      startY: e.clientY,
      initialNodeX: node.x,
      initialNodeY: node.y,
      childOffsets,
      multiOffsets
    });
  };

  // Start Resizing Node
  const handleStartResize = (nodeId: string, direction: 'se' | 'e' | 's', e: React.MouseEvent) => {
    e.stopPropagation();
    const node = diagram.nodes.find(n => n.id === nodeId);
    if (!node) return;
    const optimal = getOptimalNodeDimensions(node);
    const initialW = node.width ?? optimal.width;
    const initialH = node.height ?? optimal.height;
    setResizingNode({
      id: nodeId,
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: initialW,
      initialHeight: initialH,
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

  // Mouse Move on Canvas (Draw.io Pan, Marquee, Dragging)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (rightMouseDownPos.current) {
      const dist = Math.hypot(e.clientX - rightMouseDownPos.current.x, e.clientY - rightMouseDownPos.current.y);
      if (dist > 4) {
        setIsRightDragging(true);
      }
    }

    if (isPanning) {
      onUpdateViewport({
        ...viewport,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    if (marquee) {
      const pos = screenToCanvas(e.clientX, e.clientY);
      setMarquee(prev => prev ? { ...prev, currentX: pos.x, currentY: pos.y } : null);

      const minX = Math.min(marquee.startX, pos.x);
      const maxX = Math.max(marquee.startX, pos.x);
      const minY = Math.min(marquee.startY, pos.y);
      const maxY = Math.max(marquee.startY, pos.y);

      // Find all nodes intersecting the rubberband box
      const enclosed = diagram.nodes.filter(n => {
        return !(n.x + n.width < minX || n.x > maxX || n.y + n.height < minY || n.y > maxY);
      }).map(n => n.id);

      if (marquee.isAdditive) {
        const combined = Array.from(new Set([...selectedNodeIds, ...enclosed]));
        setSelectedNodeIds(combined);
        setSelectedNodeId(combined[combined.length - 1] || null);
      } else {
        setSelectedNodeIds(enclosed);
        setSelectedNodeId(enclosed[enclosed.length - 1] || null);
      }
      return;
    }

    if (resizingNode) {
      const deltaX = (e.clientX - resizingNode.startX) / viewport.zoom;
      const deltaY = (e.clientY - resizingNode.startY) / viewport.zoom;

      const target = diagram.nodes.find(n => n.id === resizingNode.id);
      const isContainer = target && (
        target.type === 'package' || target.type === 'frame' || target.type === 'folder' ||
        target.type === 'namespace' || target.type === 'c4-boundary' ||
        target.category === 'container' || Boolean(target.data?.isContainer)
      );
      const minW = isContainer ? 140 : 60;
      const minH = isContainer ? 100 : 40;

      const newWidth = ['se', 'e'].includes(resizingNode.direction)
        ? Math.max(minW, snap(resizingNode.initialWidth + deltaX))
        : resizingNode.initialWidth;

      const newHeight = ['se', 's'].includes(resizingNode.direction)
        ? Math.max(minH, snap(resizingNode.initialHeight + deltaY))
        : resizingNode.initialHeight;

      onUpdateNodes(diagram.nodes.map(n => 
        n.id === resizingNode.id ? { ...n, width: newWidth, height: newHeight } : n
      ), { skipHistory: true });
      return;
    }

    if (draggingMessage && sequenceMetrics) {
      const deltaX = (e.clientX - draggingMessage.startX) / viewport.zoom;
      const deltaY = (e.clientY - draggingMessage.startY) / viewport.zoom;

      const effectiveMsgY = sequenceMetrics.topY + draggingMessage.initialOrder * sequenceMetrics.stepSpacing + deltaY;
      const targetOrder = Math.max(
        1,
        Math.min(
          sequenceMessages.length,
          Math.round((effectiveMsgY - sequenceMetrics.topY) / sequenceMetrics.stepSpacing)
        )
      );

      // Horizontal shift & endpoint reconnection across lifelines
      const curMsg = sequenceMessages.find(m => m.id === draggingMessage.id);
      let shiftFrom: string | undefined = undefined;
      let shiftTo: string | undefined = undefined;

      if (curMsg && sequenceParticipants.length > 1) {
        const sortedParts = [...sequenceParticipants].sort((a, b) => a.x - b.x);
        const fromIdx = sortedParts.findIndex(p => p.id === curMsg.from);
        const toIdx = sortedParts.findIndex(p => p.id === curMsg.to);

        if (draggingMessage.endpoint === 'from') {
          const fromNode = nodes.find(n => n.id === curMsg.from);
          const curX = (fromNode ? fromNode.x + fromNode.width / 2 : 100) + deltaX;
          let closest = sortedParts[0];
          let minDist = Infinity;
          sortedParts.forEach(p => {
            const pCenterX = p.x + p.width / 2;
            const dist = Math.abs(pCenterX - curX);
            if (dist < minDist) { minDist = dist; closest = p; }
          });
          if (minDist < 120 && closest.id !== curMsg.to) shiftFrom = closest.id;
        } else if (draggingMessage.endpoint === 'to') {
          const toNode = nodes.find(n => n.id === curMsg.to);
          const curX = (toNode ? toNode.x + toNode.width / 2 : 300) + deltaX;
          let closest = sortedParts[0];
          let minDist = Infinity;
          sortedParts.forEach(p => {
            const pCenterX = p.x + p.width / 2;
            const dist = Math.abs(pCenterX - curX);
            if (dist < minDist) { minDist = dist; closest = p; }
          });
          if (minDist < 120 && closest.id !== curMsg.from) shiftTo = closest.id;
        } else {
          // Dragging whole message: shift interaction columns left or right if dragged horizontally
          const avgSpan = sortedParts.length > 1 
            ? Math.abs(sortedParts[sortedParts.length - 1].x - sortedParts[0].x) / (sortedParts.length - 1)
            : 220;
          const colDelta = Math.round(deltaX / Math.max(90, avgSpan));
          if (colDelta !== 0 && fromIdx >= 0 && toIdx >= 0) {
            const candFrom = fromIdx + colDelta;
            const candTo = toIdx + colDelta;
            if (candFrom >= 0 && candFrom < sortedParts.length && candTo >= 0 && candTo < sortedParts.length && candFrom !== candTo) {
              shiftFrom = sortedParts[candFrom].id;
              shiftTo = sortedParts[candTo].id;
            }
          }
        }
      }

      setDraggingMessage(prev => prev ? {
        ...prev,
        dragX: deltaX,
        dragY: deltaY,
        currentOrder: targetOrder,
        shiftFromId: shiftFrom,
        shiftToId: shiftTo
      } : null);
      return;
    }

    if (draggingBlock && sequenceMetrics) {
      const deltaY = (e.clientY - draggingBlock.startY) / viewport.zoom;
      const deltaSteps = Math.round(deltaY / sequenceMetrics.stepSpacing);
      setDraggingBlock(prev => prev ? { ...prev, dragSteps: deltaSteps } : null);
      return;
    }

    if (draggingNode) {
      const deltaX = (e.clientX - draggingNode.startX) / viewport.zoom;
      const deltaY = (e.clientY - draggingNode.startY) / viewport.zoom;

      const target = diagram.nodes.find(n => n.id === draggingNode.id);

      const newX = snap(draggingNode.initialNodeX + deltaX);
      const newY = snap(draggingNode.initialNodeY + deltaY);
      const effectiveDeltaX = newX - draggingNode.initialNodeX;
      const effectiveDeltaY = newY - draggingNode.initialNodeY;

      // Detect hover over enclosing container for live magnetic drop-target feedback
      const isTargetContainer = target && (
        target.type === 'package' || 
        target.type === 'frame' || 
        target.type === 'folder' || 
        target.type === 'namespace' ||
        target.type === 'c4-boundary' ||
        target.category === 'container' || 
        Boolean(target.data?.isContainer)
      );

      if (target && !isTargetContainer) {
        const centerX = newX + target.width / 2;
        const centerY = newY + target.height / 2;
        const enclosingContainers = diagram.nodes.filter(c => 
          c.id !== target.id &&
          (c.type === 'package' || c.type === 'frame' || c.type === 'folder' || c.type === 'namespace' || c.type === 'c4-boundary' || c.category === 'container' || c.data?.isContainer) &&
          centerX >= c.x && centerX <= c.x + c.width &&
          centerY >= c.y && centerY <= c.y + c.height
        );
        if (enclosingContainers.length > 0) {
          enclosingContainers.sort((a, b) => (a.width * a.height) - (b.width * b.height));
          setHoveredDropTargetId(enclosingContainers[0].id);
        } else {
          setHoveredDropTargetId(null);
        }
      } else {
        setHoveredDropTargetId(null);
      }

      if (draggingNode.multiOffsets && draggingNode.multiOffsets.length > 1) {
        const offsetMap = new Map(draggingNode.multiOffsets.map(o => [o.id, o]));
        onUpdateNodes(diagram.nodes.map(n => {
          const off = offsetMap.get(n.id);
          if (!off) return n;
          return {
            ...n,
            x: snap(off.initialX + effectiveDeltaX),
            y: snap(off.initialY + effectiveDeltaY)
          };
        }), { skipHistory: true });
        return;
      }

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

    if (draggingEdgeLabel) {
      const deltaX = (e.clientX - draggingEdgeLabel.startX) / viewport.zoom;
      const deltaY = (e.clientY - draggingEdgeLabel.startY) / viewport.zoom;
      const newOffsetX = snap(draggingEdgeLabel.initialOffsetX + deltaX);
      const newOffsetY = snap(draggingEdgeLabel.initialOffsetY + deltaY);

      onUpdateEdges(diagram.edges.map(ed => 
        ed.id === draggingEdgeLabel.edgeId ? { ...ed, labelOffset: { x: newOffsetX, y: newOffsetY } } : ed
      ));
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

  const handleStartDragLabel = (edge: DiagramEdge, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
    setDraggingEdgeLabel({
      edgeId: edge.id,
      startX: e.clientX,
      startY: e.clientY,
      initialOffsetX: edge.labelOffset?.x || 0,
      initialOffsetY: edge.labelOffset?.y || 0
    });
  };

  // Mouse Up on Canvas (Draw.io Marquee commit, Pan stop, Drag end)
  const handleMouseUp = (e: React.MouseEvent) => {
    if (marquee) {
      const dist = Math.hypot(marquee.currentX - marquee.startX, marquee.currentY - marquee.startY);
      if (dist < 4 && !marquee.isAdditive) {
        // Pure click on empty canvas without drag: deselect all
        clearSelection();
      }
      setMarquee(null);
    }

    if (isPanning) {
      setIsPanning(false);
    }

    rightMouseDownPos.current = null;

    if (draggingEdgeLabel) {
      setDraggingEdgeLabel(null);
    }

    if (resizingNode) {
      const deltaX = (e.clientX - resizingNode.startX) / viewport.zoom;
      const deltaY = (e.clientY - resizingNode.startY) / viewport.zoom;
      const target = diagram.nodes.find(n => n.id === resizingNode.id);
      const isContainer = target && (
        target.type === 'package' || target.type === 'frame' || target.type === 'folder' ||
        target.type === 'namespace' || target.type === 'c4-boundary' ||
        target.category === 'container' || Boolean(target.data?.isContainer)
      );
      const minW = isContainer ? 140 : 60;
      const minH = isContainer ? 100 : 40;

      const finalWidth = ['se', 'e'].includes(resizingNode.direction)
        ? Math.max(minW, snap(resizingNode.initialWidth + deltaX))
        : resizingNode.initialWidth;

      const finalHeight = ['se', 's'].includes(resizingNode.direction)
        ? Math.max(minH, snap(resizingNode.initialHeight + deltaY))
        : resizingNode.initialHeight;

      const hasResized = target && (
        finalWidth !== resizingNode.initialWidth ||
        finalHeight !== resizingNode.initialHeight
      );
      if (hasResized) {
        onUpdateNodes(diagram.nodes.map(n => 
          n.id === resizingNode.id ? { ...n, width: finalWidth, height: finalHeight } : n
        ), { 
          actionName: `Resized ${target?.label || 'Element'}` 
        });
      }
      setResizingNode(null);
    }

    if (draggingMessage) {
      if (onUpdateDiagram && sequenceMessages.length > 0) {
        let sorted = [...sequenceMessages].sort((a, b) => (a.order || 0) - (b.order || 0));
        const movingIndex = sorted.findIndex(m => m.id === draggingMessage.id);
        if (movingIndex !== -1) {
          const orig = sorted[movingIndex];
          const hasHorizontalShift = Boolean(
            (draggingMessage.shiftFromId && draggingMessage.shiftFromId !== orig.from) ||
            (draggingMessage.shiftToId && draggingMessage.shiftToId !== orig.to)
          );
          const hasOrderChange = draggingMessage.currentOrder !== draggingMessage.initialOrder;
          const hasLabelMove = Math.abs(draggingMessage.dragX) > 6 && !draggingMessage.endpoint;

          const updatedMsg = {
            ...orig,
            from: draggingMessage.shiftFromId || orig.from,
            to: draggingMessage.shiftToId || orig.to,
            labelOffset: hasLabelMove 
              ? { x: Math.round(draggingMessage.initialLabelOffsetX + draggingMessage.dragX), y: 0 } 
              : orig.labelOffset
          };

          sorted[movingIndex] = updatedMsg;

          if (hasOrderChange) {
            const [moved] = sorted.splice(movingIndex, 1);
            const targetIndex = Math.max(0, Math.min(sorted.length, draggingMessage.currentOrder - 1));
            sorted.splice(targetIndex, 0, moved);
            sorted = sorted.map((m, idx) => ({ ...m, order: idx + 1 }));
          }

          if (hasHorizontalShift || hasOrderChange || hasLabelMove) {
            onUpdateDiagram({ messages: sorted }, `Moved sequence message ${orig.label || orig.id}`);
          }
        }
      }
      setDraggingMessage(null);
    }

    if (draggingBlock) {
      if (draggingBlock.dragSteps !== 0 && onUpdateDiagram && diagram.blocks) {
        const nextBlocks = diagram.blocks.map(b => {
          if (b.id !== draggingBlock.id) return b;
          if (draggingBlock.mode === 'move') {
            const span = draggingBlock.initialEndOrder - draggingBlock.initialStartOrder;
            const newStart = Math.max(1, Math.min(sequenceMessages.length - span, draggingBlock.initialStartOrder + draggingBlock.dragSteps));
            const newEnd = Math.max(newStart, newStart + span);
            return { ...b, startOrder: newStart, endOrder: newEnd };
          } else if (draggingBlock.mode === 'resize-bottom') {
            const newEnd = Math.max(b.startOrder, draggingBlock.initialEndOrder + draggingBlock.dragSteps);
            return { ...b, endOrder: newEnd };
          }
          return b;
        });
        onUpdateDiagram({ blocks: nextBlocks }, `Updated sequence block bounds`);
      }
      setDraggingBlock(null);
    }

    if (draggingNode) {
      setHoveredDropTargetId(null);
      const deltaX = (e.clientX - draggingNode.startX) / viewport.zoom;
      const deltaY = (e.clientY - draggingNode.startY) / viewport.zoom;
      const finalNewX = snap(draggingNode.initialNodeX + deltaX);
      const finalNewY = snap(draggingNode.initialNodeY + deltaY);
      const effectiveDeltaX = finalNewX - draggingNode.initialNodeX;
      const effectiveDeltaY = finalNewY - draggingNode.initialNodeY;

      const target = diagram.nodes.find(n => n.id === draggingNode.id);
      const isTargetContainer = target && (
        target.type === 'package' || 
        target.type === 'frame' || 
        target.type === 'folder' || 
        target.type === 'namespace' || 
        target.type === 'c4-boundary' || 
        target.category === 'container' || 
        Boolean(target.data?.isContainer)
      );

      const hasMoved = Math.abs(effectiveDeltaX) > 0 || Math.abs(effectiveDeltaY) > 0;
      if (hasMoved) {
        let updatedNodes = [...diagram.nodes];
        let moveActionName = `Moved ${target?.label || 'Element'}`;

        if (draggingNode.multiOffsets && draggingNode.multiOffsets.length > 1) {
          const offsetMap = new Map(draggingNode.multiOffsets.map(o => [o.id, o]));
          updatedNodes = diagram.nodes.map(n => {
            const off = offsetMap.get(n.id);
            if (!off) return n;
            return {
              ...n,
              x: snap(off.initialX + effectiveDeltaX),
              y: snap(off.initialY + effectiveDeltaY)
            };
          });
          moveActionName = `Moved ${draggingNode.multiOffsets.length} Elements`;
        } else if (target && !isTargetContainer) {
          const centerX = finalNewX + target.width / 2;
          const centerY = finalNewY + target.height / 2;
          const enclosingContainers = diagram.nodes.filter(c => 
            c.id !== target.id &&
            (c.type === 'package' || c.type === 'frame' || c.type === 'folder' || c.type === 'namespace' || c.type === 'c4-boundary' || c.category === 'container' || c.data?.isContainer) &&
            centerX >= c.x && centerX <= c.x + c.width &&
            centerY >= c.y && centerY <= c.y + c.height
          );
          let enclosing: DiagramNode | undefined;
          if (enclosingContainers.length > 0) {
            enclosingContainers.sort((a, b) => (a.width * a.height) - (b.width * b.height));
            enclosing = enclosingContainers[0];
          }

          if (enclosing) {
            const newParentId = enclosing.id;
            moveActionName = `Snapped ${target.label || 'Element'} into ${enclosing.label || 'Container'}`;
            // Magnetic tab clearance: ensure top doesn't collide with the frame/package title tab
            const headerPadding = enclosing.type === 'frame' ? 36 : (enclosing.type === 'folder' ? 32 : 30);
            let finalTargetX = finalNewX;
            let finalTargetY = finalNewY;

            if (finalTargetY < enclosing.y + headerPadding) {
              finalTargetY = enclosing.y + headerPadding;
            }
            if (finalTargetX < enclosing.x + 16) {
              finalTargetX = enclosing.x + 16;
            }

            // Auto-expand container if child exceeds right or bottom boundary
            const requiredWidth = Math.max(enclosing.width, (finalTargetX + target.width + 24) - enclosing.x);
            const requiredHeight = Math.max(enclosing.height, (finalTargetY + target.height + 24) - enclosing.y);

            updatedNodes = updatedNodes.map(n => {
              if (n.id === target.id) {
                return {
                  ...n,
                  x: finalTargetX,
                  y: finalTargetY,
                  data: { ...(n.data || {}), parentId: newParentId }
                };
              }
              if (n.id === enclosing.id) {
                return {
                  ...n,
                  width: requiredWidth,
                  height: requiredHeight
                };
              }
              return n;
            });
          } else {
            // Normal move (or unsnapped from container)
            updatedNodes = updatedNodes.map(n => {
              if (n.id === target.id) {
                return {
                  ...n,
                  x: finalNewX,
                  y: finalNewY,
                  data: target.data?.parentId ? { ...(n.data || {}), parentId: undefined } : n.data
                };
              }
              return n;
            });
            if (target.data?.parentId) {
              moveActionName = `Unsnapped ${target.label || 'Element'} from Container`;
            }
          }
        } else if (target && isTargetContainer) {
          // Explicitly sync final positions for all enclosed children when container moved
          updatedNodes = updatedNodes.map(n => {
            if (n.id === target.id) {
              return { ...n, x: finalNewX, y: finalNewY };
            }
            const child = draggingNode.childOffsets?.find(c => c.id === n.id);
            if (child) {
              return { ...n, x: snap(child.initialX + effectiveDeltaX), y: snap(child.initialY + effectiveDeltaY) };
            }
            return n;
          });
        }

        onUpdateNodes(updatedNodes, { 
          actionName: moveActionName 
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

  // Draw.io Right-Click Context Menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isRightDragging) {
      setIsRightDragging(false);
      return;
    }

    const target = e.target as HTMLElement | SVGElement | null;
    const nodeEl = target?.closest('[data-node-id]');
    const clickedNodeId = nodeEl?.getAttribute('data-node-id') || undefined;

    if (clickedNodeId && !selectedNodeIds.includes(clickedNodeId)) {
      setSelectedNodeId(clickedNodeId);
      setSelectedNodeIds([clickedNodeId]);
      const clickedNode = diagram.nodes.find(n => n.id === clickedNodeId);
      if (clickedNode) onSelectElement?.({ type: 'node', id: clickedNode.id, label: clickedNode.label });
    }

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetNodeId: clickedNodeId || selectedNodeId || undefined
    });
  };

  useEffect(() => {
    if (!contextMenu) return;
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  // Intercept right clicks on the canvas to completely suppress native browser context menu
  useEffect(() => {
    const handleGlobalContextMenu = (e: MouseEvent) => {
      const container = containerRef.current;
      if (container && (container.contains(e.target as Node) || isRightDragging || isPanning)) {
        e.preventDefault();
      }
    };

    window.addEventListener('contextmenu', handleGlobalContextMenu, { capture: true });
    return () => {
      window.removeEventListener('contextmenu', handleGlobalContextMenu, { capture: true });
    };
  }, [isRightDragging, isPanning]);

  // Prevent browser page zoom on Ctrl+Wheel / Cmd+Wheel (non-passive listener required by browsers)
  useEffect(() => {
    const handleNativeWheel = (e: WheelEvent) => {
      const container = containerRef.current;
      if (container && container.contains(e.target as Node)) {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleNativeWheel);
    };
  }, []);

  // Window-level mouse tracking ensuring fast drags and out-of-bounds mouse releases always commit
  const handleMouseMoveRef = useRef(handleMouseMove);
  handleMouseMoveRef.current = handleMouseMove;
  const handleMouseUpRef = useRef(handleMouseUp);
  handleMouseUpRef.current = handleMouseUp;

  useEffect(() => {
    const isInteracting = Boolean(
      draggingNode || resizingNode || isPanning || draggingBlock || draggingMessage || draggingEdgeLabel || connecting || marquee
    );
    if (!isInteracting) return;

    const onWindowMouseMove = (e: MouseEvent) => {
      handleMouseMoveRef.current(e as unknown as React.MouseEvent);
    };
    const onWindowMouseUp = (e: MouseEvent) => {
      handleMouseUpRef.current(e as unknown as React.MouseEvent);
    };

    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
    };
  }, [Boolean(draggingNode || resizingNode || isPanning || draggingBlock || draggingMessage || draggingEdgeLabel || connecting || marquee)]);

  // Zoom & Pan with Wheel (Draw.io Scheme - non-passive native event listener)
  const handleWheel = (e: WheelEvent | React.WheelEvent) => {
    // If the wheel event happened inside a scrollable menu, popover, drawer, or input, do NOT pan/zoom canvas
    const target = e.target as HTMLElement | null;
    if (target && (
      target.closest('.overflow-y-auto') || 
      target.closest('.overflow-x-auto') || 
      target.closest('.overflow-auto') || 
      target.closest('[data-scrollable]') ||
      target.closest('#quick-action-bar-container') ||
      target.closest('#edge-toolbar-container') ||
      target.closest('.scrollbar-thin') ||
      target.closest('#drawio-context-menu')
    )) {
      return;
    }

    if (e.cancelable) {
      e.preventDefault();
    }

    // Draw.io Wheel Scheme:
    // 1. Ctrl / Cmd + Wheel: Zoom centered at mouse cursor
    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.min(Math.max(viewport.zoom * zoomFactor, 0.25), 2.5);

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newX = mouseX - (mouseX - viewport.x) * (newZoom / viewport.zoom);
        const newY = mouseY - (mouseY - viewport.y) * (newZoom / viewport.zoom);

        onUpdateViewport({ x: newX, y: newY, zoom: newZoom });
      }
      return;
    }

    // 2. Shift + Wheel: Horizontal pan
    if (e.shiftKey) {
      const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
      onUpdateViewport({
        ...viewport,
        x: viewport.x - delta
      });
      return;
    }

    // 3. Normal Wheel: Vertical pan (and deltaX if trackpad 2D scrolling)
    onUpdateViewport({
      ...viewport,
      x: viewport.x - (e.deltaX || 0),
      y: viewport.y - e.deltaY
    });
  };

  const handleWheelRef = useRef(handleWheel);
  handleWheelRef.current = handleWheel;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onNativeWheel = (e: WheelEvent) => {
      handleWheelRef.current(e);
    };

    container.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onNativeWheel);
    };
  }, []);

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

  // Draw.io Clipboard, Deletion & Layering operations
  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeIds.length > 0 || selectedNodeId) {
      const idsToDelete = new Set(selectedNodeIds.length > 0 ? selectedNodeIds : [selectedNodeId!]);
      onUpdateNodes(diagram.nodes.filter(n => !idsToDelete.has(n.id)));
      onUpdateEdges(diagram.edges.filter(e => !idsToDelete.has(e.source) && !idsToDelete.has(e.target)));
      if (diagram.messages) {
        onUpdateDiagram?.({
          messages: diagram.messages.filter(m => !idsToDelete.has(m.from) && !idsToDelete.has(m.to))
        });
      }
      setSelectedNodeId(null);
      setSelectedNodeIds([]);
    } else if (selectedEdgeId) {
      if (diagram.messages?.some(m => m.id === selectedEdgeId)) {
        onUpdateDiagram?.({
          messages: diagram.messages.filter(m => m.id !== selectedEdgeId)
        });
      } else {
        onUpdateEdges(diagram.edges.filter(e => e.id !== selectedEdgeId));
      }
      setSelectedEdgeId(null);
      setEditingEdgeId(null);
    } else if (selectedBlockId) {
      if (diagram.blocks) {
        onUpdateDiagram?.({
          blocks: diagram.blocks.filter(b => b.id !== selectedBlockId)
        });
      }
      setSelectedBlockId(null);
    }
  }, [selectedNodeIds, selectedNodeId, selectedEdgeId, selectedBlockId, diagram.nodes, diagram.edges, diagram.messages, diagram.blocks, onUpdateNodes, onUpdateEdges, onUpdateDiagram]);

  const handleSelectAll = useCallback(() => {
    const allIds = diagram.nodes.map(n => n.id);
    setSelectedNodeIds(allIds);
    setSelectedNodeId(allIds[0] || null);
    setSelectedEdgeId(null);
    setSelectedBlockId(null);
  }, [diagram.nodes]);

  const handleCopySelected = useCallback(() => {
    const activeIds = selectedNodeIds.length > 0 ? selectedNodeIds : (selectedNodeId ? [selectedNodeId] : []);
    if (activeIds.length === 0) return;
    const targets = diagram.nodes.filter(n => activeIds.includes(n.id));
    clipboardRef.current = JSON.parse(JSON.stringify(targets));
  }, [diagram.nodes, selectedNodeIds, selectedNodeId]);

  const handlePaste = useCallback(() => {
    if (clipboardRef.current.length === 0) return;
    const now = Date.now();
    const pastedNodes: DiagramNode[] = clipboardRef.current.map((n, idx) => {
      const newId = `${n.type}_pasted_${now}_${idx}`;
      return {
        ...n,
        id: newId,
        x: n.x + 32,
        y: n.y + 32,
        label: `${n.label}`
      };
    });

    onUpdateNodes([...diagram.nodes, ...pastedNodes], { actionName: `Pasted ${pastedNodes.length} element(s)` });
    const newIds = pastedNodes.map(n => n.id);
    setSelectedNodeIds(newIds);
    setSelectedNodeId(newIds[newIds.length - 1] || null);
    clipboardRef.current = pastedNodes;
  }, [diagram.nodes, onUpdateNodes]);

  const handleCutSelected = useCallback(() => {
    handleCopySelected();
    handleDeleteSelected();
  }, [handleCopySelected, handleDeleteSelected]);

  const handleDuplicateAllSelected = useCallback(() => {
    handleCopySelected();
    handlePaste();
  }, [handleCopySelected, handlePaste]);

  const handleBringToFront = useCallback(() => {
    const activeIds = new Set(selectedNodeIds.length > 0 ? selectedNodeIds : (selectedNodeId ? [selectedNodeId] : []));
    if (activeIds.size === 0) return;
    const nonSelected = diagram.nodes.filter(n => !activeIds.has(n.id));
    const selected = diagram.nodes.filter(n => activeIds.has(n.id));
    onUpdateNodes([...nonSelected, ...selected], { actionName: 'Bring to Front' });
  }, [diagram.nodes, selectedNodeIds, selectedNodeId, onUpdateNodes]);

  const handleSendToBack = useCallback(() => {
    const activeIds = new Set(selectedNodeIds.length > 0 ? selectedNodeIds : (selectedNodeId ? [selectedNodeId] : []));
    if (activeIds.size === 0) return;
    const nonSelected = diagram.nodes.filter(n => !activeIds.has(n.id));
    const selected = diagram.nodes.filter(n => activeIds.has(n.id));
    onUpdateNodes([...selected, ...nonSelected], { actionName: 'Send to Back' });
  }, [diagram.nodes, selectedNodeIds, selectedNodeId, onUpdateNodes]);

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

  // Fast connect / branch out new node
  const handleAddConnectedNode = (
    direction: 'right' | 'down' | 'left' | 'up' = 'right',
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

    const targetType = options?.type || source.type;
    const targetCategory = options?.category || source.category;
    const targetW = targetType === 'note' ? 180 : source.width;
    const targetH = targetType === 'note' ? 80 : source.height;

    let offsetX = 0;
    let offsetY = 0;
    let sourceHandle: PortPosition = 'right';
    let targetHandle: PortPosition = 'left';

    switch (direction) {
      case 'right':
        offsetX = source.width + 80;
        offsetY = 0;
        sourceHandle = 'right';
        targetHandle = 'left';
        break;
      case 'left':
        offsetX = -(targetW + 80);
        offsetY = 0;
        sourceHandle = 'left';
        targetHandle = 'right';
        break;
      case 'down':
        offsetX = 0;
        offsetY = source.height + 60;
        sourceHandle = 'bottom';
        targetHandle = 'top';
        break;
      case 'up':
        offsetX = 0;
        offsetY = -(targetH + 60);
        sourceHandle = 'top';
        targetHandle = 'bottom';
        break;
    }

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
      width: targetW,
      height: targetH,
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
      sourceHandle,
      targetHandle,
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

  // Wrap selected node in a Frame boundary (or alt/loop/opt fragment frame)
  const handleWrapInFrame = (kind: 'frame' | 'alt' | 'loop' | 'opt' | 'par' | 'group' = 'frame', condition?: string) => {
    if (!selectedNode) return;
    const padX = 36;
    const padTop = 44;
    const padBottom = 32;
    const label = kind === 'frame' ? 'Frame' : kind.toUpperCase();
    const frameNode: DiagramNode = {
      id: `${kind}_${Date.now()}`,
      type: 'frame',
      label,
      category: 'container',
      shape: 'frame',
      x: snap(selectedNode.x - padX),
      y: snap(selectedNode.y - padTop),
      width: snap(selectedNode.width + padX * 2),
      height: snap(selectedNode.height + padTop + padBottom),
      color: kind === 'alt' ? 'ochre' : kind === 'loop' ? 'sage' : 'slate',
      data: {
        isContainer: true,
        containerType: 'frame',
        frameKind: kind === 'frame' ? undefined : kind,
        condition: condition || (kind === 'alt' ? 'condition' : kind === 'loop' ? 'items' : undefined),
        shape: 'frame'
      }
    };

    // Place frame at the beginning of the array so it's behind the child node
    onUpdateNodes([frameNode, ...diagram.nodes]);
    selectNode(frameNode);
  };

  // Draw.io Keyboard Shortcuts & Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement | null;
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName || '') ||
        target?.isContentEditable
      ) {
        return;
      }

      // Spacebar Hand Tool Pan
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        setIsSpacePressed(true);
        return;
      }

      // Escape: clear selection, marquee, context menu
      if (e.key === 'Escape') {
        clearSelection();
        setContextMenu(null);
        setMarquee(null);
        return;
      }

      // Ctrl/Cmd + A: Select All
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleSelectAll();
        return;
      }

      // Ctrl/Cmd + C: Copy
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopySelected();
        return;
      }

      // Ctrl/Cmd + V: Paste
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handlePaste();
        return;
      }

      // Ctrl/Cmd + X: Cut
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleCutSelected();
        return;
      }

      // Ctrl/Cmd + D: Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateAllSelected();
        return;
      }

      // Ctrl/Cmd + S: Prevent browser Save As dialog
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        return;
      }

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelected();
        return;
      }

      // Zoom shortcuts: Ctrl + '=', Ctrl + '+', Ctrl + '-'
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        onUpdateViewport({ ...viewport, zoom: Math.min(viewport.zoom * 1.15, 2.5) });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        onUpdateViewport({ ...viewport, zoom: Math.max(viewport.zoom * 0.85, 0.3) });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        onUpdateViewport({ x: 60, y: 40, zoom: 1 });
        return;
      }

      // Arrow keys: Nudge selected nodes (10px default, 1px with Shift)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const activeIds = selectedNodeIds.length > 0 ? selectedNodeIds : (selectedNodeId ? [selectedNodeId] : []);
        if (activeIds.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 1 : (snapToGrid ? 16 : 10);
          const dx = e.key === 'ArrowLeft' ? -step : (e.key === 'ArrowRight' ? step : 0);
          const dy = e.key === 'ArrowUp' ? -step : (e.key === 'ArrowDown' ? step : 0);

          const activeSet = new Set(activeIds);
          const updated = diagram.nodes.map(n => {
            if (!activeSet.has(n.id)) return n;
            return {
              ...n,
              x: n.x + dx,
              y: n.y + dy
            };
          });
          onUpdateNodes(updated, { actionName: `Nudge ${activeIds.length} element(s)` });
          return;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        setIsSpacePressed(false);
      }
    };

    const handleWindowBlur = () => {
      setIsSpacePressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [
    selectedNodeId,
    selectedNodeIds,
    selectedEdgeId,
    selectedBlockId,
    diagram,
    snapToGrid,
    viewport,
    onUpdateViewport,
    onUpdateNodes,
    handleSelectAll,
    handleCopySelected,
    handlePaste,
    handleCutSelected,
    handleDuplicateAllSelected,
    handleDeleteSelected,
    clearSelection
  ]);

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

    const srcOptimal = getOptimalNodeDimensions(srcNode);
    const tgtOptimal = getOptimalNodeDimensions(tgtNode);
    const srcW = srcNode.width ?? srcOptimal.width;
    const srcH = srcNode.height ?? srcOptimal.height;
    const tgtW = tgtNode.width ?? tgtOptimal.width;
    const tgtH = tgtNode.height ?? tgtOptimal.height;

    const srcCenter = { x: srcNode.x + srcW / 2, y: srcNode.y + srcH / 2 };
    const tgtCenter = { x: tgtNode.x + tgtW / 2, y: tgtNode.y + tgtH / 2 };

    const dx = tgtCenter.x - srcCenter.x;
    const dy = tgtCenter.y - srcCenter.y;

    const wRatio = (srcW + tgtW) / 2 || 1;
    const hRatio = (srcH + tgtH) / 2 || 1;

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
    const node = typeof nodeOrId === 'string' ? (nodes.find(n => n.id === nodeOrId) || diagram.nodes?.find(n => n.id === nodeOrId)) : nodeOrId;
    if (!node) return { x: 0, y: 0 };
    const optimal = getOptimalNodeDimensions(node);
    const w = node.width ?? optimal.width;
    const h = node.height ?? optimal.height;
    switch (port) {
      case 'top':
        return { x: node.x + w / 2, y: node.y };
      case 'right':
        return { x: node.x + w, y: node.y + h / 2 };
      case 'bottom':
        return { x: node.x + w / 2, y: node.y + h };
      case 'left':
        return { x: node.x, y: node.y + h / 2 };
      default:
        return { x: node.x + w / 2, y: node.y + h / 2 };
    }
  };

  // Sequence Lifelines & Timeline Metrics
  const sequenceParticipants = useMemo(() => {
    const msgs = diagram.messages || [];
    const involvedIds = new Set<string>();
    msgs.forEach(m => {
      involvedIds.add(m.from);
      involvedIds.add(m.to);
    });
    return nodes.filter(n =>
      n.category === 'sequence' ||
      n.type === 'participant' ||
      n.type === 'seq-participant' ||
      (msgs.length > 0 && involvedIds.has(n.id))
    );
  }, [nodes, diagram.messages]);

  const sequenceMessages = diagram.messages || [];
  const sequenceBlocks = diagram.blocks || [];

  const sequenceMetrics = useMemo(() => {
    if (sequenceParticipants.length === 0 || sequenceMessages.length === 0) {
      return null;
    }
    const maxOrder = Math.max(...sequenceMessages.map(m => m.order || 0), 1);
    const topY = Math.min(...sequenceParticipants.map(p => p.y + p.height));
    const stepSpacing = 68;
    const lifelineBottom = Math.max(520, topY + (maxOrder + 2) * stepSpacing + 40);

    return {
      maxOrder,
      topY,
      stepSpacing,
      lifelineBottom
    };
  }, [sequenceParticipants, sequenceMessages]);

  // Memoize computed edge paths, markers, and non-overlapping label / cardinality positions
  const computedEdges = useMemo(() => {
    const hasSeqMsgs = Boolean(diagram.messages && diagram.messages.length > 0);
    const activeEdges = hasSeqMsgs ? edges.filter(e => !e.id.startsWith('edge_seq_') && !e.id.startsWith('msg_')) : edges;

    // 1. Pre-calculate optimal ports for all valid edges
    const validEdgePorts = activeEdges.map(edge => {
      const srcNode = nodes.find(n => n.id === edge.source);
      const tgtNode = nodes.find(n => n.id === edge.target);
      if (!srcNode || !tgtNode) return null;
      const { srcPort, tgtPort } = getOptimalPorts(
        srcNode,
        tgtNode,
        edge.sourceHandle,
        edge.targetHandle,
        edge.directionHint
      );
      return { edge, srcNode, tgtNode, srcPort, tgtPort };
    }).filter(Boolean) as Array<{
      edge: DiagramEdge;
      srcNode: DiagramNode;
      tgtNode: DiagramNode;
      srcPort: PortPosition;
      tgtPort: PortPosition;
    }>;

    // 2. Group connections along node faces to distribute multiple edges
    const portGroups = new Map<string, Array<{
      edgeId: string;
      isSource: boolean;
      otherNode: DiagramNode;
    }>>();

    validEdgePorts.forEach(({ edge, srcNode, tgtNode, srcPort, tgtPort }) => {
      const srcKey = `${srcNode.id}_${srcPort}`;
      const tgtKey = `${tgtNode.id}_${tgtPort}`;
      if (!portGroups.has(srcKey)) portGroups.set(srcKey, []);
      portGroups.get(srcKey)!.push({ edgeId: edge.id, isSource: true, otherNode: tgtNode });

      if (!portGroups.has(tgtKey)) portGroups.set(tgtKey, []);
      portGroups.get(tgtKey)!.push({ edgeId: edge.id, isSource: false, otherNode: srcNode });
    });

    // 3. Compute distinct, distributed connection coordinates along node sides
    const connectionCoordMap = new Map<string, { x: number; y: number }>();

    portGroups.forEach((conns, key) => {
      const lastUnderscore = key.lastIndexOf('_');
      const nodeId = key.slice(0, lastUnderscore);
      const port = key.slice(lastUnderscore + 1) as PortPosition;
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      if (conns.length === 1) {
        const pt = getPortCoord(node, port);
        connectionCoordMap.set(`${conns[0].edgeId}_${conns[0].isSource ? 'src' : 'tgt'}`, pt);
        return;
      }

      const optimal = getOptimalNodeDimensions(node);
      const nodeW = node.width ?? optimal.width;
      const nodeH = node.height ?? optimal.height;

      // Distribute multiple connections evenly across the face
      if (port === 'top' || port === 'bottom') {
        conns.sort((a, b) => {
          const aOpt = getOptimalNodeDimensions(a.otherNode);
          const bOpt = getOptimalNodeDimensions(b.otherNode);
          const aW = a.otherNode.width ?? aOpt.width;
          const bW = b.otherNode.width ?? bOpt.width;
          return (a.otherNode.x + aW / 2) - (b.otherNode.x + bW / 2);
        });
        const margin = Math.min(24, nodeW * 0.15);
        const usableW = Math.max(10, nodeW - 2 * margin);
        conns.forEach((c, idx) => {
          const frac = (idx + 0.5) / conns.length;
          const x = node.x + margin + frac * usableW;
          const y = port === 'top' ? node.y : node.y + nodeH;
          connectionCoordMap.set(`${c.edgeId}_${c.isSource ? 'src' : 'tgt'}`, { x, y });
        });
      } else {
        conns.sort((a, b) => {
          const aOpt = getOptimalNodeDimensions(a.otherNode);
          const bOpt = getOptimalNodeDimensions(b.otherNode);
          const aH = a.otherNode.height ?? aOpt.height;
          const bH = b.otherNode.height ?? bOpt.height;
          return (a.otherNode.y + aH / 2) - (b.otherNode.y + bH / 2);
        });
        const margin = Math.min(24, nodeH * 0.15);
        const usableH = Math.max(10, nodeH - 2 * margin);
        conns.forEach((c, idx) => {
          const frac = (idx + 0.5) / conns.length;
          const x = port === 'left' ? node.x : node.x + nodeW;
          const y = node.y + margin + frac * usableH;
          connectionCoordMap.set(`${c.edgeId}_${c.isSource ? 'src' : 'tgt'}`, { x, y });
        });
      }
    });

    // 4. Registry for collision detection of placed overlay boxes
    const placedCardBoxes: Array<{ x: number; y: number; width: number; height: number }> = [];
    const placedLabelBoxes: Array<{ x: number; y: number; width: number; height: number }> = [];

    return validEdgePorts.map(({ edge, srcNode, tgtNode, srcPort, tgtPort }) => {
      const isSelfLoop = edge.source === edge.target;
      const src = connectionCoordMap.get(`${edge.id}_src`) || getPortCoord(srcNode, srcPort);
      const tgt = connectionCoordMap.get(`${edge.id}_tgt`) || getPortCoord(tgtNode, tgtPort);

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

      // Helper function to test box overlap against all placed cardinality boxes
      const collidesWithPlacedCards = (cx: number, cy: number, w: number, h: number, pad = 6) => {
        const left = cx - w / 2 - pad;
        const right = cx + w / 2 + pad;
        const top = cy - h / 2 - pad;
        const bottom = cy + h / 2 + pad;
        return placedCardBoxes.some(b => {
          const bLeft = b.x - b.width / 2;
          const bRight = b.x + b.width / 2;
          const bTop = b.y - b.height / 2;
          const bBottom = b.y + b.height / 2;
          return !(right <= bLeft || left >= bRight || bottom <= bTop || top >= bBottom);
        });
      };

      // 5. Source Cardinality Placement
      let sourceCardPos: { x: number; y: number } | null = null;
      if (edge.cardinalitySource) {
        const cardW = Math.max(28, edge.cardinalitySource.length * 7.5 + 16);
        const cardH = 20;
        let baseX = src.x;
        let baseY = src.y;

        if (srcPort === 'right') { baseX = src.x + 14 + cardW / 2; baseY = src.y - 12; }
        else if (srcPort === 'left') { baseX = src.x - 14 - cardW / 2; baseY = src.y - 12; }
        else if (srcPort === 'bottom') { baseX = src.x; baseY = src.y + 14 + cardH / 2; }
        else { baseX = src.x; baseY = src.y - 14 - cardH / 2; }

        if (collidesWithPlacedCards(baseX, baseY, cardW, cardH)) {
          const offsets = srcPort === 'top' || srcPort === 'bottom'
            ? [{ x: baseX, y: baseY - 22 }, { x: baseX, y: baseY + 22 }, { x: baseX + cardW * 0.6, y: baseY }, { x: baseX - cardW * 0.6, y: baseY }]
            : [{ x: baseX, y: baseY - 20 }, { x: baseX, y: baseY + 20 }, { x: baseX + 24, y: baseY }, { x: baseX - 24, y: baseY }];
          for (const cand of offsets) {
            if (!collidesWithPlacedCards(cand.x, cand.y, cardW, cardH)) {
              baseX = cand.x;
              baseY = cand.y;
              break;
            }
          }
        }

        placedCardBoxes.push({ x: baseX, y: baseY, width: cardW, height: cardH });
        sourceCardPos = { x: baseX, y: baseY };
      }

      // 6. Target Cardinality Placement (Strictly for actual multiplicity e.g. "1", "*", "0..*")
      let targetCardPos: { x: number; y: number } | null = null;
      if (edge.cardinalityTarget && isMultiplicity(edge.cardinalityTarget)) {
        const cardW = Math.max(24, edge.cardinalityTarget.length * 7.5 + 14);
        const cardH = 18;
        let baseX = tgt.x;
        let baseY = tgt.y;

        if (tgtPort === 'left') { baseX = tgt.x - 14 - cardW / 2; baseY = tgt.y - 12; }
        else if (tgtPort === 'right') { baseX = tgt.x + 14 + cardW / 2; baseY = tgt.y - 12; }
        else if (tgtPort === 'top') { baseX = tgt.x; baseY = tgt.y - 14 - cardH / 2; }
        else { baseX = tgt.x; baseY = tgt.y + 14 + cardH / 2; }

        if (collidesWithPlacedCards(baseX, baseY, cardW, cardH)) {
          const offsets = tgtPort === 'top'
            ? [
                { x: baseX, y: baseY - 24 },
                { x: baseX + cardW * 0.55, y: baseY },
                { x: baseX - cardW * 0.55, y: baseY },
                { x: baseX, y: baseY - 48 }
              ]
            : tgtPort === 'bottom'
            ? [
                { x: baseX, y: baseY + 24 },
                { x: baseX + cardW * 0.55, y: baseY },
                { x: baseX - cardW * 0.55, y: baseY },
                { x: baseX, y: baseY + 48 }
              ]
            : [
                { x: baseX, y: baseY - 20 },
                { x: baseX, y: baseY + 20 },
                { x: baseX - 24, y: baseY },
                { x: baseX + 24, y: baseY }
              ];

          for (const cand of offsets) {
            if (!collidesWithPlacedCards(cand.x, cand.y, cardW, cardH)) {
              baseX = cand.x;
              baseY = cand.y;
              break;
            }
          }
        }

        placedCardBoxes.push({ x: baseX, y: baseY, width: cardW, height: cardH });
        targetCardPos = { x: baseX, y: baseY };
      }

      // Sibling edges parallel offset & staggered along-fractions
      const siblingEdges = diagram.edges.filter(
        e => (e.source === edge.source && e.target === edge.target) || (e.source === edge.target && e.target === edge.source)
      );
      const siblingIndex = siblingEdges.findIndex(e => e.id === edge.id);
      const siblingCount = siblingEdges.length;

      let baseFrac = 0.5;
      if (siblingCount === 2) {
        baseFrac = siblingIndex === 0 ? 0.35 : 0.65;
      } else if (siblingCount > 2) {
        baseFrac = 0.2 + (siblingIndex / (siblingCount - 1)) * 0.6;
      }

      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = -dy / dist;
      const ny = dx / dist;
      const midX = (src.x + tgt.x) / 2;
      const midY = (src.y + tgt.y) / 2;

      // Extract main description and technology badge
      const rawLabel = edge.label || getFriendlyRelationLabel(edge.arrowType, edge.style);
      let mainDesc = rawLabel;
      let techNote: string | undefined = undefined;

      const bracketMatch = rawLabel.match(/^(.*?)\[(.*?)\]$/);
      if (bracketMatch) {
        mainDesc = bracketMatch[1].trim();
        techNote = bracketMatch[2].trim();
      } else if (edge.cardinalityTarget && !isMultiplicity(edge.cardinalityTarget)) {
        techNote = edge.cardinalityTarget.trim();
      }

      // Estimate realistic badge height and width based on text wrapping
      const lineEstimate = Math.max(1, Math.ceil(mainDesc.length / 26));
      const badgeW = mainDesc.length > 26 ? 220 : Math.max(68, mainDesc.length * 7.5 + 28);
      const badgeH = (lineEstimate * 16) + (techNote ? 28 : 16);
      const isHorizontal = Math.abs(dx) >= Math.abs(dy);

      let autoNormalShift = 0;
      if (siblingCount > 1 && !edge.labelOffset) {
        if (isHorizontal) {
          // Horizontal edge: nx = 0, ny = 1 (downward). Badges are ~badgeH tall.
          // Sibling 0 moves UP (-ny), Sibling 1 moves DOWN (+ny)
          if (siblingCount === 2) {
            autoNormalShift = siblingIndex === 0 ? -(badgeH / 2 + 16) : (badgeH / 2 + 16);
          } else {
            autoNormalShift = (siblingIndex % 2 === 1 ? 1 : -1) * Math.ceil(siblingIndex / 2) * 36;
          }
        } else {
          // Vertical edge: nx = -1 (leftward), ny = 0. Badges are ~badgeW wide.
          // Sibling 0 moves LEFT (+nx), Sibling 1 moves RIGHT (-nx)
          const sideShift = Math.max(126, badgeW / 2 + 24);
          if (siblingCount === 2) {
            autoNormalShift = siblingIndex === 0 ? sideShift : -sideShift;
          } else {
            autoNormalShift = (siblingIndex % 2 === 0 ? 1 : -1) * (sideShift + Math.floor(siblingIndex / 2) * 40);
          }
        }
      }

      // Default label position: shifted along perpendicular normal to flank edge
      let labelX = Math.max(badgeW / 2 + 12, midX + nx * autoNormalShift);
      let labelY = Math.max(badgeH / 2 + 12, midY + ny * autoNormalShift + (isHorizontal ? -12 : 0));

      if (isSelfLoop) {
        labelX = src.x + 36;
        labelY = tgt.y - 18;
      } else if (edge.labelOffset) {
        labelX = midX + edge.labelOffset.x;
        labelY = midY + edge.labelOffset.y;
      } else {
        // Anti-collision testing against ALL nodes, placed labels, and placed cardinality badges
        const testOverlap = (cx: number, cy: number, pad = 6) => {
          const left = cx - badgeW / 2 - pad;
          const right = cx + badgeW / 2 + pad;
          const top = cy - badgeH / 2 - pad;
          const bottom = cy + badgeH / 2 + pad;

          // 1. Check all nodes for bounding box collision (never overlap any node body)
          const hitNode = nodes.some(n => {
            return !(
              right <= n.x ||
              left >= n.x + n.width ||
              bottom <= n.y ||
              top >= n.y + n.height
            );
          });
          if (hitNode) return true;

          // 2. Check already placed edge labels
          const hitLabel = placedLabelBoxes.some(b => {
            const bLeft = b.x - b.width / 2 - pad;
            const bRight = b.x + b.width / 2 + pad;
            const bTop = b.y - b.height / 2 - pad;
            const bBottom = b.y + b.height / 2 + pad;
            return !(right <= bLeft || left >= bRight || bottom <= bTop || top >= bBottom);
          });
          if (hitLabel) return true;

          // 3. Check placed cardinality / tech badges
          const hitBadge = placedCardBoxes.some(b => {
            const bLeft = b.x - b.width / 2 - pad;
            const bRight = b.x + b.width / 2 + pad;
            const bTop = b.y - b.height / 2 - pad;
            const bBottom = b.y + b.height / 2 + pad;
            return !(right <= bLeft || left >= bRight || bottom <= bTop || top >= bBottom);
          });
          return hitBadge;
        };

        if (testOverlap(labelX, labelY)) {
          const step = isHorizontal ? badgeH + 20 : badgeW + 28;
          const normalDeltas = isHorizontal 
            ? [0, -step, step, -step * 1.5, step * 1.5] 
            : [0, step, -step, step * 1.5, -step * 1.5];
          const alongFractions = [0.5, 0.35, 0.65, 0.2, 0.8];
          let bestCandidate: { x: number; y: number } | null = null;
          let bestPenalty = Infinity;

          for (const frac of alongFractions) {
            const bx = src.x + dx * frac;
            const by = src.y + dy * frac;
            for (const norm of normalDeltas) {
              const cx = Math.max(badgeW / 2 + 12, bx + nx * (norm + autoNormalShift));
              const cy = Math.max(badgeH / 2 + 12, by + ny * (norm + autoNormalShift) + (isHorizontal ? -12 : 0));
              if (!testOverlap(cx, cy)) {
                const penalty = Math.hypot(cx - midX, cy - midY);
                if (penalty < bestPenalty) {
                  bestPenalty = penalty;
                  bestCandidate = { x: cx, y: cy };
                }
              }
            }
          }

          if (bestCandidate) {
            labelX = bestCandidate.x;
            labelY = bestCandidate.y;
          }
        }
      }

      placedLabelBoxes.push({ x: labelX, y: labelY, width: badgeW, height: badgeH });

      const lineAnchor = { x: midX, y: midY };
      const distFromAnchor = Math.hypot(labelX - midX, labelY - midY);
      const needsLeaderLine = !isSelfLoop && distFromAnchor > 16;

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
        lineAnchor,
        needsLeaderLine,
        badgeW,
        badgeH,
        mainDesc,
        techNote
      };
    });
  }, [diagram.edges, diagram.nodes, diagram.settings]);

  const isDark = Boolean(
    diagram.settings?.monochromeReverse ||
    diagram.settings?.theme === 'cyborg' ||
    diagram.settings?.theme === 'black-knight' ||
    diagram.settings?.theme === 'dark' ||
    (diagram.settings?.backgroundColor && ['#000000', '#121212', '#1a1a1a', '#0f172a', '#18181b', '#181412'].includes(diagram.settings.backgroundColor.toLowerCase()))
  );

  const defaultArrowColor = diagram.settings?.arrowColor || (isDark ? '#e2e8f0' : '#A80036');
  const markerStroke = defaultArrowColor;
  const markerFill = defaultArrowColor;
  const markerHollowFill = isDark ? '#181412' : (isPlainWhite ? '#ffffff' : '#faf5ee');
  const canvasBg = isDark ? '#181412' : (isPlainWhite ? '#ffffff' : '#faf5ee');
  const brickColor = isDark ? 'rgba(255, 255, 255, 0.04)' : (isPlainWhite ? 'transparent' : 'rgba(194, 101, 42, 0.04)');

  const canvasCursor = isSpacePressed 
    ? (isPanning ? 'cursor-grabbing' : 'cursor-grab')
    : isPanning
    ? 'cursor-grabbing'
    : marquee
    ? 'cursor-crosshair'
    : 'cursor-default';

  return (
    <div
      ref={containerRef}
      id="diagram-canvas-root"
      className={`relative w-full h-full overflow-hidden canvas-bg ${canvasCursor}`}
      style={{
        backgroundColor: canvasBg,
        backgroundImage: isPlainWhite ? 'none' : `
          linear-gradient(335deg, ${brickColor} ${23 * viewport.zoom}px, transparent ${23 * viewport.zoom}px),
          linear-gradient(155deg, ${brickColor} ${23 * viewport.zoom}px, transparent ${23 * viewport.zoom}px),
          linear-gradient(335deg, ${brickColor} ${23 * viewport.zoom}px, transparent ${23 * viewport.zoom}px),
          linear-gradient(155deg, ${brickColor} ${23 * viewport.zoom}px, transparent ${23 * viewport.zoom}px)
        `,
        backgroundSize: `${58 * viewport.zoom}px ${58 * viewport.zoom}px`,
        backgroundPosition: `${0 * viewport.zoom + viewport.x}px ${2 * viewport.zoom + viewport.y}px, ${4 * viewport.zoom + viewport.x}px ${35 * viewport.zoom + viewport.y}px, ${29 * viewport.zoom + viewport.x}px ${31 * viewport.zoom + viewport.y}px, ${34 * viewport.zoom + viewport.x}px ${6 * viewport.zoom + viewport.y}px`
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
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
        <svg 
          className="absolute top-0 left-0 w-[5000px] h-[5000px] overflow-visible pointer-events-none z-[8]"
          style={{ zIndex: 8 }}
        >
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
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={markerFill} />
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
              <path d="M 9 1.5 L 0 5 L 9 8.5 z" fill={markerFill} />
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
              <polygon points="0,1 11,6 0,11" fill={markerHollowFill} stroke={markerStroke} strokeWidth="1.5" />
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
              <polygon points="1,6 8,1 15,6 8,11" fill={markerFill} stroke={markerStroke} strokeWidth="1" />
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
              <polygon points="1,6 8,1 15,6 8,11" fill={markerHollowFill} stroke={markerStroke} strokeWidth="1.5" />
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
              <polyline points="2,1 10,6 2,11" fill="none" stroke={markerStroke} strokeWidth="1.8" />
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
              <line x1="4" y1="2" x2="4" y2="14" stroke={markerStroke} strokeWidth="1.8" />
              <line x1="4" y1="8" x2="18" y2="1" stroke={markerStroke} strokeWidth="1.8" />
              <line x1="4" y1="8" x2="18" y2="8" stroke={markerStroke} strokeWidth="1.8" />
              <line x1="4" y1="8" x2="18" y2="15" stroke={markerStroke} strokeWidth="1.8" />
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
              <circle cx="5" cy="8" r="3.5" fill={markerHollowFill} stroke={markerStroke} strokeWidth="1.6" />
              <line x1="10" y1="8" x2="22" y2="1" stroke={markerStroke} strokeWidth="1.8" />
              <line x1="10" y1="8" x2="22" y2="8" stroke={markerStroke} strokeWidth="1.8" />
              <line x1="10" y1="8" x2="22" y2="15" stroke={markerStroke} strokeWidth="1.8" />
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
              <line x1="6" y1="2" x2="6" y2="14" stroke={markerStroke} strokeWidth="1.8" />
              <line x1="11" y1="2" x2="11" y2="14" stroke={markerStroke} strokeWidth="1.8" />
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
              <circle cx="5" cy="8" r="3.5" fill={markerHollowFill} stroke={markerStroke} strokeWidth="1.6" />
              <line x1="13" y1="2" x2="13" y2="14" stroke={markerStroke} strokeWidth="1.8" />
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
              <line x1="6" y1="2" x2="6" y2="14" stroke={markerStroke} strokeWidth="1.8" />
              <line x1="11" y1="2" x2="11" y2="14" stroke={markerStroke} strokeWidth="1.8" />
            </marker>

            {/* Crow's Foot: Source One or Many (}| start) */}
            <marker
              id="crows-foot-many-start"
              viewBox="0 0 20 16"
              refX="2"
              refY="8"
              markerWidth="16"
              markerHeight="14"
              orient="auto"
            >
              <line x1="16" y1="2" x2="16" y2="14" stroke={markerStroke} strokeWidth="1.8" />
              <line x1="16" y1="8" x2="2" y2="1" stroke={markerStroke} strokeWidth="1.8" />
              <line x1="16" y1="8" x2="2" y2="8" stroke={markerStroke} strokeWidth="1.8" />
              <line x1="16" y1="8" x2="2" y2="15" stroke={markerStroke} strokeWidth="1.8" />
            </marker>

            {/* Crow's Foot: Source Zero or Many (}o start) */}
            <marker
              id="crows-foot-zero-many-start"
              viewBox="0 0 24 16"
              refX="2"
              refY="8"
              markerWidth="18"
              markerHeight="14"
              orient="auto"
            >
              <circle cx="19" cy="8" r="3.5" fill={markerHollowFill} stroke={markerStroke} strokeWidth="1.6" />
              <line x1="14" y1="8" x2="2" y2="1" stroke={markerStroke} strokeWidth="1.8" />
              <line x1="14" y1="8" x2="2" y2="8" stroke={markerStroke} strokeWidth="1.8" />
              <line x1="14" y1="8" x2="2" y2="15" stroke={markerStroke} strokeWidth="1.8" />
            </marker>

            {/* Crow's Foot: Source Zero or One (|o start) */}
            <marker
              id="crows-foot-zero-one-start"
              viewBox="0 0 20 16"
              refX="2"
              refY="8"
              markerWidth="15"
              markerHeight="14"
              orient="auto"
            >
              <circle cx="15" cy="8" r="3.5" fill={markerHollowFill} stroke={markerStroke} strokeWidth="1.6" />
              <line x1="7" y1="2" x2="7" y2="14" stroke={markerStroke} strokeWidth="1.8" />
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
              <polygon points="0,1 11,6 0,11" fill={markerHollowFill} stroke={markerStroke} strokeWidth="1.5" />
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
              <path d="M 4 2 A 6 6 0 0 1 4 14" fill="none" stroke={markerStroke} strokeWidth="1.8" />
              <circle cx="9" cy="8" r="3" fill={markerFill} />
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
              <circle cx="7" cy="7" r="4.5" fill={markerHollowFill} stroke={markerStroke} strokeWidth="1.8" />
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
              <circle cx="8" cy="8" r="5" fill={markerHollowFill} stroke={markerStroke} strokeWidth="1.5" />
              <line x1="8" y1="5" x2="8" y2="11" stroke={markerStroke} strokeWidth="1.5" />
              <line x1="5" y1="8" x2="11" y2="8" stroke={markerStroke} strokeWidth="1.5" />
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

          {/* Render Sequence Blocks (alt, opt, loop, par) */}
          {sequenceMetrics && sequenceBlocks.map((block, bIdx) => {
            const isDraggingThis = draggingBlock?.id === block.id;
            let effectiveStart = block.startOrder;
            let effectiveEnd = block.endOrder;

            if (isDraggingThis && draggingBlock) {
              if (draggingBlock.mode === 'move') {
                const span = draggingBlock.initialEndOrder - draggingBlock.initialStartOrder;
                effectiveStart = Math.max(1, Math.min(sequenceMessages.length - span, draggingBlock.initialStartOrder + draggingBlock.dragSteps));
                effectiveEnd = Math.max(effectiveStart, effectiveStart + span);
              } else if (draggingBlock.mode === 'resize-bottom') {
                effectiveEnd = Math.max(block.startOrder, draggingBlock.initialEndOrder + draggingBlock.dragSteps);
              }
            }

            const bTop = sequenceMetrics.topY + (effectiveStart - 0.7) * sequenceMetrics.stepSpacing;
            const bBottom = sequenceMetrics.topY + (effectiveEnd + 0.4) * sequenceMetrics.stepSpacing;
            const bHeight = Math.max(50, bBottom - bTop);

            const blockMsgs = sequenceMessages.filter(m => (m.order || 0) >= effectiveStart && (m.order || 0) <= effectiveEnd);
            const involvedIds = new Set<string>();
            blockMsgs.forEach(m => { involvedIds.add(m.from); involvedIds.add(m.to); });
            const involvedParts = sequenceParticipants.filter(p => involvedIds.has(p.id));
            const targetParts = involvedParts.length > 0 ? involvedParts : sequenceParticipants;

            const minX = Math.min(...targetParts.map(p => p.x)) - 30;
            const maxX = Math.max(...targetParts.map(p => p.x + p.width)) + 30;
            const bWidth = Math.max(220, maxX - minX);

            const isBlockSelected = selectedBlockId === block.id;

            return (
              <g key={block.id || `seq-block-${bIdx}`}>
                <rect
                  x={minX}
                  y={bTop}
                  width={bWidth}
                  height={bHeight}
                  fill="#ffffff"
                  fillOpacity="0.5"
                  stroke="#c2652a"
                  strokeWidth={isBlockSelected || isDraggingThis ? "2.5" : "1.2"}
                  strokeDasharray={block.type === 'par' ? '4,4' : undefined}
                  rx="6"
                  style={{ pointerEvents: 'none' }}
                />
                {/* Drag Handle Tab Header */}
                <g
                  className="pointer-events-auto cursor-grab active:cursor-grabbing select-none"
                  data-drag-handle="true"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    selectBlock(block);
                    setDraggingBlock({
                      id: block.id,
                      startY: e.clientY,
                      initialStartOrder: block.startOrder,
                      initialEndOrder: block.endOrder,
                      mode: 'move',
                      dragSteps: 0
                    });
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    selectBlock(block);
                  }}
                >
                  <path
                    d={`M ${minX} ${bTop} H ${minX + 75} L ${minX + 85} ${bTop + 22} H ${minX} Z`}
                    fill={isBlockSelected || isDraggingThis ? '#fbeee2' : '#f4ebe1'}
                    stroke="#c2652a"
                    strokeWidth={isBlockSelected || isDraggingThis ? "2" : "1.2"}
                  />
                  <text
                    x={minX + 8}
                    y={bTop + 15}
                    fontSize="11"
                    fontWeight="bold"
                    fill={isBlockSelected || isDraggingThis ? '#c2652a' : '#92400e'}
                    className="select-none font-mono"
                  >
                    {block.type.toUpperCase()}
                  </text>
                  {block.condition && (
                    <text
                      x={minX + 92}
                      y={bTop + 15}
                      fontSize="11"
                      fontWeight="500"
                      fill={isBlockSelected || isDraggingThis ? '#c2652a' : '#5a4e44'}
                      className="select-none font-mono"
                    >
                      [{block.condition}]
                    </text>
                  )}
                </g>

                {/* Bottom Resize Handle for Sequence Block */}
                <line
                  x1={minX + 8}
                  y1={bTop + bHeight}
                  x2={minX + bWidth - 8}
                  y2={bTop + bHeight}
                  stroke="transparent"
                  strokeWidth="12"
                  className="pointer-events-auto cursor-ns-resize"
                  data-drag-handle="true"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    selectBlock(block);
                    setDraggingBlock({
                      id: block.id,
                      startY: e.clientY,
                      initialStartOrder: block.startOrder,
                      initialEndOrder: block.endOrder,
                      mode: 'resize-bottom',
                      dragSteps: 0
                    });
                  }}
                />
              </g>
            );
          })}

          {/* Render Sequence Lifelines */}
          {sequenceMetrics && sequenceParticipants.map(part => {
            const centerX = part.x + part.width / 2;
            const topY = part.y + part.height;
            const bottomY = sequenceMetrics.lifelineBottom;
            const isPartSelected = selectedNodeIds.includes(part.id) || selectedNodeId === part.id;

            return (
              <g key={`seq-lifeline-${part.id}`}>
                {/* Dashed lifeline */}
                <line
                  x1={centerX}
                  y1={topY}
                  x2={centerX}
                  y2={bottomY}
                  stroke={diagram.settings?.arrowColor || '#A80036'}
                  strokeWidth="1.6"
                  strokeDasharray="5,5"
                  opacity="0.75"
                  className="pointer-events-none"
                />
                {/* Interactive Lifeline Drag Handle: allows dragging lifeline left and right from anywhere along its height */}
                <line
                  x1={centerX}
                  y1={topY}
                  x2={centerX}
                  y2={bottomY}
                  stroke="transparent"
                  strokeWidth="24"
                  className="pointer-events-auto cursor-col-resize select-none"
                  data-drag-handle="true"
                  data-lifeline-id={part.id}
                  title={`Drag lifeline '${part.label}' left or right`}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleNodeMouseDown(part, e);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const isMulti = e.shiftKey || e.ctrlKey || e.metaKey;
                    if (!isMulti) selectNode(part, false);
                  }}
                />
                {/* Interactive bottom participant footer box */}
                {!diagram.settings?.hideFootbox && (
                  <g 
                    transform={`translate(${part.x}, ${bottomY})`}
                    className="pointer-events-auto cursor-move select-none"
                    data-drag-handle="true"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleNodeMouseDown(part, e);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const isMulti = e.shiftKey || e.ctrlKey || e.metaKey;
                      if (!isMulti) selectNode(part, false);
                    }}
                  >
                    <rect
                      width={part.width}
                      height={36}
                      rx={6}
                      fill={isPartSelected ? "#fef7ee" : "#ffffff"}
                      stroke={isPartSelected ? '#c2652a' : (diagram.settings?.arrowColor || '#A80036')}
                      strokeWidth={isPartSelected ? 2.5 : 1.5}
                      className="shadow-xs"
                    />
                    <text
                      x={part.width / 2}
                      y={22}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="600"
                      fill={isPartSelected ? '#c2652a' : '#2b2622'}
                      className="select-none font-sans"
                    >
                      {part.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Target insertion guide line when reordering sequence message */}
          {draggingMessage && sequenceMetrics && (() => {
            const guideY = sequenceMetrics.topY + draggingMessage.currentOrder * sequenceMetrics.stepSpacing;
            const minX = Math.min(...sequenceParticipants.map(p => p.x)) - 30;
            const maxX = Math.max(...sequenceParticipants.map(p => p.x + p.width)) + 30;
            return (
              <g className="pointer-events-none z-30">
                <line
                  x1={minX}
                  y1={guideY}
                  x2={maxX}
                  y2={guideY}
                  stroke="#c2652a"
                  strokeWidth="2.5"
                  strokeDasharray="6,4"
                  opacity="0.9"
                />
                <circle cx={minX} cy={guideY} r="5" fill="#c2652a" />
                <circle cx={maxX} cy={guideY} r="5" fill="#c2652a" />
              </g>
            );
          })()}

          {/* Render Sequence Timeline Messages */}
          {sequenceMetrics && sequenceMessages.map((msg, mIdx) => {
            const order = msg.order || (mIdx + 1);
            const isDraggingThis = draggingMessage?.id === msg.id;
            const msgY = sequenceMetrics.topY + order * sequenceMetrics.stepSpacing + (isDraggingThis ? draggingMessage.dragY : 0);
            
            const currentFrom = isDraggingThis && draggingMessage.shiftFromId ? draggingMessage.shiftFromId : msg.from;
            const currentTo = isDraggingThis && draggingMessage.shiftToId ? draggingMessage.shiftToId : msg.to;
            const srcNode = nodes.find(n => n.id === currentFrom);
            const tgtNode = nodes.find(n => n.id === currentTo);

            let srcX = srcNode ? srcNode.x + srcNode.width / 2 : 100;
            let tgtX = tgtNode ? tgtNode.x + tgtNode.width / 2 : 300;

            if (isDraggingThis && draggingMessage.endpoint === 'from') {
              srcX += draggingMessage.dragX;
            }
            if (isDraggingThis && draggingMessage.endpoint === 'to') {
              tgtX += draggingMessage.dragX;
            }

            const isSelf = currentFrom === currentTo || Math.abs(srcX - tgtX) < 5;
            const isReply = msg.type === 'reply' || msg.isReturn;
            const isAsync = msg.type === 'async';
            const isSelected = selectedEdgeId === msg.id;

            const strokeColor = (isSelected || isDraggingThis) ? '#c2652a' : (isReply ? '#64748b' : (isAsync ? '#d97706' : '#A80036'));
            const strokeWidth = (isSelected || isDraggingThis) ? 2.5 : 1.8;
            const dashArray = isReply ? '5,4' : undefined;

            const labelOffsetX = (isDraggingThis && !draggingMessage.endpoint)
              ? ((msg.labelOffset?.x || 0) + draggingMessage.dragX)
              : (msg.labelOffset?.x || 0);

            let pathD = '';
            let labelX = 0;
            let labelY = msgY - 7;

            if (isSelf) {
              pathD = `M ${srcX} ${msgY} H ${srcX + 42} V ${msgY + 24} H ${srcX}`;
              labelX = srcX + 48 + labelOffsetX;
              labelY = msgY + 16;
            } else {
              pathD = `M ${srcX} ${msgY} L ${tgtX} ${msgY}`;
              labelX = (srcX + tgtX) / 2 + labelOffsetX;
              labelY = msgY - 7;
            }

            const markerEnd = (isSelected || isDraggingThis) ? 'url(#arrow-head-selected)' : 'url(#arrow-head)';

            const handleMsgMouseDown = (e: React.MouseEvent, endpoint?: 'from' | 'to') => {
              e.stopPropagation();
              selectEdge({
                id: msg.id,
                source: msg.from,
                target: msg.to,
                label: msg.label,
                style: isReply ? 'dashed' : 'solid',
                arrowType: 'arrow'
              });
              setDraggingMessage({
                id: msg.id,
                startX: e.clientX,
                startY: e.clientY,
                initialOrder: order,
                currentOrder: order,
                dragX: 0,
                dragY: 0,
                initialLabelOffsetX: msg.labelOffset?.x || 0,
                endpoint
              });
            };

            return (
              <g key={msg.id || `seq-msg-${mIdx}`} className="pointer-events-auto cursor-grab active:cursor-grabbing group">
                {/* Thick invisible path for easy clicking & dragging */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="24"
                  data-drag-handle="true"
                  title="Drag arrow to reorder vertically or shift left/right across lifelines"
                  onMouseDown={(e) => handleMsgMouseDown(e)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEdgeLabelText(msg.label || '');
                    setEditingEdgeId(msg.id);
                  }}
                />
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={dashArray}
                  markerEnd={markerEnd}
                  opacity={isDraggingThis ? 0.85 : 1}
                />
                {!isSelf && (
                  <rect
                    x={tgtX - 5}
                    y={msgY - 6}
                    width={10}
                    height={28}
                    fill="#ffffff"
                    stroke={strokeColor}
                    strokeWidth="1.2"
                    rx="1"
                    className="pointer-events-auto cursor-grab active:cursor-grabbing"
                    data-drag-handle="true"
                    title="Activation Box"
                    onMouseDown={(e) => handleMsgMouseDown(e)}
                  />
                )}

                {/* Left/Right Reconnection Endpoint Handles */}
                <circle
                  cx={srcX}
                  cy={msgY}
                  r="5"
                  fill={isDraggingThis && draggingMessage.endpoint === 'from' ? "#c2652a" : "#ffffff"}
                  stroke={strokeColor}
                  strokeWidth="2"
                  className="pointer-events-auto cursor-ew-resize hover:fill-amber-400 transition-colors shadow-xs"
                  data-drag-handle="true"
                  title="Drag endpoint left/right to reconnect source lifeline"
                  onMouseDown={(e) => handleMsgMouseDown(e, 'from')}
                />
                <circle
                  cx={tgtX}
                  cy={msgY}
                  r="5"
                  fill={isDraggingThis && draggingMessage.endpoint === 'to' ? "#c2652a" : "#ffffff"}
                  stroke={strokeColor}
                  strokeWidth="2"
                  className="pointer-events-auto cursor-ew-resize hover:fill-amber-400 transition-colors shadow-xs"
                  data-drag-handle="true"
                  title="Drag endpoint left/right to reconnect target lifeline"
                  onMouseDown={(e) => handleMsgMouseDown(e, 'to')}
                />

                {/* Message Label with background badge (draggable left/right & up/down) */}
                <g
                  transform={`translate(${labelX}, ${labelY})`}
                  className="cursor-grab active:cursor-grabbing select-none"
                  data-drag-handle="true"
                  title="Drag label left/right to reposition, or up/down to reorder step"
                  onMouseDown={(e) => handleMsgMouseDown(e)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEdgeLabelText(msg.label || '');
                    setEditingEdgeId(msg.id);
                  }}
                >
                  <rect
                    x={isSelf ? -4 : -(Math.max(44, (msg.label?.length || 0) * 7.2 + 24) / 2)}
                    y={-14}
                    width={Math.max(44, (msg.label?.length || 0) * 7.2 + 24)}
                    height={18}
                    rx={4}
                    fill="#faf5ee"
                    fillOpacity="0.95"
                    stroke={isSelected || isDraggingThis ? '#c2652a' : '#d8d0c8'}
                    strokeWidth={isSelected || isDraggingThis ? 1.5 : 0.8}
                    className="shadow-xs"
                  />
                  <text
                    x={isSelf ? 8 : 0}
                    y={-1}
                    textAnchor={isSelf ? 'start' : 'middle'}
                    fontSize="11"
                    fontWeight="500"
                    fill={isSelected || isDraggingThis ? '#c2652a' : '#2b2622'}
                    className="select-none font-sans"
                  >
                    {diagram.settings?.autonumberFormat !== 'disabled' ? `${order}. ` : ''}{msg.label}
                  </text>
                </g>
              </g>
            );
          })}

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
                  stroke={isSelected ? '#c2652a' : (edge.color || defaultArrowColor)}
                  strokeWidth={isSelected ? 2.5 : 1.8}
                  strokeDasharray={edge.style === 'dashed' ? '6,4' : edge.style === 'dotted' ? '2,4' : undefined}
                  markerStart={getMarkerStart(edge.arrowType, isSelected, edge)}
                  markerEnd={getMarkerEnd(edge.arrowType, isSelected, edge)}
                />
              </g>
            );
          })}

          {/* Leader Tether Lines for offset edge labels */}
          {computedEdges.map(({ edge, labelPos, lineAnchor, needsLeaderLine }) => {
            if (!needsLeaderLine) return null;
            const isSelected = selectedEdgeId === edge.id;
            const strokeColor = isSelected ? '#c2652a' : (edge.color || defaultArrowColor);

            return (
              <g key={`leader-${edge.id}`} className="pointer-events-none opacity-60 transition-opacity">
                {/* Anchor dot on the edge line */}
                <circle cx={lineAnchor.x} cy={lineAnchor.y} r="2.5" fill={strokeColor} />
                {/* Dashed tether line linking edge midpoint to label */}
                <line
                  x1={lineAnchor.x}
                  y1={lineAnchor.y}
                  x2={labelPos.x}
                  y2={labelPos.y}
                  stroke={strokeColor}
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
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

          {/* Draw.io Marquee Rubberband Selection Rectangle */}
          {marquee && (() => {
            const mX = Math.min(marquee.startX, marquee.currentX);
            const mY = Math.min(marquee.startY, marquee.currentY);
            const mW = Math.abs(marquee.currentX - marquee.startX);
            const mH = Math.abs(marquee.currentY - marquee.startY);
            return (
              <rect
                x={mX}
                y={mY}
                width={mW}
                height={mH}
                fill="rgba(194, 101, 42, 0.08)"
                stroke="#c2652a"
                strokeWidth="1.5"
                strokeDasharray="4,3"
                rx="2"
                className="pointer-events-none"
              />
            );
          })()}
        </svg>

        {/* HTML Nodes Layer */}
        <div className="absolute top-0 left-0 pointer-events-auto">
          {nodes.map(node => (
            <div
              key={node.id}
              data-node-id={node.id}
              onMouseDown={(e) => handleNodeMouseDown(node, e)}
            >
              <DiagramNodeView
                node={node}
                isSelected={selectedNodeId === node.id || selectedNodeIds.includes(node.id)}
                isDropTarget={hoveredDropTargetId === node.id}
                onSelect={(e) => {
                  e.stopPropagation();
                  const isMulti = e.shiftKey || e.ctrlKey || e.metaKey;
                  if (!isMulti) {
                    selectNode(node, false);
                  }
                }}
                onUpdate={(patch) => {
                  onUpdateNodes(nodes.map(n => n.id === node.id ? { ...n, ...patch } : n));
                }}
                onStartConnection={handleStartConnection}
                onQuickAddChild={(id, port) => {
                  const targetNode = nodes.find(n => n.id === id);
                  if (!targetNode) return;
                  setSelectedNodeId(id);
                  setSelectedEdgeId(null);

                  let branchDir: 'right' | 'down' | 'left' | 'up' = 'right';
                  let popupX = targetNode.x + targetNode.width + 16;
                  let popupY = targetNode.y;

                  if (port === 'top') {
                    branchDir = 'up';
                    popupX = targetNode.x + targetNode.width / 2 - 144;
                    popupY = targetNode.y - 240;
                  } else if (port === 'bottom') {
                    branchDir = 'down';
                    popupX = targetNode.x + targetNode.width / 2 - 144;
                    popupY = targetNode.y + targetNode.height + 16;
                  } else if (port === 'left') {
                    branchDir = 'left';
                    popupX = targetNode.x - 304;
                    popupY = targetNode.y;
                  } else {
                    branchDir = 'right';
                    popupX = targetNode.x + targetNode.width + 16;
                    popupY = targetNode.y;
                  }

                  setQuickBranchPopup({
                    sourceNodeId: id,
                    x: Math.max(10, popupX),
                    y: Math.max(10, popupY),
                    direction: branchDir
                  });
                }}
                onStartResize={handleStartResize}
              />
            </div>
          ))}

          {/* Floating Quick Action Bar for selected node - hidden when multiple nodes are selected */}
          {selectedNode && selectedNodeIds.length <= 1 && (
            <QuickActionBar
              x={selectedNode.x + selectedNode.width / 2}
              y={selectedNode.y - 8}
              node={selectedNode}
              allNodes={nodes}
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

          {/* Floating Quick Branch Popup from connector circle double click */}
          {quickBranchPopup && (() => {
            const src = nodes.find(n => n.id === quickBranchPopup.sourceNodeId);
            if (!src) return null;
            return (
              <QuickBranchPopup
                sourceNode={src}
                x={quickBranchPopup.x}
                y={quickBranchPopup.y}
                initialDirection={quickBranchPopup.direction}
                onBranch={(dir, opts) => handleAddConnectedNode(dir, src.id, opts)}
                onClose={() => setQuickBranchPopup(null)}
              />
            );
          })()}

          {/* Floating Relationship Toolbar for selected edge */}
          {selectedEdge && (() => {
            const isSeqMsg = Boolean((selectedEdge as any).data?.isSequenceMessage) || diagram.messages?.some(m => m.id === selectedEdge.id);
            const msgObj = diagram.messages?.find(m => m.id === selectedEdge.id);

            const srcNode = nodes.find(n => n.id === selectedEdge.source);
            const tgtNode = nodes.find(n => n.id === selectedEdge.target);
            const { srcPort, tgtPort } = srcNode && tgtNode 
              ? getOptimalPorts(srcNode, tgtNode, selectedEdge.sourceHandle, selectedEdge.targetHandle)
              : { srcPort: selectedEdge.sourceHandle || 'right', tgtPort: selectedEdge.targetHandle || 'left' };
            const src = getPortCoord(selectedEdge.source, srcPort);
            const tgt = getPortCoord(selectedEdge.target, tgtPort);
            let midX = (src.x + tgt.x) / 2;
            let midY = (src.y + tgt.y) / 2;

            if (isSeqMsg && msgObj && sequenceMetrics) {
              const order = msgObj.order || 1;
              const msgY = sequenceMetrics.topY + order * sequenceMetrics.stepSpacing;
              const sX = srcNode ? srcNode.x + srcNode.width / 2 : 100;
              const tX = tgtNode ? tgtNode.x + tgtNode.width / 2 : 300;
              midX = (sX + tX) / 2;
              midY = msgY - 28;
            }

            return (
              <EdgeToolbar
                edge={selectedEdge}
                nodes={nodes}
                sourceNodeLabel={srcNode?.label}
                targetNodeLabel={tgtNode?.label}
                position={{ x: midX, y: midY }}
                onUpdateEdge={(updated) => {
                  if (isSeqMsg && diagram.messages) {
                    const nextMsgs = diagram.messages.map(m => {
                      if (m.id !== selectedEdge.id) return m;
                      const nextType = updated.style === 'dashed' ? 'reply' : m.type;
                      return {
                        ...m,
                        label: updated.label !== undefined ? updated.label : m.label,
                        type: nextType
                      };
                    });
                    onUpdateDiagram?.({ messages: nextMsgs });
                  } else {
                    onUpdateEdges(diagram.edges.map(e => e.id === selectedEdge.id ? { ...e, ...updated } : e));
                  }
                }}
                onDeleteEdge={() => {
                  if (isSeqMsg && diagram.messages) {
                    const nextMsgs = diagram.messages.filter(m => m.id !== selectedEdge.id);
                    onUpdateDiagram?.({ messages: nextMsgs });
                    setSelectedEdgeId(null);
                  } else {
                    onUpdateEdges(diagram.edges.filter(e => e.id !== selectedEdge.id));
                    setSelectedEdgeId(null);
                  }
                }}
                onClose={() => setSelectedEdgeId(null)}
              />
            );
          })()}

          {/* Floating Toolbar for selected Sequence Block */}
          {selectedBlock && sequenceMetrics && (() => {
            const bTop = sequenceMetrics.topY + (selectedBlock.startOrder - 0.7) * sequenceMetrics.stepSpacing;
            const blockMsgs = sequenceMessages.filter(m => (m.order || 0) >= selectedBlock.startOrder && (m.order || 0) <= selectedBlock.endOrder);
            const involvedIds = new Set<string>();
            blockMsgs.forEach(m => { involvedIds.add(m.from); involvedIds.add(m.to); });
            const involvedParts = sequenceParticipants.filter(p => involvedIds.has(p.id));
            const targetParts = involvedParts.length > 0 ? involvedParts : sequenceParticipants;
            const minX = Math.min(...targetParts.map(p => p.x)) - 30;

            return (
              <div
                className="absolute z-30 flex items-center gap-2 px-2.5 py-1.5 bg-white dark:bg-[#1f1d1a] border border-[#c2652a] rounded-lg shadow-lg pointer-events-auto"
                style={{
                  left: `${minX}px`,
                  top: `${bTop - 36}px`
                }}
              >
                <span className="text-xs font-mono font-bold text-[#c2652a] uppercase">
                  {selectedBlock.type}
                </span>
                {selectedBlock.condition && (
                  <span className="text-xs text-gray-700 dark:text-gray-300 font-mono font-medium">
                    [{selectedBlock.condition}]
                  </span>
                )}
                <div className="w-px h-3.5 bg-gray-200 dark:bg-gray-700 mx-0.5" />
                <button
                  type="button"
                  title="Delete Block"
                  onClick={() => {
                    if (diagram.blocks) {
                      onUpdateDiagram?.({
                        blocks: diagram.blocks.filter(b => b.id !== selectedBlock.id)
                      });
                    }
                    setSelectedBlockId(null);
                  }}
                  className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 rounded transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Deselect"
                  onClick={() => setSelectedBlockId(null)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 rounded transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })()}

        </div>

        {/* HTML Overlay for Edge Multiplicity & Labels (Z-20: Always floats cleanly above nodes) */}
        <div className="absolute top-0 left-0 w-[5000px] h-[5000px] pointer-events-none z-20">
          {computedEdges.map(({ edge, sourceCardPos, targetCardPos, labelPos, mainDesc, techNote }) => {
            const isSelected = selectedEdgeId === edge.id;
            const isEditing = editingEdgeId === edge.id;

            return (
              <React.Fragment key={`edge-overlay-${edge.id}`}>
                {/* Source Cardinality (e.g. "1", "0..*") */}
                {edge.cardinalitySource && sourceCardPos && isMultiplicity(edge.cardinalitySource) && (
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-20"
                    style={{ left: `${sourceCardPos.x}px`, top: `${sourceCardPos.y}px` }}
                  >
                    <span 
                      className="text-[10px] font-mono font-bold px-1 py-0.2 rounded shadow-2xs"
                      style={{
                        color: isDark ? '#f4f4f5' : (edge.color || defaultArrowColor),
                        backgroundColor: isDark ? '#1e1e24' : '#ffffff',
                        border: `1px solid ${isDark ? '#3f3f46' : 'rgba(168,0,54,0.3)'}`
                      }}
                    >
                      {edge.cardinalitySource}
                    </span>
                  </div>
                )}

                {/* Target Cardinality (Strictly actual multiplicity e.g. "*", "1..*", "0..*") */}
                {edge.cardinalityTarget && targetCardPos && isMultiplicity(edge.cardinalityTarget) && (
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-20"
                    style={{ left: `${targetCardPos.x}px`, top: `${targetCardPos.y}px` }}
                  >
                    <span 
                      className="text-[10px] font-mono font-bold px-1 py-0.2 rounded shadow-2xs"
                      style={{
                        color: isDark ? '#f4f4f5' : (edge.color || defaultArrowColor),
                        backgroundColor: isDark ? '#1e1e24' : '#ffffff',
                        border: `1px solid ${isDark ? '#3f3f46' : 'rgba(168,0,54,0.3)'}`
                      }}
                    >
                      {edge.cardinalityTarget}
                    </span>
                  </div>
                )}

                {/* Edge Label Card - Linked, Draggable, Structured, Zero Collision */}
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
                      className={`text-[11px] font-semibold text-center rounded-lg px-2.5 py-1 outline-none shadow-md min-w-[110px] border-2 border-[#c2652a] ${
                        isDark ? 'bg-[#1e1e24] text-[#f4f4f5]' : 'bg-white text-[#1c1917]'
                      }`}
                    />
                  ) : (
                    <div
                      onMouseDown={(e) => handleStartDragLabel(edge, e)}
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
                      className={`group/badge flex flex-col items-center justify-center max-w-[220px] px-2.5 py-1 rounded-lg border shadow-xs transition-all select-none cursor-grab active:cursor-grabbing backdrop-blur-xs ${
                        isSelected 
                          ? (isDark ? 'bg-[#27272a] text-[#c2652a] border-[#c2652a] font-bold shadow-md ring-2 ring-[#c2652a]/30 scale-105 z-30' : 'bg-white text-[#c2652a] border-[#c2652a] font-bold shadow-md ring-2 ring-[#c2652a]/20 scale-105 z-30')
                          : (isDark ? 'bg-[#18181b]/95 text-[#f4f4f5] border-[#3f3f46] hover:border-[#c2652a] hover:bg-[#27272a]' : 'bg-white/95 text-[#2c2420] border-[#d8d0c8] hover:border-[#c2652a] hover:shadow-sm hover:bg-white')
                      }`}
                      title="Drag to reposition • Double-click to edit label • Click to configure"
                    >
                      <div className="flex items-center gap-1.5 text-center">
                        <span 
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: isSelected ? '#c2652a' : (edge.color || defaultArrowColor) }}
                        />
                        <span className={`text-[11px] font-medium leading-snug text-center break-words text-balance ${isDark ? 'text-[#f4f4f5]' : 'text-[#181818]'}`}>
                          {mainDesc}
                        </span>
                      </div>
                      {techNote && (
                        <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded mt-1 tracking-tight border ${
                          isDark ? 'bg-[#27272a] text-[#fbbf24] border-[#3f3f46]' : 'bg-[#f4ebe1] text-[#78350f] border-[#d8d0c8]/70'
                        }`}>
                          {techNote}
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

        <div className="w-[1px] h-4 bg-[#d8d0c8]/60 mx-0.5" />

        {/* Toggle Plain White Background */}
        <button
          id="btn-toggle-plain-white"
          onClick={handleTogglePlainWhite}
          className={`px-2 py-1 rounded-lg transition-colors flex items-center gap-1.5 text-xs ${
            isPlainWhite 
              ? 'bg-[#c2652a] text-white font-medium shadow-xs' 
              : 'text-[#78706a] hover:bg-[#faf5ee] hover:text-[#2b2622]'
          }`}
          title={isPlainWhite ? 'Canvas Background: Plain White (Click to switch to Warm Grid)' : 'Canvas Background: Warm Grid (Click to switch to Plain White)'}
        >
          <div className={`w-3.5 h-3.5 rounded-xs border transition-colors ${isPlainWhite ? 'border-white bg-white shadow-xs' : 'border-[#8f8377] bg-[#faf5ee]'}`} />
          <span className="font-mono text-[11px]">Plain White</span>
        </button>
      </aside>

      {/* Draw.io Control Scheme hint indicator */}
      <div className="absolute bottom-4 left-4 pointer-events-none text-[11px] text-[#78706a] dark:text-[#a19991] flex items-center gap-2 bg-[#faf5ee]/90 dark:bg-[#201d1a]/90 px-2.5 py-1.5 rounded-lg border border-[#d8d0c8]/60 dark:border-[#3f3a34] backdrop-blur-md shadow-xs">
        <Move className="w-3.5 h-3.5 text-[#c2652a]" />
        <span><strong className="font-semibold text-[#2b2622] dark:text-[#f4f4f5]">Right-drag / Space-drag:</strong> Pan</span>
        <span className="text-[#d8d0c8] dark:text-[#524941]">•</span>
        <span><strong className="font-semibold text-[#2b2622] dark:text-[#f4f4f5]">Left-drag:</strong> Select</span>
        <span className="text-[#d8d0c8] dark:text-[#524941]">•</span>
        <span><strong className="font-semibold text-[#2b2622] dark:text-[#f4f4f5]">Alt-drag:</strong> Duplicate</span>
        <span className="text-[#d8d0c8] dark:text-[#524941]">•</span>
        <span><strong className="font-semibold text-[#2b2622] dark:text-[#f4f4f5]">Ctrl+Wheel:</strong> Zoom</span>
      </div>

      {/* Draw.io Right-Click Context Menu */}
      {contextMenu && (
        <div
          id="drawio-context-menu"
          className="fixed z-50 min-w-[200px] bg-white dark:bg-[#1f1d1a] border border-[#d8d0c8] dark:border-[#3f3a34] rounded-xl shadow-2xl py-1 text-xs text-[#2b2622] dark:text-[#f4f4f5] select-none backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: `${Math.max(8, Math.min(contextMenu.x, window.innerWidth - 220))}px`,
            top: `${Math.max(8, Math.min(contextMenu.y, window.innerHeight - 340))}px`
          }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          {selectedNodeIds.length > 0 || selectedNodeId ? (
            <>
              <button
                type="button"
                onClick={() => { handleCutSelected(); setContextMenu(null); }}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#faf5ee] dark:hover:bg-[#2a2622] text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Scissors className="w-3.5 h-3.5 text-[#78706a]" />
                  <span>Cut</span>
                </span>
                <kbd className="font-mono text-[10px] text-[#78706a]/70">Ctrl+X</kbd>
              </button>

              <button
                type="button"
                onClick={() => { handleCopySelected(); setContextMenu(null); }}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#faf5ee] dark:hover:bg-[#2a2622] text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Copy className="w-3.5 h-3.5 text-[#78706a]" />
                  <span>Copy</span>
                </span>
                <kbd className="font-mono text-[10px] text-[#78706a]/70">Ctrl+C</kbd>
              </button>

              <button
                type="button"
                onClick={() => { handleDuplicateAllSelected(); setContextMenu(null); }}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#faf5ee] dark:hover:bg-[#2a2622] text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <CopyPlus className="w-3.5 h-3.5 text-[#78706a]" />
                  <span>Duplicate</span>
                </span>
                <kbd className="font-mono text-[10px] text-[#78706a]/70">Ctrl+D</kbd>
              </button>

              <button
                type="button"
                onClick={() => { handleDeleteSelected(); setContextMenu(null); }}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Delete</span>
                </span>
                <kbd className="font-mono text-[10px] text-red-600/70">Del</kbd>
              </button>

              <div className="my-1 border-t border-gray-100 dark:border-[#35302b]" />

              <button
                type="button"
                onClick={() => { handleBringToFront(); setContextMenu(null); }}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#faf5ee] dark:hover:bg-[#2a2622] text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <ArrowUp className="w-3.5 h-3.5 text-[#78706a]" />
                  <span>Bring to Front</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => { handleSendToBack(); setContextMenu(null); }}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#faf5ee] dark:hover:bg-[#2a2622] text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <ArrowDown className="w-3.5 h-3.5 text-[#78706a]" />
                  <span>Send to Back</span>
                </span>
              </button>

              <div className="my-1 border-t border-gray-100 dark:border-[#35302b]" />

              <button
                type="button"
                onClick={() => { handleWrapInPackage(); setContextMenu(null); }}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#faf5ee] dark:hover:bg-[#2a2622] text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Edit3 className="w-3.5 h-3.5 text-[#78706a]" />
                  <span>Wrap in Package</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => { handleWrapInFrame(); setContextMenu(null); }}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#faf5ee] dark:hover:bg-[#2a2622] text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Edit3 className="w-3.5 h-3.5 text-[#78706a]" />
                  <span>Wrap in Frame</span>
                </span>
              </button>

              <div className="my-1 border-t border-gray-100 dark:border-[#35302b]" />

              <button
                type="button"
                onClick={() => { handleSelectAll(); setContextMenu(null); }}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#faf5ee] dark:hover:bg-[#2a2622] text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <BoxSelect className="w-3.5 h-3.5 text-[#78706a]" />
                  <span>Select All</span>
                </span>
                <kbd className="font-mono text-[10px] text-[#78706a]/70">Ctrl+A</kbd>
              </button>

              <button
                type="button"
                onClick={() => { setIsInspectorOpen(true); setContextMenu(null); }}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#faf5ee] dark:hover:bg-[#2a2622] text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Edit3 className="w-3.5 h-3.5 text-[#78706a]" />
                  <span>Inspect Properties</span>
                </span>
              </button>
            </>
          ) : (
            <>
              {clipboardRef.current.length > 0 && (
                <button
                  type="button"
                  onClick={() => { handlePaste(); setContextMenu(null); }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#faf5ee] dark:hover:bg-[#2a2622] text-left transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ClipboardPaste className="w-3.5 h-3.5 text-[#78706a]" />
                    <span>Paste ({clipboardRef.current.length})</span>
                  </span>
                  <kbd className="font-mono text-[10px] text-[#78706a]/70">Ctrl+V</kbd>
                </button>
              )}

              <button
                type="button"
                onClick={() => { handleSelectAll(); setContextMenu(null); }}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#faf5ee] dark:hover:bg-[#2a2622] text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <BoxSelect className="w-3.5 h-3.5 text-[#78706a]" />
                  <span>Select All</span>
                </span>
                <kbd className="font-mono text-[10px] text-[#78706a]/70">Ctrl+A</kbd>
              </button>

              <div className="my-1 border-t border-gray-100 dark:border-[#35302b]" />

              <button
                type="button"
                onClick={() => {
                  onUpdateViewport({ ...viewport, zoom: Math.min(viewport.zoom * 1.15, 2.5) });
                  setContextMenu(null);
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#faf5ee] dark:hover:bg-[#2a2622] text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <ZoomIn className="w-3.5 h-3.5 text-[#78706a]" />
                  <span>Zoom In</span>
                </span>
                <kbd className="font-mono text-[10px] text-[#78706a]/70">Ctrl +</kbd>
              </button>

              <button
                type="button"
                onClick={() => {
                  onUpdateViewport({ ...viewport, zoom: Math.max(viewport.zoom * 0.85, 0.3) });
                  setContextMenu(null);
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#faf5ee] dark:hover:bg-[#2a2622] text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <ZoomOut className="w-3.5 h-3.5 text-[#78706a]" />
                  <span>Zoom Out</span>
                </span>
                <kbd className="font-mono text-[10px] text-[#78706a]/70">Ctrl -</kbd>
              </button>

              <button
                type="button"
                onClick={() => {
                  onUpdateViewport({ x: 60, y: 40, zoom: 1 });
                  setContextMenu(null);
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#faf5ee] dark:hover:bg-[#2a2622] text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Maximize className="w-3.5 h-3.5 text-[#78706a]" />
                  <span>Reset View</span>
                </span>
                <kbd className="font-mono text-[10px] text-[#78706a]/70">Ctrl 0</kbd>
              </button>

              <div className="my-1 border-t border-gray-100 dark:border-[#35302b]" />

              <button
                type="button"
                onClick={() => { onToggleSnap(); setContextMenu(null); }}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#faf5ee] dark:hover:bg-[#2a2622] text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Grid className="w-3.5 h-3.5 text-[#78706a]" />
                  <span>Snap to Grid</span>
                </span>
                <span className={`text-[10px] font-semibold ${snapToGrid ? 'text-[#c2652a]' : 'text-gray-400'}`}>
                  {snapToGrid ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                type="button"
                id="context-menu-toggle-plain-white"
                onClick={() => { handleTogglePlainWhite(); setContextMenu(null); }}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#faf5ee] dark:hover:bg-[#2a2622] text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-xs border ${isPlainWhite ? 'border-[#c2652a] bg-white' : 'border-[#8f8377] bg-[#faf5ee]'}`} />
                  <span>Plain White Background</span>
                </span>
                <span className={`text-[10px] font-semibold ${isPlainWhite ? 'text-[#c2652a]' : 'text-gray-400'}`}>
                  {isPlainWhite ? 'ON' : 'OFF'}
                </span>
              </button>
            </>
          )}
        </div>
      )}

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
