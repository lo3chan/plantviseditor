import React from 'react';
import { 
  Plus, 
  Copy, 
  Trash2, 
  Palette, 
  ArrowRight, 
  ArrowDown, 
  MoreHorizontal 
} from 'lucide-react';
import { COLOR_THEMES } from '../utils/assetsData';

interface QuickActionBarProps {
  x: number;
  y: number;
  currentColor?: string;
  onSelectColor: (colorKey: string) => void;
  onDuplicate: () => void;
  onAddConnectedNode: (direction: 'right' | 'down') => void;
  onDelete: () => void;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({
  x,
  y,
  currentColor,
  onSelectColor,
  onDuplicate,
  onAddConnectedNode,
  onDelete
}) => {
  const [showColorPicker, setShowColorPicker] = React.useState(false);

  return (
    <div 
      className="absolute z-40 -translate-x-1/2 -translate-y-full mb-2 pointer-events-auto"
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md border border-[#c2652a]/40 shadow-md rounded-xl p-1 text-xs">
        {/* Color Picker Toggle */}
        <div className="relative">
          <button
            id="quick-action-color"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-1.5 rounded-lg hover:bg-[#faf5ee] text-[#3a302a] flex items-center gap-1 transition-colors"
            title="Change Color Theme"
          >
            <Palette className="w-3.5 h-3.5 text-[#c2652a]" />
          </button>

          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1.5 bg-white border border-[#d8d0c8] rounded-xl shadow-lg p-2 flex gap-1 z-50 animate-in fade-in zoom-in-95">
              {COLOR_THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => {
                    onSelectColor(theme.id);
                    setShowColorPicker(false);
                  }}
                  className={`w-5 h-5 rounded-full border transition-transform hover:scale-115 ${
                    currentColor === theme.id ? 'ring-2 ring-[#c2652a] scale-110' : 'border-black/10'
                  }`}
                  style={{ backgroundColor: theme.hex }}
                  title={theme.name}
                />
              ))}
            </div>
          )}
        </div>

        <div className="w-[1px] h-4 bg-[#d8d0c8]/60" />

        {/* Quick Branch / Connect to the right */}
        <button
          id="quick-action-branch-right"
          onClick={() => onAddConnectedNode('right')}
          className="p-1.5 rounded-lg hover:bg-[#faf5ee] text-[#3a302a] hover:text-[#c2652a] flex items-center gap-1 transition-colors font-medium"
          title="Add connected node to the right (+)"
        >
          <ArrowRight className="w-3.5 h-3.5 text-[#c2652a]" />
          <span className="text-[11px] font-semibold">Link</span>
        </button>

        {/* Quick Branch downwards */}
        <button
          id="quick-action-branch-down"
          onClick={() => onAddConnectedNode('down')}
          className="p-1.5 rounded-lg hover:bg-[#faf5ee] text-[#3a302a] hover:text-[#c2652a] transition-colors"
          title="Add connected node below"
        >
          <ArrowDown className="w-3.5 h-3.5 text-[#78706a]" />
        </button>

        <div className="w-[1px] h-4 bg-[#d8d0c8]/60" />

        {/* Duplicate */}
        <button
          id="quick-action-duplicate"
          onClick={onDuplicate}
          className="p-1.5 rounded-lg hover:bg-[#faf5ee] text-[#3a302a] hover:text-[#c2652a] transition-colors"
          title="Duplicate Element (Ctrl+D)"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        {/* Delete */}
        <button
          id="quick-action-delete"
          onClick={onDelete}
          className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
          title="Delete Element (Del)"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
