import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  ArrowLeftRight, 
  ArrowLeft,
  ArrowRight,
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Check, 
  StickyNote, 
  Sparkles,
  RotateCw,
  Send,
  X
} from 'lucide-react';
import { SequenceMessage, SequenceParticipant } from '../types';

interface SequenceMessageBarProps {
  message: SequenceMessage;
  allParticipants: SequenceParticipant[];
  messagesCount: number;
  messageIndex: number;
  onUpdateMessage: (patch: Partial<SequenceMessage>) => void;
  onSwapDirection: () => void;
  onShiftHorizontal?: (direction: 'left' | 'right') => void;
  onMoveStep: (direction: 'up' | 'down') => void;
  onDelete: () => void;
}

const CALL_TYPES = [
  { id: 'sync', label: 'Sync Call (->)', symbol: '->', desc: 'Synchronous blocking invocation' },
  { id: 'reply', label: 'Return / Reply (-->)', symbol: '-->', desc: 'Dashed return response' },
  { id: 'async', label: 'Async Event (->>)', symbol: '->>', desc: 'Non-blocking event message' },
  { id: 'self', label: 'Self Processing Loop', symbol: '->', desc: 'Internal self call loop' }
];

const METHOD_PRESETS = [
  'request()',
  'authenticate()',
  'queryRecords()',
  'validateToken()',
  'processPayment()',
  'saveRecord()',
  'notify()',
  'sendWebhook()',
  'acknowledge()'
];

export const SequenceMessageBar: React.FC<SequenceMessageBarProps> = ({
  message,
  allParticipants,
  messagesCount,
  messageIndex,
  onUpdateMessage,
  onSwapDirection,
  onShiftHorizontal,
  onMoveStep,
  onDelete
}) => {
  const [activeMenu, setActiveMenu] = useState<'none' | 'from' | 'to' | 'call' | 'note'>('none');
  const [methodInput, setMethodInput] = useState(message.label);
  const [noteInput, setNoteInput] = useState(message.noteText || '');
  const barRef = useRef<HTMLDivElement>(null);

  const fromIdx = allParticipants.findIndex(p => p.id === message.from);
  const toIdx = allParticipants.findIndex(p => p.id === message.to);
  const isSelf = message.from === message.to;
  const isLeftToRight = !isSelf && (toIdx >= fromIdx);
  const canShiftLeft = fromIdx > 0 && toIdx > 0;
  const canShiftRight = fromIdx >= 0 && toIdx >= 0 && fromIdx < allParticipants.length - 1 && toIdx < allParticipants.length - 1;

  useEffect(() => {
    setMethodInput(message.label);
  }, [message.label]);

  useEffect(() => {
    setNoteInput(message.noteText || '');
  }, [message.noteText]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setActiveMenu('none');
      }
    };
    window.addEventListener('mousedown', handleDown);
    return () => window.removeEventListener('mousedown', handleDown);
  }, []);

  const sender = allParticipants.find(p => p.id === message.from) || { id: message.from, name: message.from };
  const receiver = allParticipants.find(p => p.id === message.to) || { id: message.to, name: message.to };

  const currentCallType = CALL_TYPES.find(c => c.id === message.type) || CALL_TYPES[0];

  const handleCommitMethod = (val: string) => {
    if (val.trim()) {
      onUpdateMessage({ label: val.trim() });
    }
  };

  return (
    <div
      ref={barRef}
      className="absolute -top-11 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1 bg-[#2b2622] text-[#f5efe6] rounded-xl shadow-xl border border-[#4a4036] font-sans text-xs select-none backdrop-blur-md whitespace-nowrap"
      onClick={(e) => e.stopPropagation()}
    >
      {/* STEP NUMBER BADGE */}
      <span className="text-[10px] font-mono font-bold bg-[#c2652a] text-white px-1.5 py-0.5 rounded">
        #{message.order || messageIndex + 1}
      </span>

      {/* 1. SENDER PARTICIPANT SELECTOR */}
      <div className="relative">
        <button
          onClick={() => setActiveMenu(activeMenu === 'from' ? 'none' : 'from')}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
            activeMenu === 'from' ? 'bg-[#c2652a] text-white' : 'hover:bg-[#3d342c] text-[#e8dfd5]'
          }`}
          title="Change caller sender"
        >
          <span className="text-[10px] uppercase font-mono text-[#d4834f] font-bold">From</span>
          <span className="font-semibold text-white max-w-[90px] truncate">{sender.name}</span>
          <ChevronDown className="w-3 h-3 text-[#b0a498]" />
        </button>

        {activeMenu === 'from' && (
          <div className="absolute top-full left-0 mt-1.5 w-48 bg-[#1f1b18] border border-[#4a4036] rounded-xl shadow-2xl p-1.5 z-50">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#b0a498] px-2 py-1 mb-0.5">
              Select Caller (From)
            </div>
            <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
              {allParticipants.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    onUpdateMessage({ from: p.id });
                    setActiveMenu('none');
                  }}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-left text-xs transition-colors ${
                    p.id === message.from ? 'bg-[#c2652a] text-white font-medium' : 'hover:bg-[#2e2823] text-[#e8dfd5]'
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  {p.id === message.from && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ARROW CONNECTOR */}
      <span className="text-[#d4834f] font-mono font-bold">➔</span>

      {/* 2. VERBAL CALL & METHOD SELECTOR */}
      <div className="relative">
        <button
          onClick={() => setActiveMenu(activeMenu === 'call' ? 'none' : 'call')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
            activeMenu === 'call' ? 'bg-[#c2652a] text-white shadow-sm' : 'hover:bg-[#3d342c] text-[#e8dfd5]'
          }`}
          title="Change method name or invocation type"
        >
          <span className="font-mono text-[11px] font-semibold text-white max-w-[140px] truncate">
            {message.label || 'call()'}
          </span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#d4834f] bg-black/30 px-1 py-0.2 rounded ml-0.5">
            {message.type || 'sync'}
          </span>
          <ChevronDown className="w-3 h-3 text-[#b0a498]" />
        </button>

        {activeMenu === 'call' && (
          <div className="absolute top-full left-0 mt-1.5 w-72 bg-[#1f1b18] border border-[#4a4036] rounded-xl shadow-2xl p-3 z-50">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#b0a498] mb-2 flex items-center justify-between">
              <span>Configure Interaction Call</span>
              <span className="text-[#d4834f] font-semibold">{currentCallType.symbol}</span>
            </div>

            {/* Invocation Type Grid */}
            <div className="mb-2.5">
              <label className="text-[10px] text-[#b0a498] block mb-1 font-mono">Call Mechanism</label>
              <div className="grid grid-cols-2 gap-1">
                {CALL_TYPES.map(ct => (
                  <button
                    key={ct.id}
                    type="button"
                    onClick={() => {
                      onUpdateMessage({ 
                        type: ct.id,
                        isReturn: ct.id === 'reply'
                      });
                    }}
                    className={`px-2 py-1.5 rounded-lg text-left border transition-all ${
                      message.type === ct.id 
                        ? 'bg-[#c2652a] text-white border-[#c2652a] font-medium' 
                        : 'bg-[#2b2622] text-[#b0a498] border-[#4a4036] hover:bg-[#382f27]'
                    }`}
                  >
                    <div className="text-[11px] font-mono leading-tight">{ct.symbol} {ct.id}</div>
                    <div className="text-[9px] opacity-70 leading-tight truncate">{ct.label.split(' ')[0]}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Method Name */}
            <div className="mb-2">
              <label className="text-[10px] text-[#b0a498] block mb-1 font-mono">Method / Payload Text</label>
              <div className="flex gap-1">
                <input
                  autoFocus
                  value={methodInput}
                  onChange={(e) => setMethodInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCommitMethod(methodInput);
                      setActiveMenu('none');
                    }
                  }}
                  className="flex-1 px-2 py-1 bg-[#2b2622] text-xs text-[#f5efe6] rounded-lg border border-[#4a4036] outline-none focus:border-[#c2652a]"
                />
                <button
                  onClick={() => {
                    handleCommitMethod(methodInput);
                    setActiveMenu('none');
                  }}
                  className="px-2.5 py-1 bg-[#c2652a] text-white text-xs font-semibold rounded-lg hover:bg-[#a95420]"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Verbal Method Presets */}
            <div>
              <label className="text-[10px] text-[#b0a498] block mb-1 font-mono">Quick Method Presets</label>
              <div className="flex flex-wrap gap-1">
                {METHOD_PRESETS.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setMethodInput(preset);
                      handleCommitMethod(preset);
                      setActiveMenu('none');
                    }}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#2b2622] text-[#d4834f] hover:bg-[#c2652a] hover:text-white border border-[#4a4036] transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ARROW CONNECTOR */}
      <span className="text-[#d4834f] font-mono font-bold">➔</span>

      {/* 3. RECEIVER PARTICIPANT SELECTOR */}
      <div className="relative">
        <button
          onClick={() => setActiveMenu(activeMenu === 'to' ? 'none' : 'to')}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
            activeMenu === 'to' ? 'bg-[#c2652a] text-white' : 'hover:bg-[#3d342c] text-[#e8dfd5]'
          }`}
          title="Change receiver target"
        >
          <span className="text-[10px] uppercase font-mono text-[#d4834f] font-bold">To</span>
          <span className="font-semibold text-white max-w-[90px] truncate">{receiver.name}</span>
          <ChevronDown className="w-3 h-3 text-[#b0a498]" />
        </button>

        {activeMenu === 'to' && (
          <div className="absolute top-full left-0 mt-1.5 w-48 bg-[#1f1b18] border border-[#4a4036] rounded-xl shadow-2xl p-1.5 z-50">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#b0a498] px-2 py-1 mb-0.5">
              Select Receiver (To)
            </div>
            <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
              {allParticipants.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    onUpdateMessage({ to: p.id });
                    setActiveMenu('none');
                  }}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-left text-xs transition-colors ${
                    p.id === message.to ? 'bg-[#c2652a] text-white font-medium' : 'hover:bg-[#2e2823] text-[#e8dfd5]'
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  {p.id === message.to && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-[1px] h-4 bg-[#4a4036]" />

      {/* 4. DIRECTION BADGE & SWAP (L➔R / R➔L / Self) */}
      <button
        onClick={onSwapDirection}
        className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-[#1f1b18] hover:bg-[#3d342c] text-[#d4834f] hover:text-white border border-[#4a4036] transition-colors font-mono text-[10px]"
        title="Flip direction between Left-to-Right and Right-to-Left (From <-> To)"
      >
        <ArrowLeftRight className="w-3 h-3 text-[#c2652a]" />
        <span>{isSelf ? 'Self' : isLeftToRight ? 'L➔R' : 'R➔L'}</span>
      </button>

      {/* 5. SHIFT INTERACTION HORIZONTALLY (Left / Right across lifelines) */}
      <button
        onClick={() => onShiftHorizontal?.('left')}
        disabled={!canShiftLeft}
        className="p-1.5 rounded-lg hover:bg-[#3d342c] text-[#e8dfd5] hover:text-[#d4834f] disabled:opacity-25 transition-colors cursor-pointer disabled:cursor-not-allowed"
        title="Shift interaction Left (move to previous lifelines)"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => onShiftHorizontal?.('right')}
        disabled={!canShiftRight}
        className="p-1.5 rounded-lg hover:bg-[#3d342c] text-[#e8dfd5] hover:text-[#d4834f] disabled:opacity-25 transition-colors cursor-pointer disabled:cursor-not-allowed"
        title="Shift interaction Right (move to next lifelines)"
      >
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

      <div className="w-[1px] h-4 bg-[#4a4036]" />

      {/* 6. MOVE STEP UP / DOWN BUTTONS (Vertical reordering) */}
      <button
        onClick={() => onMoveStep('up')}
        disabled={messageIndex === 0}
        className="p-1.5 rounded-lg hover:bg-[#3d342c] text-[#e8dfd5] disabled:opacity-30 transition-colors"
        title="Move step up"
      >
        <ArrowUp className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => onMoveStep('down')}
        disabled={messageIndex === messagesCount - 1}
        className="p-1.5 rounded-lg hover:bg-[#3d342c] text-[#e8dfd5] disabled:opacity-30 transition-colors"
        title="Move step down"
      >
        <ArrowDown className="w-3.5 h-3.5" />
      </button>

      {/* 6. ATTACH NOTE */}
      <div className="relative">
        <button
          onClick={() => setActiveMenu(activeMenu === 'note' ? 'none' : 'note')}
          className={`p-1.5 rounded-lg transition-colors ${
            message.noteText ? 'text-[#e6b976] bg-[#3d342c]' : 'text-[#b0a498] hover:bg-[#3d342c]'
          }`}
          title="Attach note over lifeline"
        >
          <StickyNote className="w-3.5 h-3.5" />
        </button>

        {activeMenu === 'note' && (
          <div className="absolute top-full right-0 mt-1.5 w-60 bg-[#1f1b18] border border-[#4a4036] rounded-xl shadow-2xl p-2.5 z-50">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#b0a498] mb-1">
              Note Over {receiver.name}
            </div>
            <textarea
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Enter note text..."
              rows={2}
              className="w-full p-1.5 bg-[#2b2622] text-xs text-[#f5efe6] rounded border border-[#4a4036] outline-none"
            />
            <div className="flex justify-end gap-1 mt-1.5">
              {message.noteText && (
                <button
                  onClick={() => {
                    onUpdateMessage({ noteText: undefined });
                    setNoteInput('');
                    setActiveMenu('none');
                  }}
                  className="px-2 py-1 text-[11px] text-red-400 hover:bg-red-950/30 rounded"
                >
                  Remove
                </button>
              )}
              <button
                onClick={() => {
                  onUpdateMessage({ noteText: noteInput.trim() || undefined });
                  setActiveMenu('none');
                }}
                className="px-2.5 py-1 bg-[#c2652a] text-white text-[11px] font-semibold rounded hover:bg-[#a95420]"
              >
                Save Note
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-[1px] h-4 bg-[#4a4036]" />

      {/* 7. DELETE STEP BUTTON */}
      <button
        onClick={onDelete}
        className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/40 transition-colors"
        title="Delete step"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
