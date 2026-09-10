import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ArrowRight, 
  ArrowDown, 
  Sparkles, 
  Check, 
  Layers, 
  Box, 
  Database, 
  Server, 
  Cloud, 
  StickyNote, 
  GitBranch,
  CornerDownRight
} from 'lucide-react';
import { DiagramNode, DiagramEdge, EdgeArrowType } from '../types';

interface QuickBranchPopupProps {
  sourceNode: DiagramNode;
  x: number;
  y: number;
  onBranch: (
    direction: 'right' | 'down',
    options?: {
      type?: string;
      label?: string;
      category?: string;
      color?: string;
      arrowType?: EdgeArrowType;
      relationshipVerb?: string;
    }
  ) => void;
  onClose: () => void;
}

const TARGET_TYPES = [
  { id: 'same', label: 'Same Type', icon: Layers, desc: 'Clone shape & styling' },
  { id: 'class', label: 'Class', icon: Box, desc: 'Object-oriented class' },
  { id: 'interface', label: 'Interface', icon: Sparkles, desc: 'Contract / Interface' },
  { id: 'database', label: 'Database', icon: Database, desc: 'Storage / ER table' },
  { id: 'queue', label: 'Queue', icon: Server, desc: 'Message queue / broker' },
  { id: 'cloud', label: 'Cloud Service', icon: Cloud, desc: 'Microservice / gateway' },
  { id: 'note', label: 'UML Note', icon: StickyNote, desc: 'Comment / documentation' }
];

const RELATIONSHIPS: Array<{ id: EdgeArrowType; label: string; puml: string }> = [
  { id: 'arrow', label: 'Association', puml: '-->' },
  { id: 'inheritance', label: 'Inherits', puml: '--|>' },
  { id: 'composition', label: 'Composed Of', puml: '*--' },
  { id: 'dependency', label: 'Depends On', puml: '..>' },
  { id: 'crows-foot-many', label: 'One-to-Many', puml: '}o--' }
];

export const QuickBranchPopup: React.FC<QuickBranchPopupProps> = ({
  sourceNode,
  x,
  y,
  onBranch,
  onClose
}) => {
  const [direction, setDirection] = useState<'right' | 'down'>('right');
  const [selectedType, setSelectedType] = useState<string>('same');
  const [selectedArrow, setSelectedArrow] = useState<EdgeArrowType>('arrow');
  const [nodeLabel, setNodeLabel] = useState<string>('');
  const [verbLabel, setVerbLabel] = useState<string>('');
  const popupRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && !(e.target as HTMLElement)?.matches('button')) {
        handleExecute();
      }
    };
    window.addEventListener('mousedown', handleDown);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('keydown', handleKey);
    };
  }, [direction, selectedType, selectedArrow, nodeLabel, verbLabel]);

  const handleExecute = (overrideType?: string, overrideDir?: 'right' | 'down') => {
    const finalDir = overrideDir || direction;
    const finalType = overrideType || selectedType;
    
    let resolvedType = sourceNode.type;
    let resolvedCategory = sourceNode.category;
    let resolvedColor = sourceNode.color || 'sienna';

    if (finalType === 'class') {
      resolvedType = 'class';
      resolvedCategory = 'class';
      resolvedColor = 'sienna';
    } else if (finalType === 'interface') {
      resolvedType = 'interface';
      resolvedCategory = 'class';
      resolvedColor = 'sand';
    } else if (finalType === 'database') {
      resolvedType = 'database';
      resolvedCategory = 'storage';
      resolvedColor = 'emerald';
    } else if (finalType === 'queue') {
      resolvedType = 'queue';
      resolvedCategory = 'arch';
      resolvedColor = 'copper';
    } else if (finalType === 'cloud') {
      resolvedType = 'cloud';
      resolvedCategory = 'arch';
      resolvedColor = 'slate';
    } else if (finalType === 'note') {
      resolvedType = 'note';
      resolvedCategory = 'note';
      resolvedColor = 'gold';
    }

    const defaultName = finalType === 'same'
      ? `${sourceNode.label} Connected`
      : finalType === 'note'
        ? 'Note'
        : `New${finalType.charAt(0).toUpperCase() + finalType.slice(1)}`;

    onBranch(finalDir, {
      type: resolvedType,
      category: resolvedCategory,
      color: resolvedColor,
      label: nodeLabel.trim() || defaultName,
      arrowType: selectedArrow,
      relationshipVerb: verbLabel.trim() || undefined
    });
  };

  return (
    <div
      ref={popupRef}
      style={{ left: x, top: y }}
      className="absolute z-50 w-72 bg-white rounded-2xl shadow-2xl border border-[#d8d0c8] p-3 text-xs text-[#2c2420] animate-in fade-in zoom-in-95 duration-150 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#d8d0c8]/60">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-[#c2652a]/15 text-[#c2652a] flex items-center justify-center font-bold">
            <GitBranch className="w-3 h-3" />
          </div>
          <div>
            <div className="font-bold text-[#2c2420] leading-none">Connect Element</div>
            <div className="text-[10px] text-[#78706a] leading-tight truncate max-w-[170px]">
              Branching from <span className="font-semibold text-[#c2652a]">{sourceNode.label}</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-[#78706a] hover:text-[#2c2420] hover:bg-[#faf5ee] rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Direction Selection */}
      <div className="my-2">
        <label className="text-[10px] font-bold text-[#78706a] uppercase tracking-wider block mb-1">
          Branch Direction:
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setDirection('right')}
            className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
              direction === 'right'
                ? 'bg-[#c2652a] text-white border-[#c2652a] shadow-xs'
                : 'bg-[#faf5ee] text-[#3a302a] border-[#d8d0c8] hover:bg-[#ebd9c8]'
            }`}
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Right (➔)</span>
          </button>
          <button
            type="button"
            onClick={() => setDirection('down')}
            className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
              direction === 'down'
                ? 'bg-[#c2652a] text-white border-[#c2652a] shadow-xs'
                : 'bg-[#faf5ee] text-[#3a302a] border-[#d8d0c8] hover:bg-[#ebd9c8]'
            }`}
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>Down (⬇)</span>
          </button>
        </div>
      </div>

      {/* Target Element Type */}
      <div className="my-2">
        <label className="text-[10px] font-bold text-[#78706a] uppercase tracking-wider block mb-1">
          Connected Element Type:
        </label>
        <div className="grid grid-cols-2 gap-1">
          {TARGET_TYPES.map(t => {
            const Icon = t.icon;
            const isSel = selectedType === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedType(t.id)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left border transition-all cursor-pointer ${
                  isSel
                    ? 'bg-[#c2652a]/10 border-[#c2652a] text-[#c2652a] font-bold'
                    : 'bg-white border-[#d8d0c8]/60 hover:bg-[#faf5ee] text-[#3a302a]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isSel ? 'text-[#c2652a]' : 'text-[#78706a]'}`} />
                <span className="truncate text-[10.5px]">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Relationship Type */}
      <div className="my-2">
        <label className="text-[10px] font-bold text-[#78706a] uppercase tracking-wider block mb-1">
          Relationship Type:
        </label>
        <div className="flex flex-wrap gap-1">
          {RELATIONSHIPS.map(rel => (
            <button
              key={rel.id}
              type="button"
              onClick={() => setSelectedArrow(rel.id)}
              className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                selectedArrow === rel.id
                  ? 'bg-[#2c2420] text-white border-[#2c2420] font-semibold'
                  : 'bg-[#faf5ee] border-[#d8d0c8] text-[#78706a] hover:bg-[#ebd9c8]'
              }`}
            >
              <span>{rel.label}</span>
              <span className="ml-1 opacity-60 font-mono">{rel.puml}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Optional Custom Label & Verb */}
      <div className="my-2 space-y-1.5">
        <div>
          <input
            type="text"
            placeholder="New element name (optional)..."
            value={nodeLabel}
            onChange={(e) => setNodeLabel(e.target.value)}
            className="w-full text-xs px-2.5 py-1 bg-[#faf5ee] border border-[#d8d0c8] rounded-lg outline-none focus:border-[#c2652a] text-[#2c2420] placeholder-[#9a9088]"
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Relationship label (e.g. calls, persists)..."
            value={verbLabel}
            onChange={(e) => setVerbLabel(e.target.value)}
            className="w-full text-xs px-2.5 py-1 bg-[#faf5ee] border border-[#d8d0c8] rounded-lg outline-none focus:border-[#c2652a] text-[#2c2420] placeholder-[#9a9088]"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t border-[#d8d0c8]/60 flex items-center justify-between gap-1.5">
        <button
          type="button"
          onClick={() => handleExecute('same', 'right')}
          className="text-[10px] text-[#78706a] hover:text-[#c2652a] underline cursor-pointer"
        >
          Fast Branch Right ➔
        </button>

        <button
          type="button"
          onClick={() => handleExecute()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#c2652a] hover:bg-[#a95420] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
        >
          <CornerDownRight className="w-3.5 h-3.5" />
          <span>Connect</span>
        </button>
      </div>
    </div>
  );
};
