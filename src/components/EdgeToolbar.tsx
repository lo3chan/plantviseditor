import React, { useState, useRef, useEffect } from 'react';
import { 
  Trash2, 
  ChevronDown, 
  Tag, 
  ArrowLeftRight, 
  Check, 
  X,
  Palette,
  ArrowRight,
  Sparkles,
  Link,
  Layers
} from 'lucide-react';
import { DiagramEdge, DiagramNode, EdgeArrowType, EdgeStyle } from '../types';

export interface EdgeToolbarProps {
  edge: DiagramEdge;
  nodes?: DiagramNode[];
  sourceNodeLabel?: string;
  targetNodeLabel?: string;
  position: { x: number; y: number };
  onUpdateEdge: (updated: Partial<DiagramEdge>) => void;
  onDeleteEdge: () => void;
  onClose?: () => void;
}

interface RelationOption {
  id: EdgeArrowType;
  label: string;
  category: 'uml' | 'arch' | 'erd' | 'general';
  plantuml: string;
  description: string;
  defaultStyle?: EdgeStyle;
  renderIcon: (color?: string) => React.ReactNode;
}

export const RELATION_OPTIONS: RelationOption[] = [
  // UML Object Oriented
  {
    id: 'arrow',
    label: 'Association',
    category: 'uml',
    plantuml: '-->',
    description: 'Directed connection (A calls, knows, or navigates to B)',
    defaultStyle: 'solid',
    renderIcon: (color = 'currentColor') => (
      <svg width="26" height="16" viewBox="0 0 26 16" className="shrink-0">
        <line x1="2" y1="8" x2="19" y2="8" stroke={color} strokeWidth="1.8" />
        <polygon points="17,4.5 24,8 17,11.5" fill={color} />
      </svg>
    )
  },
  {
    id: 'inheritance',
    label: 'Inheritance',
    category: 'uml',
    plantuml: '--|>',
    description: 'Generalization (A subclasses / extends parent B)',
    defaultStyle: 'solid',
    renderIcon: (color = 'currentColor') => (
      <svg width="26" height="16" viewBox="0 0 26 16" className="shrink-0">
        <line x1="2" y1="8" x2="17" y2="8" stroke={color} strokeWidth="1.8" />
        <polygon points="17,3.5 24,8 17,12.5" fill="#ffffff" stroke={color} strokeWidth="1.6" />
      </svg>
    )
  },
  {
    id: 'composition',
    label: 'Composition',
    category: 'uml',
    plantuml: '*--',
    description: 'Strong whole-part ownership (child lifecycle tied to parent)',
    defaultStyle: 'solid',
    renderIcon: (color = 'currentColor') => (
      <svg width="26" height="16" viewBox="0 0 26 16" className="shrink-0">
        <polygon points="2,8 7,4 12,8 7,12" fill={color} />
        <line x1="12" y1="8" x2="24" y2="8" stroke={color} strokeWidth="1.8" />
      </svg>
    )
  },
  {
    id: 'aggregation',
    label: 'Aggregation',
    category: 'uml',
    plantuml: 'o--',
    description: 'Shared reference / collection (child can exist independently)',
    defaultStyle: 'solid',
    renderIcon: (color = 'currentColor') => (
      <svg width="26" height="16" viewBox="0 0 26 16" className="shrink-0">
        <polygon points="2,8 7,4 12,8 7,12" fill="#ffffff" stroke={color} strokeWidth="1.6" />
        <line x1="12" y1="8" x2="24" y2="8" stroke={color} strokeWidth="1.8" />
      </svg>
    )
  },
  {
    id: 'dependency',
    label: 'Dependency',
    category: 'uml',
    plantuml: '..>',
    description: 'Usage dependency (A temporarily relies on / instantiates B)',
    defaultStyle: 'dashed',
    renderIcon: (color = 'currentColor') => (
      <svg width="26" height="16" viewBox="0 0 26 16" className="shrink-0">
        <line x1="2" y1="8" x2="19" y2="8" stroke={color} strokeWidth="1.8" strokeDasharray="3,2" />
        <polygon points="17,4.5 24,8 17,11.5" fill={color} />
      </svg>
    )
  },
  {
    id: 'realization',
    label: 'Realization',
    category: 'uml',
    plantuml: '..|>',
    description: 'Interface implementation (A implements contract B)',
    defaultStyle: 'dashed',
    renderIcon: (color = 'currentColor') => (
      <svg width="26" height="16" viewBox="0 0 26 16" className="shrink-0">
        <line x1="2" y1="8" x2="17" y2="8" stroke={color} strokeWidth="1.8" strokeDasharray="3,2" />
        <polygon points="17,3.5 24,8 17,12.5" fill="#ffffff" stroke={color} strokeWidth="1.6" />
      </svg>
    )
  },

  // ERD / Database Relationships
  {
    id: 'crows-foot-many',
    label: 'One-to-Many (1:N)',
    category: 'erd',
    plantuml: '||--o{',
    description: 'Entity relationship: one parent row maps to multiple children',
    defaultStyle: 'solid',
    renderIcon: (color = 'currentColor') => (
      <svg width="26" height="16" viewBox="0 0 26 16" className="shrink-0">
        <line x1="2" y1="8" x2="16" y2="8" stroke={color} strokeWidth="1.8" />
        <line x1="16" y1="8" x2="24" y2="3" stroke={color} strokeWidth="1.8" />
        <line x1="16" y1="8" x2="24" y2="8" stroke={color} strokeWidth="1.8" />
        <line x1="16" y1="8" x2="24" y2="13" stroke={color} strokeWidth="1.8" />
      </svg>
    )
  },
  {
    id: 'crows-foot-one',
    label: 'One-to-One (1:1)',
    category: 'erd',
    plantuml: '||--||',
    description: 'Entity relationship: exactly one-to-one strictly mapped',
    defaultStyle: 'solid',
    renderIcon: (color = 'currentColor') => (
      <svg width="26" height="16" viewBox="0 0 26 16" className="shrink-0">
        <line x1="2" y1="8" x2="24" y2="8" stroke={color} strokeWidth="1.8" />
        <line x1="6" y1="4" x2="6" y2="12" stroke={color} strokeWidth="1.8" />
        <line x1="10" y1="4" x2="10" y2="12" stroke={color} strokeWidth="1.8" />
        <line x1="16" y1="4" x2="16" y2="12" stroke={color} strokeWidth="1.8" />
        <line x1="20" y1="4" x2="20" y2="12" stroke={color} strokeWidth="1.8" />
      </svg>
    )
  },
  {
    id: 'crows-foot-zero-many',
    label: 'Zero-to-Many (0:N)',
    category: 'erd',
    plantuml: '||--o{',
    description: 'Optional relationship: zero or more children permitted',
    defaultStyle: 'solid',
    renderIcon: (color = 'currentColor') => (
      <svg width="26" height="16" viewBox="0 0 26 16" className="shrink-0">
        <line x1="2" y1="8" x2="14" y2="8" stroke={color} strokeWidth="1.8" />
        <circle cx="15" cy="8" r="2.5" fill="#ffffff" stroke={color} strokeWidth="1.6" />
        <line x1="18" y1="8" x2="24" y2="3" stroke={color} strokeWidth="1.8" />
        <line x1="18" y1="8" x2="24" y2="13" stroke={color} strokeWidth="1.8" />
      </svg>
    )
  },
  {
    id: 'crows-foot-zero-one',
    label: 'Zero-to-One (0:1)',
    category: 'erd',
    plantuml: '|o--||',
    description: 'Optional singular: zero or one instance allowed',
    defaultStyle: 'solid',
    renderIcon: (color = 'currentColor') => (
      <svg width="26" height="16" viewBox="0 0 26 16" className="shrink-0">
        <line x1="2" y1="8" x2="14" y2="8" stroke={color} strokeWidth="1.8" />
        <circle cx="15" cy="8" r="2.5" fill="#ffffff" stroke={color} strokeWidth="1.6" />
        <line x1="18" y1="8" x2="24" y2="8" stroke={color} strokeWidth="1.8" />
        <line x1="22" y1="4" x2="22" y2="12" stroke={color} strokeWidth="1.8" />
      </svg>
    )
  },

  // Architecture & Component
  {
    id: 'socket-ball',
    label: 'Socket & Ball',
    category: 'arch',
    plantuml: '()-0)',
    description: 'Component interface provider and required socket',
    defaultStyle: 'solid',
    renderIcon: (color = 'currentColor') => (
      <svg width="26" height="16" viewBox="0 0 26 16" className="shrink-0">
        <line x1="2" y1="8" x2="10" y2="8" stroke={color} strokeWidth="1.8" />
        <circle cx="12" cy="8" r="3" fill={color} />
        <path d="M 18 3 A 5 5 0 0 0 18 13" fill="none" stroke={color} strokeWidth="1.8" />
        <line x1="19" y1="8" x2="24" y2="8" stroke={color} strokeWidth="1.8" />
      </svg>
    )
  },
  {
    id: 'lollipop',
    label: 'Interface Pin',
    category: 'arch',
    plantuml: '-(0-',
    description: 'Exposed service contract lollipop pin',
    defaultStyle: 'solid',
    renderIcon: (color = 'currentColor') => (
      <svg width="26" height="16" viewBox="0 0 26 16" className="shrink-0">
        <line x1="2" y1="8" x2="12" y2="8" stroke={color} strokeWidth="1.8" />
        <circle cx="16" cy="8" r="4" fill="#ffffff" stroke={color} strokeWidth="1.8" />
        <line x1="20" y1="8" x2="24" y2="8" stroke={color} strokeWidth="1.8" />
      </svg>
    )
  },
  {
    id: 'bi-arrow',
    label: 'Bidirectional',
    category: 'general',
    plantuml: '<-->',
    description: 'Two-way synchronous or bidirectional channel',
    defaultStyle: 'solid',
    renderIcon: (color = 'currentColor') => (
      <svg width="26" height="16" viewBox="0 0 26 16" className="shrink-0">
        <polygon points="9,4.5 2,8 9,11.5" fill={color} />
        <line x1="7" y1="8" x2="19" y2="8" stroke={color} strokeWidth="1.8" />
        <polygon points="17,4.5 24,8 17,11.5" fill={color} />
      </svg>
    )
  },
  {
    id: 'none',
    label: 'Simple Link',
    category: 'general',
    plantuml: '--',
    description: 'Undirected line connection or comment annotation',
    defaultStyle: 'solid',
    renderIcon: (color = 'currentColor') => (
      <svg width="26" height="16" viewBox="0 0 26 16" className="shrink-0">
        <line x1="2" y1="8" x2="24" y2="8" stroke={color} strokeWidth="1.8" />
      </svg>
    )
  }
];

// Quick presets for multiplicity
const MULTIPLICITY_PRESETS = [
  { value: '1', label: '1 (One)' },
  { value: '0..1', label: '0..1 (Optional)' },
  { value: '*', label: '* (Many)' },
  { value: '1..*', label: '1..* (At least 1)' },
  { value: '', label: 'None' }
];

// Quick verbal action presets
const VERB_PRESETS = [
  'places',
  'contains',
  'manages',
  'persists to',
  'calls',
  'uses',
  'subscribes to',
  'inherits',
  'authenticates',
  'depends on'
];

export const EdgeToolbar: React.FC<EdgeToolbarProps> = ({
  edge,
  nodes = [],
  sourceNodeLabel,
  targetNodeLabel,
  position,
  onUpdateEdge,
  onDeleteEdge,
  onClose
}) => {
  const [activeMenu, setActiveMenu] = useState<'none' | 'source' | 'verb' | 'target' | 'cardinality' | 'style' | 'color'>('none');
  const [customVerb, setCustomVerb] = useState(edge.label || '');

  const toolbarRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setActiveMenu('none');
      }
    };
    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, []);

  const currentOption = RELATION_OPTIONS.find(o => o.id === (edge.arrowType || 'arrow')) || RELATION_OPTIONS[0];
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);

  const displaySource = sourceNodeLabel || sourceNode?.label || 'Source';
  const displayTarget = targetNodeLabel || targetNode?.label || 'Target';

  // Reverse link direction
  const handleReverseDirection = () => {
    onUpdateEdge({
      source: edge.target,
      target: edge.source,
      sourceHandle: edge.targetHandle || 'right',
      targetHandle: edge.sourceHandle || 'left',
      cardinalitySource: edge.cardinalityTarget,
      cardinalityTarget: edge.cardinalitySource
    });
  };

  return (
    <div
      ref={toolbarRef}
      id="edge-toolbar-container"
      className="absolute z-50 -translate-x-1/2 -translate-y-full mb-3 pointer-events-auto flex flex-col items-center select-none"
      style={{ left: position.x, top: position.y - 12 }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. MODULAR VERBAL SENTENCE BAR: [ Source ▾ ]  ➔  [ Verb / Relation ▾ ]  ➔  [ Target ▾ ]  [ ⇄ Swap ] */}
      <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-[#c2652a]/40 shadow-xl rounded-full px-3 py-1.5 text-xs text-[#2c2420]">
        
        {/* SOURCE NODE SELECTOR */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'source' ? 'none' : 'source')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-bold transition-colors ${
              activeMenu === 'source'
                ? 'bg-[#c2652a] text-white'
                : 'hover:bg-[#faf5ee] text-[#1c1917]'
            }`}
            title={`Source node: ${displaySource}`}
          >
            <span className="max-w-[110px] truncate">{displaySource}</span>
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          {/* Source Node Dropdown */}
          {activeMenu === 'source' && nodes.length > 0 && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-[#d8d0c8] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
              <span className="text-[10px] font-bold text-[#78706a] uppercase px-1 block mb-1">
                Change Source Node
              </span>
              <div className="space-y-0.5 max-h-48 overflow-y-auto scrollbar-thin">
                {nodes.map(n => (
                  <button
                    key={n.id}
                    onClick={() => {
                      onUpdateEdge({ source: n.id });
                      setActiveMenu('none');
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      edge.source === n.id 
                        ? 'bg-[#c2652a]/10 text-[#c2652a] font-bold' 
                        : 'hover:bg-[#faf5ee] text-[#2c2420]'
                    }`}
                  >
                    <span className="truncate">{n.label}</span>
                    {edge.source === n.id && <Check className="w-3.5 h-3.5 text-[#c2652a] shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* VERBAL RELATION / PREDICATE SELECTOR */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'verb' ? 'none' : 'verb')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold transition-all shadow-2xs ${
              activeMenu === 'verb'
                ? 'bg-[#c2652a] text-white shadow-xs'
                : 'bg-[#faf5ee] hover:bg-[#ebd9c8] text-[#c2652a] border border-[#d8d0c8]/60'
            }`}
            title="Configure relationship and action verb"
          >
            <span>➔</span>
            <span className="max-w-[140px] truncate text-[11.5px]">
              {edge.label ? `${edge.label} (${currentOption.label.split(' ')[0]})` : currentOption.label}
            </span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {/* Verbal Relation Popover */}
          {activeMenu === 'verb' && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 bg-white border border-[#c2652a]/30 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#d8d0c8]/50">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#78706a]">
                  Verbal Relation & Action
                </span>
                <span className="text-[10px] text-[#c2652a] font-semibold bg-[#c2652a]/10 px-1.5 py-0.2 rounded-full uppercase">
                  {currentOption.category}
                </span>
              </div>

              {/* Action Verb Presets */}
              <div className="my-2">
                <label className="text-[10px] font-semibold text-[#78706a] uppercase block mb-1">
                  Action Verb / Predicate:
                </label>
                <div className="flex flex-wrap gap-1">
                  {VERB_PRESETS.map(verb => (
                    <button
                      key={verb}
                      onClick={() => {
                        setCustomVerb(verb);
                        onUpdateEdge({ label: verb });
                      }}
                      className={`text-[10.5px] px-2 py-0.5 rounded-md border transition-colors ${
                        edge.label === verb
                          ? 'bg-[#c2652a] text-white border-[#c2652a] font-bold'
                          : 'bg-[#faf5ee] border-[#d8d0c8] text-[#3a302a] hover:bg-[#ebd9c8]'
                      }`}
                    >
                      {verb}
                    </button>
                  ))}
                </div>

                {/* Custom Verb Input */}
                <div className="flex items-center gap-1 mt-2">
                  <input
                    type="text"
                    placeholder="Custom verb (e.g. subscribes to)..."
                    value={customVerb}
                    onChange={(e) => setCustomVerb(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onUpdateEdge({ label: customVerb.trim() || undefined });
                        setActiveMenu('none');
                      }
                    }}
                    className="flex-1 text-[11px] px-2.5 py-1 bg-[#faf5ee] border border-[#d8d0c8] rounded-lg outline-none focus:border-[#c2652a]"
                  />
                  {edge.label && (
                    <button
                      onClick={() => {
                        setCustomVerb('');
                        onUpdateEdge({ label: undefined });
                      }}
                      className="text-[10px] text-red-500 hover:underline px-1"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onUpdateEdge({ label: customVerb.trim() || undefined });
                      setActiveMenu('none');
                    }}
                    className="px-2.5 py-1 bg-[#c2652a] text-white rounded-lg text-[10.5px] font-bold"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Relationship Type Selector */}
              <div className="pt-2 border-t border-[#d8d0c8]/50">
                <label className="text-[10px] font-semibold text-[#78706a] uppercase block mb-1">
                  Structural Relationship Type:
                </label>
                <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin pr-1">
                  {RELATION_OPTIONS.map(opt => {
                    const isSelected = edge.arrowType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          onUpdateEdge({
                            arrowType: opt.id,
                            style: opt.defaultStyle || edge.style || 'solid'
                          });
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl border flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-[#c2652a]/10 border-[#c2652a] text-[#c2652a] font-bold'
                            : 'bg-white border-[#d8d0c8]/50 hover:bg-[#faf5ee] text-[#2c2420]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {opt.renderIcon(isSelected ? '#c2652a' : '#78706a')}
                          <div>
                            <span className="font-semibold text-[11.5px] block leading-tight">
                              {opt.label}
                            </span>
                            <span className="text-[10px] text-[#78706a] block leading-tight">
                              {opt.description}
                            </span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#c2652a] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TARGET NODE SELECTOR */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'target' ? 'none' : 'target')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-bold transition-colors ${
              activeMenu === 'target'
                ? 'bg-[#c2652a] text-white'
                : 'hover:bg-[#faf5ee] text-[#1c1917]'
            }`}
            title={`Target node: ${displayTarget}`}
          >
            <span className="max-w-[110px] truncate">{displayTarget}</span>
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          {/* Target Node Dropdown */}
          {activeMenu === 'target' && nodes.length > 0 && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-[#d8d0c8] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
              <span className="text-[10px] font-bold text-[#78706a] uppercase px-1 block mb-1">
                Change Target Node
              </span>
              <div className="space-y-0.5 max-h-48 overflow-y-auto scrollbar-thin">
                {nodes.map(n => (
                  <button
                    key={n.id}
                    onClick={() => {
                      onUpdateEdge({ target: n.id });
                      setActiveMenu('none');
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      edge.target === n.id 
                        ? 'bg-[#c2652a]/10 text-[#c2652a] font-bold' 
                        : 'hover:bg-[#faf5ee] text-[#2c2420]'
                    }`}
                  >
                    <span className="truncate">{n.label}</span>
                    {edge.target === n.id && <Check className="w-3.5 h-3.5 text-[#c2652a] shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* DIRECTION SWAP BUTTON */}
        <button
          onClick={handleReverseDirection}
          className="p-1 rounded-full hover:bg-[#faf5ee] text-[#78706a] hover:text-[#c2652a] transition-colors"
          title="Swap source and target (Reverse direction)"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. SECONDARY MODULAR VERBAL CONTROLS: Multiplicity, Line Style, Delete */}
      <div className="mt-1 flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-[#d8d0c8]/80 shadow-md rounded-full px-2.5 py-1 text-[11px] text-[#2c2420]">
        
        {/* MULTIPLICITY SELECTOR */}
        <div className="relative flex items-center gap-1">
          <span className="text-[#78706a] font-medium">Card:</span>
          
          {/* Source Multiplicity */}
          <button
            onClick={() => setActiveMenu(activeMenu === 'cardinality' ? 'none' : 'cardinality')}
            className="px-1.5 py-0.5 rounded-md bg-[#faf5ee] hover:bg-[#ebd9c8] font-mono font-bold text-[#c2652a] transition-colors"
            title="Configure multiplicity"
          >
            {edge.cardinalitySource || '1'} : {edge.cardinalityTarget || '*'}
          </button>

          {/* Multiplicity Popover */}
          {activeMenu === 'cardinality' && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-[#d8d0c8] rounded-2xl shadow-xl p-2.5 z-50 animate-in fade-in zoom-in-95">
              <span className="text-[10px] font-bold text-[#78706a] uppercase block mb-2">
                Configure Multiplicity / Cardinality
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#78706a] block mb-1">Source End:</label>
                  <div className="space-y-1">
                    {MULTIPLICITY_PRESETS.map(p => (
                      <button
                        key={p.value}
                        onClick={() => {
                          onUpdateEdge({ cardinalitySource: p.value || undefined });
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-[10.5px] transition-colors ${
                          (edge.cardinalitySource || '') === p.value
                            ? 'bg-[#c2652a]/10 text-[#c2652a] font-bold'
                            : 'hover:bg-[#faf5ee] text-[#3a302a]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-[#78706a] block mb-1">Target End:</label>
                  <div className="space-y-1">
                    {MULTIPLICITY_PRESETS.map(p => (
                      <button
                        key={p.value}
                        onClick={() => {
                          onUpdateEdge({ cardinalityTarget: p.value || undefined });
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-[10.5px] transition-colors ${
                          (edge.cardinalityTarget || '') === p.value
                            ? 'bg-[#c2652a]/10 text-[#c2652a] font-bold'
                            : 'hover:bg-[#faf5ee] text-[#3a302a]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-[1px] h-3.5 bg-[#d8d0c8]/60" />

        {/* LINE STYLE MODULAR DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'style' ? 'none' : 'style')}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-[#faf5ee] text-[#3a302a] font-medium"
            title="Line style"
          >
            <span>Line:</span>
            <span className="font-bold text-[#c2652a] capitalize">{edge.style || 'solid'}</span>
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          {activeMenu === 'style' && (
            <div className="absolute top-full left-0 mt-2 w-44 bg-white border border-[#d8d0c8] rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
              {[
                { id: 'solid' as EdgeStyle, label: 'Solid (Direct / Sync)' },
                { id: 'dashed' as EdgeStyle, label: 'Dashed (Async / Weak)' },
                { id: 'dotted' as EdgeStyle, label: 'Dotted (Dependency)' }
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => {
                    onUpdateEdge({ style: st.id });
                    setActiveMenu('none');
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                    (edge.style || 'solid') === st.id 
                      ? 'bg-[#c2652a]/10 text-[#c2652a] font-bold' 
                      : 'hover:bg-[#faf5ee] text-[#3a302a]'
                  }`}
                >
                  <span>{st.label}</span>
                  {(edge.style || 'solid') === st.id && <Check className="w-3.5 h-3.5 text-[#c2652a]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-[1px] h-3.5 bg-[#d8d0c8]/60" />

        {/* DELETE LINK */}
        <button
          onClick={onDeleteEdge}
          className="p-1 rounded-md hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
          title="Delete Link"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

      </div>
    </div>
  );
};
