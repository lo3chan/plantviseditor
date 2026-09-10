import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  Trash2, 
  Check, 
  Minus, 
  Plus, 
  GitBranch, 
  Layers 
} from 'lucide-react';
import { SequenceBlock } from '../types';

interface SequenceBlockBarProps {
  block: SequenceBlock;
  maxSteps: number;
  onUpdateBlock: (patch: Partial<SequenceBlock>) => void;
  onDelete: () => void;
}

const BLOCK_TYPES = [
  { id: 'alt', label: 'alt (Alternative Conditional)', desc: 'Conditional branching' },
  { id: 'opt', label: 'opt (Optional Execution)', desc: 'Executes only when true' },
  { id: 'loop', label: 'loop (Iteration)', desc: 'Repeated loop execution' },
  { id: 'par', label: 'par (Parallel Concurrency)', desc: 'Parallel concurrent threads' },
  { id: 'critical', label: 'critical (Atomic Section)', desc: 'Thread-safe critical block' },
  { id: 'group', label: 'group (Logical Group)', desc: 'Custom grouping frame' },
  { id: 'break', label: 'break (Exit Frame)', desc: 'Break loop or sequence' }
];

export const SequenceBlockBar: React.FC<SequenceBlockBarProps> = ({
  block,
  maxSteps,
  onUpdateBlock,
  onDelete
}) => {
  const [activeMenu, setActiveMenu] = useState<'none' | 'type' | 'edit'>('none');
  const [conditionInput, setConditionInput] = useState(block.condition || '');
  const [labelInput, setLabelInput] = useState(block.label || '');

  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setConditionInput(block.condition || '');
    setLabelInput(block.label || '');
  }, [block.condition, block.label]);

  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setActiveMenu('none');
      }
    };
    window.addEventListener('mousedown', handleDown);
    return () => window.removeEventListener('mousedown', handleDown);
  }, []);

  const currentType = BLOCK_TYPES.find(b => b.id === block.type) || BLOCK_TYPES[0];

  return (
    <div
      ref={barRef}
      className="absolute -top-10 left-4 z-40 flex items-center gap-1.5 p-1 bg-[#2b2622] text-[#f5efe6] rounded-xl shadow-xl border border-[#4a4036] font-sans text-xs select-none backdrop-blur-md"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. FRAGMENT TYPE DROPDOWN */}
      <div className="relative">
        <button
          onClick={() => setActiveMenu(activeMenu === 'type' ? 'none' : 'type')}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#3d342c] hover:bg-[#4a4036] text-white transition-all font-mono font-bold text-xs"
        >
          <span className="text-[#d4834f] uppercase">{block.type}</span>
          <ChevronDown className="w-3 h-3 text-[#b0a498]" />
        </button>

        {activeMenu === 'type' && (
          <div className="absolute top-full left-0 mt-1.5 w-60 bg-[#1f1b18] border border-[#4a4036] rounded-xl shadow-2xl p-1.5 z-50">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#b0a498] px-2 py-1">
              Select Fragment Type
            </div>
            <div className="flex flex-col gap-0.5">
              {BLOCK_TYPES.map(bt => (
                <button
                  key={bt.id}
                  onClick={() => {
                    onUpdateBlock({ type: bt.id });
                    setActiveMenu('none');
                  }}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-left text-xs transition-colors ${
                    block.type === bt.id ? 'bg-[#c2652a] text-white font-medium' : 'hover:bg-[#2e2823] text-[#e8dfd5]'
                  }`}
                >
                  <div>
                    <div className="font-mono font-bold">{bt.id}</div>
                    <div className="text-[10px] opacity-70">{bt.desc}</div>
                  </div>
                  {block.type === bt.id && <Check className="w-3.5 h-3.5 ml-1" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. GUARD CONDITION & LABEL INPUTS */}
      <div className="flex items-center gap-1">
        <input
          value={conditionInput}
          onChange={(e) => setConditionInput(e.target.value)}
          onBlur={() => onUpdateBlock({ condition: conditionInput.trim() || undefined })}
          placeholder="[condition]"
          className="px-2 py-0.5 w-24 bg-[#1f1b18] text-xs font-mono text-[#d4834f] rounded border border-[#4a4036] outline-none"
          title="Guard Condition"
        />
        <input
          value={labelInput}
          onChange={(e) => setLabelInput(e.target.value)}
          onBlur={() => onUpdateBlock({ label: labelInput.trim() })}
          placeholder="Frame label..."
          className="px-2 py-0.5 w-28 bg-[#1f1b18] text-xs text-[#f5efe6] rounded border border-[#4a4036] outline-none"
          title="Frame Description / Label"
        />
      </div>

      <div className="w-[1px] h-4 bg-[#4a4036]" />

      {/* 3. STEP SPAN CONTROLS */}
      <div className="flex items-center gap-1 text-[11px] text-[#b0a498] font-mono px-1">
        <span>Steps</span>
        <span className="text-white font-bold">{block.startOrder}..{block.endOrder}</span>

        {/* Start order - / + */}
        <div className="flex items-center gap-0.5 ml-1">
          <button
            onClick={() => onUpdateBlock({ startOrder: Math.max(1, block.startOrder - 1) })}
            disabled={block.startOrder <= 1}
            className="p-1 rounded hover:bg-[#3d342c] disabled:opacity-30 text-[#e8dfd5]"
            title="Expand top"
          >
            <Minus className="w-2.5 h-2.5" />
          </button>
          <button
            onClick={() => onUpdateBlock({ startOrder: Math.min(block.endOrder, block.startOrder + 1) })}
            disabled={block.startOrder >= block.endOrder}
            className="p-1 rounded hover:bg-[#3d342c] disabled:opacity-30 text-[#e8dfd5]"
            title="Shrink top"
          >
            <Plus className="w-2.5 h-2.5" />
          </button>
        </div>

        <span className="opacity-40">|</span>

        {/* End order - / + */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onUpdateBlock({ endOrder: Math.max(block.startOrder, block.endOrder - 1) })}
            disabled={block.endOrder <= block.startOrder}
            className="p-1 rounded hover:bg-[#3d342c] disabled:opacity-30 text-[#e8dfd5]"
            title="Shrink bottom"
          >
            <Minus className="w-2.5 h-2.5" />
          </button>
          <button
            onClick={() => onUpdateBlock({ endOrder: Math.min(maxSteps, block.endOrder + 1) })}
            disabled={block.endOrder >= maxSteps}
            className="p-1 rounded hover:bg-[#3d342c] disabled:opacity-30 text-[#e8dfd5]"
            title="Expand bottom"
          >
            <Plus className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      <div className="w-[1px] h-4 bg-[#4a4036]" />

      {/* 4. DELETE FRAGMENT */}
      <button
        onClick={onDelete}
        className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/40 transition-colors"
        title="Delete Fragment"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
