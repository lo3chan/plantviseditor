import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  User, 
  Users,
  Server, 
  Layers, 
  Radio, 
  Bot, 
  Box, 
  Folder as FolderIcon, 
  FileText, 
  Database,
  ExternalLink,
  Monitor,
  Mail,
  PhoneCall,
  MessageSquare,
  Info,
  Terminal,
  Code,
  List
} from 'lucide-react';
import { DiagramNode, PortPosition, ErColumn, ObjectSlot, MapEntry } from '../types';
import { getColorConfig } from '../utils/assetsData';
import { getOptimalNodeDimensions } from '../utils/nodeSizing';
import {
  CylinderDatabaseShape,
  QueueShape,
  Node3dShape,
  FolderShape,
  FrameShape,
  ComponentTabsShape,
  NoteFoldShape,
  FileFoldShape,
  HexagonShape,
  CloudShape,
  StickmanActorShape,
  ArchiMateWatermark,
  AwsGlyph,
  AzureGlyph,
  GcpGlyph,
  K8sGlyph,
  CloudNativeGlyph,
  PackageShape,
  UseCaseShape,
  CollectionsShape,
  BoundaryIconShape,
  ControlIconShape,
  EntityCircleIconShape,
  ActivityStartShape,
  ActivityStopShape,
  DecisionDiamondShape,
  SyncBarShape,
  StateBoxShape,
  C4DbBadge,
  C4QueueBadge,
  C4ComponentBadge,
  C4PersonAvatar,
  ActivityFlowFinalShape,
  StateHistoryShape,
  SaltWireframeMockup,
  DitaaAsciiMockup,
  MathFormulaCard,
  JsonYamlTreeViewer,
  WbsCardShape
} from './PlantUMLShapes';

interface DiagramNodeProps {
  node: DiagramNode;
  isSelected: boolean;
  isDropTarget?: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onUpdate: (updatedNode: Partial<DiagramNode>) => void;
  onStartConnection: (nodeId: string, port: PortPosition, e: React.MouseEvent) => void;
  onQuickAddChild?: (nodeId: string, port: PortPosition) => void;
  onStartResize?: (nodeId: string, direction: 'se' | 'e' | 's', e: React.MouseEvent) => void;
}

export const DiagramNodeView: React.FC<DiagramNodeProps> = ({
  node,
  isSelected,
  isDropTarget = false,
  onSelect,
  onUpdate,
  onStartConnection,
  onQuickAddChild,
  onStartResize
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(node.label);
  const [editSublabel, setEditSublabel] = useState(node.sublabel || '');
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const colorConfig = getColorConfig(node.color);

  // Content-aware optimal dimensions ensuring everything starts out visible
  // while allowing the user full freedom to resize smaller or larger
  const optimal = getOptimalNodeDimensions(node);
  const effectiveWidth = node.width ?? optimal.width;
  const effectiveHeight = node.height ?? optimal.height;

  useEffect(() => {
    setEditLabel(node.label);
    setEditSublabel(node.sublabel || '');
  }, [node.label, node.sublabel]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleCommitEdit = () => {
    setIsEditing(false);
    onUpdate({
      label: editLabel.trim() || node.label,
      sublabel: editSublabel.trim() || undefined
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommitEdit();
    } else if (e.key === 'Escape') {
      setEditLabel(node.label);
      setEditSublabel(node.sublabel || '');
      setIsEditing(false);
    }
  };

  // Inline member editing state (attributes, methods, ER columns, map entries, slots)
  const [editingMember, setEditingMember] = useState<{
    type: 'attr' | 'method' | 'col-name' | 'col-type' | 'map-key' | 'map-val' | 'slot-key' | 'slot-val';
    index: number;
  } | null>(null);
  const [memberInputVal, setMemberInputVal] = useState('');

  const handleCommitMemberEdit = () => {
    if (!editingMember) return;
    const { type, index } = editingMember;
    const val = memberInputVal.trim();

    if (type === 'attr') {
      const attrs = [...(node.data?.attributes || [])];
      if (val) attrs[index] = val;
      onUpdate({ data: { ...node.data, attributes: attrs } });
    } else if (type === 'method') {
      const methods = [...(node.data?.methods || [])];
      if (val) methods[index] = val;
      onUpdate({ data: { ...node.data, methods } });
    } else if (type === 'col-name') {
      const cols = [...(node.data?.columns || [])];
      if (val && cols[index]) {
        cols[index] = { ...cols[index], name: val };
        onUpdate({ data: { ...node.data, columns: cols } });
      }
    } else if (type === 'col-type') {
      const cols = [...(node.data?.columns || [])];
      if (val && cols[index]) {
        cols[index] = { ...cols[index], type: val };
        onUpdate({ data: { ...node.data, columns: cols } });
      }
    } else if (type === 'map-key') {
      const entries = [...(node.data?.mapEntries || [])];
      if (val && entries[index]) {
        entries[index] = { ...entries[index], key: val };
        onUpdate({ data: { ...node.data, mapEntries: entries } });
      }
    } else if (type === 'map-val') {
      const entries = [...(node.data?.mapEntries || [])];
      if (val && entries[index]) {
        entries[index] = { ...entries[index], value: val };
        onUpdate({ data: { ...node.data, mapEntries: entries } });
      }
    } else if (type === 'slot-key') {
      const slots = [...(node.data?.slots || [])];
      if (val && slots[index]) {
        slots[index] = { ...slots[index], key: val };
        onUpdate({ data: { ...node.data, slots } });
      }
    } else if (type === 'slot-val') {
      const slots = [...(node.data?.slots || [])];
      if (val && slots[index]) {
        slots[index] = { ...slots[index], value: val };
        onUpdate({ data: { ...node.data, slots } });
      }
    }
    setEditingMember(null);
  };

  // Node type category detectors
  const isC4 = node.type.startsWith('c4-') || node.category === 'c4' || Boolean(node.data?.c4Type);
  const isArchimate = node.category === 'archimate' || Boolean(node.data?.archimateLayer);
  const isAws = node.category === 'aws' || node.type.startsWith('aws-') || Boolean(node.data?.awsCategory) || node.data?.cloudProvider === 'aws';
  const isAzure = node.type.startsWith('azure-') || node.type.startsWith('cloud-azure') || node.data?.cloudProvider === 'azure' || node.label.toLowerCase().startsWith('azure');
  const isGcp = node.type.startsWith('gcp-') || node.type.startsWith('cloud-gcp') || node.data?.cloudProvider === 'gcp' || node.label.toLowerCase().startsWith('gcp');
  const isK8s = node.type.startsWith('k8s-') || node.type.startsWith('cloud-k8s') || node.data?.cloudProvider === 'k8s' || node.label.toLowerCase().startsWith('k8s');
  const isCloudNative = node.data?.cloudProvider === 'cloudogu' || node.type.startsWith('cloud-tool');
  const isDomainStory = node.category === 'domainstory' || Boolean(node.data?.domainStoryType) || node.type.startsWith('domainstory-');
  const isAdaML = node.category === 'adaml' || Boolean(node.data?.adamlType) || node.type.startsWith('adaml-');
  
  const isClassOrOO = ['class', 'interface', 'abstract-class', 'enum', 'struct', 'protocol', 'exception', 'annotation', 'metaclass'].includes(node.type) || node.category === 'code';
  const isObject = node.type === 'object';
  const isMap = node.type === 'map' || Boolean(node.data?.mapEntries);
  const isErTable = node.type === 'entity' || node.type === 'er-table' || node.category === 'data-schema';
  const isDataTree = node.type === 'data-json' || node.type === 'data-yaml' || node.type === 'json' || node.type === 'yaml';
  const isEmbedded = ['embedded-salt', 'embedded-ditaa', 'embedded-math'].includes(node.type) || Boolean(node.data?.embeddedType);
  const isNote = node.type === 'note' || node.data?.shape === 'note';
  const isFrame = node.type === 'frame' || node.data?.shape === 'frame' || node.data?.containerType === 'frame';
  const isFolder = (node.type === 'folder' || node.data?.shape === 'folder' || node.data?.containerType === 'folder') && !isFrame;
  const isPackage = ((node.type === 'package' || node.type === 'namespace' || node.category === 'container' || Boolean(node.data?.isContainer) || node.data?.shape === 'package') && !isFrame && !isFolder && node.type !== 'rectangle');

  // Shapes
  const isCylinder = node.type === 'database' || node.data?.shape === 'cylinder';
  const isQueue = node.type === 'queue' || node.data?.shape === 'queue' || node.data?.shape === 'horiz-cylinder';
  const isNode3d = node.type === 'node' || node.data?.shape === 'node3d';
  const isComponentTab = (node.type === 'component' && !isC4) || node.data?.shape === 'component';
  const isFileDoc = (node.type === 'file' || node.type === 'artifact') || node.data?.shape === 'file' || node.data?.shape === 'artifact';
  const isHexagon = node.type === 'hexagon' || node.data?.shape === 'hexagon';
  const isCloud = node.type.startsWith('cloud') || node.data?.shape === 'cloud';
  const isActor = node.type === 'actor' || node.data?.shape === 'actor';
  const isUseCase = node.type === 'usecase' || node.data?.shape === 'usecase';
  const isCollections = node.type === 'collections' || node.data?.shape === 'collections';
  const isParticipant = node.type === 'participant' || node.type === 'seq-participant' || (node.category === 'sequence' && !isFrame);
  const isBoundary = node.type === 'boundary' || node.data?.shape === 'boundary';
  const isControl = node.type === 'control' || node.data?.shape === 'control';
  const isEntityCircle = node.type === 'entity-circle' || node.data?.shape === 'entity-circle';
  const isActivityStart = node.type === 'activity-start' || node.type === 'start' || node.data?.shape === 'start';
  const isActivityStop = node.type === 'activity-stop' || node.type === 'stop' || node.type === 'end' || node.data?.shape === 'stop';
  const isActivityFlowFinal = node.type === 'activity-flow-final' || node.type === 'flow-final' || node.data?.shape === 'flow-final';
  const isDecision = node.type === 'activity-decision' || node.type === 'condition' || node.data?.shape === 'diamond';
  const isSyncBar = node.type === 'activity-fork' || node.type === 'activity-join' || node.type === 'fork' || node.type === 'join' || node.data?.shape === 'sync-bar';
  const isStateHistory = node.type === 'state-history' || node.label === '[H]' || node.label === '[H*]' || node.data?.shape === 'history';
  const isState = (node.type === 'state' || node.data?.shape === 'state') && !isStateHistory;
  const isSalt = node.type === 'salt' || node.type === 'salt-mockup' || node.type === 'embedded-salt' || node.category === 'wireframe' || Boolean(node.data?.saltContent) || node.data?.embeddedType === 'salt';
  const isDitaa = node.type === 'embedded-ditaa' || node.type === 'ditaa' || node.data?.embeddedType === 'ditaa';
  const isMath = node.type === 'embedded-math' || node.type === 'math' || node.data?.embeddedType === 'math' || Boolean(node.data?.mathFormula);
  const isWbs = node.type === 'wbs-node' || node.type === 'wbs' || node.category === 'wbs' || node.data?.wbsLevel !== undefined;

  // ER Column handlers
  const handleAddErColumn = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cols = node.data?.columns || [];
    const newCol: ErColumn = {
      name: `col_${cols.length + 1}`,
      type: 'varchar(64)',
      isPk: false
    };
    const updatedCols = [...cols, newCol];
    const simulatedNode: DiagramNode = { ...node, data: { ...node.data, columns: updatedCols } };
    const needed = getOptimalNodeDimensions(simulatedNode);
    onUpdate({
      width: Math.max(effectiveWidth, needed.width),
      height: Math.max(effectiveHeight, needed.height),
      data: {
        ...node.data,
        columns: updatedCols
      }
    });
  };

  const handleRemoveErColumn = (idx: number) => {
    const cols = (node.data?.columns || []).filter((_, i) => i !== idx);
    onUpdate({ data: { ...node.data, columns: cols } });
  };

  // Class attributes & methods handlers
  const handleAddAttribute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const attrs = node.data?.attributes || [];
    const updatedAttrs = [...attrs, `+field_${attrs.length + 1}: String`];
    const simulatedNode: DiagramNode = { ...node, data: { ...node.data, attributes: updatedAttrs } };
    const needed = getOptimalNodeDimensions(simulatedNode);
    onUpdate({
      width: Math.max(effectiveWidth, needed.width),
      height: Math.max(effectiveHeight, needed.height),
      data: {
        ...node.data,
        attributes: updatedAttrs
      }
    });
  };

  const handleRemoveAttribute = (idx: number) => {
    const attrs = (node.data?.attributes || []).filter((_, i) => i !== idx);
    onUpdate({ data: { ...node.data, attributes: attrs } });
  };

  const handleAddMethod = (e: React.MouseEvent) => {
    e.stopPropagation();
    const methods = node.data?.methods || [];
    const updatedMethods = [...methods, `+operation_${methods.length + 1}(): void`];
    const simulatedNode: DiagramNode = { ...node, data: { ...node.data, methods: updatedMethods } };
    const needed = getOptimalNodeDimensions(simulatedNode);
    onUpdate({
      width: Math.max(effectiveWidth, needed.width),
      height: Math.max(effectiveHeight, needed.height),
      data: {
        ...node.data,
        methods: updatedMethods
      }
    });
  };

  const handleRemoveMethod = (idx: number) => {
    const methods = (node.data?.methods || []).filter((_, i) => i !== idx);
    onUpdate({ data: { ...node.data, methods } });
  };

  // Map entries handlers
  const handleAddMapEntry = (e: React.MouseEvent) => {
    e.stopPropagation();
    const entries = node.data?.mapEntries || [];
    const updatedEntries = [...entries, { key: `prop_${entries.length + 1}`, value: '"val"' }];
    const simulatedNode: DiagramNode = { ...node, data: { ...node.data, mapEntries: updatedEntries } };
    const needed = getOptimalNodeDimensions(simulatedNode);
    onUpdate({
      width: Math.max(effectiveWidth, needed.width),
      height: Math.max(effectiveHeight, needed.height),
      data: {
        ...node.data,
        mapEntries: updatedEntries
      }
    });
  };

  const handleRemoveMapEntry = (idx: number) => {
    const entries = (node.data?.mapEntries || []).filter((_, i) => i !== idx);
    onUpdate({ data: { ...node.data, mapEntries: entries } });
  };

  // Object slot handlers
  const handleAddObjectSlot = (e: React.MouseEvent) => {
    e.stopPropagation();
    const slots = node.data?.slots || [];
    const updatedSlots = [...slots, { key: `key_${slots.length + 1}`, value: '"value"' }];
    const simulatedNode: DiagramNode = { ...node, data: { ...node.data, slots: updatedSlots } };
    const needed = getOptimalNodeDimensions(simulatedNode);
    onUpdate({
      width: Math.max(effectiveWidth, needed.width),
      height: Math.max(effectiveHeight, needed.height),
      data: {
        ...node.data,
        slots: updatedSlots
      }
    });
  };

  const handleRemoveObjectSlot = (idx: number) => {
    const slots = (node.data?.slots || []).filter((_, i) => i !== idx);
    onUpdate({ data: { ...node.data, slots } });
  };

  // Helper for visibility styling matching PlantUML
  const renderMemberText = (member: string) => {
    let rest = member;
    let visibilityBadge: React.ReactNode = null;

    if (member.startsWith('+')) {
      rest = member.slice(1).trim();
      visibilityBadge = <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">+</span>;
    } else if (member.startsWith('-')) {
      rest = member.slice(1).trim();
      visibilityBadge = <span className="w-3.5 h-3.5 rounded-xs bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">-</span>;
    } else if (member.startsWith('#')) {
      rest = member.slice(1).trim();
      visibilityBadge = <span className="w-3.5 h-3.5 rotate-45 bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0"><span className="-rotate-45">#</span></span>;
    } else if (member.startsWith('~')) {
      rest = member.slice(1).trim();
      visibilityBadge = <span className="w-3.5 h-3.5 rounded-xs bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">~</span>;
    }

    const isStatic = rest.includes('{static}');
    const isAbstract = rest.includes('{abstract}');
    const cleanText = rest.replace(/{static}|{abstract}|{field}|{method}/g, '').trim();

    return (
      <div className="flex items-center gap-1.5 min-w-0">
        {visibilityBadge}
        <span className={`truncate text-[#181818] ${isStatic ? 'underline font-semibold' : ''} ${isAbstract ? 'italic text-gray-700' : ''}`}>
          {cleanText}
        </span>
      </div>
    );
  };

  // Spot circle badge for UML classifiers
  const getClassifierSpot = () => {
    if (node.data?.spot) {
      return node.data.spot;
    }
    switch (node.type) {
      case 'interface':
        return { character: 'I', colorHex: '#B4A7E5' };
      case 'abstract-class':
        return { character: 'A', colorHex: '#A9DCDF' };
      case 'enum':
        return { character: 'E', colorHex: '#EB937F' };
      case 'struct':
        return { character: 'S', colorHex: '#A9DCDF' };
      case 'protocol':
        return { character: 'P', colorHex: '#B4A7E5' };
      case 'entity':
        return { character: 'E', colorHex: '#E3B680' };
      case 'class':
      default:
        return { character: 'C', colorHex: '#ADD1B2' };
    }
  };

  // =========================================================================
  // 1. C4 ARCHITECTURE RENDERER (stdlib/C4)
  // Person (#08427B), System (#1168BD), Container (#438DD5), Component (#85BBF0)
  // =========================================================================
  if (isC4) {
    const c4Type = node.data?.c4Type || (node.type.replace('c4-', '') as any);
    const isExt = c4Type?.includes('ext');
    
    let bg = '#1168BD';
    let border = '#3C7FC0';
    let textColor = '#FFFFFF';
    let stereotypeLabel = '<<system>>';

    if (c4Type === 'person' || c4Type === 'person-ext') {
      bg = isExt ? '#686868' : '#08427B';
      border = isExt ? '#8A8A8A' : '#073B6F';
      stereotypeLabel = isExt ? '<<external_person>>' : '<<person>>';
    } else if (c4Type === 'system' || c4Type === 'system-ext') {
      bg = isExt ? '#999999' : '#1168BD';
      border = isExt ? '#8A8A8A' : '#3C7FC0';
      stereotypeLabel = isExt ? '<<external_system>>' : '<<system>>';
    } else if (c4Type === 'system-db') {
      bg = '#0C4B88';
      border = '#2365A8';
      stereotypeLabel = '<<system_db>>';
    } else if (c4Type === 'system-queue') {
      bg = '#0C4B88';
      border = '#2365A8';
      stereotypeLabel = '<<system_queue>>';
    } else if (c4Type === 'container-db') {
      bg = '#2B669A';
      border = '#3C7FC0';
      stereotypeLabel = '<<container_db>>';
    } else if (c4Type === 'container-queue') {
      bg = '#2B669A';
      border = '#3C7FC0';
      stereotypeLabel = '<<container_queue>>';
    } else if (c4Type === 'container' || c4Type === 'container-ext') {
      bg = isExt ? '#B3B3B3' : '#438DD5';
      border = isExt ? '#A6A6A6' : '#3C7FC0';
      stereotypeLabel = isExt ? '<<external_container>>' : '<<container>>';
    } else if (c4Type === 'component-db') {
      bg = '#6CA8E8';
      border = '#5A94D4';
      textColor = '#000000';
      stereotypeLabel = '<<component_db>>';
    } else if (c4Type === 'component-queue') {
      bg = '#6CA8E8';
      border = '#5A94D4';
      textColor = '#000000';
      stereotypeLabel = '<<component_queue>>';
    } else if (c4Type === 'component' || c4Type === 'component-ext') {
      bg = isExt ? '#CCCCCC' : '#85BBF0';
      border = isExt ? '#BFBFBF' : '#78A8D8';
      textColor = '#000000';
      stereotypeLabel = isExt ? '<<external_component>>' : '<<component>>';
    } else if (c4Type === 'deployment-node') {
      bg = '#F8FAFC';
      border = '#64748B';
      textColor = '#0F172A';
      stereotypeLabel = '<<deployment_node>>';
    } else if (c4Type === 'boundary') {
      return (
        <div
          id={node.id}
          className={`absolute select-none border-2 border-dashed border-[#444444] rounded-lg p-3 bg-white/20 transition-all ${
            isSelected ? 'ring-2 ring-[#c2652a] shadow-lg' : ''
          } ${
            isDropTarget ? 'ring-2 ring-amber-500 ring-offset-2 ring-dashed bg-amber-500/10 shadow-lg' : ''
          }`}
          style={{
            left: node.x,
            top: node.y,
            width: node.width,
            height: node.height,
            minHeight: node.height,
            zIndex: isSelected ? 4 : (isDropTarget ? 5 : 2)
          }}
          onClick={onSelect}
        >
          {isDropTarget && (
            <div className="absolute -top-3 right-4 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold tracking-tight shadow-md pointer-events-none flex items-center gap-1 z-30 animate-pulse">
              <span>✦ Snap into {node.label || 'boundary'}</span>
            </div>
          )}
          <div className="text-xs font-bold text-[#444444] font-sans">
            [System Boundary: {node.label}]
          </div>
        </div>
      );
    }

    const isPerson = c4Type === 'person' || c4Type === 'person-ext';
    const isDb = String(c4Type).includes('db');
    const isQueueC4 = String(c4Type).includes('queue');
    const isComp = String(c4Type).includes('component');
    const isDeployNode = c4Type === 'deployment-node';

    return (
      <div
        id={node.id}
        className={`absolute cursor-move select-none transition-shadow ${
          isSelected ? 'ring-2 ring-amber-400 ring-offset-2 shadow-xl' : 'hover:shadow-lg'
        }`}
        style={{
          left: node.x,
          top: node.y,
          width: effectiveWidth,
          height: effectiveHeight,
          minWidth: 60,
          minHeight: 40,
          zIndex: isSelected ? 30 : 10
        }}
        onClick={onSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`w-full h-full p-3 flex flex-col items-center justify-center text-center shadow-md relative overflow-hidden ${
            isPerson ? 'rounded-2xl' : isDeployNode ? 'rounded-lg border-t-8' : 'rounded-xl'
          } ${isExt ? 'border-dashed' : ''}`}
          style={{
            backgroundColor: bg,
            borderColor: border,
            borderWidth: 2,
            color: textColor
          }}
        >
          {/* Top avatar icon for C4 Person using official PlantUML C4 silhouette */}
          {isPerson && (
            <div className="mb-1.5 flex items-center justify-center">
              <C4PersonAvatar size={34} color={textColor} />
            </div>
          )}

          {/* Database Badge in Top-Right Corner */}
          {isDb && (
            <div className="absolute top-2 right-2" title="C4 Database Container">
              <C4DbBadge size={22} color={textColor} />
            </div>
          )}

          {/* Queue Badge in Top-Right Corner */}
          {isQueueC4 && (
            <div className="absolute top-2 right-2" title="C4 Queue Buffer">
              <C4QueueBadge size={22} color={textColor} />
            </div>
          )}

          {/* Component Tabs Badge in Top-Right Corner */}
          {isComp && (
            <div className="absolute top-2 right-2" title="C4 Component">
              <C4ComponentBadge size={18} color={textColor} />
            </div>
          )}

          {/* Stereotype */}
          <div className="text-[10px] opacity-80 font-sans tracking-wide">
            {node.sublabel || stereotypeLabel}
          </div>

          {/* Title */}
          {isEditing ? (
            <input
              ref={inputRef}
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onBlur={handleCommitEdit}
              onKeyDown={handleKeyDown}
              className="text-xs font-bold text-gray-900 bg-white rounded px-1 py-0.5 outline-none w-full shadow-xs text-center"
            />
          ) : (
            <div
              className="text-sm font-bold font-sans tracking-tight mt-0.5 cursor-text"
              onDoubleClick={() => setIsEditing(true)}
            >
              {node.label}
            </div>
          )}

          {/* Technology in brackets */}
          {node.data?.technology && (
            <div className="text-[11px] font-mono font-medium opacity-90 mt-1">
              [{node.data.technology}]
            </div>
          )}

          {/* Description */}
          {node.data?.description && (
            <div className="text-[11px] opacity-85 leading-relaxed mt-1 line-clamp-3">
              {node.data.description}
            </div>
          )}
        </div>

        {/* Ports */}
        {renderPorts(node.id, isHovered, isSelected, onStartConnection)}

        {/* Corner Resize Handle */}
        {isSelected && onStartResize && (
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-amber-500 rounded-xs cursor-se-resize z-40 hover:scale-125 transition-transform"
            title="Drag to resize element"
            onMouseDown={(e) => onStartResize(node.id, 'se', e)}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // 2. ARCHIMATE RENDERER (stdlib/archimate)
  // Business (#FFFFB5), App (#B5FFFF), Tech (#C9E7B7), Strategy (#F5DEAA)
  // =========================================================================
  if (isArchimate) {
    const layer = node.data?.archimateLayer || 'business';
    const element = node.data?.archimateElement || node.type.replace(/^archimate-/, '');
    const getLayerColors = () => {
      switch (layer) {
        case 'application': return { bg: '#B5FFFF', border: '#0088AA' };
        case 'technology': return { bg: '#C9E7B7', border: '#3B7B19' };
        case 'strategy': return { bg: '#F5DEAA', border: '#B88B2A' };
        case 'motivation': return { bg: '#CCCCFF', border: '#5B5BA8' };
        case 'implementation': return { bg: '#FFE0E0', border: '#B84A4A' };
        case 'physical': return { bg: '#D5E7B7', border: '#5B7B19' };
        case 'business':
        default: return { bg: '#FFFFB5', border: '#B08B00' };
      }
    };

    const colors = getLayerColors();

    return (
      <div
        id={node.id}
        className={`absolute cursor-move select-none transition-shadow ${
          isSelected ? 'ring-2 ring-[#c2652a] ring-offset-1 shadow-lg' : 'hover:shadow-md'
        }`}
        style={{
          left: node.x,
          top: node.y,
          width: effectiveWidth,
          height: effectiveHeight,
          minWidth: 60,
          minHeight: 40,
          zIndex: isSelected ? 30 : 10
        }}
        onClick={onSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="w-full h-full rounded-md p-3 relative flex flex-col items-center justify-center text-center shadow-xs border"
          style={{
            backgroundColor: colors.bg,
            borderColor: colors.border,
            borderWidth: 1.5,
            color: '#000000'
          }}
        >
          {/* ArchiMate Watermark icon in top-right with specific element subtype */}
          <ArchiMateWatermark layer={layer} type={element} />

          {/* Stereotype */}
          <div className="text-[10px] font-sans text-gray-700 italic">
            {node.sublabel || `<<${layer} ${element || ''}>>`.trim()}
          </div>

          {/* Title */}
          {isEditing ? (
            <input
              ref={inputRef}
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onBlur={handleCommitEdit}
              onKeyDown={handleKeyDown}
              className="text-xs font-bold text-gray-900 bg-white rounded px-1 py-0.5 outline-none w-full shadow-xs text-center"
            />
          ) : (
            <div
              className="text-xs font-bold font-sans text-gray-900 mt-0.5 cursor-text"
              onDoubleClick={() => setIsEditing(true)}
            >
              {node.label}
            </div>
          )}

          {node.data?.description && (
            <div className="text-[10px] text-gray-600 mt-1 line-clamp-2">
              {node.data.description}
            </div>
          )}
        </div>

        {/* Ports */}
        {renderPorts(node.id, isHovered, isSelected, onStartConnection)}

        {/* Corner Resize Handle */}
        {isSelected && onStartResize && (
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-amber-500 rounded-xs cursor-se-resize z-40 hover:scale-125 transition-transform"
            title="Drag to resize element"
            onMouseDown={(e) => onStartResize(node.id, 'se', e)}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // 3. AWS ARCHITECTURE RENDERER (stdlib/aws)
  // Official AWS Category Colors & Service Badges
  // =========================================================================
  if (isAws) {
    const category = node.data?.awsCategory || 'compute';
    const getCategoryBorder = () => {
      switch (category) {
        case 'compute': return '#F58536';
        case 'database': return '#2E73B8';
        case 'storage': return '#7AA116';
        case 'analytics': return '#8C4FFF';
        case 'security': return '#DD344C';
        case 'networking': return '#527FFF';
        default: return '#F58536';
      }
    };

    const catColor = getCategoryBorder();

    return (
      <div
        id={node.id}
        className={`absolute cursor-move select-none transition-shadow ${
          isSelected ? 'ring-2 ring-amber-500 ring-offset-2 shadow-lg' : 'hover:shadow-md'
        }`}
        style={{
          left: node.x,
          top: node.y,
          width: effectiveWidth,
          height: effectiveHeight,
          minWidth: 60,
          minHeight: 40,
          zIndex: isSelected ? 30 : 10
        }}
        onClick={onSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-full h-full rounded-xl bg-white border border-gray-300 shadow-sm overflow-hidden flex flex-col">
          {/* Top Category Accent Bar */}
          <div className="h-1.5 w-full" style={{ backgroundColor: catColor }} />

          <div className="p-2.5 flex items-center gap-2 flex-1">
            <AwsGlyph service={node.label} category={category} size={32} />

            <div className="min-w-0 flex-1">
              <div className="text-[9px] font-sans font-medium uppercase tracking-wider text-gray-500">
                {node.sublabel || `AWS ${category}`}
              </div>

              {isEditing ? (
                <input
                  ref={inputRef}
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onBlur={handleCommitEdit}
                  onKeyDown={handleKeyDown}
                  className="text-xs font-bold text-gray-900 bg-white border border-amber-500 rounded px-1 py-0.5 outline-none w-full"
                />
              ) : (
                <div
                  className="text-xs font-bold text-gray-900 truncate font-sans cursor-text"
                  onDoubleClick={() => setIsEditing(true)}
                >
                  {node.label}
                </div>
              )}

              {node.data?.technology && (
                <div className="text-[10px] font-mono text-gray-500 truncate">
                  {node.data.technology}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ports */}
        {renderPorts(node.id, isHovered, isSelected, onStartConnection)}

        {/* Corner Resize Handle */}
        {isSelected && onStartResize && (
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-amber-500 rounded-xs cursor-se-resize z-40 hover:scale-125 transition-transform"
            title="Drag to resize element"
            onMouseDown={(e) => onStartResize(node.id, 'se', e)}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // 3A1. AZURE ARCHITECTURE RENDERER (stdlib/azure)
  // Official Microsoft Azure Category Styling & Service Badges
  // =========================================================================
  if (isAzure) {
    const serviceName = node.data?.cloudService || node.label;
    const category = node.data?.awsCategory || 'compute';

    return (
      <div
        id={node.id}
        className={`absolute cursor-move select-none transition-shadow ${
          isSelected ? 'ring-2 ring-sky-500 ring-offset-2 shadow-lg' : 'hover:shadow-md'
        }`}
        style={{
          left: node.x,
          top: node.y,
          width: effectiveWidth,
          height: effectiveHeight,
          minWidth: 60,
          minHeight: 40,
          zIndex: isSelected ? 30 : 10
        }}
        onClick={onSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-full h-full rounded-xl bg-white border border-sky-200 shadow-xs overflow-hidden flex flex-col">
          <div className="h-1.5 w-full bg-[#0078D4]" />
          <div className="p-2.5 flex items-center gap-2 flex-1">
            <AzureGlyph service={serviceName} category={category} size={32} />
            <div className="min-w-0 flex-1">
              <div className="text-[9px] font-sans font-medium uppercase tracking-wider text-[#0078D4]">
                {node.sublabel || `Azure ${serviceName}`}
              </div>
              {isEditing ? (
                <input
                  ref={inputRef}
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onBlur={handleCommitEdit}
                  onKeyDown={handleKeyDown}
                  className="text-xs font-bold text-gray-900 bg-white border border-sky-500 rounded px-1 py-0.5 outline-none w-full"
                />
              ) : (
                <div
                  className="text-xs font-bold text-gray-900 truncate font-sans cursor-text"
                  onDoubleClick={() => setIsEditing(true)}
                >
                  {node.label}
                </div>
              )}
              {node.data?.technology && (
                <div className="text-[10px] font-mono text-gray-500 truncate">
                  {node.data.technology}
                </div>
              )}
              {node.data?.description && (
                <div className="text-[10px] text-gray-500 truncate mt-0.5">
                  {node.data.description}
                </div>
              )}
            </div>
          </div>
        </div>
        {renderPorts(node.id, isHovered, isSelected, onStartConnection)}

        {/* Corner Resize Handle */}
        {isSelected && onStartResize && (
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-sky-500 rounded-xs cursor-se-resize z-40 hover:scale-125 transition-transform"
            title="Drag to resize element"
            onMouseDown={(e) => onStartResize(node.id, 'se', e)}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // 3A2. GCP ARCHITECTURE RENDERER (stdlib/gcp)
  // Official Google Cloud Category Styling & Service Badges
  // =========================================================================
  if (isGcp) {
    const serviceName = node.data?.cloudService || node.label;

    return (
      <div
        id={node.id}
        className={`absolute cursor-move select-none transition-shadow ${
          isSelected ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg' : 'hover:shadow-md'
        }`}
        style={{
          left: node.x,
          top: node.y,
          width: effectiveWidth,
          height: effectiveHeight,
          minWidth: 60,
          minHeight: 40,
          zIndex: isSelected ? 30 : 10
        }}
        onClick={onSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-full h-full rounded-xl bg-white border border-blue-200 shadow-xs overflow-hidden flex flex-col">
          <div className="h-1.5 w-full bg-[#4285F4]" />
          <div className="p-2.5 flex items-center gap-2 flex-1">
            <GcpGlyph service={serviceName} size={32} />
            <div className="min-w-0 flex-1">
              <div className="text-[9px] font-sans font-medium uppercase tracking-wider text-[#4285F4]">
                {node.sublabel || `GCP ${serviceName}`}
              </div>
              {isEditing ? (
                <input
                  ref={inputRef}
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onBlur={handleCommitEdit}
                  onKeyDown={handleKeyDown}
                  className="text-xs font-bold text-gray-900 bg-white border border-blue-500 rounded px-1 py-0.5 outline-none w-full"
                />
              ) : (
                <div
                  className="text-xs font-bold text-gray-900 truncate font-sans cursor-text"
                  onDoubleClick={() => setIsEditing(true)}
                >
                  {node.label}
                </div>
              )}
              {node.data?.technology && (
                <div className="text-[10px] font-mono text-gray-500 truncate">
                  {node.data.technology}
                </div>
              )}
              {node.data?.description && (
                <div className="text-[10px] text-gray-500 truncate mt-0.5">
                  {node.data.description}
                </div>
              )}
            </div>
          </div>
        </div>
        {renderPorts(node.id, isHovered, isSelected, onStartConnection)}

        {/* Corner Resize Handle */}
        {isSelected && onStartResize && (
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-xs cursor-se-resize z-40 hover:scale-125 transition-transform"
            title="Drag to resize element"
            onMouseDown={(e) => onStartResize(node.id, 'se', e)}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // 3A3. KUBERNETES WORKLOAD RENDERER (stdlib/kubernetes)
  // Official Kubernetes Blue & Workload Badges
  // =========================================================================
  if (isK8s) {
    const kind = node.data?.cloudService || node.label;

    return (
      <div
        id={node.id}
        className={`absolute cursor-move select-none transition-shadow ${
          isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 shadow-lg' : 'hover:shadow-md'
        }`}
        style={{
          left: node.x,
          top: node.y,
          width: effectiveWidth,
          height: effectiveHeight,
          minWidth: 60,
          minHeight: 40,
          zIndex: isSelected ? 30 : 10
        }}
        onClick={onSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-full h-full rounded-xl bg-white border border-blue-300 shadow-xs overflow-hidden flex flex-col">
          <div className="h-1.5 w-full bg-[#326CE5]" />
          <div className="p-2.5 flex items-center gap-2 flex-1">
            <K8sGlyph kind={kind} size={32} />
            <div className="min-w-0 flex-1">
              <div className="text-[9px] font-sans font-medium uppercase tracking-wider text-[#326CE5]">
                {node.sublabel || `K8s ${kind}`}
              </div>
              {isEditing ? (
                <input
                  ref={inputRef}
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onBlur={handleCommitEdit}
                  onKeyDown={handleKeyDown}
                  className="text-xs font-bold text-gray-900 bg-white border border-blue-500 rounded px-1 py-0.5 outline-none w-full"
                />
              ) : (
                <div
                  className="text-xs font-bold text-gray-900 truncate font-sans cursor-text"
                  onDoubleClick={() => setIsEditing(true)}
                >
                  {node.label}
                </div>
              )}
              {node.data?.description && (
                <div className="text-[10px] text-gray-500 truncate mt-0.5">
                  {node.data.description}
                </div>
              )}
            </div>
          </div>
        </div>
        {renderPorts(node.id, isHovered, isSelected, onStartConnection)}

        {/* Corner Resize Handle */}
        {isSelected && onStartResize && (
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-indigo-500 rounded-xs cursor-se-resize z-40 hover:scale-125 transition-transform"
            title="Drag to resize element"
            onMouseDown={(e) => onStartResize(node.id, 'se', e)}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // 3A4. CLOUD NATIVE & CLOUDOGU TOOLS RENDERER (stdlib/cloudogu)
  // =========================================================================
  if (isCloudNative) {
    const tool = node.data?.cloudService || node.label;

    return (
      <div
        id={node.id}
        className={`absolute cursor-move select-none transition-shadow ${
          isSelected ? 'ring-2 ring-slate-500 ring-offset-2 shadow-lg' : 'hover:shadow-md'
        }`}
        style={{
          left: node.x,
          top: node.y,
          width: effectiveWidth,
          height: effectiveHeight,
          minWidth: 60,
          minHeight: 40,
          zIndex: isSelected ? 30 : 10
        }}
        onClick={onSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-full h-full rounded-xl bg-white border border-slate-300 shadow-xs overflow-hidden flex flex-col">
          <div className="h-1.5 w-full bg-slate-700" />
          <div className="p-2.5 flex items-center gap-2 flex-1">
            <CloudNativeGlyph tool={tool} size={32} />
            <div className="min-w-0 flex-1">
              <div className="text-[9px] font-sans font-medium uppercase tracking-wider text-slate-600">
                {node.sublabel || `Tool: ${tool}`}
              </div>
              {isEditing ? (
                <input
                  ref={inputRef}
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onBlur={handleCommitEdit}
                  onKeyDown={handleKeyDown}
                  className="text-xs font-bold text-gray-900 bg-white border border-slate-500 rounded px-1 py-0.5 outline-none w-full"
                />
              ) : (
                <div
                  className="text-xs font-bold text-gray-900 truncate font-sans cursor-text"
                  onDoubleClick={() => setIsEditing(true)}
                >
                  {node.label}
                </div>
              )}
              {node.data?.technology && (
                <div className="text-[10px] font-mono text-gray-500 truncate">
                  {node.data.technology}
                </div>
              )}
            </div>
          </div>
        </div>
        {renderPorts(node.id, isHovered, isSelected, onStartConnection)}

        {/* Corner Resize Handle */}
        {isSelected && onStartResize && (
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-slate-500 rounded-xs cursor-se-resize z-40 hover:scale-125 transition-transform"
            title="Drag to resize element"
            onMouseDown={(e) => onStartResize(node.id, 'se', e)}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // 3B. DOMAIN STORYTELLING RENDERER (stdlib/DomainStory)
  // Human Actors, Work Objects, Systems & Boundaries
  // =========================================================================
  if (isDomainStory) {
    const dsType = (node.data?.domainStoryType || node.type.replace('domainstory-', '')).toLowerCase();

    if (dsType === 'boundary') {
      return (
        <div
          id={node.id}
          className={`absolute select-none border-2 border-dashed border-[#555555] rounded-xl p-3 bg-amber-50/20 transition-all ${
            isSelected ? 'ring-2 ring-[#c2652a] shadow-lg' : ''
          } ${
            isDropTarget ? 'ring-2 ring-amber-500 ring-offset-2 ring-dashed bg-amber-500/10 shadow-lg' : ''
          }`}
          style={{
            left: node.x,
            top: node.y,
            width: node.width,
            height: node.height,
            minHeight: node.height,
            zIndex: isSelected ? 4 : (isDropTarget ? 5 : 2)
          }}
          onClick={onSelect}
        >
          {isDropTarget && (
            <div className="absolute -top-3 right-4 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold tracking-tight shadow-md pointer-events-none flex items-center gap-1 z-30 animate-pulse">
              <span>✦ Snap into {node.label || 'boundary'}</span>
            </div>
          )}
          <div className="text-xs font-bold text-gray-700 font-sans tracking-wide uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            [Domain Boundary: {node.label}]
          </div>
        </div>
      );
    }

    const getDsIcon = () => {
      switch (dsType) {
        case 'person': return <User className="w-5 h-5 text-amber-700" />;
        case 'group': return <Users className="w-5 h-5 text-amber-700" />;
        case 'system': return <Monitor className="w-5 h-5 text-blue-700" />;
        case 'document': return <FileText className="w-5 h-5 text-orange-700" />;
        case 'folder': return <FolderIcon className="w-5 h-5 text-orange-700" />;
        case 'call': return <PhoneCall className="w-5 h-5 text-emerald-700" />;
        case 'email': return <Mail className="w-5 h-5 text-sky-700" />;
        case 'conversation': return <MessageSquare className="w-5 h-5 text-indigo-700" />;
        case 'info': return <Info className="w-5 h-5 text-teal-700" />;
        default: return <FileText className="w-5 h-5 text-amber-700" />;
      }
    };

    const isActorKind = ['person', 'group'].includes(dsType);

    return (
      <div
        id={node.id}
        className={`absolute cursor-move select-none transition-shadow ${
          isSelected ? 'ring-2 ring-amber-500 ring-offset-2 shadow-lg' : 'hover:shadow-md'
        }`}
        style={{
          left: node.x,
          top: node.y,
          width: effectiveWidth,
          height: effectiveHeight,
          minWidth: 60,
          minHeight: 40,
          zIndex: isSelected ? 30 : 10
        }}
        onClick={onSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={`w-full h-full rounded-xl bg-white border-2 shadow-sm p-2.5 flex flex-col justify-between ${
          isActorKind ? 'border-amber-400 bg-amber-50/30' : 'border-stone-300 bg-stone-50/40'
        }`}>
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="p-1.5 rounded-lg bg-stone-100 flex items-center justify-center">
              {getDsIcon()}
            </div>
            <span className="text-[9px] font-mono font-medium text-stone-500 uppercase tracking-tight">
              {dsType}
            </span>
          </div>

          <div className="my-auto">
            {isEditing ? (
              <input
                ref={inputRef}
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onBlur={handleCommitEdit}
                onKeyDown={handleKeyDown}
                className="text-xs font-bold text-gray-900 bg-white border border-amber-500 rounded px-1 py-0.5 outline-none w-full text-center"
              />
            ) : (
              <div
                className="text-xs font-bold font-sans text-gray-900 text-center leading-tight cursor-text line-clamp-2"
                onDoubleClick={() => setIsEditing(true)}
              >
                {node.label}
              </div>
            )}
          </div>

          <div className="text-[9px] text-center text-stone-400 italic">
            &lt;&lt;DomainStory&gt;&gt;
          </div>
        </div>

        {renderPorts(node.id, isHovered, isSelected, onStartConnection)}

        {/* Corner Resize Handle */}
        {isSelected && onStartResize && (
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-amber-500 rounded-xs cursor-se-resize z-40 hover:scale-125 transition-transform"
            title="Drag to resize element"
            onMouseDown={(e) => onStartResize(node.id, 'se', e)}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // 3C. AdaML ARCHITECTURE RENDERER (stdlib/adaml)
  // Packages, Subprograms, Tasks & Operators
  // =========================================================================
  if (isAdaML) {
    const adamlType = (node.data?.adamlType || node.type.replace('adaml-', '')).toLowerCase();
    const isSpec = adamlType === 'package-spec';
    const isBody = adamlType === 'package-body';
    const isSubprog = adamlType === 'subprogram';

    return (
      <div
        id={node.id}
        className={`absolute cursor-move select-none transition-shadow ${
          isSelected ? 'ring-2 ring-emerald-500 ring-offset-2 shadow-lg' : 'hover:shadow-md'
        }`}
        style={{
          left: node.x,
          top: node.y,
          width: effectiveWidth,
          height: effectiveHeight,
          minWidth: 60,
          minHeight: 40,
          zIndex: isSelected ? 30 : 10
        }}
        onClick={onSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-full h-full rounded-lg bg-stone-900 text-stone-100 border border-stone-700 shadow-md flex flex-col font-mono overflow-hidden">
          {/* Ada header banner */}
          <div className="bg-stone-800 px-2 py-1 text-[10px] text-emerald-400 flex items-center justify-between border-b border-stone-700">
            <span className="font-bold flex items-center gap-1">
              <Code className="w-3 h-3" />
              {isSpec ? 'package spec' : isBody ? 'package body' : isSubprog ? 'subprogram' : adamlType}
            </span>
            <span className="text-stone-400 text-[9px]">&lt;&lt;AdaML&gt;&gt;</span>
          </div>

          <div className="p-2.5 flex-1 flex flex-col justify-center">
            <div className="text-[10px] text-stone-400 mb-0.5">
              {isSpec ? 'package' : isBody ? 'package body' : isSubprog ? 'procedure' : ''}
            </div>

            {isEditing ? (
              <input
                ref={inputRef}
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onBlur={handleCommitEdit}
                onKeyDown={handleKeyDown}
                className="text-xs font-bold text-emerald-300 bg-stone-800 border border-emerald-500 rounded px-1 py-0.5 outline-none w-full"
              />
            ) : (
              <div
                className="text-xs font-bold text-emerald-300 truncate cursor-text"
                onDoubleClick={() => setIsEditing(true)}
              >
                {node.label}
              </div>
            )}

            <div className="text-[10px] text-stone-400 mt-0.5">is</div>
          </div>
        </div>

        {renderPorts(node.id, isHovered, isSelected, onStartConnection)}

        {/* Corner Resize Handle */}
        {isSelected && onStartResize && (
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-emerald-500 rounded-xs cursor-se-resize z-40 hover:scale-125 transition-transform"
            title="Drag to resize element"
            onMouseDown={(e) => onStartResize(node.id, 'se', e)}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // 3D. ACTIVITY & STATE SPECIALIZED SHAPES (Start, Stop, Decision, Fork)
  // =========================================================================
  if (isActivityStart) {
    return (
      <div
        id={node.id}
        className={`absolute cursor-move select-none flex items-center justify-center ${
          isSelected ? 'ring-2 ring-[#c2652a] ring-offset-2 rounded-full' : ''
        }`}
        style={{
          left: node.x,
          top: node.y,
          width: node.width || 30,
          height: node.height || 30,
          zIndex: isSelected ? 30 : 10
        }}
        onClick={onSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <ActivityStartShape size={Math.min(node.width || 26, node.height || 26)} color={colorConfig.borderHex || '#000000'} />
        {renderPorts(node.id, isHovered, isSelected, onStartConnection)}
      </div>
    );
  }

  if (isActivityStop) {
    return (
      <div
        id={node.id}
        className={`absolute cursor-move select-none flex items-center justify-center ${
          isSelected ? 'ring-2 ring-[#c2652a] ring-offset-2 rounded-full' : ''
        }`}
        style={{
          left: node.x,
          top: node.y,
          width: node.width || 32,
          height: node.height || 32,
          zIndex: isSelected ? 30 : 10
        }}
        onClick={onSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <ActivityStopShape size={Math.min(node.width || 28, node.height || 28)} color={colorConfig.borderHex || '#000000'} />
        {renderPorts(node.id, isHovered, isSelected, onStartConnection)}
      </div>
    );
  }

  if (isSyncBar) {
    return (
      <div
        id={node.id}
        className="absolute cursor-move select-none"
        style={{
          left: node.x,
          top: node.y,
          width: node.width || 120,
          height: node.height || 8,
          zIndex: isSelected ? 30 : 10
        }}
        onClick={onSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <SyncBarShape width={node.width || 120} height={node.height || 8} color={colorConfig.borderHex || '#000000'} isSelected={isSelected} />
        {renderPorts(node.id, isHovered, isSelected, onStartConnection)}
      </div>
    );
  }

  if (isDecision) {
    const strokeColor = colorConfig.borderHex || '#A80036';
    const fillColor = colorConfig.bgHex || '#FEFECE';
    return (
      <div
        id={node.id}
        className={`absolute cursor-move select-none transition-shadow ${isSelected ? 'ring-2 ring-[#A80036] ring-offset-2' : ''}`}
        style={{
          left: node.x,
          top: node.y,
          width: node.width || 110,
          height: node.height || 64,
          zIndex: isSelected ? 30 : 10
        }}
        onClick={onSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <DecisionDiamondShape width={node.width || 110} height={node.height || 64} fill={fillColor} stroke={strokeColor} isSelected={isSelected} />
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-2 text-center">
          {isEditing ? (
            <input
              ref={inputRef}
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onBlur={handleCommitEdit}
              onKeyDown={handleKeyDown}
              className="text-[11px] font-bold text-gray-900 bg-white border border-[#A80036] rounded px-1 py-0.5 outline-none w-3/4 shadow-xs text-center font-sans"
            />
          ) : (
            <div
              className="text-[11px] font-bold text-[#181818] font-sans px-2 cursor-text"
              onDoubleClick={() => setIsEditing(true)}
            >
              {node.label}
            </div>
          )}
        </div>
        {renderPorts(node.id, isHovered, isSelected, onStartConnection)}
      </div>
    );
  }

  // Activity Flow Final (Circle with X)
  if (isActivityFlowFinal) {
    return (
      <div
        id={node.id}
        className={`absolute cursor-move select-none flex items-center justify-center ${
          isSelected ? 'ring-2 ring-[#c2652a] ring-offset-2 rounded-full' : ''
        }`}
        style={{
          left: node.x,
          top: node.y,
          width: node.width || 32,
          height: node.height || 32,
          zIndex: isSelected ? 30 : 10
        }}
        onClick={onSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <ActivityFlowFinalShape size={Math.min(node.width || 28, node.height || 28)} color={colorConfig.borderHex || '#000000'} />
        {renderPorts(node.id, isHovered, isSelected, onStartConnection)}
      </div>
    );
  }

  // State Machine History ([H] or [H*])
  if (isStateHistory) {
    const isDeep = node.label === '[H*]' || Boolean(node.data?.isDeep);
    return (
      <div
        id={node.id}
        className={`absolute cursor-move select-none flex items-center justify-center ${
          isSelected ? 'ring-2 ring-[#A80036] ring-offset-2 rounded-full shadow-md' : ''
        }`}
        style={{
          left: node.x,
          top: node.y,
          width: node.width || 34,
          height: node.height || 34,
          zIndex: isSelected ? 30 : 10
        }}
        onClick={onSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <StateHistoryShape
          size={Math.min(node.width || 32, node.height || 32)}
          isDeep={isDeep}
          color={colorConfig.borderHex || '#A80036'}
          fill={colorConfig.bgHex || '#FEFECE'}
        />
        {renderPorts(node.id, isHovered, isSelected, onStartConnection)}
      </div>
    );
  }

  // Salt GUI Wireframe Mockup
  if (isSalt) {
    return (
      <div
        id={node.id}
        className={`absolute cursor-move select-none transition-shadow ${
          isSelected ? 'ring-2 ring-blue-500 ring-offset-2 shadow-xl' : 'hover:shadow-md'
        }`}
        style={{
          left: node.x,
          top: node.y,
          width: effectiveWidth,
          height: effectiveHeight,
          minWidth: 60,
          minHeight: 40,
          zIndex: isSelected ? 30 : 10
        }}
        onClick={onSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <SaltWireframeMockup
          width={effectiveWidth}
          height={effectiveHeight}
          title={node.label}
          content={node.data?.saltContent || node.data?.embeddedContent}
          onUpdateContent={(newContent) => onUpdate({ data: { ...node.data, saltContent: newContent, embeddedContent: newContent } })}
          onUpdateTitle={(newTitle) => onUpdate({ label: newTitle })}
        />
        {renderPorts(node.id, isHovered, isSelected, onStartConnection)}
        {isSelected && onStartResize && (
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-xs cursor-se-resize z-40 hover:scale-125 transition-transform"
            title="Drag to resize element"
            onMouseDown={(e) => onStartResize(node.id, 'se', e)}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // 3B-2. DITAA ASCII ART DIAGRAM (embedded-ditaa)
  // =========================================================================
  if (isDitaa) {
    return (
      <div
        id={node.id}
        className={`absolute cursor-move select-none transition-shadow ${
          isSelected ? 'ring-2 ring-amber-400 ring-offset-2 shadow-xl' : 'hover:shadow-md'
        }`}
        style={{
          left: node.x,
          top: node.y,
          width: effectiveWidth,
          height: effectiveHeight,
          minWidth: 60,
          minHeight: 40,
          zIndex: isSelected ? 30 : 10
        }}
        onClick={onSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <DitaaAsciiMockup
          width={effectiveWidth}
          height={effectiveHeight}
          title={node.label}
          content={node.data?.embeddedContent}
          onUpdateContent={(newContent) => onUpdate({ data: { ...node.data, embeddedContent: newContent } })}
          onUpdateTitle={(newTitle) => onUpdate({ label: newTitle })}
        />
        {renderPorts(node.id, isHovered, isSelected, onStartConnection)}
        {isSelected && onStartResize && (
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-amber-500 rounded-xs cursor-se-resize z-40 hover:scale-125 transition-transform"
            title="Drag to resize element"
            onMouseDown={(e) => onStartResize(node.id, 'se', e)}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // 3B-3. LATEX / MATH FORMULA (<math>)
  // =========================================================================
  if (isMath) {
    return (
      <div
        id={node.id}
        className={`absolute cursor-move select-none transition-shadow ${
          isSelected ? 'ring-2 ring-[#A80036] ring-offset-2 shadow-xl' : 'hover:shadow-md'
        }`}
        style={{
          left: node.x,
          top: node.y,
          width: effectiveWidth,
          height: effectiveHeight,
          minWidth: 60,
          minHeight: 40,
          zIndex: isSelected ? 30 : 10
        }}
        onClick={onSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <MathFormulaCard
          width={effectiveWidth}
          height={effectiveHeight}
          title={node.label}
          formula={node.data?.mathFormula || node.data?.embeddedContent}
          onUpdateFormula={(newFormula) => onUpdate({ data: { ...node.data, mathFormula: newFormula, embeddedContent: newFormula } })}
          onUpdateTitle={(newTitle) => onUpdate({ label: newTitle })}
        />
        {renderPorts(node.id, isHovered, isSelected, onStartConnection)}
        {isSelected && onStartResize && (
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-[#A80036] rounded-xs cursor-se-resize z-40 hover:scale-125 transition-transform"
            title="Drag to resize element"
            onMouseDown={(e) => onStartResize(node.id, 'se', e)}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // 3B-4. WBS WORK BREAKDOWN STRUCTURE NODE (@startwbs)
  // =========================================================================
  if (isWbs) {
    return (
      <div
        id={node.id}
        className={`absolute cursor-move select-none transition-shadow ${
          isSelected ? 'ring-2 ring-emerald-500 ring-offset-2 shadow-xl' : 'hover:shadow-md'
        }`}
        style={{
          left: node.x,
          top: node.y,
          width: effectiveWidth,
          height: effectiveHeight,
          minWidth: 60,
          minHeight: 40,
          zIndex: isSelected ? 30 : 10
        }}
        onClick={onSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <WbsCardShape
          level={node.data?.wbsLevel || 1}
          code={node.data?.wbsCode || '1.0'}
          title={node.label}
          progress={node.data?.wbsProgress}
          color={colorConfig.borderHex}
          onUpdateProgress={(newProgress) => onUpdate({ data: { ...node.data, wbsProgress: newProgress } })}
          onUpdateCode={(newCode) => onUpdate({ data: { ...node.data, wbsCode: newCode } })}
          onUpdateTitle={(newTitle) => onUpdate({ label: newTitle })}
        />
        {renderPorts(node.id, isHovered, isSelected, onStartConnection)}
        {isSelected && onStartResize && (
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-emerald-500 rounded-xs cursor-se-resize z-40 hover:scale-125 transition-transform"
            title="Drag to resize element"
            onMouseDown={(e) => onStartResize(node.id, 'se', e)}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // 3C. ROBUSTNESS ICONS (Boundary, Control, Entity-Circle)
  // =========================================================================
  if (isBoundary || isControl || isEntityCircle) {
    const strokeColor = colorConfig.borderHex || '#A80036';
    const fillColor = colorConfig.bgHex || '#FEFECE';
    return (
      <div
        id={node.id}
        className={`absolute cursor-move select-none flex flex-col items-center justify-center transition-shadow ${
          isSelected ? 'ring-2 ring-[#A80036] ring-offset-2 rounded-lg' : ''
        }`}
        style={{
          left: node.x,
          top: node.y,
          width: effectiveWidth,
          height: effectiveHeight,
          minWidth: 60,
          minHeight: 40,
          zIndex: isSelected ? 30 : 10
        }}
        onClick={onSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="p-1 mb-1">
          {isBoundary && <BoundaryIconShape size={44} color={strokeColor} fill={fillColor} />}
          {isControl && <ControlIconShape size={44} color={strokeColor} fill={fillColor} />}
          {isEntityCircle && <EntityCircleIconShape size={44} color={strokeColor} fill={fillColor} />}
        </div>
        {node.sublabel && (
          <span className="text-[10px] text-gray-600 font-sans italic">{node.sublabel}</span>
        )}
        {isEditing ? (
          <input
            ref={inputRef}
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            onBlur={handleCommitEdit}
            onKeyDown={handleKeyDown}
            className="text-xs font-bold text-gray-900 bg-white border border-[#A80036] rounded px-1 py-0.5 outline-none text-center font-sans"
          />
        ) : (
          <span
            className="text-xs font-bold text-[#181818] font-sans text-center cursor-text px-1"
            onDoubleClick={() => setIsEditing(true)}
          >
            {node.label}
          </span>
        )}
        {renderPorts(node.id, isHovered, isSelected, onStartConnection)}
        {isSelected && onStartResize && (
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-[#A80036] rounded-xs cursor-se-resize z-40 hover:scale-125 transition-transform"
            title="Drag to resize element"
            onMouseDown={(e) => onStartResize(node.id, 'se', e)}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // 4. PLANTUML SHAPES (Package, Database, Queue, 3D Node, Folder, Frame, Note, UseCase, Collections, State, etc.)
  // =========================================================================
  if (isPackage || isCylinder || isQueue || isNode3d || isFolder || isFrame || isComponentTab || isFileDoc || isHexagon || isCloud || isActor || isNote || isUseCase || isCollections || isState || isParticipant) {
    const strokeColor = colorConfig.borderHex || '#A80036';
    const fillColor = colorConfig.bgHex || (isNote ? '#FEFFDD' : '#FEFECE');

    const isContainerNode = isPackage || isFrame || isFolder || Boolean(node.data?.isContainer) || node.category === 'container' || node.type === 'package' || node.type === 'frame' || node.type === 'folder' || node.type === 'namespace';

    return (
      <div
        id={node.id}
        className={`absolute cursor-move select-none transition-shadow ${
          isSelected ? 'ring-2 ring-[#A80036] ring-offset-2' : ''
        } ${
          isDropTarget && isContainerNode ? 'ring-2 ring-amber-500 ring-offset-2 ring-dashed bg-amber-500/10 shadow-lg' : ''
        }`}
        style={{
          left: node.x,
          top: node.y,
          width: effectiveWidth,
          height: effectiveHeight,
          minWidth: isContainerNode ? 140 : 60,
          minHeight: isContainerNode ? 100 : 40,
          zIndex: isContainerNode 
            ? (isSelected ? 4 : (isDropTarget ? 5 : 2)) 
            : (isSelected ? 30 : 10)
        }}
        onClick={onSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Floating Snap Indicator Badge */}
        {isDropTarget && isContainerNode && (
          <div className="absolute -top-3 right-4 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold tracking-tight shadow-md pointer-events-none flex items-center gap-1 z-30 animate-pulse">
            <span>✦ Snap into {node.label || 'container'}</span>
          </div>
        )}

        {/* SVG Background Shape */}
        {isPackage && <PackageShape width={effectiveWidth} height={effectiveHeight} fill={fillColor} stroke={strokeColor} isSelected={isSelected} />}
        {isCylinder && <CylinderDatabaseShape width={effectiveWidth} height={effectiveHeight} fill={fillColor} stroke={strokeColor} isSelected={isSelected} />}
        {isQueue && <QueueShape width={effectiveWidth} height={effectiveHeight} fill={fillColor} stroke={strokeColor} isSelected={isSelected} />}
        {isNode3d && <Node3dShape width={effectiveWidth} height={effectiveHeight} fill={fillColor} stroke={strokeColor} isSelected={isSelected} />}
        {isFolder && <FolderShape width={effectiveWidth} height={effectiveHeight} fill={fillColor} stroke={strokeColor} isSelected={isSelected} />}
        {isFrame && <FrameShape width={effectiveWidth} height={effectiveHeight} fill={fillColor} stroke={strokeColor} isSelected={isSelected} />}
        {isComponentTab && <ComponentTabsShape width={effectiveWidth} height={effectiveHeight} fill={fillColor} stroke={strokeColor} isSelected={isSelected} />}
        {isFileDoc && <FileFoldShape width={effectiveWidth} height={effectiveHeight} fill={fillColor} stroke={strokeColor} isSelected={isSelected} />}
        {isHexagon && <HexagonShape width={effectiveWidth} height={effectiveHeight} fill={fillColor} stroke={strokeColor} isSelected={isSelected} />}
        {isCloud && <CloudShape width={effectiveWidth} height={effectiveHeight} fill={fillColor} stroke={strokeColor} isSelected={isSelected} />}
        {isNote && <NoteFoldShape width={effectiveWidth} height={effectiveHeight} fill={fillColor} stroke={strokeColor} isSelected={isSelected} />}
        {isUseCase && <UseCaseShape width={effectiveWidth} height={effectiveHeight} fill={fillColor} stroke={strokeColor} isSelected={isSelected} />}
        {isCollections && <CollectionsShape width={effectiveWidth} height={effectiveHeight} fill={fillColor} stroke={strokeColor} isSelected={isSelected} />}
        {isState && <StateBoxShape width={effectiveWidth} height={effectiveHeight} fill={fillColor} stroke={strokeColor} isSelected={isSelected} />}
        {isParticipant && !isActor && !isCylinder && (
          <svg
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${effectiveWidth} ${effectiveHeight}`}
          >
            <rect
              x="1"
              y="1"
              width={Math.max(0, effectiveWidth - 2)}
              height={Math.max(0, effectiveHeight - 2)}
              rx="4"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={isSelected ? "2" : "1.5"}
              filter="drop-shadow(1px 2px 2px rgba(0,0,0,0.12))"
            />
          </svg>
        )}

        {/* 4A. Specific PlantUML Package Tab Labeling */}
        {isPackage && (
          <div className="absolute top-0 left-2 h-[22px] max-w-[140px] flex items-center pr-3 z-20 overflow-hidden select-none">
            <span className="text-[9px] font-mono text-[#A80036] font-semibold mr-1">package</span>
            {isEditing ? (
              <input
                ref={inputRef}
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onBlur={handleCommitEdit}
                onKeyDown={handleKeyDown}
                className="text-xs font-bold text-gray-900 bg-white border border-[#A80036] rounded px-1 py-0 outline-none w-full shadow-xs"
              />
            ) : (
              <span
                className="text-xs font-bold text-[#181818] font-sans truncate cursor-text"
                onDoubleClick={() => setIsEditing(true)}
                title="Double click to rename package"
              >
                {node.label}
              </span>
            )}
          </div>
        )}

        {/* 4A2. Specific PlantUML Frame Header Cut-out Tab Labeling */}
        {isFrame && (
          <div className="absolute top-0 left-2.5 h-[24px] max-w-[280px] flex items-center pr-3 z-20 overflow-hidden select-none">
            <span className="text-[9px] font-mono text-[#A80036] font-bold uppercase tracking-wider mr-1.5 shrink-0">
              {node.data?.frameKind || 'frame'}
            </span>
            {node.data?.condition && (
              <span className="text-[9px] font-mono text-emerald-800 font-semibold mr-1.5 shrink-0 bg-emerald-50 px-1 rounded truncate max-w-[120px]" title={node.data.condition}>
                [{node.data.condition}]
              </span>
            )}
            {node.sublabel && (
              <span className="text-[9px] font-mono text-gray-600 mr-1 italic shrink-0">
                {node.sublabel.startsWith('<<') ? node.sublabel : `<<${node.sublabel}>>`}
              </span>
            )}
            {isEditing ? (
              <input
                ref={inputRef}
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onBlur={handleCommitEdit}
                onKeyDown={handleKeyDown}
                className="text-xs font-bold text-gray-900 bg-white border border-[#A80036] rounded px-1 py-0 outline-none w-full shadow-xs"
              />
            ) : (
              <span
                className="text-xs font-bold text-[#181818] font-sans truncate cursor-text"
                onDoubleClick={() => setIsEditing(true)}
                title="Double click to rename frame"
              >
                {node.label}
              </span>
            )}
          </div>
        )}

        {/* 4B. Specific PlantUML Note Content (Multiline formatted) */}
        {isNote && (
          <div className="relative z-10 w-full h-full p-2.5 pt-2 flex flex-col text-left overflow-auto">
            {isEditing ? (
              <textarea
                ref={inputRef as any}
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onBlur={handleCommitEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                className="w-full h-full text-xs font-sans text-gray-900 bg-white/95 border border-[#A80036] rounded p-1 outline-none resize-none shadow-xs"
                autoFocus
              />
            ) : (
              <div
                className="text-xs font-sans text-gray-900 leading-relaxed whitespace-pre-wrap cursor-text pr-2"
                onDoubleClick={() => setIsEditing(true)}
                title="Double click to edit note"
              >
                {node.data?.noteText || node.data?.description || node.label}
              </div>
            )}
          </div>
        )}

        {/* 4C. Standard Content Container for All Other Shapes */}
        {!isPackage && !isFrame && !isNote && (
          isState ? (
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-between p-2.5 text-center overflow-hidden">
              <div className="w-full text-center">
                {node.sublabel && (
                  <div className="text-[10px] font-sans italic text-gray-700 leading-none mb-0.5">
                    {node.sublabel}
                  </div>
                )}

                {isEditing ? (
                  <input
                    ref={inputRef}
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onBlur={handleCommitEdit}
                    onKeyDown={handleKeyDown}
                    className="text-xs font-bold text-gray-900 bg-white border border-[#A80036] rounded px-1 py-0.5 outline-none w-full shadow-xs text-center font-sans"
                  />
                ) : (
                  <div
                    className="text-xs font-bold text-[#181818] font-sans cursor-text truncate"
                    onDoubleClick={() => setIsEditing(true)}
                  >
                    {node.label}
                  </div>
                )}
              </div>

              {/* PlantUML State Internal Activities Divider & List */}
              {((node.data?.attributes && node.data.attributes.length > 0) || node.data?.description) ? (
                <div className="w-full border-t border-[#A80036]/50 pt-1 flex-1 flex flex-col text-left font-mono text-[10px] text-gray-800 space-y-0.5 px-1 overflow-auto">
                  {node.data?.attributes?.map((act, i) => (
                    <div key={i} className="truncate">{act}</div>
                  ))}
                  {node.data?.description && !node.data?.attributes?.length && (
                    <div className="italic text-gray-600 line-clamp-2">{node.data.description}</div>
                  )}
                </div>
              ) : (
                <div className="w-full border-t border-[#A80036]/30 pt-1 text-[9px] font-mono text-gray-400 italic">
                  &lt;&lt;state&gt;&gt;
                </div>
              )}
            </div>
          ) : (
            <div className={`relative z-10 w-full h-full flex flex-col items-center justify-center p-3 text-center ${isActor ? 'pt-1' : ''}`}>
              {isActor && (
                <div className="mb-1 flex justify-center">
                  <StickmanActorShape color={strokeColor} size={40} />
                </div>
              )}

              {node.sublabel && (
                <div className="text-[10px] font-sans italic text-gray-700 leading-none mb-0.5">
                  {node.sublabel}
                </div>
              )}

              {isEditing ? (
                <input
                  ref={inputRef}
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onBlur={handleCommitEdit}
                  onKeyDown={handleKeyDown}
                  className="text-xs font-bold text-gray-900 bg-white border border-[#A80036] rounded px-1 py-0.5 outline-none w-full shadow-xs text-center"
                />
              ) : (
                <div
                  className="text-xs font-bold text-[#181818] font-sans cursor-text"
                  onDoubleClick={() => setIsEditing(true)}
                >
                  {node.label}
                </div>
              )}

              {node.data?.technology && (
                <div className="text-[10px] font-mono text-gray-600 mt-0.5">
                  [{node.data.technology}]
                </div>
              )}

              {node.data?.description && (
                <div className="text-[11px] text-gray-700 leading-tight mt-1 line-clamp-3">
                  {node.data.description}
                </div>
              )}
            </div>
          )
        )}

        {/* Ports */}
        {renderPorts(node.id, isHovered, isSelected, onStartConnection)}

        {/* Quick Add Connected Node button on Right */}
        {onQuickAddChild && isHovered && !isPackage && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickAddChild(node.id);
            }}
            className="absolute -right-6 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#A80036] text-white flex items-center justify-center shadow-xs hover:scale-115 transition-transform z-40 cursor-pointer"
            title="Quick add connected element (Click to open Connect menu)"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}

        {/* Corner Resize Handle */}
        {isSelected && onStartResize && (
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-[#A80036] rounded-xs cursor-se-resize z-40 hover:scale-125 transition-transform"
            title="Drag to resize element"
            onMouseDown={(e) => onStartResize(node.id, 'se', e)}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // 5. STANDARD UML CLASSIFIER (Class, Interface, Abstract, Enum, Struct)
  // PlantUML cream `#FEFECE`, `#A80036` crisp borders, Spot Circles (C, I, A, E)
  // =========================================================================
  const spot = getClassifierSpot();
  const isAbstract = node.type === 'abstract-class' || Boolean(node.data?.isAbstract);

  return (
    <div
      id={node.id}
      className={`absolute cursor-move select-none transition-shadow flex flex-col ${
        isSelected ? 'ring-2 ring-[#A80036] ring-offset-2' : ''
      }`}
      style={{
        left: node.x,
        top: node.y,
        width: effectiveWidth,
        height: effectiveHeight,
        minWidth: 60,
        minHeight: 40,
        zIndex: isSelected ? 30 : 10,
        filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.15))'
      }}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Generics Tag (e.g. <T>) on Upper Right Corner in PlantUML Style */}
      {node.data?.generics && (
        <div
          className="absolute -top-3 right-2 bg-[#FEFECE] border border-dashed border-[#A80036] px-1.5 py-0.2 text-[10px] font-mono text-[#181818] z-20 shadow-2xs"
          title={`Generics: ${node.data.generics}`}
        >
          {node.data.generics}
        </div>
      )}

      {/* Main Classifier Card */}
      <div 
        className="w-full h-full flex-1 border overflow-hidden flex flex-col"
        style={{ 
          backgroundColor: colorConfig.bgHex || '#FEFECE', 
          borderColor: colorConfig.borderHex || '#A80036' 
        }}
      >
        {/* Header with Spot Circle and Name */}
        <div 
          className="p-2 border-b flex flex-col items-center justify-center text-center relative"
          style={{ 
            backgroundColor: colorConfig.bgHex || '#FEFECE', 
            borderColor: colorConfig.borderHex || '#A80036' 
          }}
        >
          {/* Stereotype (e.g. <<interface>>, <<abstract>>) */}
          {node.sublabel && (
            <div className="text-[10px] font-sans italic text-gray-700 leading-none mb-1">
              {node.sublabel}
            </div>
          )}

          <div className="flex items-center gap-1.5 justify-center w-full">
            {/* Spot Circle */}
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shadow-2xs shrink-0 border border-black/20"
              style={{ backgroundColor: spot.colorHex, color: '#181818' }}
              title={`Classifier Spot: ${spot.character}`}
            >
              {spot.character}
            </div>

            {/* Class Name */}
            {isEditing ? (
              <input
                ref={inputRef}
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onBlur={handleCommitEdit}
                onKeyDown={handleKeyDown}
                className="text-xs font-bold text-gray-900 bg-white border border-[#A80036] rounded px-1 py-0.5 outline-none w-full shadow-2xs text-center font-sans"
              />
            ) : (
              <div
                className={`text-xs font-bold text-[#181818] font-sans truncate cursor-text ${isAbstract ? 'italic' : ''}`}
                onDoubleClick={() => setIsEditing(true)}
              >
                {node.label}
              </div>
            )}
          </div>
        </div>

        {/* 1. ER Database Table Columns */}
        {isErTable && (
          <div className="p-2 text-[11px]">
            <div className="space-y-1">
              {(node.data?.columns || []).map((col, idx) => {
                const isEditingName = editingMember?.type === 'col-name' && editingMember.index === idx;
                const isEditingType = editingMember?.type === 'col-type' && editingMember.index === idx;

                return (
                  <div key={idx} className="flex items-center justify-between gap-1 group py-0.5 hover:bg-[#FAF5EE] px-1 transition-colors rounded">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const cols = [...(node.data?.columns || [])];
                          cols[idx] = { ...cols[idx], isPk: !cols[idx].isPk };
                          onUpdate({ data: { ...node.data, columns: cols } });
                        }}
                        className="cursor-pointer"
                        title="Click to toggle Primary Key"
                      >
                        {col.isPk ? (
                          <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-amber-500 text-white shrink-0">PK</span>
                        ) : (
                          <span className="w-3 text-center text-gray-400 hover:text-amber-600 shrink-0 font-bold">•</span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const cols = [...(node.data?.columns || [])];
                          cols[idx] = { ...cols[idx], isFk: !cols[idx].isFk };
                          onUpdate({ data: { ...node.data, columns: cols } });
                        }}
                        className="cursor-pointer"
                        title="Click to toggle Foreign Key"
                      >
                        {col.isFk ? (
                          <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-blue-600 text-white shrink-0">FK</span>
                        ) : (
                          <span className="hidden group-hover:inline-block text-[7px] font-bold px-0.5 rounded bg-gray-200 text-gray-500 shrink-0">FK</span>
                        )}
                      </button>

                      {isEditingName ? (
                        <input
                          autoFocus
                          value={memberInputVal}
                          onChange={(e) => setMemberInputVal(e.target.value)}
                          onBlur={handleCommitMemberEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCommitMemberEdit();
                            if (e.key === 'Escape') setEditingMember(null);
                          }}
                          className="font-mono text-xs text-[#181818] bg-white border border-[#c2652a] rounded px-1 py-0 outline-none w-full"
                        />
                      ) : (
                        <span
                          className={`font-mono text-xs text-[#181818] truncate cursor-text ${col.isPk ? 'font-bold' : ''}`}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingMember({ type: 'col-name', index: idx });
                            setMemberInputVal(col.name);
                          }}
                          title="Double-click to edit column name"
                        >
                          {col.name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isEditingType ? (
                        <input
                          autoFocus
                          value={memberInputVal}
                          onChange={(e) => setMemberInputVal(e.target.value)}
                          onBlur={handleCommitMemberEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCommitMemberEdit();
                            if (e.key === 'Escape') setEditingMember(null);
                          }}
                          className="font-mono text-[10px] text-gray-800 bg-white border border-[#c2652a] rounded px-1 py-0 outline-none w-20"
                        />
                      ) : (
                        <span
                          className="font-mono text-[10px] text-gray-600 uppercase cursor-text hover:text-gray-900"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingMember({ type: 'col-type', index: idx });
                            setMemberInputVal(col.type);
                          }}
                          title="Double-click to edit column type"
                        >
                          {col.type}
                        </span>
                      )}

                      {isHovered && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveErColumn(idx);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 p-0.5"
                          title="Delete column"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleAddErColumn}
              className="mt-2 w-full py-0.5 text-[10px] font-medium text-[#A80036] hover:bg-[#FAF5EE] border border-dashed border-[#A80036]/40 rounded flex items-center justify-center gap-1 transition-colors"
            >
              <Plus className="w-2.5 h-2.5" />
              <span>Add Column</span>
            </button>
          </div>
        )}

        {/* 2. Map Dictionary Table */}
        {isMap && (
          <div className="p-2 text-[11px] font-mono">
            <div className="space-y-1">
              {(node.data?.mapEntries || []).map((entry, idx) => {
                const isEditingKey = editingMember?.type === 'map-key' && editingMember.index === idx;
                const isEditingVal = editingMember?.type === 'map-val' && editingMember.index === idx;

                return (
                  <div key={idx} className="flex items-center justify-between group hover:bg-[#FAF5EE] px-1 py-0.5 rounded">
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      {isEditingKey ? (
                        <input
                          autoFocus
                          value={memberInputVal}
                          onChange={(e) => setMemberInputVal(e.target.value)}
                          onBlur={handleCommitMemberEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCommitMemberEdit();
                            if (e.key === 'Escape') setEditingMember(null);
                          }}
                          className="w-1/2 text-xs font-mono bg-white border border-[#c2652a] rounded px-1 outline-none"
                        />
                      ) : (
                        <span
                          className="text-[#8a4518] font-semibold cursor-text"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingMember({ type: 'map-key', index: idx });
                            setMemberInputVal(entry.key);
                          }}
                          title="Double-click to edit key"
                        >
                          {entry.key}
                        </span>
                      )}
                      <span className="text-gray-500">=&gt;</span>
                      {isEditingVal ? (
                        <input
                          autoFocus
                          value={memberInputVal}
                          onChange={(e) => setMemberInputVal(e.target.value)}
                          onBlur={handleCommitMemberEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCommitMemberEdit();
                            if (e.key === 'Escape') setEditingMember(null);
                          }}
                          className="w-1/2 text-xs font-mono bg-white border border-[#c2652a] rounded px-1 outline-none"
                        />
                      ) : (
                        <span
                          className="text-emerald-700 truncate cursor-text"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingMember({ type: 'map-val', index: idx });
                            setMemberInputVal(entry.value);
                          }}
                          title="Double-click to edit value"
                        >
                          {entry.value}
                        </span>
                      )}
                    </div>
                    {isHovered && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMapEntry(idx);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleAddMapEntry}
              className="mt-2 w-full py-0.5 text-[10px] font-medium text-[#A80036] hover:bg-[#FAF5EE] border border-dashed border-[#A80036]/40 rounded flex items-center justify-center gap-1 transition-colors"
            >
              <Plus className="w-2.5 h-2.5" />
              <span>Add Entry</span>
            </button>
          </div>
        )}

        {/* 3. Class / Interface Attributes & Methods */}
        {isClassOrOO && !isMap && !isErTable && (
          <div className="text-[11px] font-mono flex-1">
            {/* Attributes Partition */}
            <div className="p-2 border-b border-[#A80036]">
              <div className="text-[9px] font-sans font-bold text-gray-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Attributes</span>
                <button
                  onClick={handleAddAttribute}
                  className="text-[#A80036] hover:underline flex items-center gap-0.5"
                  title="Add attribute"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>
              <div className="space-y-0.5">
                {(node.data?.attributes || []).map((attr, idx) => {
                  const isEditingThis = editingMember?.type === 'attr' && editingMember.index === idx;

                  return (
                    <div key={idx} className="flex items-center justify-between group hover:bg-[#FAF5EE] px-1 py-0.5 rounded transition-colors">
                      {isEditingThis ? (
                        <input
                          autoFocus
                          value={memberInputVal}
                          onChange={(e) => setMemberInputVal(e.target.value)}
                          onBlur={handleCommitMemberEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCommitMemberEdit();
                            if (e.key === 'Escape') setEditingMember(null);
                          }}
                          className="w-full text-xs font-mono bg-white border border-[#c2652a] rounded px-1 py-0.2 outline-none"
                        />
                      ) : (
                        <div
                          className="flex-1 cursor-text min-w-0"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingMember({ type: 'attr', index: idx });
                            setMemberInputVal(attr);
                          }}
                          title="Double-click to edit attribute"
                        >
                          {renderMemberText(attr)}
                        </div>
                      )}
                      {isHovered && !isEditingThis && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAttribute(idx);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 p-0.5 shrink-0"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Methods Partition */}
            {node.type !== 'enum' && (
              <div className="p-2">
                <div className="text-[9px] font-sans font-bold text-gray-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Methods</span>
                  <button
                    onClick={handleAddMethod}
                    className="text-[#A80036] hover:underline flex items-center gap-0.5"
                    title="Add method"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>
                <div className="space-y-0.5">
                  {(node.data?.methods || []).map((m, idx) => {
                    const isEditingThis = editingMember?.type === 'method' && editingMember.index === idx;

                    return (
                      <div key={idx} className="flex items-center justify-between group hover:bg-[#FAF5EE] px-1 py-0.5 rounded transition-colors">
                        {isEditingThis ? (
                          <input
                            autoFocus
                            value={memberInputVal}
                            onChange={(e) => setMemberInputVal(e.target.value)}
                            onBlur={handleCommitMemberEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCommitMemberEdit();
                              if (e.key === 'Escape') setEditingMember(null);
                            }}
                            className="w-full text-xs font-mono bg-white border border-[#c2652a] rounded px-1 py-0.2 outline-none"
                          />
                        ) : (
                          <div
                            className="flex-1 cursor-text min-w-0"
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setEditingMember({ type: 'method', index: idx });
                              setMemberInputVal(m);
                            }}
                            title="Double-click to edit method"
                          >
                            {renderMemberText(m)}
                          </div>
                        )}
                        {isHovered && !isEditingThis && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMethod(idx);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 p-0.5 shrink-0"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. Object Slots */}
        {isObject && (
          <div className="p-2 text-[11px] font-mono">
            <div className="text-[9px] font-sans font-bold text-gray-600 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Slots</span>
              <button onClick={handleAddObjectSlot} className="text-[#A80036] hover:underline">
                <Plus className="w-2.5 h-2.5" />
              </button>
            </div>
            <div className="space-y-1">
              {(node.data?.slots || []).map((slot, idx) => {
                const isEditingKey = editingMember?.type === 'slot-key' && editingMember.index === idx;
                const isEditingVal = editingMember?.type === 'slot-val' && editingMember.index === idx;

                return (
                  <div key={idx} className="flex items-center justify-between group hover:bg-[#FAF5EE] px-1 py-0.5 rounded">
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      {isEditingKey ? (
                        <input
                          autoFocus
                          value={memberInputVal}
                          onChange={(e) => setMemberInputVal(e.target.value)}
                          onBlur={handleCommitMemberEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCommitMemberEdit();
                            if (e.key === 'Escape') setEditingMember(null);
                          }}
                          className="w-1/2 text-xs font-mono bg-white border border-[#c2652a] rounded px-1 outline-none"
                        />
                      ) : (
                        <span
                          className="text-[#8a4518] font-semibold cursor-text"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingMember({ type: 'slot-key', index: idx });
                            setMemberInputVal(slot.key);
                          }}
                          title="Double-click to edit slot key"
                        >
                          {slot.key}
                        </span>
                      )}
                      <span className="text-gray-500">=</span>
                      {isEditingVal ? (
                        <input
                          autoFocus
                          value={memberInputVal}
                          onChange={(e) => setMemberInputVal(e.target.value)}
                          onBlur={handleCommitMemberEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCommitMemberEdit();
                            if (e.key === 'Escape') setEditingMember(null);
                          }}
                          className="w-1/2 text-xs font-mono bg-white border border-[#c2652a] rounded px-1 outline-none"
                        />
                      ) : (
                        <span
                          className="text-emerald-700 truncate cursor-text"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingMember({ type: 'slot-val', index: idx });
                            setMemberInputVal(slot.value);
                          }}
                          title="Double-click to edit slot value"
                        >
                          {slot.value}
                        </span>
                      )}
                    </div>
                    {isHovered && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveObjectSlot(idx);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. Embedded Tree Content */}
        {isDataTree && (
          <JsonYamlTreeViewer
            format={node.data?.treeFormat || (node.type.includes('yaml') ? 'yaml' : 'json')}
            content={node.data?.treeContent || '{}'}
            onUpdateContent={(newContent) => onUpdate({ data: { ...node.data, treeContent: newContent } })}
          />
        )}

        {/* Fill remaining card height when resized taller */}
        <div className="flex-1 w-full min-h-0" style={{ backgroundColor: colorConfig.bgHex || '#FEFECE' }} />
      </div>

      {/* Ports */}
      {renderPorts(node.id, isHovered, isSelected, onStartConnection, onQuickAddChild)}

      {/* Corner Resize Handle */}
      {isSelected && onStartResize && (
        <div
          className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-[#A80036] rounded-xs cursor-se-resize z-40 hover:scale-125 transition-transform"
          title="Drag to resize element"
          onMouseDown={(e) => onStartResize(node.id, 'se', e)}
        />
      )}
    </div>
  );
};

// =========================================================================
// Helper: 4 Magnetic Anchor Ports (Top, Right, Bottom, Left)
// Double-click on any port opens the connect menu and pre-selects that direction
// =========================================================================
function renderPorts(
  nodeId: string,
  isHovered: boolean,
  isSelected: boolean,
  onStartConnection: (nodeId: string, port: PortPosition, e: React.MouseEvent) => void,
  onQuickAddChild?: (nodeId: string, port: PortPosition) => void
) {
  if (!isHovered && !isSelected) return null;

  return (
    <>
      <div
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#A80036] shadow-xs cursor-crosshair hover:scale-125 transition-transform z-40 flex items-center justify-center group/port"
        title="Connect from Top (Double-click to branch upwards)"
        onMouseDown={(e) => onStartConnection(nodeId, 'top', e)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onQuickAddChild?.(nodeId, 'top');
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-[#A80036] group-hover/port:bg-[#c2652a]" />
      </div>

      <div
        className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#A80036] shadow-xs cursor-crosshair hover:scale-125 transition-transform z-40 flex items-center justify-center group/port"
        title="Connect from Right (Double-click to branch right)"
        onMouseDown={(e) => onStartConnection(nodeId, 'right', e)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onQuickAddChild?.(nodeId, 'right');
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-[#A80036] group-hover/port:bg-[#c2652a]" />
      </div>

      <div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#A80036] shadow-xs cursor-crosshair hover:scale-125 transition-transform z-40 flex items-center justify-center group/port"
        title="Connect from Bottom (Double-click to branch downwards)"
        onMouseDown={(e) => onStartConnection(nodeId, 'bottom', e)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onQuickAddChild?.(nodeId, 'bottom');
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-[#A80036] group-hover/port:bg-[#c2652a]" />
      </div>

      <div
        className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#A80036] shadow-xs cursor-crosshair hover:scale-125 transition-transform z-40 flex items-center justify-center group/port"
        title="Connect from Left (Double-click to branch left)"
        onMouseDown={(e) => onStartConnection(nodeId, 'left', e)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onQuickAddChild?.(nodeId, 'left');
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-[#A80036] group-hover/port:bg-[#c2652a]" />
      </div>
    </>
  );
}
