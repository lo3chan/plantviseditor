import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  Maximize, 
  Grid, 
  Trash2, 
  Edit3, 
  ArrowRight,
  Move
} from 'lucide-react';
import { 
  DiagramData, 
  DiagramNode, 
  DiagramEdge, 
  PortPosition, 
  Viewport, 
  AssetItem 
} from '../types';
import { DiagramNodeView } from './DiagramNode';
import { QuickActionBar } from './QuickActionBar';

interface CanvasProps {
  diagram: DiagramData;
  viewport: Viewport;
  onUpdateViewport: (viewport: Viewport) => void;
  onUpdateNodes: (nodes: DiagramNode[]) => void;
  onUpdateEdges: (edges: DiagramEdge[]) => void;
  onAddNode: (node: DiagramNode) => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  diagram,
  viewport,
  onUpdateViewport,
  onUpdateNodes,
  onUpdateEdges,
  onAddNode,
  snapToGrid,
  onToggleSnap
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [edgeLabelText, setEdgeLabelText] = useState('');
  const selectedEdge = selectedEdgeId ? diagram.edges.find(e => e.id === selectedEdgeId) : null;

  // Node Dragging State
  const [draggingNode, setDraggingNode] = useState<{
    id: string;
    startX: number;
    startY: number;
    initialNodeX: number;
    initialNodeY: number;
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
        label: asset.label,
        sublabel: asset.sublabel,
        x: snap(pos.x - (asset.width || 150) / 2),
        y: snap(pos.y - (asset.height || 60) / 2),
        width: asset.width || 150,
        height: asset.height || 60,
        color: asset.defaultColor || 'sienna',
        data: asset.defaultData
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
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setEditingEdgeId(null);
    }
  };

  // Start Node Dragging
  const handleNodeMouseDown = (node: DiagramNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);

    setDraggingNode({
      id: node.id,
      startX: e.clientX,
      startY: e.clientY,
      initialNodeX: node.x,
      initialNodeY: node.y
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

    if (draggingNode) {
      const deltaX = (e.clientX - draggingNode.startX) / viewport.zoom;
      const deltaY = (e.clientY - draggingNode.startY) / viewport.zoom;

      const newX = snap(draggingNode.initialNodeX + deltaX);
      const newY = snap(draggingNode.initialNodeY + deltaY);

      onUpdateNodes(diagram.nodes.map(n => 
        n.id === draggingNode.id ? { ...n, x: newX, y: newY } : n
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

  // Mouse Up on Canvas
  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (draggingNode) {
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
        // Create new edge
        const newEdge: DiagramEdge = {
          id: `edge_${connecting.sourceId}_${targetNode.id}_${Date.now()}`,
          source: connecting.sourceId,
          target: targetNode.id,
          sourceHandle: connecting.port,
          targetHandle: 'left',
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
  const handleAddConnectedNode = (direction: 'right' | 'down') => {
    if (!selectedNode) return;
    const offsetX = direction === 'right' ? selectedNode.width + 80 : 0;
    const offsetY = direction === 'down' ? selectedNode.height + 60 : 0;

    const newNode: DiagramNode = {
      id: `node_${Date.now()}`,
      type: selectedNode.type,
      label: 'New Element',
      x: selectedNode.x + offsetX,
      y: selectedNode.y + offsetY,
      width: selectedNode.width,
      height: selectedNode.height,
      color: selectedNode.color || 'sienna'
    };

    const newEdge: DiagramEdge = {
      id: `edge_${selectedNode.id}_${newNode.id}_${Date.now()}`,
      source: selectedNode.id,
      target: newNode.id,
      sourceHandle: direction === 'right' ? 'right' : 'bottom',
      targetHandle: direction === 'right' ? 'left' : 'top',
      style: 'solid',
      arrowType: 'arrow'
    };

    onAddNode(newNode);
    onUpdateEdges([...diagram.edges, newEdge]);
    setSelectedNodeId(newNode.id);
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

  const getPortCoord = (nodeId: string, port?: PortPosition) => {
    const node = diagram.nodes.find(n => n.id === nodeId);
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
          transformOrigin: '0 0'
        }}
      >
        {/* SVG Layer for Edges and Connectors */}
        <svg className="absolute top-0 left-0 w-[5000px] h-[5000px] overflow-visible pointer-events-none">
          <defs>
            {/* Standard Arrow Marker */}
            <marker
              id="arrow-head"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#c2652a" />
            </marker>

            {/* Selected Arrow Marker */}
            <marker
              id="arrow-head-selected"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#a95420" />
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
              <polygon points="0,1 11,6 0,11" fill="#ffffff" stroke="#c2652a" strokeWidth="1.5" />
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
              <polygon points="1,6 8,1 15,6 8,11" fill="#c2652a" stroke="#c2652a" strokeWidth="1" />
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
              <polygon points="1,6 8,1 15,6 8,11" fill="#ffffff" stroke="#c2652a" strokeWidth="1.5" />
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
              <polyline points="2,1 10,6 2,11" fill="none" stroke="#c2652a" strokeWidth="1.8" />
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
              <line x1="4" y1="2" x2="4" y2="14" stroke="#c2652a" strokeWidth="1.8" />
              <line x1="4" y1="8" x2="18" y2="1" stroke="#c2652a" strokeWidth="1.8" />
              <line x1="4" y1="8" x2="18" y2="8" stroke="#c2652a" strokeWidth="1.8" />
              <line x1="4" y1="8" x2="18" y2="15" stroke="#c2652a" strokeWidth="1.8" />
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
              <circle cx="5" cy="8" r="3.5" fill="#faf5ee" stroke="#c2652a" strokeWidth="1.6" />
              <line x1="10" y1="8" x2="22" y2="1" stroke="#c2652a" strokeWidth="1.8" />
              <line x1="10" y1="8" x2="22" y2="8" stroke="#c2652a" strokeWidth="1.8" />
              <line x1="10" y1="8" x2="22" y2="15" stroke="#c2652a" strokeWidth="1.8" />
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
              <line x1="6" y1="2" x2="6" y2="14" stroke="#c2652a" strokeWidth="1.8" />
              <line x1="11" y1="2" x2="11" y2="14" stroke="#c2652a" strokeWidth="1.8" />
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
              <circle cx="5" cy="8" r="3.5" fill="#faf5ee" stroke="#c2652a" strokeWidth="1.6" />
              <line x1="13" y1="2" x2="13" y2="14" stroke="#c2652a" strokeWidth="1.8" />
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
              <line x1="6" y1="2" x2="6" y2="14" stroke="#c2652a" strokeWidth="1.8" />
              <line x1="11" y1="2" x2="11" y2="14" stroke="#c2652a" strokeWidth="1.8" />
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
              <polygon points="0,1 11,6 0,11" fill="#ffffff" stroke="#c2652a" strokeWidth="1.5" />
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
              <path d="M 4 2 A 6 6 0 0 1 4 14" fill="none" stroke="#c2652a" strokeWidth="1.8" />
              <circle cx="9" cy="8" r="3" fill="#c2652a" />
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
              <circle cx="7" cy="7" r="4.5" fill="#ffffff" stroke="#c2652a" strokeWidth="1.8" />
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
              <circle cx="8" cy="8" r="5" fill="#ffffff" stroke="#c2652a" strokeWidth="1.5" />
              <line x1="8" y1="5" x2="8" y2="11" stroke="#c2652a" strokeWidth="1.5" />
              <line x1="5" y1="8" x2="11" y2="8" stroke="#c2652a" strokeWidth="1.5" />
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
          {diagram.edges.map(edge => {
            const src = getPortCoord(edge.source, edge.sourceHandle || 'right');
            const tgt = getPortCoord(edge.target, edge.targetHandle || 'left');
            const isSelected = selectedEdgeId === edge.id;
            const isEditing = editingEdgeId === edge.id;

            const isOrtho = diagram.settings?.linetype === 'ortho';
            const midX = (src.x + tgt.x) / 2;
            const midY = (src.y + tgt.y) / 2;

            let pathData = '';
            if (isOrtho) {
              pathData = `M ${src.x} ${src.y} L ${midX} ${src.y} L ${midX} ${tgt.y} L ${tgt.x} ${tgt.y}`;
            } else {
              const dx = Math.abs(tgt.x - src.x) * 0.5;
              pathData = `M ${src.x} ${src.y} C ${src.x + dx} ${src.y}, ${tgt.x - dx} ${tgt.y}, ${tgt.x} ${tgt.y}`;
            }

            const getMarkerEnd = () => {
              switch (edge.arrowType) {
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
            };

            const getMarkerStart = () => {
              if (edge.arrowType === 'crows-foot-many' || edge.arrowType === 'crows-foot-zero-many') {
                return 'url(#crows-foot-one-start)';
              }
              if (edge.arrowType === 'bi-arrow') {
                return 'url(#arrow-head)';
              }
              return undefined;
            };

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
                    setSelectedEdgeId(edge.id);
                    setSelectedNodeId(null);
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
                  stroke={isSelected ? '#c2652a' : '#a95420'}
                  strokeWidth={isSelected ? 3 : 2}
                  strokeDasharray={edge.style === 'dashed' ? '6,4' : edge.style === 'dotted' ? '2,4' : undefined}
                  markerStart={getMarkerStart()}
                  markerEnd={getMarkerEnd()}
                />

                {/* Edge Label */}
                {(edge.label || isEditing) && (
                  <foreignObject
                    x={midX - 75}
                    y={midY - 14}
                    width="150"
                    height="32"
                    className="overflow-visible"
                  >
                    <div className="flex items-center justify-center">
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
                          className="text-[11px] font-medium text-center bg-white border border-[#c2652a] rounded px-1 py-0.5 outline-none shadow-xs"
                        />
                      ) : (
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEdgeId(edge.id);
                          }}
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full border shadow-2xs whitespace-nowrap transition-colors ${
                            isSelected 
                              ? 'bg-white text-[#c2652a] border-[#c2652a] font-semibold' 
                              : 'bg-[#fefaf4]/90 text-[#3a302a] border-[#d8d0c8] group-hover:border-[#c2652a]'
                          }`}
                        >
                          {edge.label}
                        </span>
                      )}
                    </div>
                  </foreignObject>
                )}
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
                  setSelectedNodeId(node.id);
                  setSelectedEdgeId(null);
                }}
                onUpdate={(patch) => {
                  onUpdateNodes(diagram.nodes.map(n => n.id === node.id ? { ...n, ...patch } : n));
                }}
                onStartConnection={handleStartConnection}
                onQuickAddChild={(id) => handleAddConnectedNode('right')}
              />
            </div>
          ))}

          {/* Floating Quick Action Bar for selected node */}
          {selectedNode && (
            <QuickActionBar
              x={selectedNode.x + selectedNode.width / 2}
              y={selectedNode.y - 8}
              currentColor={selectedNode.color}
              onSelectColor={(col) => handleUpdateSelectedNode({ color: col })}
              onDuplicate={handleDuplicateSelected}
              onAddConnectedNode={handleAddConnectedNode}
              onDelete={handleDeleteSelected}
            />
          )}

          {/* Floating Relationship Toolbar for selected edge */}
          {selectedEdge && (() => {
            const src = getPortCoord(selectedEdge.source, selectedEdge.sourceHandle || 'right');
            const tgt = getPortCoord(selectedEdge.target, selectedEdge.targetHandle || 'left');
            const midX = (src.x + tgt.x) / 2;
            const midY = (src.y + tgt.y) / 2;

            return (
              <div
                className="absolute z-40 -translate-x-1/2 -translate-y-full mb-3 pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-[#c2652a]/40 shadow-xl rounded-xl p-1.5 text-xs select-none"
                style={{ left: midX, top: midY - 14 }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <span className="text-[10px] font-bold text-[#78706a] uppercase px-1">Rel:</span>
                
                {/* Association --> */}
                <button
                  onClick={() => onUpdateEdges(diagram.edges.map(e => e.id === selectedEdge.id ? { ...e, arrowType: 'arrow' } : e))}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    selectedEdge.arrowType === 'arrow' || !selectedEdge.arrowType ? 'bg-[#c2652a] text-white font-bold' : 'hover:bg-[#faf5ee] text-[#3a302a]'
                  }`}
                  title="Association (-->)"
                >
                  --&gt;
                </button>

                {/* Inheritance --|> */}
                <button
                  onClick={() => onUpdateEdges(diagram.edges.map(e => e.id === selectedEdge.id ? { ...e, arrowType: 'inheritance' } : e))}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    selectedEdge.arrowType === 'inheritance' ? 'bg-[#c2652a] text-white font-bold' : 'hover:bg-[#faf5ee] text-[#3a302a]'
                  }`}
                  title="Inheritance / Generalization (--|>)"
                >
                  --|&gt;
                </button>

                {/* Composition *-- */}
                <button
                  onClick={() => onUpdateEdges(diagram.edges.map(e => e.id === selectedEdge.id ? { ...e, arrowType: 'composition' } : e))}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    selectedEdge.arrowType === 'composition' ? 'bg-[#c2652a] text-white font-bold' : 'hover:bg-[#faf5ee] text-[#3a302a]'
                  }`}
                  title="Composition (*--)"
                >
                  *--
                </button>

                {/* Aggregation o-- */}
                <button
                  onClick={() => onUpdateEdges(diagram.edges.map(e => e.id === selectedEdge.id ? { ...e, arrowType: 'aggregation' } : e))}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    selectedEdge.arrowType === 'aggregation' ? 'bg-[#c2652a] text-white font-bold' : 'hover:bg-[#faf5ee] text-[#3a302a]'
                  }`}
                  title="Aggregation (o--)"
                >
                  o--
                </button>

                {/* Dependency ..> */}
                <button
                  onClick={() => onUpdateEdges(diagram.edges.map(e => e.id === selectedEdge.id ? { ...e, arrowType: 'dependency', style: 'dashed' } : e))}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    selectedEdge.arrowType === 'dependency' ? 'bg-[#c2652a] text-white font-bold' : 'hover:bg-[#faf5ee] text-[#3a302a]'
                  }`}
                  title="Dependency (..>)"
                >
                  ..&gt;
                </button>

                {/* Realization ..|> */}
                <button
                  onClick={() => onUpdateEdges(diagram.edges.map(e => e.id === selectedEdge.id ? { ...e, arrowType: 'realization', style: 'dashed' } : e))}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    selectedEdge.arrowType === 'realization' ? 'bg-[#c2652a] text-white font-bold' : 'hover:bg-[#faf5ee] text-[#3a302a]'
                  }`}
                  title="Realization (..|>)"
                >
                  ..|&gt;
                </button>

                {/* Socket & Ball -0) */}
                <button
                  onClick={() => onUpdateEdges(diagram.edges.map(e => e.id === selectedEdge.id ? { ...e, arrowType: 'socket-ball' } : e))}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    selectedEdge.arrowType === 'socket-ball' ? 'bg-[#c2652a] text-white font-bold' : 'hover:bg-[#faf5ee] text-[#3a302a]'
                  }`}
                  title="Socket & Ball Assembly (-0))"
                >
                  -0)
                </button>

                {/* Lollipop ()-- */}
                <button
                  onClick={() => onUpdateEdges(diagram.edges.map(e => e.id === selectedEdge.id ? { ...e, arrowType: 'lollipop' } : e))}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    selectedEdge.arrowType === 'lollipop' ? 'bg-[#c2652a] text-white font-bold' : 'hover:bg-[#faf5ee] text-[#3a302a]'
                  }`}
                  title="Lollipop Anchor (()--)"
                >
                  ()--
                </button>

                {/* Nesting +-- */}
                <button
                  onClick={() => onUpdateEdges(diagram.edges.map(e => e.id === selectedEdge.id ? { ...e, arrowType: 'nesting' } : e))}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    selectedEdge.arrowType === 'nesting' ? 'bg-[#c2652a] text-white font-bold' : 'hover:bg-[#faf5ee] text-[#3a302a]'
                  }`}
                  title="Nesting (+--)"
                >
                  +--
                </button>

                {/* Cancellation x-- */}
                <button
                  onClick={() => onUpdateEdges(diagram.edges.map(e => e.id === selectedEdge.id ? { ...e, arrowType: 'cancellation' } : e))}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    selectedEdge.arrowType === 'cancellation' ? 'bg-red-600 text-white font-bold' : 'hover:bg-red-50 text-red-600'
                  }`}
                  title="Cancellation (x--)"
                >
                  x--
                </button>

                <div className="w-[1px] h-4 bg-[#d8d0c8]/60" />

                {/* Crow's Foot Exactly One ||--|| */}
                <button
                  onClick={() => onUpdateEdges(diagram.edges.map(e => e.id === selectedEdge.id ? { ...e, arrowType: 'crows-foot-one' } : e))}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    selectedEdge.arrowType === 'crows-foot-one' ? 'bg-[#c2652a] text-white font-bold' : 'hover:bg-[#faf5ee] text-[#3a302a]'
                  }`}
                  title="Crow's Foot One-to-One (||--||)"
                >
                  ||--||
                </button>

                {/* Crow's Foot 1 to Many ||--|{ */}
                <button
                  onClick={() => onUpdateEdges(diagram.edges.map(e => e.id === selectedEdge.id ? { ...e, arrowType: 'crows-foot-many' } : e))}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    selectedEdge.arrowType === 'crows-foot-many' ? 'bg-[#c2652a] text-white font-bold' : 'hover:bg-[#faf5ee] text-[#3a302a]'
                  }`}
                  title="Crow's Foot One-to-Many (||--|{)"
                >
                  ||--|&#123;
                </button>

                {/* Crow's Foot 0 to Many ||--o{ */}
                <button
                  onClick={() => onUpdateEdges(diagram.edges.map(e => e.id === selectedEdge.id ? { ...e, arrowType: 'crows-foot-zero-many' } : e))}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    selectedEdge.arrowType === 'crows-foot-zero-many' ? 'bg-[#c2652a] text-white font-bold' : 'hover:bg-[#faf5ee] text-[#3a302a]'
                  }`}
                  title="Crow's Foot Zero-to-Many (||--o{)"
                >
                  ||--o&#123;
                </button>

                {/* Crow's Foot 0 to One ||--o| */}
                <button
                  onClick={() => onUpdateEdges(diagram.edges.map(e => e.id === selectedEdge.id ? { ...e, arrowType: 'crows-foot-zero-one' } : e))}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    selectedEdge.arrowType === 'crows-foot-zero-one' ? 'bg-[#c2652a] text-white font-bold' : 'hover:bg-[#faf5ee] text-[#3a302a]'
                  }`}
                  title="Crow's Foot Zero-to-One (||--o|)"
                >
                  ||--o|
                </button>

                <div className="w-[1px] h-4 bg-[#d8d0c8]/60" />

                {/* Line Style Toggle */}
                <button
                  onClick={() => {
                    const nextStyle = selectedEdge.style === 'solid' ? 'dashed' : selectedEdge.style === 'dashed' ? 'dotted' : 'solid';
                    onUpdateEdges(diagram.edges.map(e => e.id === selectedEdge.id ? { ...e, style: nextStyle } : e));
                  }}
                  className="px-1.5 py-0.5 rounded hover:bg-[#faf5ee] text-[#78706a] hover:text-[#c2652a] text-[10px] font-semibold border border-[#d8d0c8]/60"
                  title="Cycle Line Style (Solid, Dashed, Dotted)"
                >
                  {selectedEdge.style?.toUpperCase() || 'SOLID'}
                </button>

                {/* Delete Connection */}
                <button
                  onClick={() => {
                    onUpdateEdges(diagram.edges.filter(e => e.id !== selectedEdge.id));
                    setSelectedEdgeId(null);
                  }}
                  className="p-1 rounded hover:bg-red-50 text-red-600 transition-colors"
                  title="Delete Connection"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })()}

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
            snapToGrid ? 'bg-[#c2652a]/10 text-[#c2652a]' : 'text-[#78706a] hover:bg-[#faf5ee]'
          }`}
          title={snapToGrid ? 'Grid Snap: ON' : 'Grid Snap: OFF'}
        >
          <Grid className="w-3.5 h-3.5" />
        </button>
      </aside>

      {/* Mini Pan hint indicator */}
      <div className="absolute bottom-4 left-4 pointer-events-none text-[11px] text-[#78706a]/70 flex items-center gap-1 bg-[#faf5ee]/80 px-2 py-1 rounded-md border border-[#d8d0c8]/40 backdrop-blur-xs">
        <Move className="w-3 h-3" />
        <span>Drag canvas to pan • Wheel to zoom</span>
      </div>
    </div>
  );
};
