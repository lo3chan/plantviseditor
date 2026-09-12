import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Check, 
  Sliders, 
  Layers, 
  FileText, 
  Database, 
  Boxes, 
  Tag, 
  Code, 
  Move,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { DiagramNode, ErColumn, MapEntry, ObjectSlot, AssetItem } from '../types';
import { UNIFIED_ASSETS } from '../utils/assetsData';
import { getFriendlyNodeTypeName } from './QuickActionBar';

interface ElementInspectorProps {
  node: DiagramNode | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateNode: (patch: Partial<DiagramNode>) => void;
  onDeleteNode: () => void;
  onMorphNode?: (asset: AssetItem) => void;
}

export const ElementInspector: React.FC<ElementInspectorProps> = ({
  node,
  isOpen,
  onClose,
  onUpdateNode,
  onDeleteNode,
  onMorphNode
}) => {
  if (!isOpen || !node) return null;

  const [activeTab, setActiveTab] = useState<'content' | 'properties'>('content');

  // Local draft states
  const [label, setLabel] = useState(node.label);
  const [sublabel, setSublabel] = useState(node.sublabel || '');
  const [technology, setTechnology] = useState(node.data?.technology || '');
  const [description, setDescription] = useState(node.data?.description || node.data?.noteText || '');
  const [generics, setGenerics] = useState(node.data?.generics || '');
  const [spotChar, setSpotChar] = useState(node.data?.spot?.character || 'C');
  const [spotColor, setSpotColor] = useState(node.data?.spot?.colorHex || '#2e7d32');
  const [width, setWidth] = useState(node.width);
  const [height, setHeight] = useState(node.height);

  // Sync draft state when selected node changes
  useEffect(() => {
    setLabel(node.label);
    setSublabel(node.sublabel || '');
    setTechnology(node.data?.technology || '');
    setDescription(node.data?.description || node.data?.noteText || '');
    setGenerics(node.data?.generics || '');
    setSpotChar(node.data?.spot?.character || (node.type === 'interface' ? 'I' : node.type === 'enum' ? 'E' : node.type === 'abstract-class' ? 'A' : 'C'));
    setSpotColor(node.data?.spot?.colorHex || '#2e7d32');
    setWidth(node.width);
    setHeight(node.height);
  }, [node.id, node.label, node.sublabel, node.data, node.width, node.height]);

  const friendlyType = getFriendlyNodeTypeName(node.type, node.shape || node.data?.shape);

  // Detection
  const isClassOrOO = ['class', 'interface', 'abstract-class', 'enum', 'struct', 'protocol', 'exception', 'annotation', 'metaclass'].includes(node.type) || node.category === 'code';
  const isErTable = node.type === 'entity' || node.type === 'er-table' || node.category === 'data-schema';
  const isMap = node.type === 'map' || Boolean(node.data?.mapEntries);
  const isObject = node.type === 'object' || Boolean(node.data?.slots);
  const isNote = node.type === 'note' || node.data?.shape === 'note';
  const isSalt = node.type === 'embedded-salt' || node.type === 'salt' || Boolean(node.data?.saltContent);
  const isMath = node.type === 'embedded-math' || node.type === 'math' || Boolean(node.data?.mathFormula);
  const isDitaa = node.type === 'embedded-ditaa' || node.type === 'ditaa' || Boolean(node.data?.embeddedContent && !isSalt && !isMath);
  const isTree = node.type === 'data-json' || node.type === 'data-yaml' || Boolean(node.data?.treeContent);
  const isWbs = node.type === 'wbs-node' || node.type === 'wbs';
  const isC4 = node.type.startsWith('c4-') || node.category === 'c4';

  // Handlers for Attributes
  const handleUpdateAttribute = (index: number, value: string) => {
    const current = [...(node.data?.attributes || [])];
    current[index] = value;
    onUpdateNode({ data: { ...node.data, attributes: current } });
  };

  const handleAddAttribute = () => {
    const current = [...(node.data?.attributes || [])];
    current.push(`+field_${current.length + 1}: String`);
    onUpdateNode({ data: { ...node.data, attributes: current } });
  };

  const handleDeleteAttribute = (index: number) => {
    const current = (node.data?.attributes || []).filter((_, i) => i !== index);
    onUpdateNode({ data: { ...node.data, attributes: current } });
  };

  // Handlers for Methods
  const handleUpdateMethod = (index: number, value: string) => {
    const current = [...(node.data?.methods || [])];
    current[index] = value;
    onUpdateNode({ data: { ...node.data, methods: current } });
  };

  const handleAddMethod = () => {
    const current = [...(node.data?.methods || [])];
    current.push(`+operation_${current.length + 1}(): void`);
    onUpdateNode({ data: { ...node.data, methods: current } });
  };

  const handleDeleteMethod = (index: number) => {
    const current = (node.data?.methods || []).filter((_, i) => i !== index);
    onUpdateNode({ data: { ...node.data, methods: current } });
  };

  // Handlers for ER Columns
  const handleUpdateColumn = (index: number, patch: Partial<ErColumn>) => {
    const current = [...(node.data?.columns || [])];
    current[index] = { ...current[index], ...patch };
    onUpdateNode({ data: { ...node.data, columns: current } });
  };

  const handleAddColumn = () => {
    const current = [...(node.data?.columns || [])];
    current.push({ name: `column_${current.length + 1}`, type: 'varchar(64)', isPk: current.length === 0 });
    onUpdateNode({ data: { ...node.data, columns: current } });
  };

  const handleDeleteColumn = (index: number) => {
    const current = (node.data?.columns || []).filter((_, i) => i !== index);
    onUpdateNode({ data: { ...node.data, columns: current } });
  };

  // Handlers for Map Entries
  const handleUpdateMapEntry = (index: number, patch: Partial<MapEntry>) => {
    const current = [...(node.data?.mapEntries || [])];
    current[index] = { ...current[index], ...patch };
    onUpdateNode({ data: { ...node.data, mapEntries: current } });
  };

  const handleAddMapEntry = () => {
    const current = [...(node.data?.mapEntries || [])];
    current.push({ key: `key_${current.length + 1}`, value: '"value"' });
    onUpdateNode({ data: { ...node.data, mapEntries: current } });
  };

  const handleDeleteMapEntry = (index: number) => {
    const current = (node.data?.mapEntries || []).filter((_, i) => i !== index);
    onUpdateNode({ data: { ...node.data, mapEntries: current } });
  };

  // Handlers for Object Slots
  const handleUpdateObjectSlot = (index: number, patch: Partial<ObjectSlot>) => {
    const current = [...(node.data?.slots || [])];
    current[index] = { ...current[index], ...patch };
    onUpdateNode({ data: { ...node.data, slots: current } });
  };

  const handleAddObjectSlot = () => {
    const current = [...(node.data?.slots || [])];
    current.push({ key: `prop_${current.length + 1}`, value: '"val"' });
    onUpdateNode({ data: { ...node.data, slots: current } });
  };

  const handleDeleteObjectSlot = (index: number) => {
    const current = (node.data?.slots || []).filter((_, i) => i !== index);
    onUpdateNode({ data: { ...node.data, slots: current } });
  };

  return (
    <aside 
      id="element-inspector-panel"
      className="absolute top-16 right-4 z-40 w-84 max-h-[calc(100vh-80px)] bg-white/95 backdrop-blur-md border border-[#d8d0c8] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200 select-none text-[#2c2420]"
    >
      {/* Header */}
      <div className="p-3.5 border-b border-[#d8d0c8]/60 flex items-center justify-between bg-[#faf5ee]/80">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#c2652a]/10 border border-[#c2652a]/20 flex items-center justify-center text-[#c2652a] shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-[#3a302a] truncate font-sans">
              {label || 'Element Inspector'}
            </h3>
            <span className="text-[10px] text-[#78706a] font-mono bg-white px-1.5 py-0.2 rounded border border-[#d8d0c8]/60 inline-block">
              {friendlyType}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg text-[#78706a] hover:bg-[#ebd9c8] hover:text-[#2c2420] flex items-center justify-center transition-colors cursor-pointer"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#d8d0c8]/60 bg-[#faf5ee]/40 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'content'
              ? 'border-[#c2652a] text-[#c2652a] bg-white'
              : 'border-transparent text-[#78706a] hover:text-[#2c2420]'
          }`}
        >
          Content & Data
        </button>
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'properties'
              ? 'border-[#c2652a] text-[#c2652a] bg-white'
              : 'border-transparent text-[#78706a] hover:text-[#2c2420]'
          }`}
        >
          Properties
        </button>
      </div>

      {/* Body / Active Tab */}
      <div className="p-3.5 overflow-y-auto space-y-3.5 flex-1 max-h-[calc(100vh-230px)] scrollbar-thin">
        
        {/* ================= TAB 1: CONTENT & DATA ================= */}
        {activeTab === 'content' && (
          <div className="space-y-3.5">
            
            {/* Title / Name */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#78706a] block mb-1">
                Element Label / Name
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => {
                  setLabel(e.target.value);
                  onUpdateNode({ label: e.target.value });
                }}
                className="w-full text-xs font-semibold px-2.5 py-1.5 bg-[#faf5ee] border border-[#d8d0c8] rounded-xl outline-none focus:border-[#c2652a]"
              />
            </div>

            {/* Note text editor for sticky notes */}
            {isNote && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#78706a] block mb-1">
                  Note Text (Multiline)
                </label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    onUpdateNode({ 
                      label: e.target.value,
                      data: { ...node.data, noteText: e.target.value, description: e.target.value } 
                    });
                  }}
                  className="w-full text-xs font-sans px-2.5 py-2 bg-[#faf5ee] border border-[#d8d0c8] rounded-xl outline-none focus:border-[#c2652a] resize-y"
                  placeholder="Enter note contents..."
                />
              </div>
            )}

            {/* Class / OO Attributes Manager */}
            {isClassOrOO && !isMap && !isErTable && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#78706a]">
                    Attributes (Fields)
                  </span>
                  <button
                    onClick={handleAddAttribute}
                    className="text-[11px] font-semibold text-[#c2652a] hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {(node.data?.attributes || []).length === 0 ? (
                    <div className="text-[11px] text-[#78706a] italic bg-[#faf5ee] p-2 rounded-lg text-center">
                      No attributes defined yet.
                    </div>
                  ) : (
                    (node.data?.attributes || []).map((attr, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <input
                          type="text"
                          value={attr}
                          onChange={(e) => handleUpdateAttribute(idx, e.target.value)}
                          className="flex-1 text-[11px] font-mono px-2 py-1 bg-[#faf5ee] border border-[#d8d0c8] rounded-lg outline-none focus:border-[#c2652a]"
                        />
                        <button
                          onClick={() => handleDeleteAttribute(idx)}
                          className="w-6 h-6 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center shrink-0 cursor-pointer"
                          title="Delete attribute"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Methods Manager */}
                {node.type !== 'enum' && (
                  <div className="pt-2 border-t border-[#d8d0c8]/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#78706a]">
                        Methods (Operations)
                      </span>
                      <button
                        onClick={handleAddMethod}
                        className="text-[11px] font-semibold text-[#c2652a] hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {(node.data?.methods || []).length === 0 ? (
                        <div className="text-[11px] text-[#78706a] italic bg-[#faf5ee] p-2 rounded-lg text-center">
                          No methods defined yet.
                        </div>
                      ) : (
                        (node.data?.methods || []).map((m, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <input
                              type="text"
                              value={m}
                              onChange={(e) => handleUpdateMethod(idx, e.target.value)}
                              className="flex-1 text-[11px] font-mono px-2 py-1 bg-[#faf5ee] border border-[#d8d0c8] rounded-lg outline-none focus:border-[#c2652a]"
                            />
                            <button
                              onClick={() => handleDeleteMethod(idx)}
                              className="w-6 h-6 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center shrink-0 cursor-pointer"
                              title="Delete method"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Relational Columns Manager */}
            {isErTable && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#78706a]">
                    Table Columns
                  </span>
                  <button
                    onClick={handleAddColumn}
                    className="text-[11px] font-semibold text-[#c2652a] hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Column</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {(node.data?.columns || []).map((col, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-[#faf5ee] border border-[#d8d0c8] space-y-1.5">
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={col.name}
                          placeholder="column_name"
                          onChange={(e) => handleUpdateColumn(idx, { name: e.target.value })}
                          className="flex-1 text-[11px] font-mono font-semibold px-2 py-1 bg-white border border-[#d8d0c8] rounded-lg outline-none focus:border-[#c2652a]"
                        />
                        <button
                          onClick={() => handleDeleteColumn(idx)}
                          className="w-6 h-6 rounded text-gray-400 hover:text-red-600 flex items-center justify-center shrink-0 cursor-pointer"
                          title="Delete column"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <input
                          type="text"
                          value={col.type}
                          placeholder="varchar(64)"
                          onChange={(e) => handleUpdateColumn(idx, { type: e.target.value })}
                          className="w-28 text-[10px] font-mono px-2 py-0.5 bg-white border border-[#d8d0c8] rounded-md outline-none"
                        />

                        <div className="flex items-center gap-1 text-[10px]">
                          <button
                            onClick={() => handleUpdateColumn(idx, { isPk: !col.isPk })}
                            className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                              col.isPk ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            PK
                          </button>
                          <button
                            onClick={() => handleUpdateColumn(idx, { isFk: !col.isFk })}
                            className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                              col.isFk ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            FK
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map Dictionary Entries Manager */}
            {isMap && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#78706a]">
                    Map Key-Value Entries
                  </span>
                  <button
                    onClick={handleAddMapEntry}
                    className="text-[11px] font-semibold text-[#c2652a] hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Entry</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {(node.data?.mapEntries || []).map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="key"
                        value={entry.key}
                        onChange={(e) => handleUpdateMapEntry(idx, { key: e.target.value })}
                        className="w-1/2 text-[11px] font-mono px-2 py-1 bg-[#faf5ee] border border-[#d8d0c8] rounded-lg outline-none focus:border-[#c2652a]"
                      />
                      <span className="text-gray-400">=</span>
                      <input
                        type="text"
                        placeholder="value"
                        value={entry.value}
                        onChange={(e) => handleUpdateMapEntry(idx, { value: e.target.value })}
                        className="w-1/2 text-[11px] font-mono px-2 py-1 bg-[#faf5ee] border border-[#d8d0c8] rounded-lg outline-none focus:border-[#c2652a]"
                      />
                      <button
                        onClick={() => handleDeleteMapEntry(idx)}
                        className="w-6 h-6 rounded text-gray-400 hover:text-red-600 flex items-center justify-center shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Object Slots Manager */}
            {isObject && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#78706a]">
                    Object Instance Slots
                  </span>
                  <button
                    onClick={handleAddObjectSlot}
                    className="text-[11px] font-semibold text-[#c2652a] hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Slot</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {(node.data?.slots || []).map((slot, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="slot_name"
                        value={slot.key}
                        onChange={(e) => handleUpdateObjectSlot(idx, { key: e.target.value })}
                        className="w-1/2 text-[11px] font-mono px-2 py-1 bg-[#faf5ee] border border-[#d8d0c8] rounded-lg outline-none focus:border-[#c2652a]"
                      />
                      <span className="text-gray-400">=</span>
                      <input
                        type="text"
                        placeholder="slot_val"
                        value={slot.value}
                        onChange={(e) => handleUpdateObjectSlot(idx, { value: e.target.value })}
                        className="w-1/2 text-[11px] font-mono px-2 py-1 bg-[#faf5ee] border border-[#d8d0c8] rounded-lg outline-none focus:border-[#c2652a]"
                      />
                      <button
                        onClick={() => handleDeleteObjectSlot(idx)}
                        className="w-6 h-6 rounded text-gray-400 hover:text-red-600 flex items-center justify-center shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Salt GUI Wireframe Content */}
            {isSalt && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#78706a] block mb-1">
                  Salt GUI Script
                </label>
                <textarea
                  rows={6}
                  value={node.data?.saltContent || node.data?.embeddedContent || '{+ \n  [Text Input] \n  [Button] \n}'}
                  onChange={(e) => onUpdateNode({ data: { ...node.data, saltContent: e.target.value, embeddedContent: e.target.value } })}
                  className="w-full text-xs font-mono px-2.5 py-2 bg-[#faf5ee] border border-[#d8d0c8] rounded-xl outline-none focus:border-[#c2652a] resize-y"
                />
              </div>
            )}

            {/* LaTeX Math Formula */}
            {isMath && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#78706a] block mb-1">
                  LaTeX Math Formula
                </label>
                <input
                  type="text"
                  value={node.data?.mathFormula || node.data?.embeddedContent || 'e^{i\\pi} + 1 = 0'}
                  onChange={(e) => onUpdateNode({ data: { ...node.data, mathFormula: e.target.value, embeddedContent: e.target.value } })}
                  className="w-full text-xs font-mono px-2.5 py-1.5 bg-[#faf5ee] border border-[#d8d0c8] rounded-xl outline-none focus:border-[#c2652a]"
                />
              </div>
            )}

            {/* Ditaa ASCII Art */}
            {isDitaa && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#78706a] block mb-1">
                  Ditaa ASCII Art
                </label>
                <textarea
                  rows={6}
                  value={node.data?.embeddedContent || '+--------+\n| Source |\n+--------+'}
                  onChange={(e) => onUpdateNode({ data: { ...node.data, embeddedContent: e.target.value } })}
                  className="w-full text-xs font-mono px-2.5 py-2 bg-[#faf5ee] border border-[#d8d0c8] rounded-xl outline-none focus:border-[#c2652a] resize-y"
                />
              </div>
            )}

            {/* JSON / YAML Content */}
            {isTree && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#78706a] block mb-1">
                  JSON / YAML Data Content
                </label>
                <textarea
                  rows={6}
                  value={node.data?.treeContent || '{\n  "service": "billing",\n  "active": true\n}'}
                  onChange={(e) => onUpdateNode({ data: { ...node.data, treeContent: e.target.value } })}
                  className="w-full text-xs font-mono px-2.5 py-2 bg-[#faf5ee] border border-[#d8d0c8] rounded-xl outline-none focus:border-[#c2652a] resize-y"
                />
              </div>
            )}

            {/* WBS Work Breakdown Structure */}
            {isWbs && (
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#78706a] block mb-1">
                    WBS Code (e.g. 1.2.1)
                  </label>
                  <input
                    type="text"
                    value={node.data?.wbsCode || '1.1'}
                    onChange={(e) => onUpdateNode({ data: { ...node.data, wbsCode: e.target.value } })}
                    className="w-full text-xs font-mono px-2.5 py-1.5 bg-[#faf5ee] border border-[#d8d0c8] rounded-xl outline-none focus:border-[#c2652a]"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#78706a]">
                      Progress Percentage
                    </label>
                    <span className="text-xs font-mono font-bold text-[#c2652a]">
                      {node.data?.wbsProgress ?? 65}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={node.data?.wbsProgress ?? 65}
                    onChange={(e) => onUpdateNode({ data: { ...node.data, wbsProgress: parseInt(e.target.value) } })}
                    className="w-full accent-[#c2652a]"
                  />
                </div>
              </div>
            )}

            {/* Technology & Description (For C4, Cloud, ArchiMate, Services, etc.) */}
            {!isNote && !isTree && (
              <div className="space-y-2 pt-2 border-t border-[#d8d0c8]/60">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#78706a] block mb-1">
                    Technology / Framework Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Spring Boot, PostgreSQL, REST"
                    value={technology}
                    onChange={(e) => {
                      setTechnology(e.target.value);
                      onUpdateNode({ data: { ...node.data, technology: e.target.value } });
                    }}
                    className="w-full text-xs font-mono px-2.5 py-1.5 bg-[#faf5ee] border border-[#d8d0c8] rounded-xl outline-none focus:border-[#c2652a]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#78706a] block mb-1">
                    Description / Documentation
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of responsibilities..."
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      onUpdateNode({ data: { ...node.data, description: e.target.value } });
                    }}
                    className="w-full text-xs font-sans px-2.5 py-1.5 bg-[#faf5ee] border border-[#d8d0c8] rounded-xl outline-none focus:border-[#c2652a] resize-y"
                  />
                </div>
              </div>
            )}

          </div>
        )}

        {/* ================= TAB 2: PROPERTIES & METADATA ================= */}
        {activeTab === 'properties' && (
          <div className="space-y-3.5">
            {/* Stereotype / Sublabel */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#78706a] block mb-1">
                Stereotype (e.g. «interface», «service»)
              </label>
              <input
                type="text"
                placeholder="«service»"
                value={sublabel}
                onChange={(e) => {
                  setSublabel(e.target.value);
                  onUpdateNode({ sublabel: e.target.value });
                }}
                className="w-full text-xs font-mono px-2.5 py-1.5 bg-[#faf5ee] border border-[#d8d0c8] rounded-xl outline-none focus:border-[#c2652a]"
              />
            </div>

            {/* Generics (for Classes/Interfaces) */}
            {isClassOrOO && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#78706a] block mb-1">
                  Generics Parameter (e.g. &lt;T, ID&gt;)
                </label>
                <input
                  type="text"
                  placeholder="<T, ID>"
                  value={generics}
                  onChange={(e) => {
                    setGenerics(e.target.value);
                    onUpdateNode({ data: { ...node.data, generics: e.target.value } });
                  }}
                  className="w-full text-xs font-mono px-2.5 py-1.5 bg-[#faf5ee] border border-[#d8d0c8] rounded-xl outline-none focus:border-[#c2652a]"
                />
              </div>
            )}

            {/* Classifier Spot Badge */}
            {isClassOrOO && (
              <div className="p-2.5 rounded-xl bg-[#faf5ee] border border-[#d8d0c8] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#78706a] block">
                  UML Classifier Spot Badge
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={2}
                    value={spotChar}
                    onChange={(e) => {
                      const char = e.target.value.toUpperCase();
                      setSpotChar(char);
                      onUpdateNode({ data: { ...node.data, spot: { character: char, colorHex: spotColor } } });
                    }}
                    className="w-10 text-center text-xs font-bold px-1.5 py-1 bg-white border border-[#d8d0c8] rounded-lg outline-none"
                    title="Badge character (C, I, A, E, S)"
                  />
                  <input
                    type="color"
                    value={spotColor}
                    onChange={(e) => {
                      setSpotColor(e.target.value);
                      onUpdateNode({ data: { ...node.data, spot: { character: spotChar, colorHex: e.target.value } } });
                    }}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-[#d8d0c8]"
                    title="Badge color"
                  />
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs ml-auto"
                    style={{ backgroundColor: spotColor }}
                  >
                    {spotChar}
                  </div>
                </div>
              </div>
            )}

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#78706a] block mb-1">
                  Width (px)
                </label>
                <input
                  type="number"
                  min={80}
                  max={800}
                  step={10}
                  value={width}
                  onChange={(e) => {
                    const w = parseInt(e.target.value) || node.width;
                    setWidth(w);
                    onUpdateNode({ width: w });
                  }}
                  className="w-full text-xs font-mono px-2.5 py-1.5 bg-[#faf5ee] border border-[#d8d0c8] rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#78706a] block mb-1">
                  Min Height (px)
                </label>
                <input
                  type="number"
                  min={40}
                  max={800}
                  step={10}
                  value={height}
                  onChange={(e) => {
                    const h = parseInt(e.target.value) || node.height;
                    setHeight(h);
                    onUpdateNode({ height: h });
                  }}
                  className="w-full text-xs font-mono px-2.5 py-1.5 bg-[#faf5ee] border border-[#d8d0c8] rounded-xl outline-none"
                />
              </div>
            </div>

            {/* Node ID */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#78706a] block mb-0.5">
                Internal Identifier
              </label>
              <span className="text-[11px] font-mono text-gray-500 select-all">
                {node.id}
              </span>
            </div>

          </div>
        )}

      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-[#d8d0c8]/60 bg-[#faf5ee]/80 flex items-center justify-between">
        <span className="text-[10px] text-[#78706a]">
          PlantUML Visual Studio
        </span>

        <button
          onClick={onDeleteNode}
          className="px-2.5 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Delete element from diagram"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>
      </div>
    </aside>
  );
};
