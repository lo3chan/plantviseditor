import React, { useState, useMemo } from 'react';
import { 
  Palette, 
  RotateCcw, 
  PenTool, 
  Layers, 
  Type, 
  Check, 
  X,
  Compass,
  ShieldCheck,
  Minimize2,
  Split,
  Search,
  Sliders,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { GlobalCanvasSettings } from '../types';

interface PlantUMLStylePanelProps {
  settings: GlobalCanvasSettings;
  onUpdateSettings: (patch: Partial<GlobalCanvasSettings>) => void;
  isSequenceDiagram?: boolean;
  onClose?: () => void;
}

// Reusable Slider + Number Input Component for all numeric variables
interface SliderNumberControlProps {
  id: string;
  label: string;
  paramName?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  zeroLabel?: string;
  onChange: (val: number) => void;
  presets?: Array<{ label: string; value: number }>;
}

const SliderNumberControl: React.FC<SliderNumberControlProps> = ({
  id,
  label,
  paramName,
  value,
  min,
  max,
  step = 1,
  unit = 'px',
  zeroLabel,
  onChange,
  presets
}) => {
  return (
    <div className="space-y-1.5 py-1.5 bg-white/60 p-2 rounded-lg border border-[#d8d0c8]/60">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-[#3a302a]">{label}</span>
          {paramName && (
            <span className="text-[9px] font-mono text-[#8a7f75] block">skinparam {paramName}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <input
            id={`num-${id}`}
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => {
              const parsed = parseFloat(e.target.value);
              if (!isNaN(parsed)) {
                onChange(Math.min(max, Math.max(min, parsed)));
              }
            }}
            className="w-16 px-1.5 py-0.5 text-xs text-right font-mono bg-white border border-[#d8d0c8] rounded shadow-2xs focus:border-[#c2652a] focus:outline-none text-[#2d251f]"
          />
          <span className="text-[10px] font-medium text-[#78706a] w-5">{unit}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id={`range-${id}`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 accent-[#c2652a] cursor-pointer h-1.5 bg-[#e0d6cb] rounded-lg"
        />
      </div>

      {presets && presets.length > 0 && (
        <div className="flex items-center gap-1 pt-0.5 overflow-x-auto scrollbar-none">
          {presets.map(p => (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange(p.value)}
              className={`px-1.5 py-0.2 rounded text-[9px] font-mono transition-colors cursor-pointer border ${
                value === p.value
                  ? 'bg-[#c2652a] text-white border-[#c2652a]'
                  : 'bg-white text-[#78706a] border-[#d8d0c8]/60 hover:border-[#c2652a]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Unified Themes & Visual Archetype Presets
interface ThemePresetOption {
  id: string;
  themeId: string;
  label: string;
  desc: string;
  icon: string;
  color: string;
  category: 'all' | 'classic' | 'modern' | 'dark' | 'technical' | 'artistic';
  applyPatch: Partial<GlobalCanvasSettings>;
}

const UNIFIED_THEME_OPTIONS: ThemePresetOption[] = [
  // Classic & Standard
  {
    id: 'classic-default',
    themeId: 'none',
    label: 'Classic PlantUML',
    desc: 'Standard yellow/crimson UML palette',
    icon: '🏛️',
    color: '#A80036',
    category: 'classic',
    applyPatch: {
      theme: 'none',
      strictuml: false,
      monochromeReverse: false,
      monochrome: false,
      handwritten: false,
      shadowing: false,
      roundcorner: 8,
      diagonalCorner: 0,
      arrowColor: '#A80036',
      defaultFontName: ''
    }
  },
  {
    id: 'strictuml-preset',
    themeId: 'none',
    label: 'Strict UML 2.5',
    desc: 'OMG standard compliance & monochrome',
    icon: '📐',
    color: '#111827',
    category: 'classic',
    applyPatch: {
      theme: 'none',
      strictuml: true,
      monochromeReverse: false,
      monochrome: true,
      handwritten: false,
      shadowing: false,
      roundcorner: 0,
      diagonalCorner: 0,
      arrowColor: '#111827'
    }
  },
  {
    id: 'plain-minimal',
    themeId: 'plain',
    label: 'Plain Minimal',
    desc: 'Crisp black & white minimal vector lines',
    icon: '📄',
    color: '#4a4036',
    category: 'classic',
    applyPatch: {
      theme: 'plain',
      strictuml: false,
      monochromeReverse: false,
      monochrome: false,
      handwritten: false,
      shadowing: false,
      roundcorner: 0,
      diagonalCorner: 0,
      arrowColor: '#111827'
    }
  },

  // Modern UI
  {
    id: 'materia-flat',
    themeId: 'materia',
    label: 'Materia Flat',
    desc: 'Google Material cards & soft cyan hues',
    icon: '🎨',
    color: '#2196f3',
    category: 'modern',
    applyPatch: {
      theme: 'materia',
      strictuml: false,
      monochromeReverse: false,
      monochrome: false,
      handwritten: false,
      shadowing: true,
      roundcorner: 10,
      diagonalCorner: 0,
      arrowColor: '#2196f3'
    }
  },
  {
    id: 'mint-fresh',
    themeId: 'mint',
    label: 'Fresh Mint',
    desc: 'Pastel teal & clean mint UI theme',
    icon: '🌿',
    color: '#00bfa5',
    category: 'modern',
    applyPatch: {
      theme: 'mint',
      strictuml: false,
      monochromeReverse: false,
      arrowColor: '#00bfa5',
      roundcorner: 8
    }
  },
  {
    id: 'cerulean-marine',
    themeId: 'cerulean',
    label: 'Cerulean Oceanic',
    desc: 'Deep oceanic marine sapphire palette',
    icon: '🌊',
    color: '#0288d1',
    category: 'modern',
    applyPatch: {
      theme: 'cerulean',
      strictuml: false,
      monochromeReverse: false,
      arrowColor: '#0288d1',
      roundcorner: 8
    }
  },
  {
    id: 'spacelab-tech',
    themeId: 'spacelab',
    label: 'Spacelab Enterprise',
    desc: 'Crisp corporate enterprise tech cards',
    icon: '🚀',
    color: '#3f51b5',
    category: 'modern',
    applyPatch: {
      theme: 'spacelab',
      strictuml: false,
      monochromeReverse: false,
      arrowColor: '#3f51b5',
      roundcorner: 6
    }
  },
  {
    id: 'sandstone-warm',
    themeId: 'sandstone',
    label: 'Sandstone Warm',
    desc: 'Warm organic architectural earth tones',
    icon: '🏜️',
    color: '#8d6e63',
    category: 'modern',
    applyPatch: {
      theme: 'sandstone',
      strictuml: false,
      monochromeReverse: false,
      arrowColor: '#8d6e63',
      roundcorner: 6
    }
  },
  {
    id: 'silver-metallic',
    themeId: 'silver',
    label: 'Silver Metallic',
    desc: 'Polished metallic monochromatic slate',
    icon: '🪙',
    color: '#78909c',
    category: 'modern',
    applyPatch: {
      theme: 'silver',
      strictuml: false,
      monochromeReverse: false,
      arrowColor: '#78909c',
      roundcorner: 6
    }
  },

  // Dark & Cyberpunk
  {
    id: 'dark-invert-preset',
    themeId: 'none',
    label: 'Dark Invert',
    desc: 'Inverted obsidian dark canvas with warm accents',
    icon: '🌙',
    color: '#c2652a',
    category: 'dark',
    applyPatch: {
      theme: 'none',
      strictuml: false,
      monochromeReverse: true,
      monochrome: false,
      handwritten: false,
      shadowing: true,
      roundcorner: 8,
      diagonalCorner: 0,
      arrowColor: '#c2652a'
    }
  },
  {
    id: 'cyborg-dark',
    themeId: 'cyborg',
    label: 'Cyborg Dark',
    desc: 'Deep cyberpunk dark theme with glowing cyan',
    icon: '⚡',
    color: '#00e5ff',
    category: 'dark',
    applyPatch: {
      theme: 'cyborg',
      strictuml: false,
      monochromeReverse: false,
      monochrome: false,
      handwritten: false,
      shadowing: true,
      roundcorner: 4,
      diagonalCorner: 0,
      arrowColor: '#00e5ff'
    }
  },
  {
    id: 'black-knight-dark',
    themeId: 'black-knight',
    label: 'Black Knight',
    desc: 'Stealth high-contrast carbon dark theme',
    icon: '🛡️',
    color: '#111827',
    category: 'dark',
    applyPatch: {
      theme: 'black-knight',
      strictuml: false,
      monochromeReverse: false,
      arrowColor: '#38bdf8',
      roundcorner: 4
    }
  },
  {
    id: 'crt-amber-retro',
    themeId: 'crt-amber',
    label: 'CRT Amber',
    desc: 'Retro phosphor amber terminal monitor',
    icon: '📟',
    color: '#ffb300',
    category: 'technical',
    applyPatch: {
      theme: 'crt-amber',
      strictuml: false,
      monochromeReverse: false,
      monochrome: false,
      handwritten: false,
      shadowing: false,
      roundcorner: 0,
      diagonalCorner: 0,
      arrowColor: '#ffb300',
      defaultFontName: 'monospace'
    }
  },
  {
    id: 'crt-green-matrix',
    themeId: 'crt-green',
    label: 'CRT Green Matrix',
    desc: 'Vintage green phosphor hacker display',
    icon: '💻',
    color: '#00e676',
    category: 'technical',
    applyPatch: {
      theme: 'crt-green',
      strictuml: false,
      monochromeReverse: false,
      arrowColor: '#00e676',
      defaultFontName: 'monospace'
    }
  },

  // Technical Drafting & Blueprint
  {
    id: 'blueprint-drafting',
    themeId: 'blueprint',
    label: 'Blueprint Cyan',
    desc: 'Technical drafting blueprint & monospace',
    icon: '📑',
    color: '#00bcd4',
    category: 'technical',
    applyPatch: {
      theme: 'blueprint',
      strictuml: false,
      monochromeReverse: false,
      monochrome: false,
      handwritten: false,
      shadowing: false,
      roundcorner: 0,
      diagonalCorner: 0,
      arrowColor: '#00bcd4',
      defaultFontName: 'monospace'
    }
  },
  {
    id: 'resume-light-print',
    themeId: 'resume-light',
    label: 'Resume Light',
    desc: 'Formal publication & print-ready document',
    icon: '📜',
    color: '#37474f',
    category: 'technical',
    applyPatch: {
      theme: 'resume-light',
      strictuml: false,
      monochromeReverse: false,
      arrowColor: '#37474f',
      roundcorner: 4
    }
  },

  // Artistic & Expressive
  {
    id: 'sketch-handdrawn',
    themeId: 'sketchy',
    label: 'Sketchy Hand-Drawn',
    desc: 'Hand-drawn organic marker & sketch lines',
    icon: '✏️',
    color: '#e65100',
    category: 'artistic',
    applyPatch: {
      theme: 'sketchy',
      strictuml: false,
      monochromeReverse: false,
      monochrome: false,
      handwritten: true,
      shadowing: false,
      roundcorner: 15,
      diagonalCorner: 0,
      arrowColor: '#A80036',
      defaultFontName: 'Comic Sans MS'
    }
  },
  {
    id: 'vibrant-punchy',
    themeId: 'vibrant',
    label: 'Vibrant Accent',
    desc: 'Punchy saturated accent palette',
    icon: '🌸',
    color: '#e91e63',
    category: 'artistic',
    applyPatch: {
      theme: 'vibrant',
      strictuml: false,
      monochromeReverse: false,
      arrowColor: '#e91e63',
      roundcorner: 8
    }
  },
  {
    id: 'toy-playful',
    themeId: 'toy',
    label: 'Toy Playful',
    desc: 'High-energy playful saturated theme',
    icon: '🧸',
    color: '#ff4081',
    category: 'artistic',
    applyPatch: {
      theme: 'toy',
      strictuml: false,
      monochromeReverse: false,
      arrowColor: '#ff4081',
      roundcorner: 14
    }
  },
  {
    id: 'superhero-bold',
    themeId: 'superhero',
    label: 'Superhero Comic',
    desc: 'Dramatic bold comic book palette',
    icon: '🦸',
    color: '#f57c00',
    category: 'artistic',
    applyPatch: {
      theme: 'superhero',
      strictuml: false,
      monochromeReverse: false,
      arrowColor: '#f57c00',
      roundcorner: 6
    }
  }
];

const ARROW_COLORS = [
  { hex: '#A80036', label: 'Classic Crimson' },
  { hex: '#c2652a', label: 'Terra Cotta' },
  { hex: '#2563eb', label: 'Royal Blue' },
  { hex: '#10b981', label: 'Emerald Green' },
  { hex: '#6b7280', label: 'Steel Neutral' },
  { hex: '#d97706', label: 'Amber Gold' },
  { hex: '#9333ea', label: 'Deep Violet' },
  { hex: '#111827', label: 'Pitch Black' }
];

export const PlantUMLStylePanel: React.FC<PlantUMLStylePanelProps> = ({
  settings,
  onUpdateSettings,
  isSequenceDiagram = false,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'layout' | 'geometry' | 'sequence' | 'theme'>('theme');
  const [themeSearch, setThemeSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'classic' | 'modern' | 'dark' | 'technical' | 'artistic'>('all');

  const currentTheme = settings.theme || 'none';
  const isMonochromeReverse = Boolean(settings.monochromeReverse);
  const isMonochrome = Boolean(settings.monochrome);
  const isStrictUml = Boolean(settings.strictuml);
  const isHandwritten = Boolean(settings.handwritten);
  const isShadowing = settings.shadowing !== false;
  const isHideFootbox = Boolean(settings.hideFootbox);
  const isResponseBelow = Boolean(settings.responseMessageBelowArrow);
  const currentDirection = settings.direction || 'TB';
  const currentLinetype = settings.linetype || 'ortho';
  const currentRoundcorner = settings.roundcorner !== undefined ? settings.roundcorner : 8;
  const currentDiagonalCorner = settings.diagonalCorner || 0;
  const currentArrowColor = settings.arrowColor || '#A80036';
  const currentAutonumber = settings.autonumberFormat || 'disabled';
  const currentScale = settings.scale || 1;
  const currentDpi = settings.dpi || 150;
  const currentArrowThickness = settings.arrowThickness || 2;
  const currentFontSize = settings.defaultFontSize || 12;

  // Filtered theme presets for the unified selection menu
  const filteredThemes = useMemo(() => {
    return UNIFIED_THEME_OPTIONS.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch = !themeSearch.trim() || 
        item.label.toLowerCase().includes(themeSearch.toLowerCase()) ||
        item.desc.toLowerCase().includes(themeSearch.toLowerCase()) ||
        item.themeId.toLowerCase().includes(themeSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, themeSearch]);

  return (
    <div className="w-84 h-full flex flex-col bg-[#fdfaf5] border-l border-[#d8d0c8]/80 shadow-2xl select-none z-30 overflow-hidden">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-[#d8d0c8]/70 bg-[#faf5ee] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#c2652a] text-white flex items-center justify-center shadow-2xs">
            <Palette className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-[#3a302a] tracking-tight">PlantUML Style & Variables</h2>
            <p className="text-[10px] text-[#78706a]">Live Skinparam & Sliders</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdateSettings({
              theme: 'none',
              strictuml: false,
              monochromeReverse: false,
              monochrome: false,
              handwritten: false,
              shadowing: false,
              roundcorner: 8,
              diagonalCorner: 0,
              arrowColor: '#A80036',
              direction: 'TB',
              linetype: 'ortho',
              nodesep: 40,
              ranksep: 50,
              padding: 8,
              margin: 8,
              minClassWidth: 0,
              wrapWidth: 0,
              arrowThickness: 2,
              defaultFontSize: 12,
              scale: 1,
              dpi: 150
            })}
            className="p-1.5 rounded-md text-[#78706a] hover:text-[#c2652a] hover:bg-white transition-colors cursor-pointer"
            title="Reset to classic PlantUML defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[#78706a] hover:text-[#3a302a] hover:bg-white transition-colors cursor-pointer"
              title="Close Style Panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs Header */}
      <div className="flex items-center border-b border-[#d8d0c8]/70 bg-[#f4eee6] px-1 pt-1 gap-1 text-[11px] font-medium">
        <button
          onClick={() => setActiveTab('theme')}
          className={`flex-1 py-1.5 text-center rounded-t-lg transition-all cursor-pointer ${
            activeTab === 'theme'
              ? 'bg-[#fdfaf5] text-[#c2652a] font-bold border-t-2 border-[#c2652a] shadow-xs'
              : 'text-[#605850] hover:text-[#3a302a] hover:bg-white/50'
          }`}
        >
          Theme
        </button>
        <button
          onClick={() => setActiveTab('geometry')}
          className={`flex-1 py-1.5 text-center rounded-t-lg transition-all cursor-pointer ${
            activeTab === 'geometry'
              ? 'bg-[#fdfaf5] text-[#c2652a] font-bold border-t-2 border-[#c2652a] shadow-xs'
              : 'text-[#605850] hover:text-[#3a302a] hover:bg-white/50'
          }`}
        >
          Geometry
        </button>
        <button
          onClick={() => setActiveTab('layout')}
          className={`flex-1 py-1.5 text-center rounded-t-lg transition-all cursor-pointer ${
            activeTab === 'layout'
              ? 'bg-[#fdfaf5] text-[#c2652a] font-bold border-t-2 border-[#c2652a] shadow-xs'
              : 'text-[#605850] hover:text-[#3a302a] hover:bg-white/50'
          }`}
        >
          Layout
        </button>
        <button
          onClick={() => setActiveTab('sequence')}
          className={`flex-1 py-1.5 text-center rounded-t-lg transition-all cursor-pointer relative ${
            activeTab === 'sequence'
              ? 'bg-[#fdfaf5] text-[#c2652a] font-bold border-t-2 border-[#c2652a] shadow-xs'
              : 'text-[#605850] hover:text-[#3a302a] hover:bg-white/50'
          }`}
        >
          Sequence
          {isSequenceDiagram && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#c2652a] inline-block ml-1" />
          )}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
        {/* ============================================================ */}
        {/* TAB: THEME & VISUAL ARCHETYPES (CONSOLIDATED SELECTION MENU) */}
        {/* ============================================================ */}
        {activeTab === 'theme' && (
          <div className="space-y-4">
            {/* Header with Search and Category Filter */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#78706a] block flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#c2652a]" />
                  <span>Themes & Visual Archetypes</span>
                </label>
                <span className="text-[9px] font-mono text-[#c2652a] bg-[#faf0e6] px-1.5 py-0.2 rounded border border-[#c2652a]/30 font-semibold">
                  {UNIFIED_THEME_OPTIONS.length} Presets
                </span>
              </div>

              {/* Search Box */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-[#8a7f75] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={themeSearch}
                  onChange={(e) => setThemeSearch(e.target.value)}
                  placeholder="Filter themes (e.g. materia, dark, sketch)..."
                  className="w-full pl-8 pr-2.5 py-1 text-xs bg-white border border-[#d8d0c8] rounded-lg shadow-2xs focus:border-[#c2652a] focus:outline-none text-[#2d251f]"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1 text-[10px]">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'classic', label: 'Classic' },
                  { id: 'modern', label: 'Modern' },
                  { id: 'dark', label: 'Dark' },
                  { id: 'technical', label: 'Technical' },
                  { id: 'artistic', label: 'Handmade' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as any)}
                    className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-colors cursor-pointer border ${
                      selectedCategory === cat.id
                        ? 'bg-[#c2652a] text-white border-[#c2652a] font-bold shadow-2xs'
                        : 'bg-white text-[#78706a] border-[#d8d0c8]/70 hover:border-[#c2652a]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selection Menu (2-Column Grid Format) */}
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {filteredThemes.map(option => {
                // Check if this option is currently active
                const isActive = (
                  (option.id === 'strictuml-preset' && isStrictUml) ||
                  (option.id === 'dark-invert-preset' && isMonochromeReverse) ||
                  (option.id === 'sketch-handdrawn' && (isHandwritten || currentTheme === 'sketchy')) ||
                  (option.themeId !== 'none' && currentTheme === option.themeId) ||
                  (option.id === 'classic-default' && currentTheme === 'none' && !isStrictUml && !isMonochromeReverse && !isHandwritten)
                );

                return (
                  <button
                    key={option.id}
                    onClick={() => onUpdateSettings(option.applyPatch)}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between relative shadow-2xs ${
                      isActive
                        ? 'bg-white border-[#c2652a] ring-2 ring-[#c2652a]/25 shadow-xs'
                        : 'bg-white/80 border-[#d8d0c8]/70 hover:bg-white hover:border-[#c2652a]/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{option.icon}</span>
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: option.color }}
                        />
                      </div>
                      {isActive && (
                        <div className="w-3.5 h-3.5 rounded-full bg-[#c2652a] text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-[#3a302a] leading-tight truncate">
                        {option.label}
                      </div>
                      <div className="text-[9px] text-[#78706a] line-clamp-1 leading-tight mt-0.5">
                        {option.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Sliders for Theme Variables */}
            <div className="border-t border-[#d8d0c8]/50 pt-3 space-y-2.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#78706a] block flex items-center justify-between">
                <span>Theme & Appearance Variables</span>
                <Sliders className="w-3 h-3 text-[#c2652a]" />
              </label>

              {/* Arrow Stroke Thickness Slider */}
              <SliderNumberControl
                id="arrow-thickness"
                label="Arrow Stroke Thickness"
                paramName="ArrowThickness"
                value={currentArrowThickness}
                min={1}
                max={8}
                step={0.5}
                unit="px"
                onChange={(val) => onUpdateSettings({ arrowThickness: val })}
                presets={[
                  { label: '1 Thin', value: 1 },
                  { label: '2 Normal', value: 2 },
                  { label: '3 Bold', value: 3 },
                  { label: '4 Heavy', value: 4 }
                ]}
              />

              {/* Arrow Accent Color Palette */}
              <div className="bg-white/60 p-2 rounded-lg border border-[#d8d0c8]/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#3a302a]">Arrow Accent Color</span>
                  <span className="text-[9px] font-mono text-[#8a7f75]">skinparam ArrowColor</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {ARROW_COLORS.map(c => (
                    <button
                      key={c.hex}
                      onClick={() => onUpdateSettings({ arrowColor: c.hex })}
                      className={`flex items-center gap-1.5 p-1 rounded-lg border transition-all cursor-pointer ${
                        currentArrowColor.toLowerCase() === c.hex.toLowerCase()
                          ? 'border-[#c2652a] ring-2 ring-[#c2652a]/30 bg-white shadow-2xs'
                          : 'border-[#d8d0c8]/60 bg-white hover:border-[#c2652a]/60'
                      }`}
                      title={c.label}
                    >
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.hex }} />
                      <span className="text-[9px] font-mono truncate">{c.hex}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Base Font Size Slider */}
              <SliderNumberControl
                id="font-size"
                label="Base Font Size"
                paramName="defaultFontSize"
                value={currentFontSize}
                min={8}
                max={26}
                step={1}
                unit="pt"
                onChange={(val) => onUpdateSettings({ defaultFontSize: val })}
                presets={[
                  { label: '10pt', value: 10 },
                  { label: '12pt', value: 12 },
                  { label: '14pt', value: 14 },
                  { label: '16pt', value: 16 }
                ]}
              />

              {/* Font Family Selection */}
              <div className="bg-white/60 p-2 rounded-lg border border-[#d8d0c8]/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#3a302a]">Default Typography</span>
                  <span className="text-[9px] font-mono text-[#8a7f75]">skinparam defaultFontName</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: '', label: 'Default' },
                    { id: 'sans-serif', label: 'Sans-Serif' },
                    { id: 'monospace', label: 'Monospace' },
                    { id: 'Comic Sans MS', label: 'Comic/Casual' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => onUpdateSettings({ defaultFontName: f.id })}
                      className={`py-1 px-1.5 rounded text-[11px] font-medium border text-center transition-colors cursor-pointer truncate ${
                        (settings.defaultFontName || '') === f.id
                          ? 'bg-[#c2652a] text-white border-[#c2652a]'
                          : 'bg-white text-[#3a302a] border-[#d8d0c8]/70 hover:bg-[#faf5ee]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Output Scale Modifier Slider */}
              <SliderNumberControl
                id="canvas-scale"
                label="Output Scale Modifier"
                paramName="scale"
                value={currentScale}
                min={0.5}
                max={2.5}
                step={0.05}
                unit="x"
                onChange={(val) => onUpdateSettings({ scale: val })}
                presets={[
                  { label: '0.75x', value: 0.75 },
                  { label: '1.0x', value: 1.0 },
                  { label: '1.25x', value: 1.25 },
                  { label: '1.5x', value: 1.5 },
                  { label: '2.0x', value: 2.0 }
                ]}
              />

              {/* Raster DPI Slider */}
              <SliderNumberControl
                id="canvas-dpi"
                label="Raster Export DPI"
                paramName="dpi"
                value={currentDpi}
                min={72}
                max={600}
                step={12}
                unit="dpi"
                onChange={(val) => onUpdateSettings({ dpi: val })}
                presets={[
                  { label: '72 Web', value: 72 },
                  { label: '150 Std', value: 150 },
                  { label: '300 Print', value: 300 },
                  { label: '600 Ultra', value: 600 }
                ]}
              />
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB: GEOMETRY, CORNERS & SPACING (SLIDERS FOR ALL VARIABLES) */}
        {/* ============================================================ */}
        {activeTab === 'geometry' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#78706a] block flex items-center gap-1">
                <Sliders className="w-3 h-3 text-[#c2652a]" />
                <span>Geometry & Spacing Variables</span>
              </label>
              <span className="text-[9px] font-mono text-[#8a7f75]">Continuous Range</span>
            </div>

            {/* Rounded Corners Slider */}
            <SliderNumberControl
              id="round-corner"
              label="Rounded Corners"
              paramName="roundcorner"
              value={currentRoundcorner}
              min={0}
              max={30}
              step={1}
              unit="px"
              onChange={(val) => onUpdateSettings({ roundcorner: val, diagonalCorner: val > 0 ? 0 : currentDiagonalCorner })}
              presets={[
                { label: '0 Sharp', value: 0 },
                { label: '8 Soft', value: 8 },
                { label: '12 Round', value: 12 },
                { label: '20 Pill', value: 20 }
              ]}
            />

            {/* Chamfered / Diagonal Corners Slider */}
            <SliderNumberControl
              id="diagonal-corner"
              label="Chamfered / Beveled Corners"
              paramName="diagonalCorner"
              value={currentDiagonalCorner}
              min={0}
              max={30}
              step={1}
              unit="px"
              onChange={(val) => onUpdateSettings({ diagonalCorner: val, roundcorner: val > 0 ? 0 : currentRoundcorner })}
              presets={[
                { label: '0 None', value: 0 },
                { label: '8 Chamfer', value: 8 },
                { label: '14 Deep', value: 14 }
              ]}
            />

            {/* Node Separation (nodesep) Slider */}
            <SliderNumberControl
              id="node-sep"
              label="Horizontal Node Separation"
              paramName="nodesep"
              value={settings.nodesep || 40}
              min={10}
              max={180}
              step={5}
              unit="px"
              onChange={(val) => onUpdateSettings({ nodesep: val })}
              presets={[
                { label: '20 Dense', value: 20 },
                { label: '40 Normal', value: 40 },
                { label: '60 Wide', value: 60 },
                { label: '80 Open', value: 80 }
              ]}
            />

            {/* Rank / Layer Separation (ranksep) Slider */}
            <SliderNumberControl
              id="rank-sep"
              label="Vertical Layer Separation"
              paramName="ranksep"
              value={settings.ranksep || 50}
              min={10}
              max={180}
              step={5}
              unit="px"
              onChange={(val) => onUpdateSettings({ ranksep: val })}
              presets={[
                { label: '30 Tight', value: 30 },
                { label: '50 Normal', value: 50 },
                { label: '70 Relaxed', value: 70 },
                { label: '100 Open', value: 100 }
              ]}
            />

            {/* Inner Padding Slider */}
            <SliderNumberControl
              id="padding-var"
              label="Inner Element Padding"
              paramName="padding"
              value={settings.padding || 8}
              min={0}
              max={40}
              step={1}
              unit="px"
              onChange={(val) => onUpdateSettings({ padding: val })}
              presets={[
                { label: '4 Snug', value: 4 },
                { label: '8 Std', value: 8 },
                { label: '12 Generous', value: 12 },
                { label: '16 Roomy', value: 16 }
              ]}
            />

            {/* Outer Margin Slider */}
            <SliderNumberControl
              id="margin-var"
              label="Outer Element Margin"
              paramName="margin"
              value={settings.margin || 8}
              min={0}
              max={40}
              step={1}
              unit="px"
              onChange={(val) => onUpdateSettings({ margin: val })}
              presets={[
                { label: '4 Min', value: 4 },
                { label: '8 Std', value: 8 },
                { label: '12 Air', value: 12 },
                { label: '16 Lux', value: 16 }
              ]}
            />

            {/* Minimum Box Width Slider */}
            <SliderNumberControl
              id="min-class-width"
              label="Minimum Box Width"
              paramName="minClassWidth"
              value={settings.minClassWidth || 0}
              min={0}
              max={350}
              step={10}
              unit="px"
              zeroLabel="Auto"
              onChange={(val) => onUpdateSettings({ minClassWidth: val || undefined })}
              presets={[
                { label: 'Auto', value: 0 },
                { label: '100px', value: 100 },
                { label: '140px', value: 140 },
                { label: '180px', value: 180 }
              ]}
            />

            {/* Label Auto-Wrap Width Slider */}
            <SliderNumberControl
              id="wrap-width"
              label="Label Text Auto-Wrapping"
              paramName="wrapWidth"
              value={settings.wrapWidth || 0}
              min={0}
              max={400}
              step={10}
              unit="px"
              zeroLabel="Off"
              onChange={(val) => onUpdateSettings({ wrapWidth: val || undefined })}
              presets={[
                { label: 'Off', value: 0 },
                { label: '100px', value: 100 },
                { label: '140px', value: 140 },
                { label: '180px', value: 180 }
              ]}
            />
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB: LAYOUT, STANDARDS & ROUTING (CLEAN OF OVERLAPPING PRESETS) */}
        {/* ============================================================ */}
        {activeTab === 'layout' && (
          <div className="space-y-4">
            {/* Flow Orientation (TB vs LR) */}
            {!isSequenceDiagram && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#78706a] mb-2 block flex items-center justify-between">
                  <span>Flow Orientation</span>
                  <span className="font-mono text-[9px] text-[#c2652a]">direction</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => onUpdateSettings({ direction: 'TB' })}
                    className={`flex flex-col items-center py-2 px-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      currentDirection === 'TB'
                        ? 'bg-[#c2652a] text-white border-[#c2652a] shadow-xs'
                        : 'bg-white text-[#3a302a] border-[#d8d0c8]/70 hover:border-[#c2652a]'
                    }`}
                  >
                    <span>Vertical (TB)</span>
                    <span className={`text-[9px] font-mono ${currentDirection === 'TB' ? 'text-white/80' : 'text-[#78706a]'}`}>
                      top to bottom direction
                    </span>
                  </button>

                  <button
                    onClick={() => onUpdateSettings({ direction: 'LR' })}
                    className={`flex flex-col items-center py-2 px-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      currentDirection === 'LR'
                        ? 'bg-[#c2652a] text-white border-[#c2652a] shadow-xs'
                        : 'bg-white text-[#3a302a] border-[#d8d0c8]/70 hover:border-[#c2652a]'
                    }`}
                  >
                    <span>Horizontal (LR)</span>
                    <span className={`text-[9px] font-mono ${currentDirection === 'LR' ? 'text-white/80' : 'text-[#78706a]'}`}>
                      left to right direction
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Line / Connector Routing */}
            <div className="border-t border-[#d8d0c8]/50 pt-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#78706a] mb-2 block flex items-center justify-between">
                <span>Connector Routing</span>
                <span className="font-mono text-[9px] text-[#c2652a]">skinparam linetype</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'ortho', label: 'Orthogonal', desc: 'Right angles (ortho)' },
                  { id: 'polyline', label: 'Polyline', desc: 'Segmented (polyline)' },
                  { id: 'straight', label: 'Direct', desc: 'Straight line' }
                ].map(lt => (
                  <button
                    key={lt.id}
                    onClick={() => onUpdateSettings({ linetype: lt.id as any })}
                    className={`flex flex-col items-center py-1.5 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                      currentLinetype === lt.id
                        ? 'bg-[#c2652a] text-white border-[#c2652a] shadow-xs'
                        : 'bg-white text-[#3a302a] border-[#d8d0c8]/70 hover:border-[#c2652a]'
                    }`}
                  >
                    <span className="text-[11px] font-semibold">{lt.label}</span>
                    <span className={`text-[8px] truncate ${currentLinetype === lt.id ? 'text-white/80' : 'text-[#78706a]'}`}>
                      {lt.id}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Strict UML 2.5 Compliance */}
            <div className="border-t border-[#d8d0c8]/50 pt-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#78706a] mb-2 block flex items-center justify-between">
                <span>Strict Standards Compliance</span>
                <span className="font-mono text-[9px] text-[#c2652a]">strictuml</span>
              </label>
              <button
                onClick={() => onUpdateSettings({ strictuml: !isStrictUml })}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg border transition-all cursor-pointer ${
                  isStrictUml 
                    ? 'bg-[#2b2622] text-amber-300 border-[#c2652a] shadow-xs' 
                    : 'bg-white text-[#3a302a] border-[#d8d0c8]/70 hover:border-[#c2652a]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`w-4 h-4 ${isStrictUml ? 'text-amber-400' : 'text-[#78706a]'}`} />
                  <div className="text-left">
                    <div className="font-semibold text-xs">Strict OMG UML 2.5 Compliance</div>
                    <div className="text-[9px] text-[#78706a] font-mono">skinparam style strictuml</div>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  isStrictUml ? 'bg-[#c2652a] border-[#c2652a] text-white' : 'border-[#d8d0c8]'
                }`}>
                  {isStrictUml && <Check className="w-3 h-3" />}
                </div>
              </button>
            </div>

            {/* Dark Invert / Monochrome Reverse */}
            <div className="border-t border-[#d8d0c8]/50 pt-3 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#78706a] mb-1 block">
                Tonal Inversion & Monochrome
              </label>

              <button
                onClick={() => onUpdateSettings({ monochromeReverse: !isMonochromeReverse })}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg border transition-all cursor-pointer ${
                  isMonochromeReverse 
                    ? 'bg-[#181412] text-[#faf5ee] border-[#c2652a] shadow-xs' 
                    : 'bg-white text-[#3a302a] border-[#d8d0c8]/70 hover:border-[#c2652a]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full ${isMonochromeReverse ? 'bg-[#c2652a]' : 'bg-[#78706a]'}`} />
                  <div className="text-left">
                    <div className="font-semibold text-xs">Dark Canvas Invert</div>
                    <div className="text-[9px] text-[#78706a] font-mono">skinparam monochrome reverse</div>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  isMonochromeReverse ? 'bg-[#c2652a] border-[#c2652a] text-white' : 'border-[#d8d0c8]'
                }`}>
                  {isMonochromeReverse && <Check className="w-3 h-3" />}
                </div>
              </button>

              <button
                onClick={() => onUpdateSettings({ monochrome: !isMonochrome })}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg border transition-all cursor-pointer ${
                  isMonochrome 
                    ? 'bg-[#2b2622] text-white border-[#c2652a] shadow-xs' 
                    : 'bg-white text-[#3a302a] border-[#d8d0c8]/70 hover:border-[#c2652a]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full ${isMonochrome ? 'bg-black' : 'bg-gray-400'}`} />
                  <div className="text-left">
                    <div className="font-semibold text-xs">Monochrome Black & White</div>
                    <div className="text-[9px] text-[#78706a] font-mono">skinparam monochrome true</div>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  isMonochrome ? 'bg-[#c2652a] border-[#c2652a] text-white' : 'border-[#d8d0c8]'
                }`}>
                  {isMonochrome && <Check className="w-3 h-3" />}
                </div>
              </button>
            </div>

            {/* Organic Sketch & Drop Shadows */}
            <div className="border-t border-[#d8d0c8]/50 pt-3 space-y-2">
              <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-[#d8d0c8]/70">
                <div className="flex items-center gap-2">
                  <PenTool className="w-3.5 h-3.5 text-[#c2652a]" />
                  <span className="text-xs font-medium text-[#3a302a]">Organic / Handwritten (Sketch)</span>
                </div>
                <button
                  onClick={() => onUpdateSettings({ handwritten: !isHandwritten })}
                  className={`w-8 h-4 rounded-full transition-colors cursor-pointer relative p-0.5 ${
                    isHandwritten ? 'bg-[#c2652a]' : 'bg-[#d8d0c8]'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full bg-white transition-transform ${
                    isHandwritten ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-[#d8d0c8]/70">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-[#78706a]" />
                  <span className="text-xs font-medium text-[#3a302a]">3D Drop Shadows</span>
                </div>
                <button
                  onClick={() => onUpdateSettings({ shadowing: !isShadowing })}
                  className={`w-8 h-4 rounded-full transition-colors cursor-pointer relative p-0.5 ${
                    isShadowing ? 'bg-[#c2652a]' : 'bg-[#d8d0c8]'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full bg-white transition-transform ${
                    isShadowing ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB: SEQUENCE SPECIFIC DIRECTIVES & SLIDERS                  */}
        {/* ============================================================ */}
        {activeTab === 'sequence' && (
          <div className="space-y-4">
            {/* Remove Sequence Footers */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#78706a] mb-2 block flex items-center justify-between">
                <span>Sequence Participant Footers</span>
                <span className="font-mono text-[9px] text-[#c2652a]">hide footbox</span>
              </label>
              <button
                onClick={() => onUpdateSettings({ hideFootbox: !isHideFootbox })}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg border transition-all cursor-pointer ${
                  isHideFootbox 
                    ? 'bg-[#2b2622] text-amber-300 border-[#c2652a] shadow-xs' 
                    : 'bg-white text-[#3a302a] border-[#d8d0c8]/70 hover:border-[#c2652a]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Minimize2 className={`w-4 h-4 ${isHideFootbox ? 'text-amber-400' : 'text-[#78706a]'}`} />
                  <div className="text-left">
                    <div className="font-semibold text-xs">Remove Bottom Participant Boxes</div>
                    <div className="text-[9px] text-[#78706a] font-mono">hide footbox</div>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  isHideFootbox ? 'bg-[#c2652a] border-[#c2652a] text-white' : 'border-[#d8d0c8]'
                }`}>
                  {isHideFootbox && <Check className="w-3 h-3" />}
                </div>
              </button>
            </div>

            {/* Response Message Below Arrow */}
            <div className="border-t border-[#d8d0c8]/50 pt-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#78706a] mb-2 block flex items-center justify-between">
                <span>Message Text Placement</span>
                <span className="font-mono text-[9px] text-[#c2652a]">responseMessageBelowArrow</span>
              </label>
              <button
                onClick={() => onUpdateSettings({ responseMessageBelowArrow: !isResponseBelow })}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg border transition-all cursor-pointer ${
                  isResponseBelow 
                    ? 'bg-[#2b2622] text-amber-300 border-[#c2652a] shadow-xs' 
                    : 'bg-white text-[#3a302a] border-[#d8d0c8]/70 hover:border-[#c2652a]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Split className={`w-4 h-4 ${isResponseBelow ? 'text-amber-400' : 'text-[#78706a]'}`} />
                  <div className="text-left">
                    <div className="font-semibold text-xs">Place Response Text Under Arrow</div>
                    <div className="text-[9px] text-[#78706a] font-mono">skinparam responseMessageBelowArrow true</div>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  isResponseBelow ? 'bg-[#c2652a] border-[#c2652a] text-white' : 'border-[#d8d0c8]'
                }`}>
                  {isResponseBelow && <Check className="w-3 h-3" />}
                </div>
              </button>
            </div>

            {/* Autonumber Step Formats */}
            <div className="border-t border-[#d8d0c8]/50 pt-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#78706a] mb-2 block flex items-center justify-between">
                <span>Step Counters & Autonumber</span>
                <span className="font-mono text-[9px] text-[#c2652a]">autonumber</span>
              </label>
              <div className="space-y-1">
                {[
                  { id: 'disabled', label: 'Disabled (No numbers)', example: 'none' },
                  { id: 'standard', label: 'Standard (1, 2, 3...)', example: 'autonumber' },
                  { id: 'bold-bracket', label: 'Bold Brackets [01], [02]', example: 'autonumber "<b>[00]</b>"' },
                  { id: 'parentheses', label: 'Parentheses (1), (2)', example: 'autonumber "<b>(##)</b>"' },
                  { id: 'increment5', label: 'Step by 5 (10, 15, 20)', example: 'autonumber 10 5 "(##)"' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => onUpdateSettings({ autonumberFormat: item.id as any })}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                      currentAutonumber === item.id
                        ? 'bg-white border-[#c2652a] ring-1 ring-[#c2652a] shadow-2xs font-semibold text-[#c2652a]'
                        : 'bg-white/70 border-[#d8d0c8]/60 hover:bg-white text-[#3a302a]'
                    }`}
                  >
                    <div>
                      <div className="text-xs">{item.label}</div>
                      <div className="text-[9px] font-mono text-[#78706a]">{item.example}</div>
                    </div>
                    {currentAutonumber === item.id && <Check className="w-3.5 h-3.5 text-[#c2652a]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders for Sequence Variables */}
            <div className="border-t border-[#d8d0c8]/50 pt-3 space-y-2.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#78706a] block flex items-center justify-between">
                <span>Sequence Dimension Variables</span>
                <Sliders className="w-3 h-3 text-[#c2652a]" />
              </label>

              {/* Participant Padding Slider */}
              <SliderNumberControl
                id="participant-padding"
                label="Lifeline Horizontal Spacing"
                paramName="ParticipantPadding"
                value={settings.participantPadding || 35}
                min={0}
                max={140}
                step={5}
                unit="px"
                onChange={(val) => onUpdateSettings({ participantPadding: val })}
                presets={[
                  { label: '20 Dense', value: 20 },
                  { label: '35 Normal', value: 35 },
                  { label: '50 Wide', value: 50 },
                  { label: '70 Open', value: 70 }
                ]}
              />

              {/* Box Padding Slider */}
              <SliderNumberControl
                id="box-padding"
                label="Participant Box Frame Padding"
                paramName="BoxPadding"
                value={settings.boxPadding || 10}
                min={0}
                max={60}
                step={2}
                unit="px"
                onChange={(val) => onUpdateSettings({ boxPadding: val })}
                presets={[
                  { label: '5 Tight', value: 5 },
                  { label: '10 Std', value: 10 },
                  { label: '20 Airy', value: 20 }
                ]}
              />

              {/* Arrow Text Max Width Slider */}
              <SliderNumberControl
                id="max-message-size"
                label="Arrow Message Auto-Wrap"
                paramName="maxMessageSize"
                value={settings.maxMessageSize || 0}
                min={0}
                max={350}
                step={10}
                unit="px"
                zeroLabel="Off"
                onChange={(val) => onUpdateSettings({ maxMessageSize: val || undefined })}
                presets={[
                  { label: 'Off', value: 0 },
                  { label: '80px', value: 80 },
                  { label: '120px', value: 120 },
                  { label: '160px', value: 160 }
                ]}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
