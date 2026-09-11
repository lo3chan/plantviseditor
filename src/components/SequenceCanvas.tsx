import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Minus,
  Maximize,
  Grid,
  Trash2, 
  ArrowRight, 
  ArrowLeft, 
  User, 
  Box, 
  Database, 
  Server,
  Shield, 
  Layers, 
  RotateCw,
  Edit2, 
  Check, 
  ChevronDown,
  GitBranch,
  FileText,
  Boxes,
  Circle,
  Magnet,
  Move,
  GripHorizontal,
  GripVertical
} from 'lucide-react';
import { SequenceParticipant, SequenceMessage, SequenceBlock } from '../types';
import { getColorConfig, COLOR_THEMES } from '../utils/assetsData';
import { 
  StickmanActorShape, 
  CylinderDatabaseShape, 
  QueueShape, 
  BoundaryIconShape, 
  ControlIconShape, 
  EntityCircleIconShape, 
  CollectionsShape,
  NoteFoldShape
} from './PlantUMLShapes';
import { SequenceParticipantBar } from './SequenceParticipantBar';
import { SequenceMessageBar } from './SequenceMessageBar';
import { SequenceBlockBar } from './SequenceBlockBar';
import { SelectedCanvasElement } from '../utils/codeHighlightSync';

interface DragState {
  type: 'participant' | 'message' | 'message-endpoint' | 'block' | 'block-resize';
  id: string;
  endpoint?: 'from' | 'to';
  edge?: 'top' | 'bottom';
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  currentX: number;
  currentY: number;
  snappedX: number;
  snappedY: number;
  targetStep?: number;
  targetParticipantId?: string;
  shiftFromParticipantId?: string;
  shiftToParticipantId?: string;
  originStartOrder?: number;
  originEndOrder?: number;
  targetStartOrder?: number;
  targetEndOrder?: number;
}

interface SnapGuide {
  x?: number;
  y?: number;
  label: string;
  type?: 'grid' | 'lifeline' | 'step';
}

interface SequenceCanvasProps {
  participants: SequenceParticipant[];
  messages: SequenceMessage[];
  blocks?: SequenceBlock[];
  onUpdateParticipants: (participants: SequenceParticipant[]) => void;
  onUpdateMessages: (messages: SequenceMessage[]) => void;
  onUpdateBlocks?: (blocks: SequenceBlock[]) => void;
  viewport: { x: number; y: number; zoom: number };
  onUpdateViewport?: (viewport: { x: number; y: number; zoom: number }) => void;
  snapToGrid?: boolean;
  onToggleSnap?: () => void;
  selectedElementId?: string | null;
  onSelectElement?: (element: SelectedCanvasElement | null) => void;
}

export const SequenceCanvas: React.FC<SequenceCanvasProps> = ({
  participants = [],
  messages = [],
  blocks = [],
  onUpdateParticipants,
  onUpdateMessages,
  onUpdateBlocks,
  viewport,
  onUpdateViewport,
  snapToGrid = true,
  onToggleSnap,
  selectedElementId,
  onSelectElement
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // Synchronize selection with parent / Monaco cursor
  const selectParticipant = (p: SequenceParticipant | null) => {
    if (p) {
      setSelectedParticipantId(p.id);
      setSelectedMessageId(null);
      setSelectedBlockId(null);
      onSelectElement?.({ type: 'participant', id: p.id, label: p.name });
    } else {
      setSelectedParticipantId(null);
      if (!selectedMessageId && !selectedBlockId) onSelectElement?.(null);
    }
  };

  const selectMessage = (msg: SequenceMessage | null) => {
    if (msg) {
      setSelectedMessageId(msg.id);
      setSelectedParticipantId(null);
      setSelectedBlockId(null);
      onSelectElement?.({ type: 'message', id: msg.id, source: msg.from, target: msg.to, label: msg.label });
    } else {
      setSelectedMessageId(null);
      if (!selectedParticipantId && !selectedBlockId) onSelectElement?.(null);
    }
  };

  const selectBlock = (b: SequenceBlock | null) => {
    if (b) {
      setSelectedBlockId(b.id);
      setSelectedParticipantId(null);
      setSelectedMessageId(null);
      onSelectElement?.({ type: 'block', id: b.id, label: b.label });
    } else {
      setSelectedBlockId(null);
      if (!selectedParticipantId && !selectedMessageId) onSelectElement?.(null);
    }
  };

  const clearSequenceSelection = () => {
    setSelectedParticipantId(null);
    setSelectedMessageId(null);
    setSelectedBlockId(null);
    setIsAddParticipantMenuOpen(false);
    setIsAddStepMenuOpen(false);
    setIsAddBlockMenuOpen(false);
    onSelectElement?.(null);
  };

  // Sync external selectedElementId
  useEffect(() => {
    if (selectedElementId === null) {
      setSelectedParticipantId(null);
      setSelectedMessageId(null);
      setSelectedBlockId(null);
    } else if (selectedElementId) {
      const isPart = participants.some(p => p.id === selectedElementId);
      if (isPart) {
        setSelectedParticipantId(selectedElementId);
        setSelectedMessageId(null);
        setSelectedBlockId(null);
      } else {
        const isMsg = messages.some(m => m.id === selectedElementId);
        if (isMsg) {
          setSelectedMessageId(selectedElementId);
          setSelectedParticipantId(null);
          setSelectedBlockId(null);
        } else {
          const isBlk = blocks.some(b => b.id === selectedElementId);
          if (isBlk) {
            setSelectedBlockId(selectedElementId);
            setSelectedParticipantId(null);
            setSelectedMessageId(null);
          }
        }
      }
    }
  }, [selectedElementId, participants, messages, blocks]);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const [isAddParticipantMenuOpen, setIsAddParticipantMenuOpen] = useState(false);
  const [isAddStepMenuOpen, setIsAddStepMenuOpen] = useState(false);
  const [isAddBlockMenuOpen, setIsAddBlockMenuOpen] = useState(false);

  // Dragging and snapping state
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [snapGuide, setSnapGuide] = useState<SnapGuide | null>(null);

  const PARTICIPANT_SPACING = 230;
  const START_X = 140;
  const START_Y = 68;
  const MESSAGE_SPACING = 62;
  const TOP_LIFELINE_Y = 130;
  const TOTAL_HEIGHT = Math.max(650, TOP_LIFELINE_Y + (messages.length + 3) * MESSAGE_SPACING);

  const snapVal = (val: number, step: number = 16) => {
    if (!snapToGrid) return Math.round(val);
    return Math.round(val / step) * step;
  };

  const getParticipantX = (pId: string) => {
    const p = participants.find(item => item.id === pId);
    if (p && p.x !== undefined) {
      return p.x;
    }
    const idx = participants.findIndex(item => item.id === pId);
    return START_X + (idx >= 0 ? idx : 0) * PARTICIPANT_SPACING;
  };

  const getParticipantY = (pId: string) => {
    const p = participants.find(item => item.id === pId);
    return p && p.y !== undefined ? p.y : START_Y;
  };

  const getRenderParticipantX = (pId: string) => {
    if (dragState?.type === 'participant' && dragState.id === pId) {
      return dragState.snappedX;
    }
    return getParticipantX(pId);
  };

  const getRenderParticipantY = (pId: string) => {
    if (dragState?.type === 'participant' && dragState.id === pId) {
      return dragState.snappedY;
    }
    return getParticipantY(pId);
  };

  const getRenderMessageY = (mId: string, defaultY: number) => {
    if (dragState?.type === 'message' && dragState.id === mId) {
      return dragState.snappedY;
    }
    return defaultY;
  };

  // Deselect on empty canvas click
  const handleCanvasClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('button, input, select, textarea, [data-interactive="true"], .cursor-grab, .cursor-grabbing, .cursor-ns-resize, .cursor-ew-resize');
    if (!isInteractive) {
      clearSequenceSelection();
    }
  };

  // Add Participant
  const handleAddParticipant = (type: string = 'participant') => {
    const newId = `${type}_${Date.now()}`;
    const nameMap: Record<string, string> = {
      actor: `User`,
      database: `Database`,
      queue: `MessageQueue`,
      boundary: `Gateway`,
      control: `Controller`,
      entity: `Model`,
      collections: `Workers`,
      participant: `Service ${participants.length + 1}`
    };
    const newParticipant: SequenceParticipant = {
      id: newId,
      name: nameMap[type] || `Participant ${participants.length + 1}`,
      type,
      shape: type,
      color: type === 'actor' ? 'sienna' : type === 'database' ? 'slate' : 'sand',
      stereotype: type === 'boundary' ? '«gateway»' : type === 'control' ? '«controller»' : type === 'entity' ? '«entity»' : undefined
    };
    onUpdateParticipants([...participants, newParticipant]);
    setSelectedParticipantId(newId);
    setIsAddParticipantMenuOpen(false);
  };

  // Delete participant
  const handleDeleteParticipant = (pId: string) => {
    if (participants.length <= 2) return;
    onUpdateParticipants(participants.filter(p => p.id !== pId));
    onUpdateMessages(messages.filter(m => m.from !== pId && m.to !== pId));
    if (selectedParticipantId === pId) setSelectedParticipantId(null);
  };

  // Reorder participants horizontally (Left to Right movement)
  const handleMoveParticipant = (pId: string, direction: 'left' | 'right') => {
    const idx = participants.findIndex(p => p.id === pId);
    if ((direction === 'left' && idx === 0) || (direction === 'right' && idx === participants.length - 1)) {
      return;
    }
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    const cloned = [...participants];
    const temp = cloned[idx];
    cloned[idx] = cloned[targetIdx];
    cloned[targetIdx] = temp;

    // Swap physical X coordinates so they instantly switch columns
    const x1 = cloned[idx].x ?? (START_X + idx * PARTICIPANT_SPACING);
    const x2 = cloned[targetIdx].x ?? (START_X + targetIdx * PARTICIPANT_SPACING);
    cloned[idx] = { ...cloned[idx], x: x1 };
    cloned[targetIdx] = { ...cloned[targetIdx], x: x2 };

    onUpdateParticipants(cloned);
  };

  // Shift interaction message left or right across lifelines
  const handleShiftMessageHorizontal = (mId: string, direction: 'left' | 'right') => {
    const msg = messages.find(m => m.id === mId);
    if (!msg) return;

    const fromIdx = participants.findIndex(p => p.id === msg.from);
    const toIdx = participants.findIndex(p => p.id === msg.to);
    if (fromIdx < 0 || toIdx < 0) return;

    const delta = direction === 'left' ? -1 : 1;
    const newFromIdx = fromIdx + delta;
    const newToIdx = toIdx + delta;

    if (newFromIdx < 0 || newFromIdx >= participants.length || newToIdx < 0 || newToIdx >= participants.length) {
      return;
    }

    const newFrom = participants[newFromIdx].id;
    const newTo = participants[newToIdx].id;

    onUpdateMessages(messages.map(m => {
      if (m.id !== mId) return m;
      return { ...m, from: newFrom, to: newTo };
    }));
  };

  // Add Interaction Step Message
  const handleAddMessage = (
    fromId?: string, 
    toId?: string, 
    label: string = 'requestPayload()', 
    type: 'sync' | 'reply' | 'async' | 'self' = 'sync'
  ) => {
    if (participants.length < 1) return;
    const src = fromId || participants[0].id;
    const tgt = toId || (type === 'self' ? src : (participants[1] ? participants[1].id : src));
    const nextOrder = messages.length > 0 ? Math.max(...messages.map(m => m.order)) + 1 : 1;

    const newMsg: SequenceMessage = {
      id: `msg_${Date.now()}`,
      from: src,
      to: tgt,
      label,
      type,
      order: nextOrder
    };

    onUpdateMessages([...messages, newMsg]);
    setSelectedMessageId(newMsg.id);
    setIsAddStepMenuOpen(false);
  };

  // Add Sequence Block Frame
  const handleAddBlock = (type: string = 'alt') => {
    if (!onUpdateBlocks) return;
    const startOrder = Math.max(1, messages.length > 0 ? 1 : 1);
    const endOrder = Math.max(startOrder, messages.length > 0 ? messages.length : 1);

    const newBlock: SequenceBlock = {
      id: `block_${Date.now()}`,
      type,
      label: type === 'alt' ? 'Alternative Path' : type === 'loop' ? 'For Each Item' : `${type.toUpperCase()} block`,
      condition: type === 'alt' ? 'status == 200' : type === 'loop' ? 'items.hasNext()' : undefined,
      startOrder,
      endOrder
    };

    onUpdateBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
    setIsAddBlockMenuOpen(false);
  };

  // Swap message direction
  const handleSwapMessageDirection = (mId: string) => {
    onUpdateMessages(messages.map(m => {
      if (m.id !== mId) return m;
      return { ...m, from: m.to, to: m.from };
    }));
  };

  // Move message step up/down
  const handleMoveMessageStep = (mIndex: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && mIndex === 0) || (direction === 'down' && mIndex === messages.length - 1)) {
      return;
    }
    const targetIndex = direction === 'up' ? mIndex - 1 : mIndex + 1;
    const updated = [...messages];
    const temp = updated[mIndex];
    updated[mIndex] = updated[targetIndex];
    updated[targetIndex] = temp;
    updated.forEach((m, idx) => { m.order = idx + 1; });
    onUpdateMessages(updated);
  };

  // Commit inline edit
  const commitMessageEdit = (mId: string) => {
    if (editLabel.trim()) {
      onUpdateMessages(messages.map(m => m.id === mId ? { ...m, label: editLabel.trim() } : m));
    }
    setEditingMessageId(null);
  };

  const commitParticipantEdit = (pId: string) => {
    if (editLabel.trim()) {
      onUpdateParticipants(participants.map(p => p.id === pId ? { ...p, name: editLabel.trim() } : p));
    }
    setEditingParticipantId(null);
  };

  // Start dragging participant
  const startDragParticipant = (pId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedParticipantId(pId);
    setSelectedMessageId(null);
    setSelectedBlockId(null);

    const origX = getParticipantX(pId);
    const origY = getParticipantY(pId);

    setDragState({
      type: 'participant',
      id: pId,
      startX: e.clientX,
      startY: e.clientY,
      originX: origX,
      originY: origY,
      currentX: origX,
      currentY: origY,
      snappedX: origX,
      snappedY: origY
    });
  };

  // Start dragging message (interaction arrow)
  const startDragMessage = (mId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedMessageId(mId);
    setSelectedParticipantId(null);
    setSelectedBlockId(null);

    const msg = messages.find(m => m.id === mId);
    const idx = messages.findIndex(m => m.id === mId);
    const curY = TOP_LIFELINE_Y + (idx + 1) * MESSAGE_SPACING;

    setDragState({
      type: 'message',
      id: mId,
      startX: e.clientX,
      startY: e.clientY,
      originX: getParticipantX(msg?.from || ''),
      originY: curY,
      currentX: getParticipantX(msg?.from || ''),
      currentY: curY,
      snappedX: getParticipantX(msg?.from || ''),
      snappedY: curY,
      targetStep: idx + 1
    });
  };

  // Start dragging message endpoint handle (source or target)
  const startDragEndpoint = (mId: string, endpoint: 'from' | 'to', e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const msg = messages.find(m => m.id === mId);
    if (!msg) return;

    const pId = endpoint === 'from' ? msg.from : msg.to;
    const origX = getParticipantX(pId);
    const idx = messages.findIndex(m => m.id === mId);
    const curY = TOP_LIFELINE_Y + (idx + 1) * MESSAGE_SPACING;

    setDragState({
      type: 'message-endpoint',
      id: mId,
      endpoint,
      startX: e.clientX,
      startY: e.clientY,
      originX: origX,
      originY: curY,
      currentX: origX,
      currentY: curY,
      snappedX: origX,
      snappedY: curY,
      targetParticipantId: pId
    });
  };

  // Start dragging fragment block frame
  const startDragBlock = (bId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedBlockId(bId);
    setSelectedParticipantId(null);
    setSelectedMessageId(null);

    const blk = blocks.find(b => b.id === bId);
    if (!blk) return;
    const curY = TOP_LIFELINE_Y + blk.startOrder * MESSAGE_SPACING - 32;

    setDragState({
      type: 'block',
      id: bId,
      startX: e.clientX,
      startY: e.clientY,
      originX: 50,
      originY: curY,
      currentX: 50,
      currentY: curY,
      snappedX: 50,
      snappedY: curY,
      originStartOrder: blk.startOrder,
      originEndOrder: blk.endOrder,
      targetStartOrder: blk.startOrder,
      targetEndOrder: blk.endOrder
    });
  };

  // Start resizing block frame edge
  const startResizeBlock = (bId: string, edge: 'top' | 'bottom', e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const blk = blocks.find(b => b.id === bId);
    if (!blk) return;

    setDragState({
      type: 'block-resize',
      id: bId,
      edge,
      startX: e.clientX,
      startY: e.clientY,
      originX: 50,
      originY: edge === 'top' 
        ? TOP_LIFELINE_Y + blk.startOrder * MESSAGE_SPACING - 32 
        : TOP_LIFELINE_Y + blk.endOrder * MESSAGE_SPACING + 28,
      currentX: 50,
      currentY: 0,
      snappedX: 50,
      snappedY: 0,
      originStartOrder: blk.startOrder,
      originEndOrder: blk.endOrder,
      targetStartOrder: blk.startOrder,
      targetEndOrder: blk.endOrder
    });
  };

  // Global Pointer Event Listeners for Smooth Drag & Snap
  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e: PointerEvent) => {
      const zoom = viewport.zoom || 1;
      const dx = (e.clientX - dragState.startX) / zoom;
      const dy = (e.clientY - dragState.startY) / zoom;
      const rawX = dragState.originX + dx;
      const rawY = dragState.originY + dy;

      if (dragState.type === 'participant') {
        const gridX = snapToGrid ? snapVal(rawX, 16) : Math.round(rawX);
        const gridY = snapToGrid ? snapVal(rawY, 16) : Math.round(rawY);

        let finalX = gridX;
        let snapLabel = `Snap X: ${finalX}px, Y: ${gridY}px`;
        let isLifelineSnap = false;

        // Magnet snap to other participants if within 18px
        const otherP = participants.find(p => p.id !== dragState.id && Math.abs((p.x ?? getParticipantX(p.id)) - rawX) < 18);
        if (otherP) {
          finalX = otherP.x ?? getParticipantX(otherP.id);
          snapLabel = `Magnetic Align with ${otherP.name} (${finalX}px)`;
          isLifelineSnap = true;
        }

        const boundedX = Math.max(60, finalX);
        const boundedY = Math.max(30, gridY);

        setDragState(prev => prev ? {
          ...prev,
          currentX: rawX,
          currentY: rawY,
          snappedX: boundedX,
          snappedY: boundedY
        } : null);

        setSnapGuide({
          x: boundedX,
          y: boundedY,
          label: snapLabel,
          type: isLifelineSnap ? 'lifeline' : 'grid'
        });
      } else if (dragState.type === 'message') {
        const targetStep = Math.max(1, Math.min(messages.length, Math.round((rawY - TOP_LIFELINE_Y) / MESSAGE_SPACING)));
        const snappedY = TOP_LIFELINE_Y + targetStep * MESSAGE_SPACING;

        // Left to Right horizontal shift calculation
        const currentMsg = messages.find(m => m.id === dragState.id);
        const fromIdx = currentMsg ? participants.findIndex(p => p.id === currentMsg.from) : -1;
        const toIdx = currentMsg ? participants.findIndex(p => p.id === currentMsg.to) : -1;

        const colDelta = Math.round(dx / PARTICIPANT_SPACING);
        let shiftFrom: string | undefined = undefined;
        let shiftTo: string | undefined = undefined;

        if (currentMsg && fromIdx >= 0 && toIdx >= 0 && colDelta !== 0) {
          const candidateFromIdx = fromIdx + colDelta;
          const candidateToIdx = toIdx + colDelta;
          if (candidateFromIdx >= 0 && candidateFromIdx < participants.length && candidateToIdx >= 0 && candidateToIdx < participants.length) {
            shiftFrom = participants[candidateFromIdx].id;
            shiftTo = participants[candidateToIdx].id;
          }
        }

        setDragState(prev => prev ? {
          ...prev,
          currentX: rawX,
          currentY: rawY,
          snappedX: rawX,
          snappedY,
          targetStep,
          shiftFromParticipantId: shiftFrom,
          shiftToParticipantId: shiftTo
        } : null);

        let snapMsg = `Snap to Step ${targetStep} (${snappedY}px)`;
        if (shiftFrom && shiftTo) {
          const pFrom = participants.find(p => p.id === shiftFrom);
          const pTo = participants.find(p => p.id === shiftTo);
          snapMsg += ` • Shift ${colDelta > 0 ? 'Right ➔' : '⬅ Left'} to ${pFrom?.name} ➔ ${pTo?.name}`;
        }

        setSnapGuide({
          y: snappedY,
          label: snapMsg,
          type: 'step'
        });
      } else if (dragState.type === 'message-endpoint') {
        let closestP: SequenceParticipant | null = null;
        let minDist = Infinity;
        participants.forEach(p => {
          const pX = getRenderParticipantX(p.id);
          const dist = Math.abs(rawX - pX);
          if (dist < minDist) {
            minDist = dist;
            closestP = p;
          }
        });

        const targetP = (minDist < 60 && closestP) ? closestP : null;
        const snappedX = targetP ? getRenderParticipantX(targetP.id) : (snapToGrid ? snapVal(rawX, 16) : Math.round(rawX));

        setDragState(prev => prev ? {
          ...prev,
          currentX: rawX,
          currentY: rawY,
          snappedX,
          snappedY: rawY,
          targetParticipantId: targetP?.id
        } : null);

        setSnapGuide({
          x: snappedX,
          label: targetP ? `Snap to Lifeline: ${targetP.name}` : `X: ${snappedX}px`,
          type: targetP ? 'lifeline' : 'grid'
        });
      } else if (dragState.type === 'block') {
        const deltaSteps = Math.round(dy / MESSAGE_SPACING);
        const originStart = dragState.originStartOrder || 1;
        const originEnd = dragState.originEndOrder || 2;
        const span = originEnd - originStart;

        const targetStartOrder = Math.max(1, Math.min(messages.length - span, originStart + deltaSteps));
        const targetEndOrder = targetStartOrder + span;
        const snappedY = TOP_LIFELINE_Y + targetStartOrder * MESSAGE_SPACING - 32;

        setDragState(prev => prev ? {
          ...prev,
          currentX: rawX,
          currentY: rawY,
          snappedY,
          targetStartOrder,
          targetEndOrder
        } : null);

        setSnapGuide({
          y: snappedY,
          label: `Snap Steps ${targetStartOrder} → ${targetEndOrder}`,
          type: 'step'
        });
      } else if (dragState.type === 'block-resize') {
        if (dragState.edge === 'top') {
          const targetStart = Math.max(1, Math.min((dragState.originEndOrder || 2) - 1, Math.round((rawY - TOP_LIFELINE_Y + 32) / MESSAGE_SPACING)));
          const snappedY = TOP_LIFELINE_Y + targetStart * MESSAGE_SPACING - 32;
          setDragState(prev => prev ? { ...prev, targetStartOrder: targetStart, snappedY } : null);
          setSnapGuide({ y: snappedY, label: `Start Step: ${targetStart}`, type: 'step' });
        } else if (dragState.edge === 'bottom') {
          const targetEnd = Math.max((dragState.originStartOrder || 1) + 1, Math.min(messages.length, Math.round((rawY - TOP_LIFELINE_Y - 28) / MESSAGE_SPACING)));
          const snappedY = TOP_LIFELINE_Y + targetEnd * MESSAGE_SPACING + 28;
          setDragState(prev => prev ? { ...prev, targetEndOrder: targetEnd, snappedY } : null);
          setSnapGuide({ y: snappedY, label: `End Step: ${targetEnd}`, type: 'step' });
        }
      }
    };

    const handlePointerUp = () => {
      if (!dragState) return;

      if (dragState.type === 'participant') {
        const updated = participants.map(p => 
          p.id === dragState.id ? { ...p, x: dragState.snappedX, y: dragState.snappedY } : p
        );
        const sorted = [...updated].sort((a, b) => (a.x ?? getParticipantX(a.id)) - (b.x ?? getParticipantX(b.id)));
        onUpdateParticipants(sorted);
      } else if (dragState.type === 'message') {
        let updated = [...messages];
        const oldIdx = updated.findIndex(m => m.id === dragState.id);
        if (oldIdx >= 0) {
          // 1. Apply Left-to-Right / horizontal shift to new lifelines if dragged sideways
          if (dragState.shiftFromParticipantId && dragState.shiftToParticipantId) {
            updated[oldIdx] = {
              ...updated[oldIdx],
              from: dragState.shiftFromParticipantId,
              to: dragState.shiftToParticipantId
            };
          }

          // 2. Apply vertical step reordering if dragged up or down
          if (dragState.targetStep !== undefined) {
            const newIdx = dragState.targetStep - 1;
            if (oldIdx !== newIdx && newIdx >= 0 && newIdx < updated.length) {
              const [moved] = updated.splice(oldIdx, 1);
              updated.splice(newIdx, 0, moved);
              updated = updated.map((m, i) => ({ ...m, order: i + 1 }));
            }
          }

          onUpdateMessages(updated);
        }
      } else if (dragState.type === 'message-endpoint') {
        if (dragState.targetParticipantId) {
          onUpdateMessages(messages.map(m => {
            if (m.id !== dragState.id) return m;
            if (dragState.endpoint === 'from') {
              return { ...m, from: dragState.targetParticipantId! };
            } else {
              return { ...m, to: dragState.targetParticipantId! };
            }
          }));
        }
      } else if (dragState.type === 'block' || dragState.type === 'block-resize') {
        if (onUpdateBlocks && (dragState.targetStartOrder !== undefined || dragState.targetEndOrder !== undefined)) {
          onUpdateBlocks(blocks.map(b => {
            if (b.id !== dragState.id) return b;
            return {
              ...b,
              startOrder: dragState.targetStartOrder ?? b.startOrder,
              endOrder: dragState.targetEndOrder ?? b.endOrder
            };
          }));
        }
      }

      setDragState(null);
      setSnapGuide(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, participants, messages, blocks, snapToGrid, viewport.zoom]);

  // Toolbox Drag-and-Drop Handler with Snapping
  const handleDropAsset = (e: React.DragEvent) => {
    e.preventDefault();
    const assetData = e.dataTransfer.getData('application/plantuml-asset');
    if (!assetData) return;

    try {
      const asset = JSON.parse(assetData);
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dropRawX = (e.clientX - rect.left - viewport.x) / (viewport.zoom || 1);
      const dropRawY = (e.clientY - rect.top - viewport.y) / (viewport.zoom || 1);

      const dropSnappedX = snapToGrid ? snapVal(dropRawX, 16) : Math.round(dropRawX);
      const dropSnappedY = snapToGrid ? snapVal(dropRawY, 16) : Math.round(dropRawY);

      let pType = 'participant';
      if (asset.id === 'seq-actor' || asset.nodeType === 'actor') {
        pType = 'actor';
      } else if (asset.id === 'seq-database' || asset.nodeType === 'database') {
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
        name: asset.label.replace(/[^a-zA-Z0-9_ ]/g, '').trim() || `Participant ${participants.length + 1}`,
        type: pType,
        shape: asset.shape || pType,
        color: asset.defaultColor || 'sand',
        stereotype: asset.sublabel ? `«${asset.sublabel.replace(/[«»]/g, '')}»` : undefined,
        x: dropSnappedX,
        y: Math.max(40, dropSnappedY)
      };

      const updated = [...participants, newParticipant];
      updated.sort((a, b) => (a.x ?? getParticipantX(a.id)) - (b.x ?? getParticipantX(b.id)));
      onUpdateParticipants(updated);
      setSelectedParticipantId(newParticipant.id);
    } catch (err) {
      console.error('Failed to parse dropped asset', err);
    }
  };

  const selectedParticipant = participants.find(p => p.id === selectedParticipantId);
  const selectedMessage = messages.find(m => m.id === selectedMessageId);
  const selectedMessageIndex = selectedMessage ? messages.findIndex(m => m.id === selectedMessage.id) : -1;
  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  // Canvas Background Panning State
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (dragState) return;

    const target = e.target as HTMLElement;
    const isInteractive = target.closest('button, input, select, textarea, [data-interactive="true"], .cursor-grab, .cursor-grabbing, .cursor-ns-resize, .cursor-ew-resize');
    if (isInteractive && e.button !== 1 && !e.altKey && !e.shiftKey) {
      return;
    }

    if (e.button === 0 || e.button === 1 || e.altKey || e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
    }
  };

  useEffect(() => {
    if (!isPanning) return;
    const handlePointerMove = (e: MouseEvent) => {
      if (onUpdateViewport) {
        onUpdateViewport({
          ...viewport,
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y
        });
      }
    };
    const handlePointerUp = () => {
      setIsPanning(false);
    };
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };
  }, [isPanning, panStart, viewport, onUpdateViewport]);

  // Zoom with Wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!onUpdateViewport) return;
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

  return (
    <div 
      ref={containerRef}
      id="sequence-canvas-root"
      className={`relative w-full h-full overflow-hidden select-none ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
      onClick={handleCanvasClick}
      onMouseDown={handleCanvasMouseDown}
      onWheel={handleWheel}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={handleDropAsset}
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
    >
      <div 
        className="relative w-full h-full min-w-[1300px] min-h-[960px] pb-24"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0'
        }}
      >
        {/* ============================================================== */}
        {/* SEQUENCE STRUCTURAL CANVAS TOP ACTIONS TOOLBAR */}
        {/* ============================================================== */}
        <div className="absolute top-4 left-6 flex items-center gap-2 z-30 font-sans">
          {/* 1. Add Lifeline Participant */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsAddParticipantMenuOpen(!isAddParticipantMenuOpen);
                setIsAddStepMenuOpen(false);
                setIsAddBlockMenuOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#c2652a]/40 text-xs font-semibold text-[#c2652a] hover:bg-[#faf5ee] shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Participant</span>
              <ChevronDown className="w-3 h-3 text-[#c2652a]/70 ml-0.5" />
            </button>

            {isAddParticipantMenuOpen && (
              <div 
                className="absolute top-full left-0 mt-1.5 w-52 bg-[#1f1b18] border border-[#4a4036] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#b0a498] px-2 py-1">
                  Add Lifeline Participant
                </div>
                <div className="flex flex-col gap-0.5">
                  {[
                    { id: 'participant', label: 'Participant Box', icon: Box },
                    { id: 'actor', label: 'Actor (Stickman)', icon: User },
                    { id: 'database', label: 'Database Cylinder', icon: Database },
                    { id: 'queue', label: 'Message Queue', icon: Server },
                    { id: 'boundary', label: 'Boundary Gateway', icon: Shield },
                    { id: 'control', label: 'Control Manager', icon: Layers },
                    { id: 'entity', label: 'Domain Entity', icon: Circle },
                    { id: 'collections', label: 'Collections Cluster', icon: Boxes }
                  ].map(item => {
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleAddParticipant(item.id)}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs text-[#e8dfd5] hover:bg-[#2e2823] transition-colors"
                      >
                        <IconComp className="w-3.5 h-3.5 text-[#d4834f]" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. Add Interaction Step */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsAddStepMenuOpen(!isAddStepMenuOpen);
                setIsAddParticipantMenuOpen(false);
                setIsAddBlockMenuOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c2652a] text-white text-xs font-semibold hover:bg-[#a95420] shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Interaction Step</span>
              <ChevronDown className="w-3 h-3 text-white/80 ml-0.5" />
            </button>

            {isAddStepMenuOpen && (
              <div 
                className="absolute top-full left-0 mt-1.5 w-56 bg-[#1f1b18] border border-[#4a4036] rounded-xl shadow-2xl p-1.5 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#b0a498] px-2 py-1">
                  Interaction Mechanism
                </div>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => handleAddMessage(undefined, undefined, 'requestData()', 'sync')}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs text-[#e8dfd5] hover:bg-[#2e2823] transition-colors"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-[#d4834f]" />
                    <div>
                      <div className="font-semibold">{'Synchronous Call (->)'}</div>
                      <div className="text-[10px] text-[#b0a498]">Blocking procedure call</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleAddMessage(undefined, undefined, 'returnPayload', 'reply')}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs text-[#e8dfd5] hover:bg-[#2e2823] transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-[#d4834f]" />
                    <div>
                      <div className="font-semibold">{'Return / Reply (-->)'}</div>
                      <div className="text-[10px] text-[#b0a498]">Dashed response arrow</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleAddMessage(undefined, undefined, 'publishEvent()', 'async')}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs text-[#e8dfd5] hover:bg-[#2e2823] transition-colors"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-[#d4834f]" />
                    <div>
                      <div className="font-semibold">{'Async Event (->>)'}</div>
                      <div className="text-[10px] text-[#b0a498]">Non-blocking fire & forget</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleAddMessage(undefined, undefined, 'internalLoop()', 'self')}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs text-[#e8dfd5] hover:bg-[#2e2823] transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-[#d4834f]" />
                    <div>
                      <div className="font-semibold">{'Self Call Loop (->)'}</div>
                      <div className="text-[10px] text-[#b0a498]">Internal processing cycle</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Add Block / Fragment Frame */}
          {onUpdateBlocks && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddBlockMenuOpen(!isAddBlockMenuOpen);
                  setIsAddParticipantMenuOpen(false);
                  setIsAddStepMenuOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#4a4036]/30 text-xs font-semibold text-[#4a4036] hover:bg-[#faf5ee] shadow-xs transition-colors"
              >
                <GitBranch className="w-3.5 h-3.5 text-[#c2652a]" />
                <span>+ Fragment Frame</span>
                <ChevronDown className="w-3 h-3 text-[#4a4036]/70 ml-0.5" />
              </button>

              {isAddBlockMenuOpen && (
                <div 
                  className="absolute top-full left-0 mt-1.5 w-52 bg-[#1f1b18] border border-[#4a4036] rounded-xl shadow-2xl p-1.5 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#b0a498] px-2 py-1">
                    Frame Architecture
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {[
                      { id: 'alt', label: 'alt [condition]', desc: 'Conditional branching' },
                      { id: 'opt', label: 'opt [optional]', desc: 'Optional execution block' },
                      { id: 'loop', label: 'loop [items]', desc: 'Repetition iteration' },
                      { id: 'par', label: 'par [threads]', desc: 'Parallel concurrency' },
                      { id: 'critical', label: 'critical', desc: 'Atomic critical section' },
                      { id: 'group', label: 'group', desc: 'Logical grouping box' }
                    ].map(b => (
                      <button
                        key={b.id}
                        onClick={() => handleAddBlock(b.id)}
                        className="flex flex-col px-2 py-1.5 rounded-lg text-left text-xs text-[#e8dfd5] hover:bg-[#2e2823] transition-colors"
                      >
                        <span className="font-mono font-bold text-[#d4834f]">{b.label}</span>
                        <span className="text-[10px] text-[#b0a498]">{b.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Note Button */}
          <button
            onClick={() => {
              if (messages.length > 0) {
                const lastMsg = messages[messages.length - 1];
                onUpdateMessages(messages.map(m => m.id === lastMsg.id ? { ...m, noteText: 'Note: TLS 1.3 verified' } : m));
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#4a4036]/30 text-xs font-semibold text-[#4a4036] hover:bg-[#faf5ee] shadow-xs transition-colors"
            title="Add note over latest step"
          >
            <FileText className="w-3.5 h-3.5 text-[#b8860b]" />
            <span>+ Note</span>
          </button>

          {/* Magnet Snap Toggle Button */}
          {onToggleSnap && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSnap();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
                snapToGrid
                  ? 'bg-[#c2652a] text-white border-[#a95420]'
                  : 'bg-white text-[#78706a] border-[#d8d0c8] hover:border-[#c2652a]'
              }`}
              title={snapToGrid ? "Snap to Grid active (16px) - Click to toggle" : "Snap to Grid disabled - Click to enable"}
            >
              <Magnet className={`w-3.5 h-3.5 ${snapToGrid ? 'text-white' : 'text-[#c2652a]'}`} />
              <span>Snap: {snapToGrid ? 'ON (16px)' : 'OFF'}</span>
            </button>
          )}
        </div>

        {/* ============================================================== */}
        {/* ALTERNATIVE / LOOP / PAR BLOCKS (PlantUML Fragment Frames)     */}
        {/* ============================================================== */}
        {blocks.map(block => {
          const isDraggingThisBlock = (dragState?.type === 'block' || dragState?.type === 'block-resize') && dragState.id === block.id;
          const effectiveStartOrder = isDraggingThisBlock && dragState.targetStartOrder !== undefined
            ? dragState.targetStartOrder
            : block.startOrder;
          const effectiveEndOrder = isDraggingThisBlock && dragState.targetEndOrder !== undefined
            ? dragState.targetEndOrder
            : block.endOrder;

          const topY = TOP_LIFELINE_Y + effectiveStartOrder * MESSAGE_SPACING - 32;
          const bottomY = TOP_LIFELINE_Y + effectiveEndOrder * MESSAGE_SPACING + 28;
          const width = (participants.length - 1) * PARTICIPANT_SPACING + 200;
          const isSelected = selectedBlockId === block.id;

          return (
            <div
              key={block.id}
              className={`absolute left-[50px] transition-all ${
                isSelected 
                  ? 'z-35 border-2 border-[#c2652a] bg-[#c2652a]/5 shadow-md' 
                  : 'z-5 border border-[#333333]/70 bg-[#FEFECE]/15 hover:border-[#c2652a]/70'
              } ${isDraggingThisBlock ? 'opacity-90 shadow-lg' : ''}`}
              style={{
                top: topY,
                height: Math.max(70, bottomY - topY),
                width
              }}
              onClick={(e) => {
                e.stopPropagation();
                selectBlock(block);
              }}
            >
              {/* Top resize edge handle for snapping start step */}
              <div 
                className="absolute top-0 left-0 w-full h-2 cursor-ns-resize hover:bg-[#c2652a]/40 z-20"
                title="Drag to snap top edge to interaction step"
                onPointerDown={(e) => startResizeBlock(block.id, 'top', e)}
              />

              {/* Bottom resize edge handle for snapping end step */}
              <div 
                className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize hover:bg-[#c2652a]/40 z-20"
                title="Drag to snap bottom edge to interaction step"
                onPointerDown={(e) => startResizeBlock(block.id, 'bottom', e)}
              />

              {/* PlantUML Frame Tag Pentagon */}
              <div 
                className="absolute -top-[1px] -left-[1px] flex items-center shadow-xs cursor-grab active:cursor-grabbing group/frametag"
                onPointerDown={(e) => startDragBlock(block.id, e)}
              >
                <div className="bg-[#EEEEEE] border-r border-b border-[#333333] px-2.5 py-1 text-[11px] font-bold text-[#333333] flex items-center gap-1.5 select-none hover:bg-white">
                  <GripVertical className="w-3 h-3 text-[#c2652a]/80" />
                  <span className="font-bold uppercase font-mono text-[#A80036]">{block.type}</span>
                  {block.condition && (
                    <span className="font-semibold text-gray-800 font-mono">[{block.condition}]</span>
                  )}
                  {block.label && (
                    <span className="font-normal text-gray-700 italic ml-1">{block.label}</span>
                  )}
                </div>
              </div>

              {/* Floating Block Toolbar when selected */}
              {isSelected && (
                <SequenceBlockBar
                  block={block}
                  maxSteps={messages.length}
                  onUpdateBlock={(patch) => {
                    if (onUpdateBlocks) {
                      onUpdateBlocks(blocks.map(b => b.id === block.id ? { ...b, ...patch } : b));
                    }
                  }}
                  onDelete={() => {
                    if (onUpdateBlocks) {
                      onUpdateBlocks(blocks.filter(b => b.id !== block.id));
                      setSelectedBlockId(null);
                    }
                  }}
                />
              )}
            </div>
          );
        })}

        {/* ============================================================== */}
        {/* LIFELINES AND PARTICIPANTS                                     */}
        {/* ============================================================== */}
        {participants.map((p, pIdx) => {
          const x = getRenderParticipantX(p.id);
          const y = getRenderParticipantY(p.id);
          const isSelected = selectedParticipantId === p.id;
          const isEditing = editingParticipantId === p.id;
          const isDraggingThis = dragState?.type === 'participant' && dragState.id === p.id;
          const colorCfg = getColorConfig(p.color || 'sand');
          const isActor = p.type === 'actor';
          const isDatabase = p.type === 'database';
          const isQueue = p.type === 'queue';
          const isBoundary = p.type === 'boundary';
          const isControl = p.type === 'control';
          const isEntity = p.type === 'entity';
          const isCollections = p.type === 'collections';

          // Participant active messages for activation boxes
          const participantMessages = messages.map((m, idx) => ({ m, idx })).filter(
            item => item.m.to === p.id || item.m.from === p.id
          );

          return (
            <div 
              key={p.id} 
              className={`absolute transition-all ${isSelected ? 'z-40' : 'z-20'} ${isDraggingThis ? 'opacity-90 scale-102' : ''}`} 
              style={{ 
                left: x, 
                top: y,
                filter: isDraggingThis ? 'drop-shadow(0 12px 24px rgba(0,0,0,0.22))' : undefined
              }}
            >
              {/* TOP PARTICIPANT HEADER WITH FREE-FORM MOVE & SNAP */}
              <div 
                className="relative -translate-x-1/2 cursor-grab active:cursor-grabbing flex flex-col items-center group/header"
                onPointerDown={(e) => startDragParticipant(p.id, e)}
                onClick={(e) => {
                  e.stopPropagation();
                  selectParticipant(p);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditLabel(p.name);
                  setEditingParticipantId(p.id);
                }}
              >
                {/* Move Lifeline Left & Right Quick Reorder Buttons */}
                <div className="opacity-0 group-hover/header:opacity-100 transition-opacity text-[10px] flex items-center gap-1 -top-6 absolute whitespace-nowrap bg-white/95 px-1 py-0.5 rounded shadow-2xs border border-[#d8d0c8] z-30 pointer-events-auto">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveParticipant(p.id, 'left');
                    }}
                    disabled={pIdx === 0}
                    className="w-4 h-4 rounded hover:bg-[#c2652a] hover:text-white text-[#605850] disabled:opacity-20 flex items-center justify-center cursor-pointer text-[9px] font-bold transition-colors"
                    title="Move Lifeline Left (←)"
                  >
                    ◀
                  </button>
                  <span className="text-[9px] font-mono text-[#c2652a] font-bold px-0.5">#{pIdx + 1}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveParticipant(p.id, 'right');
                    }}
                    disabled={pIdx === participants.length - 1}
                    className="w-4 h-4 rounded hover:bg-[#c2652a] hover:text-white text-[#605850] disabled:opacity-20 flex items-center justify-center cursor-pointer text-[9px] font-bold transition-colors"
                    title="Move Lifeline Right (→)"
                  >
                    ▶
                  </button>
                  <div className="w-[1px] h-3 bg-[#d8d0c8] mx-0.5" />
                  <span className="text-[9px] text-[#8c8278] flex items-center gap-0.5"><Move className="w-2 h-2" /> Snap</span>
                </div>
                {/* 1. ACTOR (Stickman) */}
                {isActor ? (
                  <div className={`flex flex-col items-center p-1 rounded-xl transition-all ${
                    isSelected ? 'ring-2 ring-[#c2652a] bg-white/60 shadow-md' : 'hover:scale-105'
                  }`}>
                    <StickmanActorShape color={colorCfg.hex || '#A80036'} size={42} />
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        onBlur={() => commitParticipantEdit(p.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitParticipantEdit(p.id);
                          if (e.key === 'Escape') setEditingParticipantId(null);
                        }}
                        className="mt-1 text-xs font-bold text-center border border-[#A80036] rounded px-1 outline-none bg-white font-sans w-24"
                      />
                    ) : (
                      <span className="text-xs font-bold text-[#181818] font-sans mt-0.5 text-center">{p.name}</span>
                    )}
                    {p.stereotype && (
                      <span className="text-[10px] font-mono text-[#c2652a] font-bold">{p.stereotype}</span>
                    )}
                  </div>
                ) : isDatabase ? (
                  /* 2. DATABASE (3D Cylinder) */
                  <div className={`relative flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
                    isSelected ? 'ring-2 ring-[#c2652a] shadow-md' : 'hover:scale-102'
                  }`}>
                    <div className="relative w-32 h-14 flex items-center justify-center">
                      <CylinderDatabaseShape 
                        width={128} 
                        height={54} 
                        fill={colorCfg.bgHex || '#FEFECE'} 
                        stroke={colorCfg.borderHex || '#A80036'} 
                        isSelected={isSelected}
                      />
                      <div className="relative z-10 flex flex-col items-center px-2">
                        {isEditing ? (
                          <input
                            autoFocus
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            onBlur={() => commitParticipantEdit(p.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitParticipantEdit(p.id);
                              if (e.key === 'Escape') setEditingParticipantId(null);
                            }}
                            className="text-xs font-bold text-center border border-[#A80036] rounded px-1 outline-none bg-white w-24 font-sans"
                          />
                        ) : (
                          <>
                            <span className="text-xs font-bold text-[#181818] font-sans truncate max-w-[110px]">{p.name}</span>
                            {p.stereotype && <span className="text-[9px] font-mono text-[#c2652a] font-bold">{p.stereotype}</span>}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : isQueue ? (
                  /* 3. MESSAGE QUEUE */
                  <div className={`relative flex flex-col items-center justify-center p-1 rounded-xl transition-all ${
                    isSelected ? 'ring-2 ring-[#c2652a] shadow-md' : 'hover:scale-102'
                  }`}>
                    <div className="relative w-32 h-13 flex items-center justify-center">
                      <QueueShape 
                        width={128} 
                        height={50} 
                        fill={colorCfg.bgHex || '#FEFECE'} 
                        stroke={colorCfg.borderHex || '#A80036'} 
                        isSelected={isSelected}
                      />
                      <div className="relative z-10 flex flex-col items-center px-2">
                        {isEditing ? (
                          <input
                            autoFocus
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            onBlur={() => commitParticipantEdit(p.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitParticipantEdit(p.id);
                              if (e.key === 'Escape') setEditingParticipantId(null);
                            }}
                            className="text-xs font-bold text-center border border-[#A80036] rounded px-1 outline-none bg-white w-24 font-sans"
                          />
                        ) : (
                          <>
                            <span className="text-xs font-bold text-[#181818] font-sans truncate max-w-[110px]">{p.name}</span>
                            {p.stereotype && <span className="text-[9px] font-mono text-[#c2652a] font-bold">{p.stereotype}</span>}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : isBoundary ? (
                  /* 4. BOUNDARY GATEWAY */
                  <div className={`flex flex-col items-center p-1 rounded-xl transition-all ${
                    isSelected ? 'ring-2 ring-[#c2652a] bg-white/60 shadow-md' : 'hover:scale-105'
                  }`}>
                    <BoundaryIconShape size={40} color={colorCfg.hex || '#A80036'} fill={colorCfg.bgHex || '#FEFECE'} />
                    <span className="text-xs font-bold text-[#181818] font-sans mt-0.5">{p.name}</span>
                    {p.stereotype && <span className="text-[9px] font-mono text-[#c2652a] font-bold">{p.stereotype}</span>}
                  </div>
                ) : isControl ? (
                  /* 5. CONTROL MANAGER */
                  <div className={`flex flex-col items-center p-1 rounded-xl transition-all ${
                    isSelected ? 'ring-2 ring-[#c2652a] bg-white/60 shadow-md' : 'hover:scale-105'
                  }`}>
                    <ControlIconShape size={40} color={colorCfg.hex || '#A80036'} fill={colorCfg.bgHex || '#FEFECE'} />
                    <span className="text-xs font-bold text-[#181818] font-sans mt-0.5">{p.name}</span>
                    {p.stereotype && <span className="text-[9px] font-mono text-[#c2652a] font-bold">{p.stereotype}</span>}
                  </div>
                ) : isEntity ? (
                  /* 6. DOMAIN ENTITY */
                  <div className={`flex flex-col items-center p-1 rounded-xl transition-all ${
                    isSelected ? 'ring-2 ring-[#c2652a] bg-white/60 shadow-md' : 'hover:scale-105'
                  }`}>
                    <EntityCircleIconShape size={40} color={colorCfg.hex || '#A80036'} fill={colorCfg.bgHex || '#FEFECE'} />
                    <span className="text-xs font-bold text-[#181818] font-sans mt-0.5">{p.name}</span>
                    {p.stereotype && <span className="text-[9px] font-mono text-[#c2652a] font-bold">{p.stereotype}</span>}
                  </div>
                ) : isCollections ? (
                  /* 7. COLLECTIONS CLUSTER */
                  <div className={`relative flex flex-col items-center justify-center p-1 rounded-xl transition-all ${
                    isSelected ? 'ring-2 ring-[#c2652a] shadow-md' : 'hover:scale-102'
                  }`}>
                    <div className="relative w-34 h-14 flex items-center justify-center">
                      <CollectionsShape 
                        width={136} 
                        height={52} 
                        fill={colorCfg.bgHex || '#FEFECE'} 
                        stroke={colorCfg.borderHex || '#A80036'} 
                        isSelected={isSelected}
                      />
                      <div className="relative z-10 flex flex-col items-center px-2">
                        <span className="text-xs font-bold text-[#181818] font-sans truncate max-w-[110px]">{p.name}</span>
                        {p.stereotype && <span className="text-[9px] font-mono text-[#c2652a] font-bold">{p.stereotype}</span>}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 8. STANDARD PLANTUML PARTICIPANT BOX */
                  <div 
                    className={`relative w-36 py-2 px-2.5 rounded-lg border text-center transition-all ${
                      isSelected 
                        ? 'ring-2 ring-[#c2652a] border-[#c2652a] shadow-md scale-102' 
                        : 'border-[#A80036] hover:border-[#c2652a]'
                    }`}
                    style={{
                      backgroundColor: colorCfg.bgHex || '#FEFECE',
                      borderColor: isSelected ? '#c2652a' : (colorCfg.borderHex || '#A80036'),
                      filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.14))'
                    }}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-1 w-full">
                        <input
                          autoFocus
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          onBlur={() => commitParticipantEdit(p.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitParticipantEdit(p.id);
                            if (e.key === 'Escape') setEditingParticipantId(null);
                          }}
                          className="w-full text-xs font-bold text-center border border-[#A80036] rounded px-1 outline-none bg-white font-sans"
                        />
                        <button onClick={() => commitParticipantEdit(p.id)}>
                          <Check className="w-3 h-3 text-[#A80036]" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="text-xs font-bold text-[#181818] font-sans truncate w-full">{p.name}</div>
                        {(p.stereotype || p.sublabel) && (
                          <div className="text-[10px] text-[#c2652a] font-mono font-bold">
                            {p.stereotype || (p.sublabel ? `«${p.sublabel}»` : '')}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* MODULAR VERBAL QUICK ACTION BAR ON SELECTED PARTICIPANT */}
              {isSelected && (
                <SequenceParticipantBar
                  participant={p}
                  allParticipants={participants}
                  onUpdateParticipant={(patch) => {
                    onUpdateParticipants(participants.map(item => item.id === p.id ? { ...item, ...patch } : item));
                  }}
                  onAddMessage={(targetId, label, type) => {
                    handleAddMessage(p.id, targetId, label, type);
                  }}
                  onDuplicate={() => {
                    const cloned: SequenceParticipant = {
                      ...p,
                      id: `${p.type || 'part'}_${Date.now()}`,
                      name: `${p.name} Copy`
                    };
                    const idx = participants.findIndex(item => item.id === p.id);
                    const updated = [...participants];
                    updated.splice(idx + 1, 0, cloned);
                    onUpdateParticipants(updated);
                    setSelectedParticipantId(cloned.id);
                  }}
                  onAddNote={(text) => {
                    if (messages.length > 0) {
                      onUpdateMessages(messages.map((m, idx) => idx === messages.length - 1 ? { ...m, noteText: text } : m));
                    }
                  }}
                  onMoveLeft={() => handleMoveParticipant(p.id, 'left')}
                  onMoveRight={() => handleMoveParticipant(p.id, 'right')}
                  onDelete={() => handleDeleteParticipant(p.id)}
                />
              )}

              {/* VERTICAL LIFELINE LINE (PlantUML Crimson Dashed) */}
              <div 
                className="absolute left-0 top-16 w-[2px] -translate-x-1/2 border-l-2 border-dashed border-[#A80036]/50 z-10"
                style={{ height: TOTAL_HEIGHT - 80 }}
              />

              {/* PlantUML Activation Box Overlays along lifeline */}
              {participantMessages.map(({ m, idx }) => {
                const actY = TOP_LIFELINE_Y + (idx + 1) * MESSAGE_SPACING - 58;
                return (
                  <div
                    key={`act-${m.id}`}
                    className="absolute left-0 -translate-x-1/2 w-2.5 bg-[#FEFECE] border border-[#A80036] rounded-2xs z-15 pointer-events-none"
                    style={{
                      top: actY,
                      height: 28,
                      filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.1))'
                    }}
                  />
                );
              })}

              {/* BOTTOM PARTICIPANT ANCHOR */}
              <div 
                className="absolute -translate-x-1/2 flex flex-col items-center justify-center text-center z-20 cursor-grab active:cursor-grabbing"
                style={{ top: TOTAL_HEIGHT }}
                onPointerDown={(e) => startDragParticipant(p.id, e)}
                onClick={(e) => {
                  e.stopPropagation();
                  selectParticipant(p);
                }}
              >
                {isActor ? (
                  <>
                    <StickmanActorShape color={colorCfg.hex || '#A80036'} size={28} />
                    <span className="text-[11px] font-bold text-[#181818] font-sans mt-0.5">{p.name}</span>
                  </>
                ) : (
                  <div 
                    className="w-32 py-1 rounded-xs border text-center text-[11px] font-bold text-[#181818] font-sans"
                    style={{ 
                      backgroundColor: colorCfg.bgHex || '#FEFECE',
                      borderColor: colorCfg.borderHex || '#A80036',
                      filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.12))' 
                    }}
                  >
                    {p.name}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* ============================================================== */}
        {/* SEQUENCE MESSAGES (Horizontal Arrows & Verbal Toolbars)        */}
        {/* ============================================================== */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {messages.map((msg, idx) => {
            const isDraggingThisMsg = dragState?.type === 'message' && dragState.id === msg.id;
            const defaultY = TOP_LIFELINE_Y + (idx + 1) * MESSAGE_SPACING;
            const y = getRenderMessageY(msg.id, defaultY);

            const isDraggingEndpoint = dragState?.type === 'message-endpoint' && dragState.id === msg.id;
            const fromX = (isDraggingEndpoint && dragState.endpoint === 'from') 
              ? dragState.snappedX 
              : getRenderParticipantX(msg.from);
            const toX = (isDraggingEndpoint && dragState.endpoint === 'to') 
              ? dragState.snappedX 
              : getRenderParticipantX(msg.to);

            const isSelected = selectedMessageId === msg.id;
            const isEditing = editingMessageId === msg.id;
            const isSelf = msg.from === msg.to;
            const isLeftToRight = toX >= fromX;
            const msgFromIdx = participants.findIndex(p => p.id === msg.from);
            const msgToIdx = participants.findIndex(p => p.id === msg.to);
            const canShiftLeft = msgFromIdx > 0 && msgToIdx > 0;
            const canShiftRight = msgFromIdx >= 0 && msgToIdx >= 0 && msgFromIdx < participants.length - 1 && msgToIdx < participants.length - 1;

            const minX = Math.min(fromX, toX);
            const arrowWidth = Math.max(16, Math.abs(toX - fromX));

            return (
              <div
                key={msg.id}
                className={`absolute pointer-events-auto transition-all ${
                  isSelected ? 'z-40' : 'z-25'
                } ${isDraggingThisMsg ? 'opacity-90 scale-102' : ''}`}
                style={{ 
                  top: y, 
                  left: isSelf ? fromX : minX, 
                  width: isSelf ? 90 : arrowWidth,
                  filter: isDraggingThisMsg ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))' : undefined
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  selectMessage(msg);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditLabel(msg.label);
                  setEditingMessageId(msg.id);
                }}
              >
                {/* 1. SELF PROCESSING CALL */}
                {isSelf ? (
                  <div className="relative group cursor-pointer">
                    <svg width="70" height="40" className="overflow-visible">
                      <path
                        d="M 0 0 L 36 0 C 50 0 50 26 36 26 L 4 26"
                        fill="none"
                        stroke={isSelected ? '#c2652a' : '#A80036'}
                        strokeWidth={isSelected ? 2.5 : 1.8}
                      />
                      <polygon points="4,22 4,30 0,26" fill={isSelected ? '#c2652a' : '#A80036'} />
                    </svg>

                    {/* Self Call Label */}
                    <div 
                      className="absolute -top-4 left-6 flex items-center gap-1 text-[11px] font-sans font-medium text-[#181818] whitespace-nowrap bg-[#FEFECE]/95 px-1.5 py-0.5 border border-[#A80036]/40 rounded shadow-2xs group-hover:border-[#c2652a] cursor-grab active:cursor-grabbing"
                      onPointerDown={(e) => startDragMessage(msg.id, e)}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShiftMessageHorizontal(msg.id, 'left');
                        }}
                        disabled={msgFromIdx <= 0}
                        className="w-3.5 h-3.5 rounded hover:bg-[#c2652a] hover:text-white text-[#605850] disabled:opacity-20 flex items-center justify-center cursor-pointer text-[9px] font-bold transition-colors"
                        title="Shift Self-Call Left across lifelines (←)"
                      >
                        ◀
                      </button>

                      <GripHorizontal className="w-3 h-3 text-[#c2652a]/70" />
                      <span className="text-[10px] font-bold text-[#A80036]">{idx + 1}:</span>
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          onBlur={() => commitMessageEdit(msg.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitMessageEdit(msg.id);
                            if (e.key === 'Escape') setEditingMessageId(null);
                          }}
                          className="text-xs font-semibold outline-none border-b border-[#A80036] bg-transparent"
                        />
                      ) : (
                        <span>{msg.label}</span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShiftMessageHorizontal(msg.id, 'right');
                        }}
                        disabled={msgFromIdx >= participants.length - 1}
                        className="w-3.5 h-3.5 rounded hover:bg-[#c2652a] hover:text-white text-[#605850] disabled:opacity-20 flex items-center justify-center cursor-pointer text-[9px] font-bold transition-colors"
                        title="Shift Self-Call Right across lifelines (→)"
                      >
                        ▶
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 2. HORIZONTAL MESSAGE ARROW */
                  <div className="relative group w-full flex flex-col items-center cursor-pointer">
                    {/* Message Label Box directly above arrow */}
                    <div 
                      className={`absolute -top-6 flex items-center gap-1.5 px-2 py-0.5 rounded-2xs border transition-all cursor-grab active:cursor-grabbing ${
                        isSelected 
                          ? 'bg-white border-[#c2652a] shadow-sm text-[#181818]' 
                          : 'bg-[#FEFECE]/95 border-[#A80036]/40 group-hover:border-[#A80036] text-[#181818] shadow-2xs'
                      }`}
                      onPointerDown={(e) => startDragMessage(msg.id, e)}
                      title="Drag vertically to snap steps, or drag horizontally across lifelines"
                    >
                      {/* Quick Shift Left Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShiftMessageHorizontal(msg.id, 'left');
                        }}
                        disabled={!canShiftLeft}
                        className="w-3.5 h-3.5 rounded hover:bg-[#c2652a] hover:text-white text-[#605850] disabled:opacity-20 flex items-center justify-center cursor-pointer text-[9px] font-bold transition-colors"
                        title="Shift Left across lifelines (←)"
                      >
                        ◀
                      </button>

                      <GripHorizontal className="w-3 h-3 text-[#c2652a]/70" />
                      <span className="text-[10px] font-mono font-bold text-[#A80036]">{idx + 1}:</span>
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          onBlur={() => commitMessageEdit(msg.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitMessageEdit(msg.id);
                            if (e.key === 'Escape') setEditingMessageId(null);
                          }}
                          className="text-xs font-semibold text-[#181818] outline-none border-b border-[#A80036] px-1 bg-transparent font-sans"
                        />
                      ) : (
                        <span className="text-xs font-medium font-sans">{msg.label}</span>
                      )}

                      {/* Direction Flip Badge: L➔R or R➔L */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSwapMessageDirection(msg.id);
                        }}
                        className="text-[9px] font-mono font-bold px-1 rounded bg-[#FEFECE] hover:bg-[#c2652a] hover:text-white border border-[#A80036]/30 text-[#A80036] transition-colors cursor-pointer"
                        title="Click to flip flow direction (Left-to-Right ⇄ Right-to-Left)"
                      >
                        {isLeftToRight ? 'L➔R' : 'R➔L'}
                      </button>

                      <span className="text-[9px] text-[#A80036] font-mono uppercase bg-white/90 px-1 rounded border border-[#A80036]/20">
                        {msg.type || 'sync'}
                      </span>

                      {/* Quick Shift Right Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShiftMessageHorizontal(msg.id, 'right');
                        }}
                        disabled={!canShiftRight}
                        className="w-3.5 h-3.5 rounded hover:bg-[#c2652a] hover:text-white text-[#605850] disabled:opacity-20 flex items-center justify-center cursor-pointer text-[9px] font-bold transition-colors"
                        title="Shift Right across lifelines (→)"
                      >
                        ▶
                      </button>
                    </div>

                    {/* Left and Right Endpoint Snapping Handles when selected */}
                    {isSelected && (
                      <>
                        <div 
                          className="absolute -left-2 top-1 w-4 h-4 rounded-full bg-[#c2652a] border-2 border-white shadow-md cursor-ew-resize hover:scale-125 z-50 transition-transform flex items-center justify-center pointer-events-auto"
                          title="Drag to snap start to any lifeline"
                          onPointerDown={(e) => startDragEndpoint(msg.id, isLeftToRight ? 'from' : 'to', e)}
                        >
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        </div>
                        <div 
                          className="absolute -right-2 top-1 w-4 h-4 rounded-full bg-[#c2652a] border-2 border-white shadow-md cursor-ew-resize hover:scale-125 z-50 transition-transform flex items-center justify-center pointer-events-auto"
                          title="Drag to snap target to any lifeline"
                          onPointerDown={(e) => startDragEndpoint(msg.id, isLeftToRight ? 'to' : 'from', e)}
                        >
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        </div>
                      </>
                    )}

                    {/* SVG Arrow Line */}
                    <svg width="100%" height="22" className="overflow-visible">
                      <defs>
                        <marker
                          id={`arrow-filled-${msg.id}`}
                          viewBox="0 0 10 10"
                          refX={isLeftToRight ? "8" : "2"}
                          refY="5"
                          markerWidth="6"
                          markerHeight="6"
                          orient="auto-start-reverse"
                        >
                          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={isSelected ? '#c2652a' : '#A80036'} />
                        </marker>
                        <marker
                          id={`arrow-open-${msg.id}`}
                          viewBox="0 0 10 10"
                          refX={isLeftToRight ? "8" : "2"}
                          refY="5"
                          markerWidth="6"
                          markerHeight="6"
                          orient="auto-start-reverse"
                        >
                          <path d="M 0 1.5 L 8 5 L 0 8.5" fill="none" stroke={isSelected ? '#c2652a' : '#A80036'} strokeWidth="1.6" />
                        </marker>
                      </defs>

                      <line
                        x1={isLeftToRight ? 0 : arrowWidth}
                        y1="11"
                        x2={isLeftToRight ? arrowWidth : 0}
                        y2="11"
                        stroke={isSelected ? '#c2652a' : '#A80036'}
                        strokeWidth={isSelected ? 2.5 : (msg.type === 'async' ? 2.2 : 1.8)}
                        strokeDasharray={msg.type === 'reply' ? '5,4' : undefined}
                        markerEnd={msg.type === 'async' ? `url(#arrow-open-${msg.id})` : `url(#arrow-filled-${msg.id})`}
                      />
                    </svg>

                    {/* Attached Note over Lifeline */}
                    {msg.noteText && (
                      <div 
                        className="absolute -top-14 right-2 flex items-center gap-1.5 p-1.5 bg-[#FEFFDD] border border-[#A80036] rounded-xs shadow-xs text-[10px] font-sans text-[#181818] max-w-[140px]"
                        style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.1))' }}
                      >
                        <FileText className="w-3 h-3 text-[#c2652a] shrink-0" />
                        <span className="truncate">{msg.noteText}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* MODULAR VERBAL MESSAGE TOOLBAR ON SELECT */}
                {isSelected && (
                  <SequenceMessageBar
                    message={msg}
                    allParticipants={participants}
                    messagesCount={messages.length}
                    messageIndex={idx}
                    onUpdateMessage={(patch) => {
                      onUpdateMessages(messages.map(m => m.id === msg.id ? { ...m, ...patch } : m));
                    }}
                    onSwapDirection={() => handleSwapMessageDirection(msg.id)}
                    onShiftHorizontal={(direction) => handleShiftMessageHorizontal(msg.id, direction)}
                    onMoveStep={(direction) => handleMoveMessageStep(idx, direction)}
                    onDelete={() => {
                      onUpdateMessages(messages.filter(m => m.id !== msg.id));
                      setSelectedMessageId(null);
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ============================================================== */}
        {/* MAGNETIC SNAP GUIDE LINES & HUD INDICATOR                     */}
        {/* ============================================================== */}
        {snapGuide && (
          <div className="absolute inset-0 pointer-events-none z-50">
            {/* Vertical Snap Guide Line */}
            {snapGuide.x !== undefined && (
              <div 
                className="absolute top-0 bottom-0 border-r-2 border-dashed border-[#c2652a] shadow-sm animate-pulse"
                style={{ left: snapGuide.x }}
              >
                <div className="absolute top-12 -left-12 bg-[#c2652a] text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow-md whitespace-nowrap">
                  X: {snapGuide.x}px
                </div>
              </div>
            )}

            {/* Horizontal Snap Guide Line */}
            {snapGuide.y !== undefined && (
              <div 
                className="absolute left-0 right-0 border-b-2 border-dashed border-[#c2652a] shadow-sm animate-pulse"
                style={{ top: snapGuide.y }}
              >
                <div className="absolute -top-3.5 left-8 bg-[#c2652a] text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow-md whitespace-nowrap">
                  Y: {snapGuide.y}px
                </div>
              </div>
            )}
          </div>
        )}

        {/* Floating Magnetic HUD Tooltip */}
        {snapGuide && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#1f1b18] text-white border border-[#c2652a] px-3.5 py-2 rounded-xl shadow-2xl text-xs font-mono flex items-center gap-2.5 pointer-events-none animate-in fade-in zoom-in-95">
            <Magnet className="w-4 h-4 text-[#d4834f] animate-bounce" />
            <span className="font-semibold text-[#f5ebe1]">{snapGuide.label}</span>
          </div>
        )}
      </div>

      {/* Floating Canvas Controls Dock (Bottom Right) */}
      <aside className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-md border border-[#d8d0c8]/80 shadow-md rounded-xl p-1.5 z-40 text-xs select-none">
        <button
          id="btn-seq-zoom-out"
          onClick={() => onUpdateViewport?.({ ...viewport, zoom: Math.max(viewport.zoom * 0.85, 0.3) })}
          className="p-1.5 rounded-lg hover:bg-[#faf5ee] text-[#3a302a] hover:text-[#c2652a] transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <span 
          onClick={() => onUpdateViewport?.({ ...viewport, zoom: 1 })}
          className="px-1.5 font-mono text-[11px] text-[#78706a] hover:text-[#c2652a] cursor-pointer"
          title="Click to reset to 100%"
        >
          {Math.round(viewport.zoom * 100)}%
        </span>

        <button
          id="btn-seq-zoom-in"
          onClick={() => onUpdateViewport?.({ ...viewport, zoom: Math.min(viewport.zoom * 1.15, 2.5) })}
          className="p-1.5 rounded-lg hover:bg-[#faf5ee] text-[#3a302a] hover:text-[#c2652a] transition-colors cursor-pointer"
          title="Zoom In"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-[#d8d0c8]/60 mx-0.5" />

        <button
          id="btn-seq-center-view"
          onClick={() => onUpdateViewport?.({ x: 60, y: 40, zoom: 1 })}
          className="p-1.5 rounded-lg hover:bg-[#faf5ee] text-[#3a302a] hover:text-[#c2652a] transition-colors cursor-pointer"
          title="Reset Canvas Position"
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>

        {onToggleSnap && (
          <button
            id="btn-seq-snap-grid"
            onClick={onToggleSnap}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              snapToGrid ? 'bg-[#c2652a]/15 text-[#c2652a]' : 'text-[#78706a] hover:bg-[#faf5ee]'
            }`}
            title={snapToGrid ? 'Grid Snap: ON' : 'Grid Snap: OFF'}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
        )}
      </aside>

      {/* Mini Pan hint indicator */}
      <div className="absolute bottom-4 left-4 pointer-events-none text-[11px] text-[#78706a]/70 flex items-center gap-1 bg-[#faf5ee]/80 px-2 py-1 rounded-md border border-[#d8d0c8]/40 backdrop-blur-xs z-30 select-none">
        <Move className="w-3 h-3" />
        <span>Drag canvas to pan • Wheel to zoom</span>
      </div>
    </div>
  );
};
