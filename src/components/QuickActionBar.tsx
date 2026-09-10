import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  Search, 
  Palette, 
  ArrowRight, 
  ArrowDown, 
  StickyNote, 
  FolderPlus, 
  Copy, 
  Trash2, 
  Check, 
  Plus, 
  Sparkles, 
  Boxes, 
  Database, 
  Cloud, 
  User, 
  GitBranch, 
  ArrowLeftRight, 
  Tag, 
  X,
  Layers,
  FileCode,
  Folder,
  Sliders
} from 'lucide-react';
import { DiagramNode, DiagramEdge, EdgeArrowType, AssetItem } from '../types';
import { UNIFIED_ASSETS, COLOR_THEMES } from '../utils/assetsData';

interface QuickActionBarProps {
  x: number;
  y: number;
  node: DiagramNode;
  allNodes: DiagramNode[];
  onMorphNode?: (asset: AssetItem) => void;
  onUpdateNode: (patch: Partial<DiagramNode>) => void;
  onConnectToNode?: (targetId: string, arrowType?: EdgeArrowType, verb?: string) => void;
  onDuplicate: () => void;
  onAddConnectedNode: (direction: 'right' | 'down') => void;
  onAddNote?: () => void;
  onWrapInPackage?: () => void;
  onDelete: () => void;
  onOpenInspector?: () => void;
}

// Verbal stereotypes for quick assignment
const VERBAL_STEREOTYPES = [
  { label: '«entity»', desc: 'Core domain entity / data model' },
  { label: '«service»', desc: 'Business logic & orchestration service' },
  { label: '«repository»', desc: 'Data access & persistence layer' },
  { label: '«controller»', desc: 'API router / HTTP controller' },
  { label: '«boundary»', desc: 'External gateway / subsystem boundary' },
  { label: '«aggregate»', desc: 'DDD aggregate root boundary' },
  { label: '«component»', desc: 'Modular architectural subsystem' },
  { label: '«api»', desc: 'Public REST / GraphQL specification' },
  { label: '«dto»', desc: 'Data transfer object' }
];

// Helper to get friendly node type name
export function getFriendlyNodeTypeName(type: string, shape?: string): string {
  switch (type) {
    case 'class': return 'Class';
    case 'abstract-class': return 'Abstract Class';
    case 'interface': return 'Interface';
    case 'enum': return 'Enum';
    case 'struct': return 'Struct';
    case 'protocol': return 'Protocol';
    case 'object': return 'Object Instance';
    case 'er-entity': return 'Relational Table';
    case 'database': return 'SQL Database';
    case 'queue': return 'Message Queue';
    case 'stack': return 'Memory Stack';
    case 'cloud': return 'Cloud System';
    case 'component': return 'Component';
    case 'node3d': return '3D Compute Server';
    case 'hexagon': return 'Hexagon Module';
    case 'actor': return 'Human Actor';
    case 'agent': return 'Agent / Bot';
    case 'boundary': return 'System Boundary';
    case 'state': return 'State';
    case 'usecase': return 'Use Case';
    case 'start': return 'Start Point';
    case 'stop': return 'End Point';
    case 'decision': return 'Decision Diamond';
    case 'action': return 'Activity Action';
    case 'sync-bar': return 'Fork / Join Bar';
    case 'package': return 'Package';
    case 'folder': return 'Subnet Folder';
    case 'frame': return 'Frame';
    case 'json-tree': return 'JSON Document';
    case 'data-json': return 'JSON Document';
    case 'data-yaml': return 'YAML Document';
    case 'map-table': return 'Key-Value Map';
    case 'note': return 'UML Note';
    case 'embedded-math': return 'LaTeX Math';
    case 'embedded-ditaa': return 'Ditaa ASCII';
    case 'wbs-node': return 'WBS Work Package';
    case 'embedded-salt': return 'Salt Wireframe';
    default:
      if (shape) {
        return shape.charAt(0).toUpperCase() + shape.slice(1);
      }
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

// Group assets into semantic verbal categories for the morph dropdown
const MORPH_CATEGORIES = [
  {
    title: 'Structure & Code',
    items: ['code-class', 'code-abstract', 'code-interface', 'code-enum', 'code-struct', 'code-object']
  },
  {
    title: 'Data & Schema',
    items: ['data-entity', 'infra-database', 'data-json', 'data-map']
  },
  {
    title: 'Embedded Sub-Engines',
    items: ['embed-math', 'embed-ditaa', 'wbs-work-package', 'embed-salt']
  },
  {
    title: 'Services & Cloud',
    items: ['comp-component', 'infra-cloud', 'infra-queue', 'infra-node', 'arch-hexagon']
  },
  {
    title: 'Behavior & States',
    items: ['state-box', 'usecase-actor', 'state-start', 'state-stop', 'act-decision', 'act-action']
  },
  {
    title: 'People & Actors',
    items: ['actor-user', 'actor-agent', 'actor-boundary']
  },
  {
    title: 'Containers & Groups',
    items: ['cont-package', 'cont-folder', 'cont-frame']
  }
];

export const QuickActionBar: React.FC<QuickActionBarProps> = ({
  x,
  y,
  node,
  allNodes,
  onMorphNode,
  onUpdateNode,
  onConnectToNode,
  onDuplicate,
  onAddConnectedNode,
  onAddNote,
  onWrapInPackage,
  onDelete,
  onOpenInspector
}) => {
  const [activeMenu, setActiveMenu] = useState<'none' | 'type' | 'tone' | 'nature' | 'connect' | 'more'>('none');
  const [typeSearch, setTypeSearch] = useState('');
  const [customStereotype, setCustomStereotype] = useState('');
  const [connectSearch, setConnectSearch] = useState('');
  const [connectRelation, setConnectRelation] = useState<EdgeArrowType>('crows-foot-many');
  const [connectVerb, setConnectVerb] = useState('manages');

  const barRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setActiveMenu('none');
      }
    };
    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, []);

  const currentColorConfig = COLOR_THEMES.find(t => t.id === node.color) || COLOR_THEMES[0];
  const currentTypeName = getFriendlyNodeTypeName(node.type, node.shape);
  const currentStereotype = node.sublabel ? node.sublabel.replace(/^<<|>>$/g, '') : null;

  // Other nodes available for verbal linking
  const candidateTargets = allNodes.filter(n => n.id !== node.id);
  const filteredCandidates = candidateTargets.filter(n => 
    n.label.toLowerCase().includes(connectSearch.toLowerCase()) ||
    n.type.toLowerCase().includes(connectSearch.toLowerCase())
  );

  return (
    <div 
      ref={barRef}
      className="absolute z-40 -translate-x-1/2 -translate-y-full mb-3 pointer-events-auto select-none"
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Primary Condensed Verbal Pill Bar */}
      <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-[#c2652a]/40 shadow-xl rounded-full p-1.5 text-xs text-[#2c2420]">
        
        {/* SEGMENT 1: MODULAR TYPE REPLACE DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'type' ? 'none' : 'type')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold transition-colors ${
              activeMenu === 'type'
                ? 'bg-[#c2652a] text-white shadow-xs'
                : 'bg-[#faf5ee] hover:bg-[#ebd9c8] text-[#3a302a] border border-[#d8d0c8]/60'
            }`}
            title="Replace element type / archetype"
          >
            <Boxes className="w-3.5 h-3.5 text-[#c2652a] shrink-0" />
            <span className="font-bold text-[11.5px] max-w-[130px] truncate">
              {currentTypeName}
            </span>
            <ChevronDown className={`w-3 h-3 opacity-70 transition-transform ${activeMenu === 'type' ? 'rotate-180' : ''}`} />
          </button>

          {/* Morph Type Dropdown Popover */}
          {activeMenu === 'type' && onMorphNode && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-[#c2652a]/30 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-[#d8d0c8]/50">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#78706a]">
                  Replace Element Type
                </span>
                <span className="text-[10px] text-[#c2652a] font-semibold bg-[#c2652a]/10 px-1.5 py-0.2 rounded-full">
                  Instant Morph
                </span>
              </div>

              {/* Type Search Bar */}
              <div className="relative my-2">
                <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-[#78706a]" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search table, db, queue, cloud, actor..."
                  value={typeSearch}
                  onChange={(e) => setTypeSearch(e.target.value)}
                  className="w-full text-[11px] pl-7 pr-2 py-1.5 bg-[#faf5ee] border border-[#d8d0c8] rounded-xl outline-none focus:border-[#c2652a]"
                />
              </div>

              {/* Grouped Assets List */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {MORPH_CATEGORIES.map(cat => {
                  const catAssets = cat.items
                    .map(id => UNIFIED_ASSETS.find(a => a.id === id))
                    .filter((a): a is AssetItem => Boolean(a))
                    .filter(a => 
                      !typeSearch || 
                      a.label.toLowerCase().includes(typeSearch.toLowerCase()) ||
                      a.description.toLowerCase().includes(typeSearch.toLowerCase())
                    );

                  if (catAssets.length === 0) return null;

                  return (
                    <div key={cat.title}>
                      <span className="text-[10px] font-bold text-[#78706a] uppercase px-1">
                        {cat.title}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {catAssets.map(asset => {
                          const isCurrent = asset.nodeType === node.type;
                          return (
                            <button
                              key={asset.id}
                              onClick={() => {
                                onMorphNode(asset);
                                setActiveMenu('none');
                              }}
                              className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                                isCurrent 
                                  ? 'bg-[#c2652a]/10 text-[#c2652a] font-bold border border-[#c2652a]/30'
                                  : 'hover:bg-[#faf5ee] text-[#2c2420]'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-semibold truncate">{asset.label}</span>
                                <span className="text-[10px] text-[#78706a] truncate max-w-[120px]">
                                  {asset.description}
                                </span>
                              </div>
                              {isCurrent && <Check className="w-3.5 h-3.5 text-[#c2652a] shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SEGMENT 2: VERBAL TONE / PALETTE DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'tone' ? 'none' : 'tone')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors ${
              activeMenu === 'tone'
                ? 'bg-[#faf5ee] text-[#c2652a] ring-1 ring-[#c2652a]'
                : 'hover:bg-[#faf5ee] text-[#57534e]'
            }`}
            title={`Visual tone: ${currentColorConfig.name}`}
          >
            <span 
              className="w-3 h-3 rounded-full border border-black/10 shrink-0"
              style={{ backgroundColor: currentColorConfig.hex }}
            />
            <span className="text-[11px] font-medium hidden sm:inline">
              {currentColorConfig.name.split(' ')[0]}
            </span>
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          {/* Color Themes Popover */}
          {activeMenu === 'tone' && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-[#d8d0c8] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
              <span className="text-[10px] font-bold text-[#78706a] uppercase px-1 block mb-1.5">
                Select Visual Palette
              </span>
              <div className="space-y-1">
                {COLOR_THEMES.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      onUpdateNode({ color: theme.id });
                      setActiveMenu('none');
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors ${
                      node.color === theme.id 
                        ? 'bg-[#c2652a]/10 text-[#c2652a] font-bold' 
                        : 'hover:bg-[#faf5ee] text-[#3a302a]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: theme.hex }}
                      />
                      <span>{theme.name}</span>
                    </div>
                    {node.color === theme.id && <Check className="w-3.5 h-3.5 text-[#c2652a]" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SEGMENT 3: VERBAL STEREOTYPE / NATURE DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'nature' ? 'none' : 'nature')}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] transition-colors ${
              currentStereotype
                ? 'bg-[#c2652a]/10 text-[#c2652a] font-bold border border-[#c2652a]/30'
                : 'hover:bg-[#faf5ee] text-[#78706a] border border-transparent'
            }`}
            title="Configure architectural stereotype"
          >
            <Tag className="w-3 h-3 shrink-0" />
            <span className="max-w-[85px] truncate font-mono text-[10.5px]">
              {currentStereotype ? `«${currentStereotype}»` : '+ Nature'}
            </span>
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          {/* Stereotype Popover */}
          {activeMenu === 'nature' && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-[#d8d0c8] rounded-2xl shadow-xl p-2.5 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#d8d0c8]/50">
                <span className="text-[10px] font-bold text-[#78706a] uppercase">
                  Architectural Stereotype
                </span>
                {currentStereotype && (
                  <button
                    onClick={() => {
                      onUpdateNode({ sublabel: undefined });
                      setActiveMenu('none');
                    }}
                    className="text-[10px] text-red-500 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Custom Stereotype Input */}
              <div className="flex items-center gap-1 my-2">
                <input
                  type="text"
                  placeholder="Custom e.g. service, api..."
                  value={customStereotype}
                  onChange={(e) => setCustomStereotype(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customStereotype.trim()) {
                      onUpdateNode({ sublabel: `<<${customStereotype.trim().replace(/^<<|>>$/g, '')}>>` });
                      setActiveMenu('none');
                    }
                  }}
                  className="flex-1 text-[11px] px-2 py-1 bg-[#faf5ee] border border-[#d8d0c8] rounded-lg outline-none focus:border-[#c2652a]"
                />
                <button
                  onClick={() => {
                    if (customStereotype.trim()) {
                      onUpdateNode({ sublabel: `<<${customStereotype.trim().replace(/^<<|>>$/g, '')}>>` });
                      setActiveMenu('none');
                    }
                  }}
                  className="px-2 py-1 bg-[#c2652a] text-white rounded-lg text-[10px] font-bold"
                >
                  Set
                </button>
              </div>

              {/* Presets */}
              <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
                {VERBAL_STEREOTYPES.map(s => {
                  const isSelected = currentStereotype === s.label.replace(/^<<|>>$/g, '');
                  return (
                    <button
                      key={s.label}
                      onClick={() => {
                        onUpdateNode({ sublabel: s.label });
                        setActiveMenu('none');
                      }}
                      className={`w-full text-left px-2 py-1 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        isSelected 
                          ? 'bg-[#c2652a]/10 text-[#c2652a] font-bold'
                          : 'hover:bg-[#faf5ee] text-[#3a302a]'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-mono font-semibold text-[11px]">{s.label}</span>
                        <span className="text-[9.5px] text-[#78706a]">{s.desc}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#c2652a] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="w-[1px] h-4 bg-[#d8d0c8]/60 mx-0.5" />

        {/* Edit / Inspect button */}
        {onOpenInspector && (
          <button
            onClick={() => onOpenInspector()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold hover:bg-[#faf5ee] text-[#3a302a] transition-colors"
            title="Open Element Properties & Data Inspector"
          >
            <Sliders className="w-3 h-3 text-[#c2652a]" />
            <span>Edit</span>
          </button>
        )}

        {/* SEGMENT 4: VERBAL LINK TO DROPDOWN ("Connect to...") */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'connect' ? 'none' : 'connect')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold transition-colors ${
              activeMenu === 'connect'
                ? 'bg-[#c2652a] text-white shadow-xs'
                : 'hover:bg-[#faf5ee] text-[#c2652a] font-bold'
            }`}
            title="Connect verbally to another node on canvas"
          >
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11.5px]">Link To...</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {/* Connect Dropdown Popover */}
          {activeMenu === 'connect' && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-[#c2652a]/30 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#78706a] block mb-1">
                Verbal Link Builder
              </span>
              <p className="text-[11px] text-[#78706a] mb-2">
                Connect <strong className="text-[#1c1917]">{node.label}</strong> to target:
              </p>

              {/* Relationship Type verbal selector */}
              <div className="mb-2">
                <label className="text-[10px] font-semibold text-[#78706a] uppercase block mb-1">
                  Relationship Type:
                </label>
                <div className="grid grid-cols-2 gap-1 text-[10.5px]">
                  {[
                    { id: 'crows-foot-many' as EdgeArrowType, label: 'One-to-Many (1:N)' },
                    { id: 'arrow' as EdgeArrowType, label: 'Association (calls)' },
                    { id: 'inheritance' as EdgeArrowType, label: 'Inheritance (is a)' },
                    { id: 'composition' as EdgeArrowType, label: 'Composition (owns)' },
                    { id: 'dependency' as EdgeArrowType, label: 'Dependency (uses)' },
                    { id: 'bi-arrow' as EdgeArrowType, label: 'Bidirectional' }
                  ].map(rel => (
                    <button
                      key={rel.id}
                      onClick={() => setConnectRelation(rel.id)}
                      className={`px-2 py-1 rounded-lg border text-left font-medium transition-colors ${
                        connectRelation === rel.id
                          ? 'bg-[#c2652a]/10 border-[#c2652a] text-[#c2652a] font-bold'
                          : 'bg-[#faf5ee] border-[#d8d0c8]/70 text-[#3a302a] hover:border-[#c2652a]'
                      }`}
                    >
                      {rel.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Verb Selector */}
              <div className="mb-2">
                <label className="text-[10px] font-semibold text-[#78706a] uppercase block mb-1">
                  Verbal Description / Action:
                </label>
                <div className="flex flex-wrap gap-1">
                  {['manages', 'places', 'contains', 'persists to', 'calls', 'uses', 'inherits'].map(verb => (
                    <button
                      key={verb}
                      onClick={() => setConnectVerb(verb)}
                      className={`text-[10px] px-1.5 py-0.5 rounded-md border transition-colors ${
                        connectVerb === verb
                          ? 'bg-[#c2652a] text-white border-[#c2652a] font-bold'
                          : 'bg-[#faf5ee] border-[#d8d0c8] text-[#3a302a] hover:bg-[#ebd9c8]'
                      }`}
                    >
                      {verb}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Candidate Nodes Search */}
              <div className="mt-2 pt-2 border-t border-[#d8d0c8]/50">
                <label className="text-[10px] font-semibold text-[#78706a] uppercase block mb-1">
                  Choose Target Node:
                </label>
                <input
                  type="text"
                  placeholder="Filter targets..."
                  value={connectSearch}
                  onChange={(e) => setConnectSearch(e.target.value)}
                  className="w-full text-[11px] px-2.5 py-1 bg-[#faf5ee] border border-[#d8d0c8] rounded-lg outline-none focus:border-[#c2652a] mb-1.5"
                />

                <div className="max-h-36 overflow-y-auto space-y-1 scrollbar-thin">
                  {filteredCandidates.length === 0 ? (
                    <div className="text-[11px] text-[#78706a] text-center py-2">
                      No other nodes available on canvas.
                    </div>
                  ) : (
                    filteredCandidates.map(cand => (
                      <button
                        key={cand.id}
                        onClick={() => {
                          if (onConnectToNode) {
                            onConnectToNode(cand.id, connectRelation, connectVerb);
                          }
                          setActiveMenu('none');
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-lg bg-[#faf5ee] hover:bg-[#ebd9c8] text-xs flex items-center justify-between text-[#1c1917] transition-colors border border-[#d8d0c8]/40"
                      >
                        <span className="font-bold truncate">{cand.label}</span>
                        <span className="text-[10px] text-[#78706a] bg-white px-1.5 py-0.2 rounded border border-[#d8d0c8]/60 shrink-0">
                          {getFriendlyNodeTypeName(cand.type, cand.shape)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Branching Buttons */}
              <div className="mt-2.5 pt-2 border-t border-[#d8d0c8]/50 flex items-center justify-between text-[11px]">
                <span className="text-[#78706a] text-[10px] font-semibold uppercase">Or spawn new:</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      onAddConnectedNode('right');
                      setActiveMenu('none');
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#faf5ee] hover:bg-[#ebd9c8] text-[#c2652a] font-semibold text-[10.5px]"
                  >
                    <span>Branch Right ➔</span>
                  </button>
                  <button
                    onClick={() => {
                      onAddConnectedNode('down');
                      setActiveMenu('none');
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#faf5ee] hover:bg-[#ebd9c8] text-[#c2652a] font-semibold text-[10.5px]"
                  >
                    <span>Branch Down ⬇</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-[1px] h-4 bg-[#d8d0c8]/60 mx-0.5" />

        {/* SEGMENT 5: MODULAR MORE ACTIONS DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'more' ? 'none' : 'more')}
            className={`p-1.5 rounded-full transition-colors ${
              activeMenu === 'more' ? 'bg-[#faf5ee] text-[#c2652a]' : 'hover:bg-[#faf5ee] text-[#78706a]'
            }`}
            title="More actions"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {/* More Actions Popover */}
          {activeMenu === 'more' && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-[#d8d0c8] rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 text-xs">
              {onOpenInspector && (
                <button
                  onClick={() => {
                    onOpenInspector();
                    setActiveMenu('none');
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl hover:bg-[#faf5ee] text-left flex items-center gap-2 text-[#3a302a] font-semibold transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#c2652a]" />
                  <span>Inspect Properties</span>
                </button>
              )}

              <button
                onClick={() => {
                  onDuplicate();
                  setActiveMenu('none');
                }}
                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-[#faf5ee] text-left flex items-center gap-2 text-[#3a302a] transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-[#78706a]" />
                <span>Duplicate (Ctrl+D)</span>
              </button>

              {onAddNote && (
                <button
                  onClick={() => {
                    onAddNote();
                    setActiveMenu('none');
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl hover:bg-[#faf5ee] text-left flex items-center gap-2 text-[#3a302a] transition-colors"
                >
                  <StickyNote className="w-3.5 h-3.5 text-amber-600" />
                  <span>Attach UML Note</span>
                </button>
              )}

              {onWrapInPackage && (
                <button
                  onClick={() => {
                    onWrapInPackage();
                    setActiveMenu('none');
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl hover:bg-[#faf5ee] text-left flex items-center gap-2 text-[#3a302a] transition-colors"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-blue-600" />
                  <span>Wrap in Package</span>
                </button>
              )}

              <div className="my-1 border-t border-[#d8d0c8]/60" />

              <button
                onClick={() => {
                  onDelete();
                  setActiveMenu('none');
                }}
                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-red-50 text-left flex items-center gap-2 text-red-600 font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Element</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
