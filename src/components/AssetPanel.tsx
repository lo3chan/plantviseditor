import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Plus, 
  Cpu, 
  Server, 
  Database, 
  Cloud, 
  ShieldCheck, 
  Layers, 
  Radio, 
  User, 
  Box, 
  FileCode, 
  ListFilter, 
  Sparkles, 
  GitBranch, 
  Lightbulb, 
  CheckSquare, 
  PlayCircle, 
  Square, 
  Compass, 
  StopCircle, 
  CircleDot, 
  Maximize2,
  Shield,
  Info,
  Code,
  Folder,
  FileText,
  Users,
  Terminal,
  Sigma,
  LayoutTemplate,
  AppWindow
} from 'lucide-react';
import { DiagramType, AssetItem, StructuralCategory } from '../types';
import { UNIFIED_ASSETS, STRUCTURAL_CATEGORIES, getColorConfig } from '../utils/assetsData';

interface AssetPanelProps {
  currentType?: DiagramType;
  onAddNodeFromAsset: (asset: AssetItem, x?: number, y?: number) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

// Icon mapping helper
const ICON_MAP: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
  Cpu,
  Server,
  Database,
  Cloud,
  ShieldCheck,
  Shield,
  Layers,
  Radio,
  User,
  Box,
  FileCode,
  ListFilter,
  Sparkles,
  GitBranch,
  Lightbulb,
  CheckSquare,
  PlayCircle,
  Square,
  Compass,
  StopCircle,
  CircleDot,
  Maximize2,
  Code,
  Folder,
  FileText,
  Users,
  Terminal,
  Sigma,
  LayoutTemplate,
  AppWindow
};

export const AssetPanel: React.FC<AssetPanelProps> = ({
  onAddNodeFromAsset,
  isCollapsed,
  onToggleCollapse
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredAssets = UNIFIED_ASSETS.filter(item => {
    const matchesSearch = 
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.categoryLabel && item.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Group by category
  const categoriesPresent = Array.from(new Set(filteredAssets.map(a => a.category)));

  if (isCollapsed) {
    return (
      <aside className="absolute top-16 left-3 z-20">
        <button
          id="btn-expand-assets"
          onClick={onToggleCollapse}
          className="w-10 h-10 rounded-xl bg-white/95 border border-[#d8d0c8] shadow-sm text-[#c2652a] hover:bg-[#faf5ee] hover:border-[#c2652a] flex items-center justify-center transition-all cursor-pointer"
          title="Open Unified Structural Toolbox"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-80 h-[calc(100vh-3.5rem)] bg-[#fdfaf5]/95 backdrop-blur-md border-r border-[#d8d0c8]/60 flex flex-col z-20 select-none shadow-sm transition-all duration-200">
      {/* Panel Header */}
      <div className="p-3 border-b border-[#d8d0c8]/50 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-wider font-bold text-[#c2652a]">
              Unified Structural Toolbox
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#c2652a]/10 text-[#c2652a] font-semibold">
              {STRUCTURAL_CATEGORIES.length} Models
            </span>
          </div>
          <p className="text-xs text-[#78706a]">Mix any element on the same canvas</p>
        </div>
        <button
          id="btn-collapse-assets"
          onClick={onToggleCollapse}
          className="p-1 rounded-lg hover:bg-[#eae2da] text-[#78706a] hover:text-[#3a302a] transition-colors cursor-pointer"
          title="Collapse Panel"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="px-3 pt-2.5 pb-1.5">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-[#9a9088]" />
          <input
            type="text"
            placeholder="Search classes, tables, C4, cloud, JSON..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-white border border-[#d8d0c8]/70 rounded-lg text-[#3a302a] placeholder-[#9a9088] focus:border-[#c2652a] focus:ring-1 focus:ring-[#c2652a] outline-none transition-all"
          />
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="px-3 py-1.5 border-b border-[#d8d0c8]/40 overflow-x-auto scrollbar-none flex items-center gap-1.5">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`shrink-0 text-[10.5px] px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#c2652a] text-white shadow-2xs'
              : 'bg-white text-[#78706a] border border-[#d8d0c8]/70 hover:border-[#c2652a] hover:text-[#3a302a]'
          }`}
        >
          All ({UNIFIED_ASSETS.length})
        </button>
        {STRUCTURAL_CATEGORIES.map(cat => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 text-[10.5px] px-2 py-1 rounded-full font-medium transition-colors whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-[#c2652a] text-white shadow-2xs'
                  : 'bg-white text-[#78706a] border border-[#d8d0c8]/70 hover:border-[#c2652a] hover:text-[#3a302a]'
              }`}
              title={cat.description}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Categorized Assets List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {categoriesPresent.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#78706a]">
            No structural elements found matching "{searchQuery}"
          </div>
        ) : (
          categoriesPresent.map(categoryKey => {
            const items = filteredAssets.filter(a => a.category === categoryKey);
            const catMeta = STRUCTURAL_CATEGORIES.find(c => c.id === categoryKey);
            const categoryTitle = catMeta ? catMeta.label : categoryKey.toUpperCase();

            return (
              <div key={categoryKey} className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold text-[#78706a] uppercase tracking-wider">
                    {categoryTitle}
                  </span>
                  <span className="text-[9px] text-[#9a9088] font-mono">
                    {items.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  {items.map(asset => {
                    const Icon = ICON_MAP[asset.icon] || Box;
                    const colorCfg = getColorConfig(asset.defaultColor);
                    return (
                      <div
                        key={asset.id}
                        id={`asset-item-${asset.id}`}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/plantuml-asset', JSON.stringify(asset));
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        onClick={() => onAddNodeFromAsset(asset)}
                        className="group relative p-2 rounded-xl bg-white border border-[#d8d0c8]/70 hover:border-[#c2652a] hover:shadow-xs transition-all duration-150 cursor-grab active:cursor-grabbing flex items-center gap-2.5"
                      >
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                          style={{ backgroundColor: colorCfg.bgHex, border: `1px solid ${colorCfg.hex}` }}
                        >
                          <Icon className="w-4 h-4" style={{ color: colorCfg.hex }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-[#3a302a] group-hover:text-[#c2652a] transition-colors truncate">
                              {asset.label}
                            </span>
                            <span className="text-[9px] px-1 py-0.2 bg-[#f2ece4] text-[#78706a] rounded font-mono shrink-0">
                              {asset.sublabel || asset.nodeType}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#78706a] truncate">
                            {asset.description}
                          </p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[#c2652a] shrink-0">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Tips Footer */}
      <div className="p-2.5 border-t border-[#d8d0c8]/60 bg-[#f6f0e8]/50 text-[11px] text-[#78706a] flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-[#c2652a] shrink-0 mt-0.5" />
        <div>
          <span className="font-medium text-[#3a302a]">Unified Canvas:</span> Mix UML classes, ER tables, C4, and Cloud nodes with Crow's Foot cardinality.
        </div>
      </div>
    </aside>
  );
};
