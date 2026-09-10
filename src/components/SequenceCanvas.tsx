import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  ArrowRight, 
  ArrowLeft, 
  User, 
  Box, 
  Database, 
  Shield, 
  Layers, 
  MoreVertical,
  MoveVertical,
  Edit2,
  Check
} from 'lucide-react';
import { SequenceParticipant, SequenceMessage, SequenceBlock } from '../types';
import { getColorConfig } from '../utils/assetsData';

interface SequenceCanvasProps {
  participants: SequenceParticipant[];
  messages: SequenceMessage[];
  blocks?: SequenceBlock[];
  onUpdateParticipants: (participants: SequenceParticipant[]) => void;
  onUpdateMessages: (messages: SequenceMessage[]) => void;
  onUpdateBlocks?: (blocks: SequenceBlock[]) => void;
  viewport: { x: number; y: number; zoom: number };
}

export const SequenceCanvas: React.FC<SequenceCanvasProps> = ({
  participants,
  messages,
  blocks = [],
  onUpdateParticipants,
  onUpdateMessages,
  onUpdateBlocks,
  viewport
}) => {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const PARTICIPANT_SPACING = 220;
  const START_X = 140;
  const START_Y = 60;
  const MESSAGE_SPACING = 56;
  const TOP_LIFELINE_Y = 120;
  const TOTAL_HEIGHT = Math.max(600, TOP_LIFELINE_Y + (messages.length + 2) * MESSAGE_SPACING);

  const getParticipantX = (pId: string) => {
    const idx = participants.findIndex(p => p.id === pId);
    return START_X + (idx >= 0 ? idx : 0) * PARTICIPANT_SPACING;
  };

  // Add new participant
  const handleAddParticipant = () => {
    const newId = `service_${Date.now()}`;
    const newParticipant: SequenceParticipant = {
      id: newId,
      name: `Service ${participants.length + 1}`,
      type: 'participant',
      color: 'sand'
    };
    onUpdateParticipants([...participants, newParticipant]);
  };

  // Remove participant
  const handleDeleteParticipant = (pId: string) => {
    if (participants.length <= 2) return; // keep minimum 2
    onUpdateParticipants(participants.filter(p => p.id !== pId));
    onUpdateMessages(messages.filter(m => m.from !== pId && m.to !== pId));
  };

  // Fast add message between first two participants or next in line
  const handleAddMessage = () => {
    if (participants.length < 2) return;
    const fromP = participants[0].id;
    const toP = participants[1].id;
    const nextOrder = messages.length > 0 ? Math.max(...messages.map(m => m.order)) + 1 : 1;
    
    const newMsg: SequenceMessage = {
      id: `msg_${Date.now()}`,
      from: fromP,
      to: toP,
      label: `requestMethod(payload)`,
      type: 'sync',
      order: nextOrder
    };
    onUpdateMessages([...messages, newMsg]);
  };

  // Delete message
  const handleDeleteMessage = (mId: string) => {
    onUpdateMessages(messages.filter(m => m.id !== mId));
    if (selectedMessageId === mId) setSelectedMessageId(null);
  };

  // Toggle message type (sync -> reply -> async)
  const handleToggleMessageType = (mId: string) => {
    onUpdateMessages(messages.map(m => {
      if (m.id !== mId) return m;
      const nextType: 'sync' | 'reply' | 'async' = 
        m.type === 'sync' ? 'reply' : m.type === 'reply' ? 'async' : 'sync';
      return {
        ...m,
        type: nextType,
        isReturn: nextType === 'reply'
      };
    }));
  };

  // Commit edit
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

  // Reorder message up / down
  const moveMessage = (mIndex: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && mIndex === 0) || (direction === 'down' && mIndex === messages.length - 1)) {
      return;
    }
    const targetIndex = direction === 'up' ? mIndex - 1 : mIndex + 1;
    const updated = [...messages];
    const temp = updated[mIndex];
    updated[mIndex] = updated[targetIndex];
    updated[targetIndex] = temp;
    // reassign order numbers
    updated.forEach((m, idx) => { m.order = idx + 1; });
    onUpdateMessages(updated);
  };

  return (
    <div 
      className="relative w-full h-full min-w-[1200px] min-h-[900px] select-none"
      style={{
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        transformOrigin: '0 0'
      }}
    >
      {/* Sequence Header Actions */}
      <div className="absolute top-4 left-6 flex items-center gap-3 z-20">
        <button
          onClick={handleAddParticipant}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#c2652a]/40 text-xs font-semibold text-[#c2652a] hover:bg-[#faf5ee] shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Lifeline Participant</span>
        </button>
        <button
          onClick={handleAddMessage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c2652a] text-white text-xs font-semibold hover:bg-[#a95420] shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Interaction Step</span>
        </button>
      </div>

      {/* Lifelines and Participants */}
      {participants.map((p, index) => {
        const x = getParticipantX(p.id);
        const colorCfg = getColorConfig(p.color);
        const isEditing = editingParticipantId === p.id;

        return (
          <div key={p.id} className="absolute" style={{ left: x, top: START_Y }}>
            {/* Top Participant Box */}
            <div 
              className="relative -translate-x-1/2 w-40 p-2.5 rounded-xl bg-white border shadow-xs flex flex-col items-center justify-center text-center cursor-pointer group hover:border-[#c2652a] transition-all z-20"
              style={{ borderColor: colorCfg.border }}
              onDoubleClick={() => {
                setEditLabel(p.name);
                setEditingParticipantId(p.id);
              }}
            >
              <div 
                className="w-7 h-7 rounded-lg flex items-center justify-center mb-1"
                style={{ backgroundColor: colorCfg.bg }}
              >
                {p.type === 'actor' ? (
                  <User className="w-4 h-4" style={{ color: colorCfg.hex }} />
                ) : p.type === 'database' ? (
                  <Database className="w-4 h-4" style={{ color: colorCfg.hex }} />
                ) : (
                  <Box className="w-4 h-4" style={{ color: colorCfg.hex }} />
                )}
              </div>

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
                    className="w-full text-xs font-bold text-center border border-[#c2652a] rounded px-1 outline-none"
                  />
                  <button onClick={() => commitParticipantEdit(p.id)}>
                    <Check className="w-3 h-3 text-[#c2652a]" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-xs font-bold text-[#3a302a] truncate w-full">{p.name}</span>
                  {p.sublabel && (
                    <span className="text-[10px] text-[#78706a] font-mono">{p.sublabel}</span>
                  )}
                </>
              )}

              {/* Delete lifeline if > 2 */}
              {participants.length > 2 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteParticipant(p.id);
                  }}
                  className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-0.5 shadow-xs hover:scale-110 transition-all"
                  title="Delete Lifeline"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            {/* Vertical Lifeline Line (Dashed) */}
            <div 
              className="absolute left-0 top-14 w-[2px] -translate-x-1/2 border-l-2 border-dashed border-[#c2652a]/40 z-10"
              style={{ height: TOTAL_HEIGHT - 60 }}
            />

            {/* Bottom Participant Anchor */}
            <div 
              className="absolute -translate-x-1/2 w-32 py-1.5 rounded-lg bg-white/90 border border-[#d8d0c8] shadow-xs text-center text-[11px] font-semibold text-[#3a302a] z-20"
              style={{ top: TOTAL_HEIGHT }}
            >
              {p.name}
            </div>
          </div>
        );
      })}

      {/* Alternative / Loop Blocks Background Frame */}
      {blocks.map(block => {
        const topY = TOP_LIFELINE_Y + block.startOrder * MESSAGE_SPACING - 24;
        const bottomY = TOP_LIFELINE_Y + block.endOrder * MESSAGE_SPACING + 24;
        const width = (participants.length - 1) * PARTICIPANT_SPACING + 160;

        return (
          <div
            key={block.id}
            className="absolute left-[60px] rounded-xl border-2 border-[#b87d28]/60 bg-[#fef7eb]/30 pointer-events-none z-0"
            style={{
              top: topY,
              height: bottomY - topY,
              width
            }}
          >
            <div className="absolute top-0 left-0 bg-[#b87d28] text-white text-[10px] font-bold px-2 py-0.5 rounded-tl-lg rounded-br-lg uppercase">
              {block.type} : {block.label} {block.condition && `[${block.condition}]`}
            </div>
          </div>
        );
      })}

      {/* Sequence Messages (Horizontal Arrows) */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {messages.map((msg, idx) => {
          const y = TOP_LIFELINE_Y + (idx + 1) * MESSAGE_SPACING;
          const fromX = getParticipantX(msg.from);
          const toX = getParticipantX(msg.to);
          const isSelected = selectedMessageId === msg.id;
          const isEditing = editingMessageId === msg.id;
          const isSelf = msg.from === msg.to;
          const isLeftToRight = toX > fromX;

          const minX = Math.min(fromX, toX);
          const arrowWidth = Math.abs(toX - fromX);

          return (
            <div
              key={msg.id}
              className={`absolute pointer-events-auto transition-all ${
                isSelected ? 'z-30' : 'z-20'
              }`}
              style={{ top: y, left: isSelf ? fromX : minX, width: isSelf ? 80 : arrowWidth }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMessageId(msg.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditLabel(msg.label);
                setEditingMessageId(msg.id);
              }}
            >
              {isSelf ? (
                // Self call loop arrow
                <div className="relative group">
                  <svg width="60" height="36" className="overflow-visible">
                    <path
                      d="M 0 0 L 32 0 C 44 0 44 24 32 24 L 2 24"
                      fill="none"
                      stroke="#c2652a"
                      strokeWidth="2"
                    />
                    <polygon points="2,20 2,28 0,24" fill="#c2652a" />
                  </svg>
                  <div className="absolute -top-4 left-6 text-[11px] font-medium text-[#3a302a] whitespace-nowrap bg-white/90 px-1 rounded shadow-2xs">
                    {idx + 1}. {msg.label}
                  </div>
                </div>
              ) : (
                // Horizontal Message Arrow
                <div className="relative group w-full flex flex-col items-center">
                  {/* Message label chip */}
                  <div className="absolute -top-5 flex items-center gap-1.5 bg-white/95 px-2 py-0.5 rounded-md border border-[#d8d0c8]/80 shadow-2xs group-hover:border-[#c2652a] transition-all">
                    <span className="text-[10px] font-bold text-[#c2652a]">{idx + 1}.</span>
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
                        className="text-xs font-semibold text-[#3a302a] outline-none border-b border-[#c2652a] px-1 bg-transparent"
                      />
                    ) : (
                      <span className="text-xs font-medium text-[#3a302a]">{msg.label}</span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleMessageType(msg.id);
                      }}
                      className="text-[9px] text-[#78706a] hover:text-[#c2652a] ml-1 font-mono uppercase bg-[#faf5ee] px-1 rounded"
                      title="Click to toggle sync / reply / async"
                    >
                      {msg.type}
                    </button>
                  </div>

                  {/* SVG Arrow Line */}
                  <svg width="100%" height="20" className="overflow-visible">
                    <defs>
                      <marker
                        id={`arrow-${msg.id}`}
                        viewBox="0 0 10 10"
                        refX={isLeftToRight ? "8" : "2"}
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#c2652a" />
                      </marker>
                    </defs>
                    <line
                      x1={isLeftToRight ? 0 : arrowWidth}
                      y1="10"
                      x2={isLeftToRight ? arrowWidth : 0}
                      y2="10"
                      stroke="#c2652a"
                      strokeWidth={msg.type === 'async' ? 2.5 : 2}
                      strokeDasharray={msg.type === 'reply' ? '5,4' : undefined}
                      markerEnd={`url(#arrow-${msg.id})`}
                    />
                  </svg>

                  {/* Message Action Controls on Select or Hover */}
                  {isSelected && (
                    <div className="absolute -bottom-7 flex items-center gap-1 bg-white border border-[#c2652a]/50 rounded-lg p-1 shadow-sm">
                      <button
                        onClick={() => moveMessage(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded text-[#78706a] hover:text-[#3a302a] disabled:opacity-30"
                        title="Move step up"
                      >
                        <MoveVertical className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          // swap direction
                          onUpdateMessages(messages.map(m => m.id === msg.id ? { ...m, from: msg.to, to: msg.from } : m));
                        }}
                        className="p-1 rounded text-[#78706a] hover:text-[#c2652a]"
                        title="Flip arrow direction"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-1 rounded text-red-500 hover:bg-red-50"
                        title="Delete message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
