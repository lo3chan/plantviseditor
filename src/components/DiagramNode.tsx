import React, { useState, useRef, useEffect } from 'react';
import { 
  Cpu, 
  Database, 
  Cloud, 
  Server, 
  Radio, 
  Layers, 
  User, 
  Box, 
  FileCode, 
  Plus, 
  Trash2,
  Edit2,
  Folder,
  FileText,
  CreditCard,
  Hexagon,
  Bot,
  RotateCcw,
  CircleDot,
  HardDrive
} from 'lucide-react';
import { DiagramNode, PortPosition, ErColumn, ObjectSlot, MapEntry } from '../types';
import { getColorConfig } from '../utils/assetsData';

interface DiagramNodeProps {
  node: DiagramNode;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onUpdate: (updatedNode: Partial<DiagramNode>) => void;
  onStartConnection: (nodeId: string, port: PortPosition, e: React.MouseEvent) => void;
  onQuickAddChild?: (nodeId: string) => void;
}

export const DiagramNodeView: React.FC<DiagramNodeProps> = ({
  node,
  isSelected,
  onSelect,
  onUpdate,
  onStartConnection,
  onQuickAddChild
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(node.label);
  const [editSublabel, setEditSublabel] = useState(node.sublabel || '');
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const colorConfig = getColorConfig(node.color);

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

  // Shape / category detectors
  const isClassOrOO = ['class', 'interface', 'abstract-class', 'enum', 'struct', 'protocol', 'exception', 'annotation', 'metaclass'].includes(node.type) || node.category === 'code';
  const isObject = node.type === 'object';
  const isMap = node.type === 'map' || Boolean(node.data?.mapEntries);
  const isErTable = node.type === 'entity' || node.type === 'er-table' || node.category === 'data-schema';
  const isDataTree = node.type === 'data-json' || node.type === 'data-yaml' || node.type === 'json' || node.type === 'yaml';
  const isC4 = node.type.startsWith('c4-') || node.category === 'c4';
  const isEmbedded = ['embedded-salt', 'embedded-ditaa', 'embedded-math'].includes(node.type) || Boolean(node.data?.embeddedType);
  const isNote = node.type === 'note';

  // ER Column handlers
  const handleAddErColumn = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cols = node.data?.columns || [];
    const newCol: ErColumn = {
      name: `col_${cols.length + 1}`,
      type: 'varchar(64)',
      isPk: false
    };
    onUpdate({
      data: {
        ...node.data,
        columns: [...cols, newCol]
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
    onUpdate({
      data: {
        ...node.data,
        attributes: [...attrs, `+field_${attrs.length + 1}: String`]
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
    onUpdate({
      data: {
        ...node.data,
        methods: [...methods, `+operation_${methods.length + 1}(): void`]
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
    onUpdate({
      data: {
        ...node.data,
        mapEntries: [...entries, { key: `prop_${entries.length + 1}`, value: '"val"' }]
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
    onUpdate({
      data: {
        ...node.data,
        slots: [...slots, { key: `key_${slots.length + 1}`, value: '"value"' }]
      }
    });
  };

  const handleRemoveObjectSlot = (idx: number) => {
    const slots = (node.data?.slots || []).filter((_, i) => i !== idx);
    onUpdate({ data: { ...node.data, slots } });
  };

  // Helper for visibility styling
  const renderMemberText = (member: string) => {
    let prefix = '';
    let rest = member;
    let visibilityBadge: React.ReactNode = null;

    if (member.startsWith('+')) {
      prefix = '+';
      rest = member.slice(1).trim();
      visibilityBadge = <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0">+</span>;
    } else if (member.startsWith('-')) {
      prefix = '-';
      rest = member.slice(1).trim();
      visibilityBadge = <span className="w-3.5 h-3.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold flex items-center justify-center shrink-0">-</span>;
    } else if (member.startsWith('#')) {
      prefix = '#';
      rest = member.slice(1).trim();
      visibilityBadge = <span className="w-3.5 h-3.5 rotate-45 bg-amber-100 text-amber-800 text-[9px] font-bold flex items-center justify-center shrink-0"><span className="-rotate-45">#</span></span>;
    } else if (member.startsWith('~')) {
      prefix = '~';
      rest = member.slice(1).trim();
      visibilityBadge = <span className="w-3.5 h-3.5 rounded-xs bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">~</span>;
    }

    const isStatic = rest.includes('{static}');
    const isAbstract = rest.includes('{abstract}');
    const cleanText = rest.replace(/{static}|{abstract}|{field}|{method}/g, '').trim();

    return (
      <div className="flex items-center gap-1.5 min-w-0">
        {visibilityBadge}
        <span className={`truncate text-[#3a302a] ${isStatic ? 'underline' : ''} ${isAbstract ? 'italic text-[#78706a]' : ''}`}>
          {cleanText}
        </span>
      </div>
    );
  };

  // Get Icon based on shape
  const renderIcon = () => {
    if (node.data?.spot) {
      return (
        <div 
          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-xs shrink-0"
          style={{ backgroundColor: node.data.spot.colorHex }}
          title={`Spot: ${node.data.spot.character}`}
        >
          {node.data.spot.character}
        </div>
      );
    }
    switch (node.type) {
      case 'database': return <Database className="w-4 h-4 text-[#c48227]" />;
      case 'storage': return <HardDrive className="w-4 h-4 text-[#8a7d6b]" />;
      case 'cloud':
      case 'cloud-aws':
      case 'cloud-gcp':
      case 'cloud-azure':
      case 'cloud-k8s': return <Cloud className="w-4 h-4 text-[#587a5f]" />;
      case 'node': return <Server className="w-4 h-4 text-[#4f5e6b]" />;
      case 'queue': return <Radio className="w-4 h-4 text-[#b34d28]" />;
      case 'stack': return <Layers className="w-4 h-4 text-[#4f5e6b]" />;
      case 'component': return <Cpu className="w-4 h-4 text-[#c2652a]" />;
      case 'actor': return <User className="w-4 h-4 text-[#8a7d6b]" />;
      case 'agent': return <Bot className="w-4 h-4 text-[#587a5f]" />;
      case 'boundary': return <Radio className="w-4 h-4 text-[#8a7d6b]" />;
      case 'control': return <RotateCcw className="w-4 h-4 text-[#b34d28]" />;
      case 'entity-circle': return <CircleDot className="w-4 h-4 text-[#c48227]" />;
      case 'interface-lollipop': return <CircleDot className="w-4 h-4 text-[#8a7d6b]" />;
      case 'folder': return <Folder className="w-4 h-4 text-[#8a7d6b]" />;
      case 'file': return <FileText className="w-4 h-4 text-[#8a7d6b]" />;
      case 'card': return <CreditCard className="w-4 h-4 text-[#8a7d6b]" />;
      case 'hexagon': return <Hexagon className="w-4 h-4 text-[#c48227]" />;
      case 'note': return <FileText className="w-4 h-4 text-[#b8860b]" />;
      default: return <Box className="w-4 h-4 text-[#c2652a]" />;
    }
  };

  return (
    <div
      id={node.id}
      className={`absolute cursor-move select-none transition-shadow ${
        isSelected ? 'ring-2 ring-[#c2652a] ring-offset-2 shadow-lg' : 'hover:shadow-md'
      }`}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        minHeight: node.height,
        zIndex: isSelected ? 30 : 10
      }}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Visual Container */}
      <div 
        className={`w-full h-full rounded-xl overflow-hidden border shadow-xs transition-colors flex flex-col ${
          isNote ? 'bg-[#fffbe8] border-[#ebd278]' : 'bg-white border-[#d8d0c8]'
        }`}
      >
        {/* Node Header */}
        <div 
          className="px-2.5 py-1.5 border-b border-[#d8d0c8]/60 flex items-center justify-between gap-1.5"
          style={{ backgroundColor: isNote ? '#fef3c7' : colorConfig.bgHex }}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {renderIcon()}
            {isEditing ? (
              <input
                ref={inputRef}
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onBlur={handleCommitEdit}
                onKeyDown={handleKeyDown}
                className="text-xs font-semibold text-[#3a302a] bg-white border border-[#c2652a] rounded px-1 py-0.5 outline-none w-full shadow-2xs"
              />
            ) : (
              <div 
                className="min-w-0 flex-1 cursor-text"
                onDoubleClick={() => setIsEditing(true)}
              >
                <div className="text-xs font-bold text-[#3a302a] truncate font-serif flex items-center gap-1">
                  <span>{node.label}</span>
                  {node.data?.generics && (
                    <span className="text-[10px] font-mono font-normal text-[#c2652a]">{node.data.generics}</span>
                  )}
                  {node.data?.className && (
                    <span className="text-[10px] font-mono font-normal text-[#78706a]">: {node.data.className}</span>
                  )}
                </div>
                {node.sublabel && (
                  <div className="text-[9px] text-[#78706a] font-mono truncate">
                    {node.sublabel}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right badge / quick edit button */}
          {!isEditing && (
            <div className="flex items-center gap-1 shrink-0">
              {isHovered && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="text-[#78706a] hover:text-[#c2652a] p-0.5 rounded"
                  title="Edit label"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Node Body Partition */}
        <div className="flex-1 flex flex-col">
          {/* 1. ER Database Table */}
          {isErTable && (
            <div className="p-2 text-[11px]">
              <div className="space-y-1">
                {(node.data?.columns || []).map((col, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-1 group py-0.5 hover:bg-[#faf5ee] px-1 rounded transition-colors">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {col.isPk ? (
                        <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-[#f59e0b] text-white shrink-0">PK</span>
                      ) : col.isFk ? (
                        <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-[#3b82f6] text-white shrink-0">FK</span>
                      ) : (
                        <span className="w-4 shrink-0 text-center text-[#a8a29e]">•</span>
                      )}
                      <span className="font-mono font-medium text-[#3a302a] truncate">{col.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="font-mono text-[10px] text-[#78706a] uppercase">{col.type}</span>
                      {isHovered && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveErColumn(idx);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-[#a8a29e] hover:text-red-500"
                          title="Delete column"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddErColumn}
                className="mt-2 w-full py-0.5 text-[10px] font-medium text-[#c2652a] hover:bg-[#faf5ee] border border-dashed border-[#c2652a]/40 rounded flex items-center justify-center gap-1 transition-colors"
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
                {(node.data?.mapEntries || []).map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between group hover:bg-[#faf5ee] px-1 py-0.5 rounded">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-[#8a4518] font-semibold">{entry.key}</span>
                      <span className="text-[#78706a]">=&gt;</span>
                      <span className="text-[#059669] truncate">{entry.value}</span>
                    </div>
                    {isHovered && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMapEntry(idx);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-[#a8a29e] hover:text-red-500"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddMapEntry}
                className="mt-2 w-full py-0.5 text-[10px] font-medium text-[#c2652a] hover:bg-[#faf5ee] border border-dashed border-[#c2652a]/40 rounded flex items-center justify-center gap-1 transition-colors"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>Add Entry</span>
              </button>
            </div>
          )}

          {/* 3. Class / Interface / Struct / Enum */}
          {isClassOrOO && !isMap && (
            <div className="text-[11px] font-mono flex-1">
              {/* Attributes Partition */}
              <div className="p-2 border-b border-[#d8d0c8]/40">
                <div className="text-[9px] font-sans font-bold text-[#78706a] uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Attributes</span>
                  <button
                    onClick={handleAddAttribute}
                    className="text-[#c2652a] hover:underline flex items-center gap-0.5"
                    title="Add attribute"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>
                <div className="space-y-0.5">
                  {(node.data?.attributes || []).map((attr, idx) => (
                    <div key={idx} className="flex items-center justify-between group hover:bg-[#faf5ee] px-1 rounded">
                      {renderMemberText(attr)}
                      {isHovered && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAttribute(idx);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-[#a8a29e] hover:text-red-500"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Operations / Methods Partition */}
              {node.type !== 'enum' && (
                <div className="p-2">
                  <div className="text-[9px] font-sans font-bold text-[#78706a] uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Methods</span>
                    <button
                      onClick={handleAddMethod}
                      className="text-[#c2652a] hover:underline flex items-center gap-0.5"
                      title="Add method"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    {(node.data?.methods || []).map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between group hover:bg-[#faf5ee] px-1 rounded">
                        {renderMemberText(m)}
                        {isHovered && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMethod(idx);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-[#a8a29e] hover:text-red-500"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Object Instance */}
          {isObject && (
            <div className="p-2 text-[11px] font-mono">
              <div className="text-[9px] font-sans font-bold text-[#78706a] uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Slots</span>
                <button onClick={handleAddObjectSlot} className="text-[#c2652a] hover:underline">
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>
              <div className="space-y-1">
                {(node.data?.slots || []).map((slot, idx) => (
                  <div key={idx} className="flex items-center justify-between group hover:bg-[#faf5ee] px-1 py-0.5 rounded">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-[#8a4518] font-semibold">{slot.key}</span>
                      <span className="text-[#78706a]">=</span>
                      <span className="text-[#059669] truncate">{slot.value}</span>
                    </div>
                    {isHovered && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveObjectSlot(idx);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-[#a8a29e] hover:text-red-500"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Embedded Sub-Engines (Salt Wireframe, Ditaa, Math) */}
          {isEmbedded && (
            <div className="p-2 bg-[#fcf9f2] text-xs">
              {node.data?.embeddedType === 'salt' && (
                <div className="border border-[#d8d0c8] rounded p-2 bg-white space-y-1.5 shadow-2xs">
                  <div className="text-[10px] font-bold text-[#3a302a] border-b pb-1">Salt Form Wireframe</div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-[#78706a]">Input:</span>
                    <input readOnly value="sample_value" className="border px-1 py-0.5 text-[10px] rounded bg-gray-50 text-gray-700 w-24" />
                  </div>
                  <div className="flex gap-1 pt-1">
                    <button className="px-2 py-0.5 bg-[#c2652a] text-white text-[9px] rounded font-medium">[Save]</button>
                    <button className="px-2 py-0.5 bg-gray-100 border text-gray-700 text-[9px] rounded">[Cancel]</button>
                  </div>
                </div>
              )}

              {node.data?.embeddedType === 'ditaa' && (
                <pre className="font-mono text-[10px] bg-[#1e1e1e] text-emerald-400 p-2 rounded overflow-auto leading-tight">
                  {node.data.embeddedContent || '+---+   +---+\n| A |-->| B |\n+---+   +---+'}
                </pre>
              )}
            </div>
          )}

          {/* 6. Embedded JSON / YAML Data Tree */}
          {isDataTree && (
            <div className="p-2 font-mono text-[10px] bg-[#1e1e1e] text-[#d4d4d4] max-h-48 overflow-auto">
              <pre className="whitespace-pre-wrap leading-tight font-mono selection:bg-[#c2652a]">
                {node.data?.treeContent || '{}'}
              </pre>
            </div>
          )}

          {/* 7. Notes */}
          {isNote && (
            <div className="p-2.5 text-xs text-[#524838] leading-relaxed italic">
              {node.data?.description || node.label}
            </div>
          )}

          {/* 8. Generic Description for components, deployment, C4 */}
          {!isClassOrOO && !isErTable && !isMap && !isObject && !isDataTree && !isEmbedded && !isNote && (
            <div className="p-2 text-xs text-[#605850] space-y-1">
              {node.data?.technology && (
                <span className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#f5e6d8] text-[#8a4518]">
                  [{node.data.technology}]
                </span>
              )}
              {node.data?.description && (
                <div className="text-[11px] leading-relaxed">
                  {node.data.description}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4 Magnetic Anchor Ports (Top, Right, Bottom, Left) */}
      {(isHovered || isSelected) && (
        <>
          <div
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#c2652a] shadow-xs cursor-crosshair hover:scale-125 transition-transform z-40 flex items-center justify-center"
            title="Connect from Top"
            onMouseDown={(e) => onStartConnection(node.id, 'top', e)}
          >
            <div className="w-1 h-1 rounded-full bg-[#c2652a]" />
          </div>

          <div
            className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#c2652a] shadow-xs cursor-crosshair hover:scale-125 transition-transform z-40 flex items-center justify-center"
            title="Connect from Right"
            onMouseDown={(e) => onStartConnection(node.id, 'right', e)}
          >
            <div className="w-1 h-1 rounded-full bg-[#c2652a]" />
          </div>

          <div
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#c2652a] shadow-xs cursor-crosshair hover:scale-125 transition-transform z-40 flex items-center justify-center"
            title="Connect from Bottom"
            onMouseDown={(e) => onStartConnection(node.id, 'bottom', e)}
          >
            <div className="w-1 h-1 rounded-full bg-[#c2652a]" />
          </div>

          <div
            className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#c2652a] shadow-xs cursor-crosshair hover:scale-125 transition-transform z-40 flex items-center justify-center"
            title="Connect from Left"
            onMouseDown={(e) => onStartConnection(node.id, 'left', e)}
          >
            <div className="w-1 h-1 rounded-full bg-[#c2652a]" />
          </div>
        </>
      )}

      {/* Quick Add Connected Node button on Right */}
      {onQuickAddChild && isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickAddChild(node.id);
          }}
          className="absolute -right-6 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#c2652a] text-white flex items-center justify-center shadow-xs hover:scale-115 transition-transform z-40"
          title="Quick add connected element"
        >
          <Plus className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
