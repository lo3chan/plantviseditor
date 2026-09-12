import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  Search, 
  ArrowRight, 
  Trash2, 
  Copy, 
  StickyNote, 
  Check, 
  Tag, 
  ArrowLeftRight, 
  X,
  Plus,
  Layers,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { SequenceParticipant, SequenceMessage, AssetItem } from '../types';

interface SequenceParticipantBarProps {
  participant: SequenceParticipant;
  allParticipants: SequenceParticipant[];
  onUpdateParticipant: (patch: Partial<SequenceParticipant>) => void;
  onAddMessage: (toParticipantId: string, label: string, type: 'sync' | 'reply' | 'async' | 'self') => void;
  onDuplicate: () => void;
  onAddNote: (text: string) => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  onDelete: () => void;
}

const PARTICIPANT_TYPES = [
  { id: 'participant', label: 'Participant Box', desc: 'Standard lifeline participant box', icon: 'Box' },
  { id: 'actor', label: 'Actor (Stickman)', desc: 'Human user or external caller', icon: 'User' },
  { id: 'database', label: 'Database (Cylinder)', desc: 'SQL / NoSQL persistent storage', icon: 'Database' },
  { id: 'queue', label: 'Message Queue', desc: 'Event stream or message broker', icon: 'Server' },
  { id: 'boundary', label: 'Boundary Gateway', desc: 'API gateway or edge interface', icon: 'Shield' },
  { id: 'control', label: 'Control / Manager', desc: 'Business logic coordinator', icon: 'Layers' },
  { id: 'entity', label: 'Domain Entity', desc: 'Data model or aggregate entity', icon: 'Circle' },
  { id: 'collections', label: 'Collections Cluster', desc: 'Multi-instance pooled workers', icon: 'Boxes' }
];

const SEQUENCE_STEREOTYPES = [
  { label: '«service»', desc: 'Microservice or backend application' },
  { label: '«client»', desc: 'Frontend application or mobile client' },
  { label: '«gateway»', desc: 'Reverse proxy / API gateway router' },
  { label: '«controller»', desc: 'HTTP route handler & dispatcher' },
  { label: '«repository»', desc: 'Database access layer' },
  { label: '«broker»', desc: 'Message pub/sub broker' },
  { label: '«worker»', desc: 'Background async processing worker' },
  { label: '«boundary»', desc: 'External third-party integration' }
];

const QUICK_CALL_VERBS = [
  'request()',
  'authenticate()',
  'queryData()',
  'validateToken()',
  'processOrder()',
  'saveRecord()',
  'notify()',
  'sendWebhook()'
];

export const SequenceParticipantBar: React.FC<SequenceParticipantBarProps> = ({
  participant,
  allParticipants,
  onUpdateParticipant,
  onAddMessage,
  onDuplicate,
  onAddNote,
  onMoveLeft,
  onMoveRight,
  onDelete
}) => {
  const [activeMenu, setActiveMenu] = useState<'none' | 'type' | 'tone' | 'nature' | 'message' | 'more'>('none');
  const [typeSearch, setTypeSearch] = useState('');
  const [customStereotype, setCustomStereotype] = useState('');
  const [targetParticipantId, setTargetParticipantId] = useState<string>(() => {
    const other = allParticipants.find(p => p.id !== participant.id);
    return other ? other.id : participant.id;
  });
  const [callType, setCallType] = useState<'sync' | 'reply' | 'async' | 'self'>('sync');
  const [callVerb, setCallVerb] = useState('request()');
  const [noteContent, setNoteContent] = useState('');

  const barRef = useRef<HTMLDivElement>(null);

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

  const currentIndex = allParticipants.findIndex(p => p.id === participant.id);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === allParticipants.length - 1;

  const currentTypeConfig = PARTICIPANT_TYPES.find(t => t.id === participant.type) || PARTICIPANT_TYPES[0];

  const handleDispatchCall = () => {
    onAddMessage(targetParticipantId, callVerb.trim() || 'execute()', callType);
    setActiveMenu('none');
  };

  const handleSaveNote = () => {
    if (noteContent.trim()) {
      onAddNote(noteContent.trim());
      setNoteContent('');
      setActiveMenu('none');
    }
  };

  return (
    <div
      ref={barRef}
      className="absolute top-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-1 bg-[#2b2622] text-[#f5efe6] rounded-xl shadow-xl border border-[#4a4036] font-sans text-xs select-none backdrop-blur-md"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. MODULAR TYPE REPLACE PILL */}
      <div className="relative">
        <button
          onClick={() => setActiveMenu(activeMenu === 'type' ? 'none' : 'type')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
            activeMenu === 'type'
              ? 'bg-[#c2652a] text-white shadow-sm'
              : 'hover:bg-[#3d342c] text-[#e8dfd5]'
          }`}
          title="Replace or morph participant type"
        >
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#d4834f] font-bold">Lifeline</span>
          <span className="font-semibold text-white">{currentTypeConfig.label}</span>
          <ChevronDown className="w-3 h-3 text-[#b0a498]" />
        </button>

        {activeMenu === 'type' && (
          <div className="absolute top-full left-0 mt-1.5 w-64 bg-[#1f1b18] border border-[#4a4036] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#b0a498] px-2 py-1 flex items-center justify-between">
              <span>Morph Lifeline</span>
              <span className="text-[#d4834f] font-semibold">{participant.name}</span>
            </div>

            <div className="relative my-1 px-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2 text-[#8c8073]" />
              <input
                autoFocus
                value={typeSearch}
                onChange={(e) => setTypeSearch(e.target.value)}
                placeholder="Search lifeline shapes..."
                className="w-full pl-7 pr-2 py-1 bg-[#2b2622] text-xs text-[#f5efe6] rounded-md outline-none border border-[#4a4036] focus:border-[#c2652a]"
              />
            </div>

            <div className="max-h-60 overflow-y-auto mt-1 flex flex-col gap-0.5">
              {PARTICIPANT_TYPES.filter(t => t.label.toLowerCase().includes(typeSearch.toLowerCase())).map((t) => {
                const isSelected = participant.type === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      onUpdateParticipant({ type: t.id, shape: t.id });
                      setActiveMenu('none');
                    }}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'bg-[#c2652a] text-white font-medium'
                        : 'hover:bg-[#2e2823] text-[#e8dfd5]'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs leading-tight">{t.label}</div>
                      <div className="text-[10px] opacity-70 leading-tight">{t.desc}</div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="w-[1px] h-4 bg-[#4a4036]" />

      {/* 3. STEREOTYPE / NATURE PILL */}
      <div className="relative">
        <button
          onClick={() => setActiveMenu(activeMenu === 'nature' ? 'none' : 'nature')}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
            activeMenu === 'nature'
              ? 'bg-[#c2652a] text-white'
              : 'hover:bg-[#3d342c] text-[#e8dfd5]'
          }`}
          title="Assign stereotype"
        >
          <Tag className="w-3 h-3 text-[#d4834f]" />
          <span className="font-mono text-[11px] text-[#f2e2d2]">
            {participant.stereotype || participant.sublabel || '«nature»'}
          </span>
          <ChevronDown className="w-3 h-3 text-[#b0a498]" />
        </button>

        {activeMenu === 'nature' && (
          <div className="absolute top-full left-0 mt-1.5 w-60 bg-[#1f1b18] border border-[#4a4036] rounded-xl shadow-2xl p-2 z-50">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#b0a498] px-1 py-0.5 mb-1">
              Select Stereotype
            </div>
            <div className="flex flex-col gap-0.5 max-h-52 overflow-y-auto">
              {SEQUENCE_STEREOTYPES.map((st) => (
                <button
                  key={st.label}
                  onClick={() => {
                    onUpdateParticipant({ stereotype: st.label, sublabel: st.label.replace(/[«»]/g, '') });
                    setActiveMenu('none');
                  }}
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[#2e2823] text-left transition-colors"
                >
                  <div>
                    <div className="font-mono font-bold text-xs text-[#d4834f]">{st.label}</div>
                    <div className="text-[10px] text-[#b0a498]">{st.desc}</div>
                  </div>
                  {participant.stereotype === st.label && <Check className="w-3.5 h-3.5 text-[#d4834f]" />}
                </button>
              ))}
            </div>

            <div className="mt-2 pt-2 border-t border-[#3d342c] flex items-center gap-1">
              <input
                value={customStereotype}
                onChange={(e) => setCustomStereotype(e.target.value)}
                placeholder="Custom «tag»..."
                className="flex-1 px-2 py-1 bg-[#2b2622] text-xs text-[#f5efe6] rounded border border-[#4a4036] outline-none"
              />
              <button
                onClick={() => {
                  if (customStereotype.trim()) {
                    const tag = customStereotype.startsWith('«') ? customStereotype : `«${customStereotype}»`;
                    onUpdateParticipant({ stereotype: tag, sublabel: customStereotype.replace(/[«»]/g, '') });
                    setCustomStereotype('');
                    setActiveMenu('none');
                  }
                }}
                className="px-2 py-1 bg-[#c2652a] text-white text-xs font-semibold rounded hover:bg-[#a95420]"
              >
                Set
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-[1px] h-4 bg-[#4a4036]" />

      {/* 4. VERBAL CALL BUILDER: [ ➔ Message To... ▾ ] */}
      <div className="relative">
        <button
          onClick={() => setActiveMenu(activeMenu === 'message' ? 'none' : 'message')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
            activeMenu === 'message'
              ? 'bg-[#c2652a] text-white shadow-sm'
              : 'bg-[#382f27] hover:bg-[#483d32] text-white'
          }`}
          title="Verbally send an interaction message from this participant"
        >
          <ArrowRight className="w-3.5 h-3.5 text-[#d4834f]" />
          <span className="font-semibold text-[11px]">Send Call To...</span>
          <ChevronDown className="w-3 h-3 text-[#b0a498]" />
        </button>

        {activeMenu === 'message' && (
          <div className="absolute top-full left-0 mt-1.5 w-72 bg-[#1f1b18] border border-[#4a4036] rounded-xl shadow-2xl p-3 z-50">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#b0a498] mb-2 flex items-center justify-between">
              <span>Verbally Dispatch Call</span>
              <span className="text-[#d4834f]">{participant.name} ➔</span>
            </div>

            {/* Target Participant Select */}
            <div className="mb-2">
              <label className="text-[10px] text-[#b0a498] block mb-1 font-mono">Receiver Target</label>
              <select
                value={targetParticipantId}
                onChange={(e) => setTargetParticipantId(e.target.value)}
                className="w-full bg-[#2b2622] text-xs text-[#f5efe6] rounded-lg p-1.5 border border-[#4a4036] outline-none"
              >
                {allParticipants.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.id === participant.id ? '(Self Loop)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Call Type Selection */}
            <div className="mb-2">
              <label className="text-[10px] text-[#b0a498] block mb-1 font-mono">Invocation Type</label>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setCallType('sync')}
                  className={`px-2 py-1 rounded text-[11px] font-mono text-center border transition-all ${
                    callType === 'sync' ? 'bg-[#c2652a] text-white border-[#c2652a]' : 'bg-[#2b2622] text-[#b0a498] border-[#4a4036]'
                  }`}
                >
                  {'Sync (->)'}
                </button>
                <button
                  type="button"
                  onClick={() => setCallType('reply')}
                  className={`px-2 py-1 rounded text-[11px] font-mono text-center border transition-all ${
                    callType === 'reply' ? 'bg-[#c2652a] text-white border-[#c2652a]' : 'bg-[#2b2622] text-[#b0a498] border-[#4a4036]'
                  }`}
                >
                  {'Return (-->)'}
                </button>
                <button
                  type="button"
                  onClick={() => setCallType('async')}
                  className={`px-2 py-1 rounded text-[11px] font-mono text-center border transition-all ${
                    callType === 'async' ? 'bg-[#c2652a] text-white border-[#c2652a]' : 'bg-[#2b2622] text-[#b0a498] border-[#4a4036]'
                  }`}
                >
                  {'Async (->>)'}
                </button>
                <button
                  type="button"
                  onClick={() => setCallType('self')}
                  className={`px-2 py-1 rounded text-[11px] font-mono text-center border transition-all ${
                    callType === 'self' ? 'bg-[#c2652a] text-white border-[#c2652a]' : 'bg-[#2b2622] text-[#b0a498] border-[#4a4036]'
                  }`}
                >
                  Self Loop
                </button>
              </div>
            </div>

            {/* Method Name / Verb */}
            <div className="mb-2">
              <label className="text-[10px] text-[#b0a498] block mb-1 font-mono">Method Signature</label>
              <input
                value={callVerb}
                onChange={(e) => setCallVerb(e.target.value)}
                placeholder="methodName(params)"
                className="w-full bg-[#2b2622] text-xs text-[#f5efe6] rounded-lg px-2 py-1.5 border border-[#4a4036] outline-none"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {QUICK_CALL_VERBS.slice(0, 4).map(verb => (
                  <button
                    key={verb}
                    type="button"
                    onClick={() => setCallVerb(verb)}
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#2b2622] text-[#b0a498] hover:text-[#d4834f] border border-[#4a4036]"
                  >
                    {verb}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleDispatchCall}
              className="w-full mt-2 py-1.5 rounded-lg bg-[#c2652a] text-white font-semibold text-xs hover:bg-[#a95420] shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Dispatch Interaction Call</span>
            </button>
          </div>
        )}
      </div>

      <div className="w-[1px] h-4 bg-[#4a4036]" />

      {/* 5. REORDER LIFELINE BUTTONS */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={onMoveLeft}
          disabled={isFirst}
          className="p-1.5 rounded-lg hover:bg-[#3d342c] disabled:opacity-30 text-[#e8dfd5] transition-colors"
          title="Move Lifeline Left"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onMoveRight}
          disabled={isLast}
          className="p-1.5 rounded-lg hover:bg-[#3d342c] disabled:opacity-30 text-[#e8dfd5] transition-colors"
          title="Move Lifeline Right"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="w-[1px] h-4 bg-[#4a4036]" />

      {/* 6. MORE ACTIONS: DUPLICATE, NOTE, DELETE */}
      <div className="relative">
        <button
          onClick={() => setActiveMenu(activeMenu === 'more' ? 'none' : 'more')}
          className={`p-1.5 rounded-lg transition-colors ${
            activeMenu === 'more' ? 'bg-[#c2652a] text-white' : 'hover:bg-[#3d342c] text-[#e8dfd5]'
          }`}
          title="More actions"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        {activeMenu === 'more' && (
          <div className="absolute top-full right-0 mt-1.5 w-48 bg-[#1f1b18] border border-[#4a4036] rounded-xl shadow-2xl p-1.5 z-50">
            <button
              onClick={() => {
                onDuplicate();
                setActiveMenu('none');
              }}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-[#e8dfd5] hover:bg-[#2e2823] transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-[#b0a498]" />
              <span>Duplicate Lifeline</span>
            </button>

            <div className="p-1.5 border-t border-[#3d342c] my-1">
              <label className="text-[10px] text-[#b0a498] block mb-1 font-mono">Attach UML Note</label>
              <div className="flex gap-1">
                <input
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Note text..."
                  className="flex-1 px-1.5 py-1 bg-[#2b2622] text-[11px] text-[#f5efe6] rounded border border-[#4a4036] outline-none"
                />
                <button
                  onClick={handleSaveNote}
                  className="px-2 py-1 bg-[#c2652a] text-white text-[11px] rounded hover:bg-[#a95420]"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="border-t border-[#3d342c] my-1" />

            <button
              onClick={() => {
                onDelete();
                setActiveMenu('none');
              }}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-red-400 hover:bg-red-950/40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Lifeline</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
