import React, { useState } from 'react';
import { Terminal, Eye, Code, Copy, Check, Sigma, ChevronRight, ChevronDown, CheckCircle2, Edit3, Sliders, Sparkles } from 'lucide-react';

// ==========================================
// 1. VERTICAL 3D CYLINDER (PlantUML Database)
// ==========================================
export const CylinderDatabaseShape: React.FC<{
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  isSelected?: boolean;
}> = ({
  width,
  height,
  fill = '#FEFECE',
  stroke = '#A80036',
  strokeWidth = 1.5,
  isSelected = false
}) => {
  const rx = width / 2;
  const ry = Math.min(16, height * 0.18);
  const bodyHeight = height - ry;

  return (
    <svg
      width={width}
      height={height}
      className="absolute top-0 left-0 pointer-events-none overflow-visible"
      style={{ filter: isSelected ? 'drop-shadow(0 0 6px rgba(194, 101, 42, 0.4))' : 'drop-shadow(2px 2px 2px rgba(0,0,0,0.15))' }}
    >
      <defs>
        <linearGradient id={`cyl-grad-${width}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={fill} stopOpacity="1" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Main Cylinder Body */}
      <path
        d={`M 0,${ry} 
           A ${rx} ${ry} 0 0 0 ${width} ${ry} 
           L ${width} ${bodyHeight} 
           A ${rx} ${ry} 0 0 1 0 ${bodyHeight} 
           Z`}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {/* Subtle 3D gradient overlay */}
      <path
        d={`M 0,${ry} 
           A ${rx} ${ry} 0 0 0 ${width} ${ry} 
           L ${width} ${bodyHeight} 
           A ${rx} ${ry} 0 0 1 0 ${bodyHeight} 
           Z`}
        fill={`url(#cyl-grad-${width})`}
      />

      {/* Top Ellipse (Full) */}
      <ellipse
        cx={rx}
        cy={ry}
        rx={rx - strokeWidth / 2}
        ry={ry - strokeWidth / 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};

// ============================================
// 2. HORIZONTAL 3D CYLINDER (PlantUML Queue)
// ============================================
export const QueueShape: React.FC<{
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  isSelected?: boolean;
}> = ({
  width,
  height,
  fill = '#FEFECE',
  stroke = '#A80036',
  strokeWidth = 1.5,
  isSelected = false
}) => {
  const rx = Math.min(18, width * 0.12);
  const ry = height / 2;

  return (
    <svg
      width={width}
      height={height}
      className="absolute top-0 left-0 pointer-events-none overflow-visible"
      style={{ filter: isSelected ? 'drop-shadow(0 0 6px rgba(194, 101, 42, 0.4))' : 'drop-shadow(2px 2px 2px rgba(0,0,0,0.15))' }}
    >
      {/* Body */}
      <path
        d={`M ${rx},0 
           L ${width - rx},0 
           A ${rx} ${ry} 0 0 1 ${width - rx},${height} 
           L ${rx},${height} 
           A ${rx} ${ry} 0 0 0 ${rx},0 
           Z`}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {/* Right End Ellipse */}
      <ellipse
        cx={width - rx}
        cy={ry}
        rx={rx}
        ry={ry}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};

// ============================================
// 3. ISOMETRIC 3D BOX (PlantUML Node)
// ============================================
export const Node3dShape: React.FC<{
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  isSelected?: boolean;
}> = ({
  width,
  height,
  fill = '#FEFECE',
  stroke = '#A80036',
  strokeWidth = 1.5,
  isSelected = false
}) => {
  const depth = 12;
  const w = width - depth;
  const h = height - depth;

  return (
    <svg
      width={width}
      height={height}
      className="absolute top-0 left-0 pointer-events-none overflow-visible"
      style={{ filter: isSelected ? 'drop-shadow(0 0 6px rgba(194, 101, 42, 0.4))' : 'drop-shadow(2px 2px 2px rgba(0,0,0,0.15))' }}
    >
      {/* Front Face */}
      <rect
        x={0}
        y={depth}
        width={w}
        height={h}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />

      {/* Top Isometric Face */}
      <polygon
        points={`0,${depth} ${depth},0 ${width},0 ${w},${depth}`}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />

      {/* Right Isometric Face (slightly shaded) */}
      <polygon
        points={`${w},${depth} ${width},0 ${width},${h} ${w},${height}`}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <polygon
        points={`${w},${depth} ${width},0 ${width},${h} ${w},${height}`}
        fill="rgba(0,0,0,0.08)"
      />
    </svg>
  );
};

// ============================================
// 4. TABBED FOLDER (PlantUML Folder)
// ============================================
export const FolderShape: React.FC<{
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  isSelected?: boolean;
}> = ({
  width,
  height,
  fill = '#FEFECE',
  stroke = '#A80036',
  strokeWidth = 1.5,
  isSelected = false
}) => {
  const tabW = Math.min(65, width * 0.4);
  const tabH = 14;

  return (
    <svg
      width={width}
      height={height}
      className="absolute top-0 left-0 pointer-events-none overflow-visible"
      style={{ filter: isSelected ? 'drop-shadow(0 0 6px rgba(194, 101, 42, 0.4))' : 'drop-shadow(2px 2px 2px rgba(0,0,0,0.15))' }}
    >
      {/* Top Tab */}
      <polygon
        points={`0,0 ${tabW},0 ${tabW + 6},${tabH} 0,${tabH}`}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {/* Main Folder Box */}
      <rect
        x={0}
        y={tabH}
        width={width}
        height={height - tabH}
        fill={fill}
        fillOpacity={0.15}
        stroke={stroke}
        strokeWidth={strokeWidth}
        rx={2}
      />
    </svg>
  );
};

// ============================================
// 5. WINDOW FRAME (PlantUML Frame)
// ============================================
export const FrameShape: React.FC<{
  width: number;
  height: number;
  label?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  isSelected?: boolean;
  tabWidth?: number;
  tabHeight?: number;
}> = ({
  width,
  height,
  fill = '#FEFECE',
  stroke = '#A80036',
  strokeWidth = 1.5,
  isSelected = false,
  tabWidth,
  tabHeight = 24
}) => {
  const tabW = tabWidth ?? Math.min(220, Math.max(110, width * 0.42));
  const tabH = tabHeight;

  return (
    <svg
      width={width}
      height={height}
      className="absolute top-0 left-0 pointer-events-none overflow-visible"
      style={{ filter: isSelected ? 'drop-shadow(0 0 6px rgba(194, 101, 42, 0.4))' : 'drop-shadow(2px 2px 2px rgba(0,0,0,0.15))' }}
    >
      {/* Outer Frame Rectangle with authentic translucent background */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={fill}
        fillOpacity={0.15}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {/* Top-left cut-out title tab background */}
      <polygon
        points={`0,0 ${tabW},0 ${tabW + 10},${tabH} 0,${tabH}`}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {/* Cut-out tab separation line */}
      <polyline
        points={`0,${tabH} ${tabW},${tabH} ${tabW + 10},0`}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};

// ============================================
// 6. COMPONENT WITH TWO PROTRUDING TABS (Classic PlantUML)
// ============================================
export const ComponentTabsShape: React.FC<{
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  isSelected?: boolean;
}> = ({
  width,
  height,
  fill = '#FEFECE',
  stroke = '#A80036',
  strokeWidth = 1.5,
  isSelected = false
}) => {
  const tabW = 10;
  const tabH = 8;
  const tabOffset1 = height * 0.25;
  const tabOffset2 = height * 0.6;

  return (
    <svg
      width={width}
      height={height}
      className="absolute top-0 left-0 pointer-events-none overflow-visible"
      style={{ filter: isSelected ? 'drop-shadow(0 0 6px rgba(194, 101, 42, 0.4))' : 'drop-shadow(2px 2px 2px rgba(0,0,0,0.15))' }}
    >
      {/* Main Box */}
      <rect
        x={tabW / 2}
        y={0}
        width={width - tabW / 2}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        rx={4}
      />

      {/* Top Protruding Tab */}
      <rect
        x={0}
        y={tabOffset1}
        width={tabW}
        height={tabH}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />

      {/* Bottom Protruding Tab */}
      <rect
        x={0}
        y={tabOffset2}
        width={tabW}
        height={tabH}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};

// ============================================
// 7. FOLDED DOG-EAR STICKY NOTE (PlantUML Note)
// ============================================
export const NoteFoldShape: React.FC<{
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  isSelected?: boolean;
}> = ({
  width,
  height,
  fill = '#FEFFDD',
  stroke = '#A80036',
  strokeWidth = 1.5,
  isSelected = false
}) => {
  const fold = 14;

  return (
    <svg
      width={width}
      height={height}
      className="absolute top-0 left-0 pointer-events-none overflow-visible"
      style={{ filter: isSelected ? 'drop-shadow(0 0 6px rgba(168, 0, 54, 0.4))' : 'drop-shadow(2px 2px 2px rgba(0,0,0,0.12))' }}
    >
      {/* Note Body with cut corner */}
      <polygon
        points={`0,0 ${width - fold},0 ${width},${fold} ${width},${height} 0,${height}`}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {/* Folded Dog-Ear Corner */}
      <polygon
        points={`${width - fold},0 ${width - fold},${fold} ${width},${fold}`}
        fill="#ECECC0"
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};

// ============================================
// 8. FOLDED DOCUMENT / ARTIFACT (PlantUML File)
// ============================================
export const FileFoldShape: React.FC<{
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  isSelected?: boolean;
}> = ({
  width,
  height,
  fill = '#FEFECE',
  stroke = '#A80036',
  strokeWidth = 1.5,
  isSelected = false
}) => {
  const fold = 12;

  return (
    <svg
      width={width}
      height={height}
      className="absolute top-0 left-0 pointer-events-none overflow-visible"
      style={{ filter: isSelected ? 'drop-shadow(0 0 6px rgba(194, 101, 42, 0.4))' : 'drop-shadow(2px 2px 2px rgba(0,0,0,0.12))' }}
    >
      <polygon
        points={`0,0 ${width - fold},0 ${width},${fold} ${width},${height} 0,${height}`}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <polyline
        points={`${width - fold},0 ${width - fold},${fold} ${width},${fold}`}
        fill="rgba(0,0,0,0.06)"
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};

// ============================================
// 9. 6-SIDED REGULAR HEXAGON (PlantUML Hexagon)
// ============================================
export const HexagonShape: React.FC<{
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  isSelected?: boolean;
}> = ({
  width,
  height,
  fill = '#FEFECE',
  stroke = '#A80036',
  strokeWidth = 1.5,
  isSelected = false
}) => {
  const edge = Math.min(24, width * 0.15);
  const midY = height / 2;

  return (
    <svg
      width={width}
      height={height}
      className="absolute top-0 left-0 pointer-events-none overflow-visible"
      style={{ filter: isSelected ? 'drop-shadow(0 0 6px rgba(194, 101, 42, 0.4))' : 'drop-shadow(2px 2px 2px rgba(0,0,0,0.15))' }}
    >
      <polygon
        points={`0,${midY} ${edge},0 ${width - edge},0 ${width},${midY} ${width - edge},${height} ${edge},${height}`}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};

// ============================================
// 10. SCALLOPED CLOUD (PlantUML Cloud)
// ============================================
export const CloudShape: React.FC<{
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  isSelected?: boolean;
}> = ({
  width,
  height,
  fill = '#FEFECE',
  stroke = '#A80036',
  strokeWidth = 1.5,
  isSelected = false
}) => {
  const p = strokeWidth + 1;
  const x0 = p;
  const x1 = Math.max(x0 + 20, width - p);
  const y0 = p;
  const y1 = Math.max(y0 + 20, height - p);
  const W = x1 - x0;
  const H = y1 - y0;

  const cloudPath = `
    M ${x0 + W * 0.22} ${y1 - H * 0.06}
    C ${x0 + W * 0.08} ${y1 - H * 0.06}, ${x0} ${y1 - H * 0.24}, ${x0} ${y1 - H * 0.46}
    C ${x0} ${y0 + H * 0.32}, ${x0 + W * 0.08} ${y0 + H * 0.12}, ${x0 + W * 0.25} ${y0 + H * 0.14}
    C ${x0 + W * 0.32} ${y0}, ${x0 + W * 0.48} ${y0}, ${x0 + W * 0.55} ${y0 + H * 0.10}
    C ${x0 + W * 0.65} ${y0}, ${x0 + W * 0.82} ${y0 + H * 0.04}, ${x0 + W * 0.88} ${y0 + H * 0.22}
    C ${x1} ${y0 + H * 0.36}, ${x1} ${y1 - H * 0.36}, ${x0 + W * 0.88} ${y1 - H * 0.18}
    C ${x0 + W * 0.88} ${y1}, ${x0 + W * 0.72} ${y1}, ${x0 + W * 0.58} ${y1 - H * 0.04}
    C ${x0 + W * 0.46} ${y1}, ${x0 + W * 0.34} ${y1}, ${x0 + W * 0.22} ${y1 - H * 0.06}
    Z
  `;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="absolute top-0 left-0 pointer-events-none overflow-visible"
      style={{ filter: isSelected ? 'drop-shadow(0 0 6px rgba(194, 101, 42, 0.4))' : 'drop-shadow(2px 2px 2px rgba(0,0,0,0.15))' }}
    >
      <path
        d={cloudPath}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};

// ============================================
// 11. AUTHENTIC PLANTUML STICKMAN (Actor)
// ============================================
export const StickmanActorShape: React.FC<{
  color?: string;
  size?: number;
}> = ({ color = '#A80036', size = 44 }) => {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 40 52" className="overflow-visible">
      {/* Head */}
      <circle cx="20" cy="9" r="7" fill="#FEFECE" stroke={color} strokeWidth="1.8" />
      {/* Body Spine */}
      <line x1="20" y1="16" x2="20" y2="34" stroke={color} strokeWidth="1.8" />
      {/* Arms */}
      <line x1="6" y1="22" x2="34" y2="22" stroke={color} strokeWidth="1.8" />
      {/* Left Leg */}
      <line x1="20" y1="34" x2="8" y2="48" stroke={color} strokeWidth="1.8" />
      {/* Right Leg */}
      <line x1="20" y1="34" x2="32" y2="48" stroke={color} strokeWidth="1.8" />
    </svg>
  );
};

// ============================================
// 12. ARCHIMATE WATERMARK ICONS (stdlib/archimate)
// Full differentiation matching ArchiMate 3.x / PlantUML spec
// ============================================
export const ArchiMateWatermark: React.FC<{
  type?: string;
  layer?: string;
}> = ({ type = 'component', layer = 'business' }) => {
  const normType = (type || '').toLowerCase();
  
  // Actor (Stick figure)
  if (normType.includes('actor')) {
    return (
      <div className="absolute top-1.5 right-1.5 opacity-80 pointer-events-none" title="ArchiMate Actor">
        <svg width="14" height="18" viewBox="0 0 14 18" className="text-gray-800">
          <circle cx="7" cy="3.5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <line x1="7" y1="6" x2="7" y2="12" stroke="currentColor" strokeWidth="1.3" />
          <line x1="1" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.3" />
          <line x1="7" y1="12" x2="2" y2="17" stroke="currentColor" strokeWidth="1.3" />
          <line x1="7" y1="12" x2="12" y2="17" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      </div>
    );
  }

  // Role / Stakeholder (Person bust with ribbon)
  if (normType.includes('role') || normType.includes('stakeholder')) {
    return (
      <div className="absolute top-1.5 right-1.5 opacity-80 pointer-events-none" title="ArchiMate Role">
        <svg width="16" height="14" viewBox="0 0 16 14" className="text-gray-800">
          <circle cx="8" cy="4" r="3" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path d="M 2 13 C 2 9, 14 9, 14 13" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      </div>
    );
  }

  // Process (Chevron arrow)
  if (normType.includes('process')) {
    return (
      <div className="absolute top-1.5 right-1.5 opacity-80 pointer-events-none" title="ArchiMate Process">
        <svg width="18" height="14" viewBox="0 0 20 14" className="text-gray-800">
          <polygon points="1,2 14,2 19,7 14,12 1,12 5,7" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </div>
    );
  }

  // Function (Chevron with curved indent)
  if (normType.includes('function')) {
    return (
      <div className="absolute top-1.5 right-1.5 opacity-80 pointer-events-none" title="ArchiMate Function">
        <svg width="18" height="14" viewBox="0 0 20 14" className="text-gray-800">
          <path d="M 2 2 L 13 2 L 18 7 L 13 12 L 2 12 C 5 7, 5 7, 2 2 Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </div>
    );
  }

  // Service (Rounded pill with center dot)
  if (normType.includes('service') || (layer === 'business' && !normType)) {
    return (
      <div className="absolute top-1.5 right-1.5 opacity-80 pointer-events-none" title="ArchiMate Service">
        <svg width="18" height="12" viewBox="0 0 20 12" className="text-gray-800">
          <rect x="1" y="1" width="18" height="10" rx="5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="10" cy="6" r="2" fill="currentColor" />
        </svg>
      </div>
    );
  }

  // Interface (Lollipop: circle on stem)
  if (normType.includes('interface')) {
    return (
      <div className="absolute top-1.5 right-1.5 opacity-80 pointer-events-none" title="ArchiMate Interface">
        <svg width="16" height="14" viewBox="0 0 16 14" className="text-gray-800">
          <line x1="2" y1="7" x2="9" y2="7" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="12" cy="7" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </div>
    );
  }

  // Event (Signal pulse)
  if (normType.includes('event')) {
    return (
      <div className="absolute top-1.5 right-1.5 opacity-80 pointer-events-none" title="ArchiMate Event">
        <svg width="16" height="14" viewBox="0 0 16 14" className="text-gray-800">
          <path d="M 1 7 L 5 7 L 8 2 L 11 12 L 13 7 L 15 7" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </div>
    );
  }

  // Component (Two-tab component box)
  if (normType.includes('component') || layer === 'application') {
    return (
      <div className="absolute top-1.5 right-1.5 opacity-80 pointer-events-none" title="ArchiMate Component">
        <svg width="18" height="14" viewBox="0 0 20 16" className="text-gray-800">
          <rect x="4" y="0" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <rect x="0" y="3" width="6" height="3" fill="#ffffff" stroke="currentColor" strokeWidth="1" />
          <rect x="0" y="9" width="6" height="3" fill="#ffffff" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
    );
  }

  // Node / Device (Isometric 3D cube)
  if (normType.includes('node') || normType.includes('device') || layer === 'technology') {
    return (
      <div className="absolute top-1.5 right-1.5 opacity-80 pointer-events-none" title="ArchiMate Technology Node">
        <svg width="16" height="16" viewBox="0 0 16 16" className="text-gray-800">
          <polygon points="2,5 8,1 14,5 8,9" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <polygon points="2,5 8,9 8,15 2,11" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <polygon points="14,5 8,9 8,15 14,11" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </div>
    );
  }

  // Object / Artifact / Contract (Dog-eared document sheet)
  if (normType.includes('object') || normType.includes('artifact') || normType.includes('contract')) {
    return (
      <div className="absolute top-1.5 right-1.5 opacity-80 pointer-events-none" title="ArchiMate Data Object">
        <svg width="14" height="16" viewBox="0 0 14 16" className="text-gray-800">
          <polygon points="1,1 9,1 13,5 13,15 1,15" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <polyline points="9,1 9,5 13,5" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      </div>
    );
  }

  // Goal / Outcome (Concentric target rings)
  if (normType.includes('goal') || normType.includes('outcome')) {
    return (
      <div className="absolute top-1.5 right-1.5 opacity-80 pointer-events-none" title="ArchiMate Goal">
        <svg width="16" height="16" viewBox="0 0 16 16" className="text-gray-800">
          <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="8" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" />
        </svg>
      </div>
    );
  }

  // Driver / Assessment (Compass rose / dial gauge)
  if (normType.includes('driver') || normType.includes('assessment')) {
    return (
      <div className="absolute top-1.5 right-1.5 opacity-80 pointer-events-none" title="ArchiMate Driver">
        <svg width="16" height="16" viewBox="0 0 16 16" className="text-gray-800">
          <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.2" />
          <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </div>
    );
  }

  // Requirement / Constraint (Notched rectangle)
  if (normType.includes('requirement') || normType.includes('constraint')) {
    return (
      <div className="absolute top-1.5 right-1.5 opacity-80 pointer-events-none" title="ArchiMate Requirement">
        <svg width="16" height="14" viewBox="0 0 16 14" className="text-gray-800">
          <polygon points="1,1 15,1 15,13 1,13 1,1" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <polyline points="4,7 7,10 12,4" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </div>
    );
  }

  // Default fallback watermark
  return (
    <div className="absolute top-1.5 right-1.5 opacity-80 pointer-events-none">
      <svg width="16" height="16" viewBox="0 0 16 16" className="text-gray-800">
        <rect x="1" y="1" width="14" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    </div>
  );
};

// ============================================
// 13. AWS SERVICE GLYPHS & ICONS (stdlib/aws)
// Real vector graphics for major AWS services
// ============================================
export const AwsGlyph: React.FC<{
  service?: string;
  category?: string;
  size?: number;
}> = ({ service = 'EC2', category = 'compute', size = 26 }) => {
  const normSvc = (service || '').toUpperCase();

  const getCategoryColor = () => {
    switch (category) {
      case 'compute': return '#F58536';
      case 'database': return '#2E73B8';
      case 'storage': return '#7AA116';
      case 'analytics': return '#8C4FFF';
      case 'security': return '#DD344C';
      case 'networking': return '#527FFF';
      case 'integration': return '#E7157B';
      default: return '#F58536';
    }
  };

  const bg = getCategoryColor();

  const renderServiceVector = () => {
    // Lambda λ
    if (normSvc.includes('LAMBDA')) {
      return (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20L11 6L14 12L20 20" />
          <line x1="8.5" y1="12" x2="16" y2="12" />
        </svg>
      );
    }
    // DynamoDB / Database Cylinder
    if (normSvc.includes('DYNAMO') || normSvc.includes('RDS') || category === 'database') {
      return (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      );
    }
    // S3 / Storage Bucket
    if (normSvc.includes('S3') || category === 'storage') {
      return (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 7l2 13a2 2 0 002 2h8a2 2 0 002-2l2-13" />
          <ellipse cx="12" cy="7" rx="9" ry="3" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
    }
    // Security / IAM / KMS / Cognito Shield
    if (normSvc.includes('IAM') || normSvc.includes('KMS') || normSvc.includes('COGNITO') || category === 'security') {
      return (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <circle cx="12" cy="11" r="2" />
          <line x1="12" y1="13" x2="12" y2="17" />
        </svg>
      );
    }
    // Networking / VPC / Route 53 / API Gateway
    if (normSvc.includes('VPC') || normSvc.includes('ROUTE') || normSvc.includes('GATEWAY') || category === 'networking') {
      return (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="2" y="2" width="6" height="6" rx="1" />
          <rect x="16" y="2" width="6" height="6" rx="1" />
          <rect x="9" y="16" width="6" height="6" rx="1" />
          <line x1="5" y1="8" x2="5" y2="12" />
          <line x1="19" y1="8" x2="19" y2="12" />
          <line x1="5" y1="12" x2="19" y2="12" />
          <line x1="12" y1="12" x2="12" y2="16" />
        </svg>
      );
    }
    // Analytics / CloudWatch
    if (normSvc.includes('CLOUDWATCH') || normSvc.includes('ATHENA') || category === 'analytics') {
      return (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    }
    // SQS / SNS / Integration
    if (normSvc.includes('SQS') || normSvc.includes('SNS') || category === 'integration') {
      return (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M22 7l-10 7L2 7" />
        </svg>
      );
    }
    // Compute / EC2 Default: CPU microchip
    return (
      <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <line x1="9" y1="1" x2="9" y2="4" />
        <line x1="15" y1="1" x2="15" y2="4" />
        <line x1="9" y1="20" x2="9" y2="23" />
        <line x1="15" y1="20" x2="15" y2="23" />
        <line x1="1" y1="9" x2="4" y2="9" />
        <line x1="1" y1="15" x2="4" y2="15" />
        <line x1="20" y1="9" x2="23" y2="9" />
        <line x1="20" y1="15" x2="23" y2="15" />
      </svg>
    );
  };

  return (
    <div
      className="rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm transition-transform hover:scale-110"
      style={{
        backgroundColor: bg,
        width: size,
        height: size
      }}
      title={`AWS ${service} (${category})`}
    >
      {renderServiceVector()}
    </div>
  );
};

// ============================================
// 13A. AZURE SERVICE GLYPHS & ICONS (stdlib/azure)
// Official Microsoft Azure style vector icons
// ============================================
export const AzureGlyph: React.FC<{
  service?: string;
  category?: string;
  size?: number;
}> = ({ service = 'AppService', category = 'compute', size = 26 }) => {
  const normSvc = (service || '').toUpperCase();

  const getAzureColor = () => {
    if (normSvc.includes('DATABASE') || normSvc.includes('SQL') || normSvc.includes('COSMOS') || category === 'database') return '#005BA1';
    if (normSvc.includes('STORAGE') || normSvc.includes('BLOB') || category === 'storage') return '#0072C6';
    if (normSvc.includes('SECURITY') || normSvc.includes('VAULT') || category === 'security') return '#E81123';
    if (normSvc.includes('NETWORK') || normSvc.includes('GATEWAY') || normSvc.includes('LOADBALANCER')) return '#00188F';
    if (normSvc.includes('DEVOPS') || normSvc.includes('DIRECTORY') || normSvc.includes('ACTIVE')) return '#0078D7';
    if (normSvc.includes('ANALYTICS') || normSvc.includes('SYNAPSE') || normSvc.includes('EVENTHUB')) return '#5C2D91';
    return '#0078D4'; // Azure Blue default
  };

  const bg = getAzureColor();

  const renderServiceVector = () => {
    // Azure Function / App Service
    if (normSvc.includes('FUNCTION') || normSvc.includes('APPSERVICE') || normSvc.includes('APP_SERVICE')) {
      return (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
          <path d="M12 2v20" />
        </svg>
      );
    }
    // Azure SQL / Cosmos DB
    if (normSvc.includes('SQL') || normSvc.includes('COSMOS') || normSvc.includes('DATABASE')) {
      return (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      );
    }
    // Azure Storage / Blob
    if (normSvc.includes('BLOB') || normSvc.includes('STORAGE')) {
      return (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="6" rx="2" />
          <rect x="3" y="14" width="18" height="6" rx="2" />
          <circle cx="7" cy="7" r="1" fill="currentColor" />
          <circle cx="7" cy="17" r="1" fill="currentColor" />
        </svg>
      );
    }
    // Azure AKS / Kubernetes
    if (normSvc.includes('AKS') || normSvc.includes('KUBERNETES')) {
      return (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
          <line x1="12" y1="22" x2="12" y2="15.5" />
          <polyline points="22 8.5 12 15.5 2 8.5" />
        </svg>
      );
    }
    // Azure Key Vault
    if (normSvc.includes('VAULT') || normSvc.includes('KEY')) {
      return (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    }
    // Default Azure Cloud
    return (
      <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
      </svg>
    );
  };

  return (
    <div
      className="rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm transition-transform hover:scale-110"
      style={{
        backgroundColor: bg,
        width: size,
        height: size
      }}
      title={`Azure ${service}`}
    >
      {renderServiceVector()}
    </div>
  );
};

// ============================================
// 13B. GCP SERVICE GLYPHS & ICONS (stdlib/gcp)
// Official Google Cloud Platform style vector icons
// ============================================
export const GcpGlyph: React.FC<{
  service?: string;
  size?: number;
}> = ({ service = 'CloudRun', size = 26 }) => {
  const normSvc = (service || '').toUpperCase();

  const getGcpColor = () => {
    if (normSvc.includes('STORAGE')) return '#34A853'; // Google Green
    if (normSvc.includes('BIGQUERY') || normSvc.includes('PUBSUB')) return '#EA4335'; // Google Red
    if (normSvc.includes('VPC') || normSvc.includes('LOADBALANC') || normSvc.includes('NETWORK')) return '#FBBC05'; // Google Yellow
    return '#4285F4'; // Google Blue default
  };

  const bg = getGcpColor();

  const renderServiceVector = () => {
    // Cloud Run / Serverless Container
    if (normSvc.includes('RUN') || normSvc.includes('CONTAINER')) {
      return (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="M12 5l7 7-7 7" />
        </svg>
      );
    }
    // GKE / Kubernetes Engine
    if (normSvc.includes('GKE') || normSvc.includes('KUBERNETES')) {
      return (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3" />
          <line x1="12" y1="3" x2="12" y2="9" />
          <line x1="12" y1="15" x2="12" y2="21" />
          <line x1="3" y1="12" x2="9" y2="12" />
          <line x1="15" y1="12" x2="21" y2="12" />
        </svg>
      );
    }
    // Cloud SQL / Spanner / Firestore
    if (normSvc.includes('SQL') || normSvc.includes('SPANNER') || normSvc.includes('FIRESTORE') || normSvc.includes('DATABASE')) {
      return (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      );
    }
    // BigQuery
    if (normSvc.includes('BIGQUERY')) {
      return (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      );
    }
    // Pub/Sub
    if (normSvc.includes('PUBSUB') || normSvc.includes('PUB_SUB')) {
      return (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="18" cy="18" r="3" />
          <line x1="8.7" y1="10.7" x2="15.3" y2="7.3" />
          <line x1="8.7" y1="13.3" x2="15.3" y2="16.7" />
        </svg>
      );
    }
    // Default GCP Compute Engine
    return (
      <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <line x1="9" y1="9" x2="15" y2="9" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="13" y2="17" />
      </svg>
    );
  };

  return (
    <div
      className="rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm transition-transform hover:scale-110"
      style={{
        backgroundColor: bg,
        width: size,
        height: size
      }}
      title={`GCP ${service}`}
    >
      {renderServiceVector()}
    </div>
  );
};

// ============================================
// 13C. KUBERNETES SERVICE GLYPHS & ICONS (stdlib/kubernetes)
// Official CNCF / Kubernetes style vector icons
// ============================================
export const K8sGlyph: React.FC<{
  kind?: string;
  size?: number;
}> = ({ kind = 'Pod', size = 26 }) => {
  const normKind = (kind || '').toUpperCase();
  const bg = '#326CE5'; // Official Kubernetes Blue

  const renderKindVector = () => {
    // Pod
    if (normKind.includes('POD')) {
      return (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    }
    // Service / Ingress
    if (normKind.includes('SVC') || normKind.includes('SERVICE') || normKind.includes('INGRESS')) {
      return (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polygon points="12 2 19 8.5 12 15 5 8.5" />
          <line x1="12" y1="15" x2="12" y2="22" />
        </svg>
      );
    }
    // Deployment / ReplicaSet
    if (normKind.includes('DEPLOY') || normKind.includes('RS')) {
      return (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="2" y="3" width="9" height="9" rx="1" />
          <rect x="13" y="3" width="9" height="9" rx="1" />
          <rect x="2" y="14" width="9" height="9" rx="1" />
          <rect x="13" y="14" width="9" height="9" rx="1" />
        </svg>
      );
    }
    // ConfigMap / Secret
    if (normKind.includes('CM') || normKind.includes('CONFIG') || normKind.includes('SECRET')) {
      return (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    }
    // Persistent Volume / PVC
    if (normKind.includes('PV') || normKind.includes('STORAGE')) {
      return (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      );
    }
    // Default K8s 7-spoke Helm Wheel
    return (
      <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="3" x2="12" y2="9" />
        <line x1="12" y1="15" x2="12" y2="21" />
        <line x1="4.2" y1="7.5" x2="9.4" y2="10.5" />
        <line x1="14.6" y1="13.5" x2="19.8" y2="16.5" />
      </svg>
    );
  };

  return (
    <div
      className="rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm transition-transform hover:scale-110"
      style={{
        backgroundColor: bg,
        width: size,
        height: size
      }}
      title={`Kubernetes ${kind}`}
    >
      {renderKindVector()}
    </div>
  );
};

// ============================================
// 13D. CLOUD NATIVE & CLOUDOGU TOOLS (stdlib/cloudogu)
// ============================================
export const CloudNativeGlyph: React.FC<{
  tool?: string;
  size?: number;
}> = ({ tool = 'Docker', size = 26 }) => {
  const norm = (tool || '').toUpperCase();

  const getToolBg = () => {
    if (norm.includes('DOCKER')) return '#2496ED';
    if (norm.includes('KAFKA')) return '#231F20';
    if (norm.includes('REDIS')) return '#DC382D';
    if (norm.includes('POSTGRES')) return '#336791';
    if (norm.includes('NGINX')) return '#009639';
    if (norm.includes('JENKINS')) return '#D24939';
    if (norm.includes('GIT')) return '#F05032';
    if (norm.includes('PROMETHEUS')) return '#E6522C';
    if (norm.includes('GRAFANA')) return '#F46800';
    return '#1E293B';
  };

  return (
    <div
      className="rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm font-bold text-xs font-mono transition-transform hover:scale-110"
      style={{
        backgroundColor: getToolBg(),
        width: size,
        height: size
      }}
      title={`Cloud Native Tool: ${tool}`}
    >
      {norm.slice(0, 2)}
    </div>
  );
};

// ============================================
// 13B. C4 WATERMARK / BADGE DECORATIONS (stdlib/C4)
// ============================================
export const C4DbBadge: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#FFFFFF' }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className="opacity-90">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
};

export const C4QueueBadge: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#FFFFFF' }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className="opacity-90">
      <path d="M4 6h16M4 12h16M4 18h16" />
      <circle cx="2" cy="6" r="1.5" fill={color} />
      <circle cx="2" cy="12" r="1.5" fill={color} />
      <circle cx="2" cy="18" r="1.5" fill={color} />
    </svg>
  );
};

export const C4ComponentBadge: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = '#000000' }) => {
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 20 16" className="opacity-80">
      <rect x="4" y="0" width="16" height="16" fill="none" stroke={color} strokeWidth="1.5" />
      <rect x="0" y="3" width="6" height="3" fill="#ffffff" stroke={color} strokeWidth="1.2" />
      <rect x="0" y="9" width="6" height="3" fill="#ffffff" stroke={color} strokeWidth="1.2" />
    </svg>
  );
};

export const C4PersonAvatar: React.FC<{ size?: number; color?: string }> = ({ size = 32, color = '#FFFFFF' }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className="overflow-visible">
      {/* Head circle */}
      <circle cx="16" cy="9" r="6" fill={color} />
      {/* Torso curve */}
      <path d="M 5 28 C 5 20, 27 20, 27 28 Z" fill={color} />
    </svg>
  );
};

// ============================================
// 13E. ENTERPRISE INTEGRATION PATTERNS GLYPHS (stdlib/eip)
// Gregor Hohpe EIP Vector Patterns
// ============================================
export const EipGlyph: React.FC<{
  pattern?: string;
  size?: number;
}> = ({ pattern = 'router', size = 32 }) => {
  const p = (pattern || '').toLowerCase();

  const renderPattern = () => {
    // Splitter (1 -> 3)
    if (p.includes('splitter')) {
      return (
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="9" y2="12" />
          <path d="M9 12l5-7h7" />
          <line x1="9" y1="12" x2="21" y2="12" />
          <path d="M9 12l5 7h7" />
          <polyline points="18 3 21 5 18 7" />
          <polyline points="18 10 21 12 18 14" />
          <polyline points="18 17 21 19 18 21" />
        </svg>
      );
    }
    // Aggregator (3 -> 1)
    if (p.includes('aggregator')) {
      return (
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 5h7l5 7" />
          <line x1="3" y1="12" x2="15" y2="12" />
          <path d="M3 19h7l5-7" />
          <line x1="15" y1="12" x2="21" y2="12" />
          <polyline points="18 10 21 12 18 14" />
        </svg>
      );
    }
    // Filter
    if (p.includes('filter')) {
      return (
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
      );
    }
    // Wire Tap
    if (p.includes('wiretap') || p.includes('wire_tap') || p.includes('wire-tap')) {
      return (
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="2" y1="8" x2="22" y2="8" />
          <polyline points="19 5 22 8 19 11" />
          <path d="M12 8v8a4 4 0 0 0 4 4h6" />
          <polyline points="19 17 22 20 19 23" />
          <circle cx="12" cy="8" r="2.5" fill="currentColor" />
        </svg>
      );
    }
    // Dead Letter Channel
    if (p.includes('dead') || p.includes('dlq')) {
      return (
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
          <circle cx="12" cy="15" r="2" fill="currentColor" />
          <line x1="7" y1="5" x2="7" y2="3" />
          <line x1="17" y1="5" x2="17" y2="3" />
        </svg>
      );
    }
    // Translator
    if (p.includes('translator') || p.includes('transform')) {
      return (
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="8" height="16" rx="2" />
          <rect x="14" y="4" width="8" height="16" rx="2" />
          <path d="M10 9l4 3-4 3" />
        </svg>
      );
    }
    // Store
    if (p.includes('store')) {
      return (
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      );
    }
    // Default Router / Content-Based Router (Diamond routing)
    return (
      <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 22 12 12 22 2 12 12 2" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    );
  };

  return (
    <div
      className="rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm bg-[#5C2D91] transition-transform hover:scale-110"
      style={{
        width: size,
        height: size
      }}
      title={`EIP Pattern: ${pattern}`}
    >
      {renderPattern()}
    </div>
  );
};

// ============================================
// 13F. OPEN SECURITY ARCHITECTURE GLYPHS (stdlib/osa)
// Cybersecurity & Threat Modeling Vector Icons
// ============================================
export const OsaSecurityGlyph: React.FC<{
  element?: string;
  size?: number;
}> = ({ element = 'firewall', size = 32 }) => {
  const el = (element || '').toLowerCase();

  const getSecurityBg = () => {
    if (el.includes('threat') || el.includes('attacker')) return '#991B1B'; // dark crimson
    if (el.includes('firewall') || el.includes('waf')) return '#DC2626'; // firewall red
    if (el.includes('vpn')) return '#2563EB'; // vpn blue
    if (el.includes('hsm') || el.includes('crypto')) return '#D97706'; // hsm amber
    if (el.includes('bastion')) return '#4B5563'; // bastion slate
    return '#059669'; // security green
  };

  const renderSecurityVector = () => {
    // Threat Actor / Hacker
    if (el.includes('threat') || el.includes('attacker')) {
      return (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5z" />
          <circle cx="9" cy="15" r="1" fill="currentColor" />
          <circle cx="15" cy="15" r="1" fill="currentColor" />
        </svg>
      );
    }
    // VPN / Secure Tunnel
    if (el.includes('vpn')) {
      return (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    }
    // HSM / Encryption Key
    if (el.includes('hsm') || el.includes('crypto') || el.includes('key')) {
      return (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="7.5" cy="15.5" r="5.5" />
          <path d="M21 2l-9.6 9.6" />
          <path d="M15.5 7.5l3 3" />
        </svg>
      );
    }
    // Bastion Host
    if (el.includes('bastion')) {
      return (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 21V9l8-6 8 6v12" />
          <path d="M9 21v-6h6v6" />
          <line x1="12" y1="7" x2="12" y2="10" />
        </svg>
      );
    }
    // Default Firewall (Shield with brick pattern)
    return (
      <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <line x1="8" y1="10" x2="16" y2="10" />
        <line x1="8" y1="14" x2="16" y2="14" />
        <line x1="12" y1="6" x2="12" y2="10" />
        <line x1="10" y1="10" x2="10" y2="14" />
        <line x1="14" y1="10" x2="14" y2="14" />
      </svg>
    );
  };

  return (
    <div
      className="rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm transition-transform hover:scale-110"
      style={{
        backgroundColor: getSecurityBg(),
        width: size,
        height: size
      }}
      title={`OSA Security: ${element}`}
    >
      {renderSecurityVector()}
    </div>
  );
};

// ============================================
// 13G. ELASTIC STACK GLYPHS (stdlib/elastic)
// Official Elastic Observability Vector Icons
// ============================================
export const ElasticGlyph: React.FC<{
  component?: string;
  size?: number;
}> = ({ component = 'elasticsearch', size = 32 }) => {
  const c = (component || '').toLowerCase();

  const getComponentColor = () => {
    if (c.includes('kibana')) return '#E7157B';
    if (c.includes('logstash')) return '#00BFB3';
    if (c.includes('beats')) return '#FED10A';
    if (c.includes('apm')) return '#8C4FFF';
    return '#005571'; // Elasticsearch dark teal
  };

  return (
    <div
      className="rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm transition-transform hover:scale-110"
      style={{
        backgroundColor: getComponentColor(),
        width: size,
        height: size
      }}
      title={`Elastic: ${component}`}
    >
      <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" strokeWidth="2" />
        <line x1="7" y1="12" x2="17" y2="12" />
        <path d="M12 7a5 5 0 0 1 5 5" />
      </svg>
    </div>
  );
};

// ============================================
// 13H. TECH LOGOS STDLIB GLYPHS (stdlib/logos)
// Official Developer & Infrastructure Vector Logos
// ============================================
export const TechLogoGlyph: React.FC<{
  logo?: string;
  size?: number;
}> = ({ logo = 'docker', size = 36 }) => {
  const norm = (logo || '').toLowerCase().replace(/[-_]/g, '');

  const getLogoConfig = () => {
    if (norm.includes('docker')) return { bg: '#2496ed', text: '#ffffff', title: 'Docker' };
    if (norm.includes('kube') || norm === 'k8s') return { bg: '#326ce5', text: '#ffffff', title: 'Kubernetes' };
    if (norm.includes('kafka')) return { bg: '#231f20', text: '#ffffff', title: 'Kafka' };
    if (norm.includes('postgres') || norm.includes('pgsql')) return { bg: '#336791', text: '#ffffff', title: 'PostgreSQL' };
    if (norm.includes('redis')) return { bg: '#dc382d', text: '#ffffff', title: 'Redis' };
    if (norm.includes('react')) return { bg: '#20232a', text: '#61dafb', title: 'React' };
    if (norm.includes('node')) return { bg: '#333333', text: '#539e43', title: 'Node.js' };
    if (norm.includes('python')) return { bg: '#3776ab', text: '#ffd43b', title: 'Python' };
    if (norm.includes('java')) return { bg: '#e76f00', text: '#ffffff', title: 'Java' };
    if (norm.includes('go') || norm.includes('golang')) return { bg: '#00add8', text: '#ffffff', title: 'Go' };
    if (norm.includes('rust')) return { bg: '#000000', text: '#e43716', title: 'Rust' };
    if (norm.includes('nginx')) return { bg: '#009639', text: '#ffffff', title: 'Nginx' };
    return { bg: '#475569', text: '#ffffff', title: logo };
  };

  const cfg = getLogoConfig();

  const renderPath = () => {
    if (norm.includes('docker')) {
      return (
        <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.186.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.186.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.186.186.186m5.893 2.715h2.118a.186.186 0 00.186-.186V9.006a.186.186 0 00-.186-.186h-2.118a.186.186 0 00-.186.185v1.888c0 .102.082.185.186.185m-2.929 0h2.119a.185.185 0 00.185-.186V9.006a.185.185 0 00-.185-.186H8.1a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.186V9.006a.185.185 0 00-.185-.186H5.136a.186.186 0 00-.186.185v1.888c0 .102.084.185.186.185m-2.928 0h2.119a.185.185 0 00.185-.186V9.006a.185.185 0 00-.185-.186H2.208a.186.186 0 00-.186.185v1.888c0 .102.084.185.186.185M23.79 12.19c-.38-.264-1.25-.373-2.19-.187-.14-.49-.44-.92-.88-1.23l-.53-.33-.36.52c-.65.94-.78 2.05-.75 2.87-.58.33-1.4.52-2.38.52H1.27c-.42 0-.76.34-.76.76 0 3.84 2.37 7.02 6.55 7.49 1.13.13 2.34.15 3.59.04 4.54-.39 7.78-2.61 9.57-6.55.77-.07 2.09-.34 2.85-1.92.17-.34.11-.79-.19-1.07" />
      );
    }
    if (norm.includes('kube') || norm === 'k8s') {
      return (
        <path d="M12 2.25a.75.75 0 00-.36.09L3.75 6.72a.75.75 0 00-.39.66v8.74a.75.75 0 00.39.66l7.89 4.38a.75.75 0 00.72 0l7.89-4.38a.75.75 0 00.39-.66V7.38a.75.75 0 00-.39-.66l-7.89-4.38a.75.75 0 00-.36-.09zm0 3.19l5.88 3.26-2.13 1.19-3.75-2.08-3.75 2.08-2.13-1.19L12 5.44zm-5.88 5.75l2.13 1.19v3.74l-2.13-1.18v-3.75zm11.76 0v3.75l-2.13 1.18v-3.74l2.13-1.19zm-4.38 2.44v3.25L12 17.75l-1.5-1.07v-3.25l1.5.83 1.5-.83z" />
      );
    }
    if (norm.includes('kafka')) {
      return (
        <g>
          <circle cx="17.5" cy="5.5" r="3" fill="#e01a22" />
          <circle cx="17.5" cy="18.5" r="3" fill="#e01a22" />
          <circle cx="6.5" cy="12" r="3" fill="#e01a22" />
          <path d="M6.5 12l11-6.5M6.5 12l11 6.5" stroke="#ffffff" strokeWidth="2" />
        </g>
      );
    }
    if (norm.includes('react')) {
      return (
        <g stroke="currentColor" strokeWidth="1.5" fill="none">
          <ellipse cx="12" cy="12" rx="4" ry="11" />
          <ellipse cx="12" cy="12" rx="4" ry="11" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="4" ry="11" transform="rotate(120 12 12)" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </g>
      );
    }
    if (norm.includes('redis')) {
      return (
        <path d="M12 2L2 7l10 5 10-5-10-5zm0 9L4.5 7.25 12 3.5l7.5 3.75L12 11zm10 2l-10 5-10-5 2.5-1.25L12 15.5l7.5-3.75L22 13zm0 4l-10 5-10-5 2.5-1.25L12 19.5l7.5-3.75L22 17z" />
      );
    }
    // Default symbol / letter
    return (
      <text x="12" y="16" textAnchor="middle" fontSize="13" fontWeight="bold" fill="currentColor" fontFamily="monospace">
        {cfg.title.charAt(0)}
      </text>
    );
  };

  return (
    <div
      className="rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-105"
      style={{
        backgroundColor: cfg.bg,
        color: cfg.text,
        width: size,
        height: size
      }}
      title={`Tech Logo: ${cfg.title}`}
    >
      <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="currentColor">
        {renderPath()}
      </svg>
    </div>
  );
};

// ============================================
// 14. AUTHENTIC PLANTUML PACKAGE / NAMESPACE
// Tab on top-left, bordered container body
// ============================================
export const PackageShape: React.FC<{
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  isSelected?: boolean;
}> = ({
  width,
  height,
  fill = '#FEFECE',
  stroke = '#A80036',
  strokeWidth = 1.5,
  isSelected = false
}) => {
  const tabW = Math.min(140, Math.max(75, width * 0.38));
  const tabH = 22;

  return (
    <svg
      width={width}
      height={height}
      className="absolute top-0 left-0 pointer-events-none overflow-visible"
      style={{
        filter: isSelected
          ? 'drop-shadow(0 0 6px rgba(168, 0, 54, 0.4))'
          : 'drop-shadow(2px 2px 2px rgba(0,0,0,0.1))'
      }}
    >
      {/* Top Tab for Package label */}
      <polygon
        points={`0,0 ${tabW},0 ${tabW + 6},${tabH} 0,${tabH}`}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {/* Container Body enclosing children */}
      <rect
        x={0}
        y={tabH}
        width={width}
        height={height - tabH}
        fill={fill}
        fillOpacity="0.2"
        stroke={stroke}
        strokeWidth={strokeWidth}
        rx={1}
      />
    </svg>
  );
};

// ============================================
// 15. AUTHENTIC PLANTUML USE CASE (Oval / Ellipse)
// ============================================
export const UseCaseShape: React.FC<{
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  isSelected?: boolean;
}> = ({
  width,
  height,
  fill = '#FEFECE',
  stroke = '#A80036',
  strokeWidth = 1.5,
  isSelected = false
}) => {
  return (
    <svg
      width={width}
      height={height}
      className="absolute top-0 left-0 pointer-events-none overflow-visible"
      style={{
        filter: isSelected
          ? 'drop-shadow(0 0 6px rgba(168, 0, 54, 0.4))'
          : 'drop-shadow(2px 2px 2px rgba(0,0,0,0.12))'
      }}
    >
      <ellipse
        cx={width / 2}
        cy={height / 2}
        rx={width / 2 - strokeWidth}
        ry={height / 2 - strokeWidth}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};

// ============================================
// 16. AUTHENTIC PLANTUML COLLECTIONS
// Stacked offset cascading cards
// ============================================
export const CollectionsShape: React.FC<{
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  isSelected?: boolean;
}> = ({
  width,
  height,
  fill = '#FEFECE',
  stroke = '#A80036',
  strokeWidth = 1.5,
  isSelected = false
}) => {
  const offset = 6;

  return (
    <svg
      width={width}
      height={height}
      className="absolute top-0 left-0 pointer-events-none overflow-visible"
      style={{
        filter: isSelected
          ? 'drop-shadow(0 0 6px rgba(168, 0, 54, 0.4))'
          : 'drop-shadow(2px 2px 2px rgba(0,0,0,0.12))'
      }}
    >
      {/* Back card */}
      <rect
        x={offset * 2}
        y={0}
        width={width - offset * 2}
        height={height - offset * 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        rx={2}
      />
      {/* Middle card */}
      <rect
        x={offset}
        y={offset}
        width={width - offset * 2}
        height={height - offset * 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        rx={2}
      />
      {/* Front card */}
      <rect
        x={0}
        y={offset * 2}
        width={width - offset * 2}
        height={height - offset * 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        rx={2}
      />
    </svg>
  );
};

// ============================================
// 17. ROBUSTNESS BOUNDARY ICON ( -|O )
// ============================================
export const BoundaryIconShape: React.FC<{
  size?: number;
  color?: string;
  fill?: string;
}> = ({ size = 44, color = '#A80036', fill = '#FEFECE' }) => {
  const r = size * 0.32;
  const cx = size * 0.58;
  const cy = size * 0.5;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      {/* Vertical line on left */}
      <line x1={size * 0.12} y1={size * 0.15} x2={size * 0.12} y2={size * 0.85} stroke={color} strokeWidth="2.2" />
      {/* Connector stem */}
      <line x1={size * 0.12} y1={cy} x2={cx - r} y2={cy} stroke={color} strokeWidth="2" />
      {/* Circle */}
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke={color} strokeWidth="2" />
    </svg>
  );
};

// ============================================
// 18. ROBUSTNESS CONTROL ICON ( O↺ )
// ============================================
export const ControlIconShape: React.FC<{
  size?: number;
  color?: string;
  fill?: string;
}> = ({ size = 44, color = '#A80036', fill = '#FEFECE' }) => {
  const r = size * 0.32;
  const cx = size * 0.5;
  const cy = size * 0.54;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      {/* Base Circle */}
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke={color} strokeWidth="2" />
      {/* Loop Arrow on Top */}
      <path
        d={`M ${cx - r * 0.4} ${cy - r} C ${cx} ${size * 0.04}, ${cx + r * 1.1} ${size * 0.08}, ${cx + r * 0.65} ${cy - r * 0.6}`}
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
      {/* Arrowhead */}
      <polygon
        points={`${cx + r * 0.85},${cy - r * 0.75} ${cx + r * 0.55},${cy - r * 0.35} ${cx + r * 0.35},${cy - r * 0.85}`}
        fill={color}
      />
    </svg>
  );
};

// ============================================
// 19. ROBUSTNESS DOMAIN ENTITY ICON ( O_ )
// ============================================
export const EntityCircleIconShape: React.FC<{
  size?: number;
  color?: string;
  fill?: string;
}> = ({ size = 44, color = '#A80036', fill = '#FEFECE' }) => {
  const r = size * 0.35;
  const cx = size * 0.5;
  const cy = size * 0.44;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      {/* Circle */}
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke={color} strokeWidth="2" />
      {/* Baseline chord */}
      <line x1={size * 0.15} y1={size * 0.84} x2={size * 0.85} y2={size * 0.84} stroke={color} strokeWidth="2.2" />
    </svg>
  );
};

// ============================================
// 20. ACTIVITY / STATE: START DISC ( ● )
// ============================================
export const ActivityStartShape: React.FC<{
  size?: number;
  color?: string;
}> = ({ size = 26, color = '#000000' }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="overflow-visible">
      <circle cx="12" cy="12" r="10" fill={color} stroke="#333333" strokeWidth="1" />
    </svg>
  );
};

// ============================================
// 21. ACTIVITY / STATE: STOP / END BULLSEYE ( ◎ )
// ============================================
export const ActivityStopShape: React.FC<{
  size?: number;
  color?: string;
}> = ({ size = 28, color = '#000000' }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="overflow-visible">
      {/* Outer ring */}
      <circle cx="12" cy="12" r="11" fill="none" stroke={color} strokeWidth="2" />
      {/* Inner disc */}
      <circle cx="12" cy="12" r="6.5" fill={color} />
    </svg>
  );
};

// ============================================
// 22. ACTIVITY DECISION DIAMOND ( ◇ )
// ============================================
export const DecisionDiamondShape: React.FC<{
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  isSelected?: boolean;
}> = ({
  width,
  height,
  fill = '#FEFECE',
  stroke = '#A80036',
  strokeWidth = 1.5,
  isSelected = false
}) => {
  const midX = width / 2;
  const midY = height / 2;

  return (
    <svg
      width={width}
      height={height}
      className="absolute top-0 left-0 pointer-events-none overflow-visible"
      style={{
        filter: isSelected
          ? 'drop-shadow(0 0 6px rgba(168, 0, 54, 0.4))'
          : 'drop-shadow(2px 2px 2px rgba(0,0,0,0.12))'
      }}
    >
      <polygon
        points={`${midX},0 ${width},${midY} ${midX},${height} 0,${midY}`}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};

// ============================================
// 23. ACTIVITY / STATE: FORK / JOIN SYNC BAR
// ============================================
export const SyncBarShape: React.FC<{
  width: number;
  height: number;
  color?: string;
  isSelected?: boolean;
}> = ({
  width,
  height,
  color = '#000000',
  isSelected = false
}) => {
  return (
    <div
      className={`absolute top-0 left-0 w-full h-full rounded-xs transition-shadow ${
        isSelected ? 'ring-2 ring-[#c2652a] shadow-md' : ''
      }`}
      style={{
        backgroundColor: color,
        minHeight: Math.max(6, height),
        minWidth: Math.max(6, width)
      }}
    />
  );
};

// ============================================
// 24. AUTHENTIC PLANTUML STATE DIAGRAM BOX
// Deep rounded corners (rx: 12), crisp divider
// ============================================
export const StateBoxShape: React.FC<{
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  isSelected?: boolean;
}> = ({
  width,
  height,
  fill = '#FEFECE',
  stroke = '#A80036',
  strokeWidth = 1.5,
  isSelected = false
}) => {
  return (
    <svg
      width={width}
      height={height}
      className="absolute top-0 left-0 pointer-events-none overflow-visible"
      style={{
        filter: isSelected
          ? 'drop-shadow(0 0 6px rgba(168, 0, 54, 0.4))'
          : 'drop-shadow(2px 2px 2px rgba(0,0,0,0.12))'
      }}
    >
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        rx={12}
      />
    </svg>
  );
};

// ============================================
// 25. ACTIVITY: FLOW FINAL SHAPE ( ⨂ )
// Circle with X inside
// ============================================
export const ActivityFlowFinalShape: React.FC<{
  size?: number;
  color?: string;
}> = ({ size = 28, color = '#000000' }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="overflow-visible">
      <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="2" />
      <line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="2" />
      <line x1="6" y1="18" x2="18" y2="6" stroke={color} strokeWidth="2" />
    </svg>
  );
};

// ============================================
// 26. STATE MACHINE: HISTORY PSEUDO-STATE ( [H] or [H*] )
// ============================================
export const StateHistoryShape: React.FC<{
  size?: number;
  isDeep?: boolean;
  color?: string;
  fill?: string;
}> = ({ size = 32, isDeep = false, color = '#A80036', fill = '#FEFECE' }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className="overflow-visible">
      <circle cx="16" cy="16" r="14" fill={fill} stroke={color} strokeWidth="1.8" />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fontSize={isDeep ? "13" : "15"}
        fontWeight="bold"
        fontFamily="sans-serif"
        fill={color}
      >
        {isDeep ? 'H*' : 'H'}
      </text>
    </svg>
  );
};

// ============================================
// 27. SALT WIREFRAME MOCKUP (embedded-salt)
// Renders authentic PlantUML Salt wireframe widgets
// ============================================
export const SaltWireframeMockup: React.FC<{
  width: number;
  height: number;
  title?: string;
  content?: string;
  onUpdateContent?: (content: string) => void;
  onUpdateTitle?: (title: string) => void;
}> = ({ width, height, title = 'Window', content, onUpdateContent, onUpdateTitle }) => {
  const [mode, setMode] = useState<'preview' | 'source' | 'edit'>('preview');
  const [copied, setCopied] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  const defaultSalt = `{\n  <b>Login Screen</b>\n  Username: | "admin"\n  Password: | "****"\n  [X] Remember me | [Forgot Password]\n  [Submit] | [Cancel]\n}`;
  const rawText = (content && content.trim().length > 0) ? content : defaultSalt;
  const [editText, setEditText] = useState(rawText);

  // Parse Salt lines into grid rows & widget cells
  const parseSaltRows = (saltStr: string) => {
    // Strip outer curly brackets if present
    let cleaned = saltStr.trim();
    if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
      cleaned = cleaned.slice(1, -1).trim();
    }

    const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);
    return lines.map(line => {
      // Check for horizontal separator line
      if (line.startsWith('--') || line === '{-}') {
        return { isDivider: true, cells: [] };
      }

      // Check for menu line: {* File | Edit | View }
      if (line.startsWith('{*') && line.endsWith('}')) {
        const menuItems = line.slice(2, -1).split('|').map(s => s.trim()).filter(Boolean);
        return { isMenu: true, menuItems, cells: [] };
      }

      // Split into columns
      const cols = line.split('|').map(c => c.trim());
      const parsedCells = cols.map(cell => {
        // Bold header: <b>Text</b>
        const boldMatch = cell.match(/^<b>(.*?)<\/b>$/i);
        if (boldMatch) {
          return { type: 'header', text: boldMatch[1] };
        }

        // Checkbox: [X] Label or [ ] Label
        const checkMatch = cell.match(/^\[([ Xx*])?\]\s*(.*)/);
        if (checkMatch) {
          const isChecked = Boolean(checkMatch[1] && checkMatch[1].trim());
          return { type: 'checkbox', checked: isChecked, label: checkMatch[2] || '' };
        }

        // Radio button: (X) Label or ( ) Label
        const radioMatch = cell.match(/^\(([ Xx*])?\)\s*(.*)/);
        if (radioMatch) {
          const isSelected = Boolean(radioMatch[1] && radioMatch[1].trim());
          return { type: 'radio', selected: isSelected, label: radioMatch[2] || '' };
        }

        // Button: [Button Text]
        const btnMatch = cell.match(/^\[([^\]]+)\]$/);
        if (btnMatch) {
          return { type: 'button', label: btnMatch[1] };
        }

        // Text input: "Placeholder or Value"
        const inputMatch = cell.match(/^"([^"]*)"$/);
        if (inputMatch) {
          return { type: 'input', value: inputMatch[1] };
        }

        // Dropdown: ^Selected Option^
        const dropMatch = cell.match(/^\^([^^]+)\^$/);
        if (dropMatch) {
          return { type: 'dropdown', label: dropMatch[1] };
        }

        // Fallback: simple text / label
        return { type: 'text', text: cell };
      });

      return { isDivider: false, isMenu: false, cells: parsedCells };
    });
  };

  const parsedRows = parseSaltRows(rawText);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSaveEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onUpdateContent) {
      onUpdateContent(editText);
    }
    setMode('preview');
  };

  const insertSnippet = (snippet: string) => {
    setEditText(prev => prev.trim() + '\n' + snippet);
  };

  return (
    <div
      className="w-full h-full bg-[#ECE9D8] border border-[#7A7A7A] rounded-t-sm shadow-md flex flex-col font-sans select-none overflow-hidden"
      style={{ minWidth: 160, minHeight: 100 }}
    >
      {/* Title Bar */}
      <div className="bg-gradient-to-r from-[#0055EA] to-[#3B80ED] text-white px-2 py-1 flex items-center justify-between text-xs font-bold shadow-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          {isEditingTitle ? (
            <input
              autoFocus
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={() => {
                setIsEditingTitle(false);
                if (onUpdateTitle && tempTitle.trim()) onUpdateTitle(tempTitle.trim());
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingTitle(false);
                  if (onUpdateTitle && tempTitle.trim()) onUpdateTitle(tempTitle.trim());
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white text-gray-900 font-semibold px-1 py-0.2 rounded text-[11px] outline-none max-w-[130px]"
            />
          ) : (
            <span
              onClick={(e) => {
                if (onUpdateTitle) {
                  e.stopPropagation();
                  setTempTitle(title);
                  setIsEditingTitle(true);
                }
              }}
              className={`truncate text-[11px] ${onUpdateTitle ? 'hover:text-amber-200 cursor-pointer' : ''}`}
              title={onUpdateTitle ? 'Click to rename window' : undefined}
            >
              {title}
            </span>
          )}
          <span className="text-[9px] bg-white/20 text-white font-mono px-1 py-0.2 rounded font-normal">
            salt
          </span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1">
          {onUpdateContent && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (mode === 'edit') {
                  handleSaveEdit();
                } else {
                  setEditText(rawText);
                  setMode('edit');
                }
              }}
              className={`px-1.5 py-0.2 text-[9.5px] rounded flex items-center gap-0.5 cursor-pointer transition-colors font-medium ${
                mode === 'edit'
                  ? 'bg-amber-400 text-gray-950 font-bold hover:bg-amber-300'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
              title="Edit Salt GUI definition"
            >
              <Edit3 className="w-2.5 h-2.5" />
              <span>{mode === 'edit' ? 'Done' : 'Edit'}</span>
            </button>
          )}

          {mode !== 'edit' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMode(mode === 'preview' ? 'source' : 'preview');
              }}
              className="px-1.5 py-0.2 text-[9.5px] bg-white/20 hover:bg-white/30 text-white rounded flex items-center gap-0.5 cursor-pointer transition-colors"
              title="Toggle source code / visual wireframe"
            >
              {mode === 'preview' ? <Code className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
              <span>{mode === 'preview' ? 'Code' : 'View'}</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="p-0.5 hover:bg-white/20 text-white rounded cursor-pointer transition-colors"
            title="Copy Salt script"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3 text-white/80" />}
          </button>

          <div className="flex items-center gap-0.5 ml-1">
            <button className="w-3.5 h-3.5 bg-[#DCE4EC] hover:bg-white text-black text-[9px] font-bold rounded-xs flex items-center justify-center leading-none">_</button>
            <button className="w-3.5 h-3.5 bg-[#DCE4EC] hover:bg-white text-black text-[9px] font-bold rounded-xs flex items-center justify-center leading-none">□</button>
            <button className="w-3.5 h-3.5 bg-[#E81123] hover:bg-red-600 text-white text-[9px] font-bold rounded-xs flex items-center justify-center leading-none">✕</button>
          </div>
        </div>
      </div>

      {/* Wireframe Body Canvas */}
      <div className="p-2.5 flex-1 flex flex-col bg-[#F0EFE7] overflow-auto text-xs text-gray-800">
        {mode === 'edit' ? (
          <div className="w-full h-full flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[9px] text-gray-600 font-mono">Insert:</span>
              <button
                type="button"
                onClick={() => insertSnippet('  Username: | "admin"')}
                className="px-1.5 py-0.5 text-[9px] bg-white text-blue-700 hover:bg-gray-100 rounded border border-gray-300 font-mono"
              >
                + Input
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('  [Submit] | [Cancel]')}
                className="px-1.5 py-0.5 text-[9px] bg-white text-emerald-700 hover:bg-gray-100 rounded border border-gray-300 font-mono"
              >
                + Button
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('  [X] Remember me')}
                className="px-1.5 py-0.5 text-[9px] bg-white text-amber-700 hover:bg-gray-100 rounded border border-gray-300 font-mono"
              >
                + Checkbox
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('  Role: | ^Admin | User^')}
                className="px-1.5 py-0.5 text-[9px] bg-white text-purple-700 hover:bg-gray-100 rounded border border-gray-300 font-mono"
              >
                + Dropdown
              </button>
            </div>
            <textarea
              autoFocus
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full flex-1 font-mono text-[10.5px] text-gray-900 bg-white p-2 rounded border border-gray-400 outline-none resize-none leading-tight"
              rows={5}
            />
          </div>
        ) : mode === 'source' ? (
          <pre className="font-mono text-[10px] text-gray-700 bg-white/70 p-2 rounded border border-gray-300 whitespace-pre-wrap leading-tight select-text overflow-auto flex-1">
            {rawText}
          </pre>
        ) : (
          <div className="flex-1 flex flex-col justify-center space-y-1.5">
            {parsedRows.map((row, rIdx) => {
              if (row.isDivider) {
                return <hr key={rIdx} className="border-t border-gray-300 my-1" />;
              }
              if (row.isMenu) {
                return (
                  <div key={rIdx} className="flex items-center gap-3 bg-white/60 px-2 py-0.5 rounded border border-gray-300 text-[10px] text-gray-700">
                    {row.menuItems.map((item, mIdx) => (
                      <span key={mIdx} className="hover:text-blue-700 cursor-pointer">{item}</span>
                    ))}
                  </div>
                );
              }

              return (
                <div key={rIdx} className="flex items-center gap-2 flex-wrap">
                  {row.cells.map((cell, cIdx) => {
                    if (cell.type === 'header') {
                      return (
                        <div key={cIdx} className="w-full font-bold text-gray-900 text-xs pb-0.5 border-b border-gray-300/60 mb-0.5">
                          {cell.text}
                        </div>
                      );
                    }
                    if (cell.type === 'button') {
                      return (
                        <button
                          key={cIdx}
                          type="button"
                          className="px-2.5 py-0.5 bg-[#ECE9D8] hover:bg-[#DDD8C4] active:bg-[#C8C2AB] border border-gray-500 rounded-xs text-[10.5px] font-medium text-gray-800 shadow-2xs transition-colors"
                        >
                          {cell.label}
                        </button>
                      );
                    }
                    if (cell.type === 'input') {
                      return (
                        <input
                          key={cIdx}
                          type="text"
                          readOnly
                          value={cell.value}
                          className="px-1.5 py-0.5 text-[10.5px] bg-white border border-gray-400 rounded-xs text-gray-800 flex-1 min-w-[70px]"
                        />
                      );
                    }
                    if (cell.type === 'dropdown') {
                      return (
                        <div
                          key={cIdx}
                          className="px-2 py-0.5 text-[10.5px] bg-white border border-gray-400 rounded-xs flex items-center justify-between gap-1 text-gray-700 flex-1 min-w-[90px]"
                        >
                          <span className="truncate">{cell.label}</span>
                          <span className="text-[8px] text-gray-500">▾</span>
                        </div>
                      );
                    }
                    if (cell.type === 'checkbox') {
                      return (
                        <label key={cIdx} className="flex items-center gap-1.5 text-[11px] text-gray-800 cursor-pointer">
                          <input
                            type="checkbox"
                            defaultChecked={cell.checked}
                            className="accent-blue-600 rounded-xs"
                          />
                          <span>{cell.label}</span>
                        </label>
                      );
                    }
                    if (cell.type === 'radio') {
                      return (
                        <label key={cIdx} className="flex items-center gap-1.5 text-[11px] text-gray-800 cursor-pointer">
                          <input
                            type="radio"
                            defaultChecked={cell.selected}
                            className="accent-blue-600"
                          />
                          <span>{cell.label}</span>
                        </label>
                      );
                    }
                    return (
                      <span key={cIdx} className="text-[11px] font-medium text-gray-700">
                        {cell.text}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// 28. DITAA ASCII ART MOCKUP (embedded-ditaa)
// Renders anti-aliased vector blocks and drafting grid
// ============================================
export const DitaaAsciiMockup: React.FC<{
  width: number;
  height: number;
  title?: string;
  content?: string;
  onUpdateContent?: (content: string) => void;
  onUpdateTitle?: (title: string) => void;
}> = ({ width, height, title = 'ditaa ASCII diagram', content, onUpdateContent, onUpdateTitle }) => {
  const [mode, setMode] = useState<'preview' | 'ascii' | 'edit'>('preview');
  const [copied, setCopied] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  const defaultAscii = `+--------+  TCP  +--------+\n| Client | ----> | Server |\n+--------+       +--------+`;
  const rawText = (content && content.trim().length > 0) ? content : defaultAscii;
  const [editText, setEditText] = useState(rawText);

  // Simple box extractor for the visual preview mode
  const parseBoxes = (ascii: string) => {
    const lines = ascii.split('\n');
    const boxes: Array<{ label: string; lineIndex: number }> = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/\|\s*([^|]+?)\s*\|/g);
      if (match) {
        match.forEach((m) => {
          const text = m.replace(/\|/g, '').trim();
          if (text && !text.includes('+') && !text.includes('-')) {
            boxes.push({ label: text, lineIndex: i });
          }
        });
      }
    }
    return boxes;
  };

  const detectedBoxes = parseBoxes(rawText);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSaveEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onUpdateContent) {
      onUpdateContent(editText);
    }
    setMode('preview');
  };

  return (
    <div
      className="w-full h-full bg-[#181d24] border border-[#334155] rounded-md shadow-lg flex flex-col font-sans select-none overflow-hidden"
      style={{ minWidth: 200, minHeight: 120 }}
    >
      {/* Blueprint Header */}
      <div className="bg-[#0f172a] text-[#94a3b8] px-2.5 py-1.5 flex items-center justify-between text-xs border-b border-[#334155]">
        <div className="flex items-center gap-1.5 min-w-0">
          <Terminal className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          {isEditingTitle ? (
            <input
              autoFocus
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={() => {
                setIsEditingTitle(false);
                if (onUpdateTitle && tempTitle.trim()) onUpdateTitle(tempTitle.trim());
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingTitle(false);
                  if (onUpdateTitle && tempTitle.trim()) onUpdateTitle(tempTitle.trim());
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1e293b] text-gray-100 font-semibold px-1 py-0.5 rounded text-[11px] outline-none border border-amber-400/60 max-w-[140px]"
            />
          ) : (
            <span 
              onClick={(e) => {
                if (onUpdateTitle) {
                  e.stopPropagation();
                  setTempTitle(title);
                  setIsEditingTitle(true);
                }
              }}
              className={`font-semibold text-gray-200 truncate text-[11px] ${onUpdateTitle ? 'hover:text-amber-300 cursor-pointer' : ''}`}
              title={onUpdateTitle ? 'Click to rename' : undefined}
            >
              {title}
            </span>
          )}
          <span className="text-[9px] bg-amber-500/20 text-amber-300 font-mono px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
            ditaa
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onUpdateContent && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (mode === 'edit') {
                  handleSaveEdit();
                } else {
                  setEditText(rawText);
                  setMode('edit');
                }
              }}
              className={`px-1.5 py-0.5 text-[10px] rounded flex items-center gap-1 cursor-pointer transition-colors ${
                mode === 'edit'
                  ? 'bg-amber-500 text-gray-900 font-bold hover:bg-amber-400'
                  : 'bg-[#1e293b] hover:bg-[#334155] text-gray-300'
              }`}
              title="Edit ASCII art layout"
            >
              <Edit3 className="w-3 h-3 text-amber-400" />
              <span>{mode === 'edit' ? 'Done' : 'Edit'}</span>
            </button>
          )}
          {mode !== 'edit' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMode(mode === 'preview' ? 'ascii' : 'preview');
              }}
              className="px-1.5 py-0.5 text-[10px] bg-[#1e293b] hover:bg-[#334155] text-gray-300 rounded flex items-center gap-1 cursor-pointer transition-colors"
              title="Toggle between vector render and ASCII grid"
            >
              {mode === 'preview' ? <Code className="w-3 h-3 text-cyan-400" /> : <Eye className="w-3 h-3 text-emerald-400" />}
              <span>{mode === 'preview' ? 'Source' : 'Render'}</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-[#334155] text-gray-400 hover:text-gray-200 rounded cursor-pointer transition-colors"
            title="Copy ASCII art"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-2.5 overflow-auto relative flex flex-col justify-center bg-[#111827]">
        {mode === 'edit' ? (
          <div className="w-full h-full flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[9px] text-gray-400 font-mono">Insert:</span>
              <button
                type="button"
                onClick={() => setEditText(prev => prev + '\n+--------+\n| Target |\n+--------+')}
                className="px-1.5 py-0.5 text-[9px] bg-[#1e293b] text-cyan-300 hover:bg-[#334155] rounded font-mono"
              >
                + Box
              </button>
              <button
                type="button"
                onClick={() => setEditText(prev => prev + ' ----> ')}
                className="px-1.5 py-0.5 text-[9px] bg-[#1e293b] text-emerald-300 hover:bg-[#334155] rounded font-mono"
              >
                ➔ Arrow
              </button>
              <button
                type="button"
                onClick={() => setEditText(prev => prev + '\n+--------+\n| {s} DB |\n+--------+')}
                className="px-1.5 py-0.5 text-[9px] bg-[#1e293b] text-amber-300 hover:bg-[#334155] rounded font-mono"
              >
                Storage
              </button>
            </div>
            <textarea
              autoFocus
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full flex-1 font-mono text-[11px] text-[#38bdf8] bg-[#0a0e17] p-2 rounded border border-[#1e293b] outline-none resize-none leading-tight"
              rows={5}
            />
          </div>
        ) : mode === 'preview' && detectedBoxes.length > 0 ? (
          <div className="flex flex-wrap items-center justify-center gap-3 py-2">
            {detectedBoxes.map((box, idx) => (
              <React.Fragment key={idx}>
                <div className="px-3 py-2 bg-[#1e293b] border border-[#0ea5e9] rounded-lg text-center shadow-md min-w-[70px]">
                  <div className="text-[11px] font-bold text-gray-100 font-sans tracking-wide">
                    {box.label}
                  </div>
                  <div className="text-[9px] text-[#38bdf8] font-mono mt-0.5">
                    box_{idx + 1}
                  </div>
                </div>
                {idx < detectedBoxes.length - 1 && (
                  <div className="flex items-center text-emerald-400 font-mono text-xs font-bold px-1">
                    <span>--&gt;</span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <pre
            className="font-mono text-[11px] text-[#38bdf8] leading-tight whitespace-pre bg-[#0a0e17] p-2 rounded border border-[#1e293b] overflow-x-auto select-text"
            style={{
              backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)',
              backgroundSize: '12px 12px'
            }}
          >
            {rawText}
          </pre>
        )}
      </div>
    </div>
  );
};

// ============================================
// 29. LATEX / MATH FORMULA CARD (embedded-math)
// Renders PlantUML <math> display formulas
// ============================================
export const MathFormulaCard: React.FC<{
  width: number;
  height: number;
  title?: string;
  formula?: string;
  onUpdateFormula?: (formula: string) => void;
  onUpdateTitle?: (title: string) => void;
}> = ({ width, height, title = 'Mathematical Model', formula, onUpdateFormula, onUpdateTitle }) => {
  const [showSource, setShowSource] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const rawFormula = formula || 'P(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}';
  const [editFormula, setEditFormula] = useState(rawFormula);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  // Format Greek letters and symbols for visual rendering
  const formatFormula = (latex: string) => {
    return latex
      .replace(/\\sigma/g, 'σ')
      .replace(/\\mu/g, 'μ')
      .replace(/\\pi/g, 'π')
      .replace(/\\alpha/g, 'α')
      .replace(/\\beta/g, 'β')
      .replace(/\\lambda/g, 'λ')
      .replace(/\\theta/g, 'θ')
      .replace(/\\Delta/g, 'Δ')
      .replace(/\\sum/g, '∑')
      .replace(/\\int/g, '∫')
      .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
      .replace(/\^\{([^}]+)\}/g, '^($1)')
      .replace(/_\{([^}]+)\}/g, '_($1)');
  };

  const handleSaveFormula = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onUpdateFormula && editFormula.trim()) {
      onUpdateFormula(editFormula.trim());
    }
    setIsEditing(false);
  };

  const insertSymbol = (sym: string) => {
    setEditFormula(prev => prev + sym);
  };

  return (
    <div
      className="w-full h-full bg-[#FCFBF9] border border-[#D1D5DB] rounded-lg shadow-sm flex flex-col font-sans select-none overflow-hidden"
      style={{ minWidth: 200, minHeight: 90 }}
    >
      {/* Top Header */}
      <div className="bg-[#F3F4F6] text-gray-700 px-2.5 py-1.5 flex items-center justify-between text-xs border-b border-[#E5E7EB]">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sigma className="w-3.5 h-3.5 text-[#A80036] shrink-0" />
          {isEditingTitle ? (
            <input
              autoFocus
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={() => {
                setIsEditingTitle(false);
                if (onUpdateTitle && tempTitle.trim()) onUpdateTitle(tempTitle.trim());
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingTitle(false);
                  if (onUpdateTitle && tempTitle.trim()) onUpdateTitle(tempTitle.trim());
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white text-gray-900 font-semibold px-1 py-0.5 rounded text-[11px] outline-none border border-[#A80036]/60 max-w-[140px]"
            />
          ) : (
            <span
              onClick={(e) => {
                if (onUpdateTitle) {
                  e.stopPropagation();
                  setTempTitle(title);
                  setIsEditingTitle(true);
                }
              }}
              className={`font-semibold text-gray-800 truncate text-[11px] ${onUpdateTitle ? 'hover:text-[#A80036] cursor-pointer' : ''}`}
              title={onUpdateTitle ? 'Click to rename' : undefined}
            >
              {title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onUpdateFormula && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isEditing) {
                  handleSaveFormula();
                } else {
                  setEditFormula(rawFormula);
                  setIsEditing(true);
                }
              }}
              className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-white hover:bg-gray-100 text-[#A80036] border border-[#A80036]/30 rounded flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Edit3 className="w-3 h-3" />
              <span>{isEditing ? 'Done' : 'Edit'}</span>
            </button>
          )}
          <span className="text-[9px] bg-[#A80036]/10 text-[#A80036] font-mono px-1.5 py-0.2 rounded font-bold">
            &lt;math&gt;
          </span>
        </div>
      </div>

      {/* Formula Display or Inline Editor */}
      <div className="flex-1 p-2.5 flex flex-col items-center justify-center bg-white text-center">
        {isEditing ? (
          <div className="w-full flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1 flex-wrap justify-center">
              {[
                { label: 'a/b', code: '\\frac{a}{b}' },
                { label: '√x', code: '\\sqrt{x}' },
                { label: 'e^x', code: 'e^{x}' },
                { label: 'x_i', code: 'x_{i}' },
                { label: '∑', code: '\\sum_{i=1}^{N}' },
                { label: 'λ', code: '\\lambda' },
                { label: 'θ', code: '\\theta' },
                { label: 'σ', code: '\\sigma' }
              ].map(s => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => insertSymbol(s.code)}
                  className="px-1.5 py-0.5 text-[9.5px] font-mono bg-gray-100 hover:bg-gray-200 text-gray-800 rounded border border-gray-300"
                >
                  {s.label}
                </button>
              ))}
            </div>
            <input
              autoFocus
              type="text"
              value={editFormula}
              onChange={(e) => setEditFormula(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveFormula();
              }}
              className="w-full font-mono text-xs text-gray-900 bg-gray-50 border border-[#A80036]/50 rounded px-2 py-1 outline-none"
            />
            <div className="flex justify-end gap-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2 py-0.5 text-[10px] text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFormula}
                className="px-2 py-0.5 text-[10px] bg-[#A80036] text-white font-bold rounded"
              >
                Save
              </button>
            </div>
          </div>
        ) : showSource ? (
          <code className="font-mono text-xs text-gray-700 bg-gray-50 p-2 rounded border border-gray-200 select-text max-w-full overflow-x-auto">
            {rawFormula}
          </code>
        ) : (
          <div className="font-serif italic text-base sm:text-lg text-gray-900 tracking-wide select-text py-1">
            {formatFormula(rawFormula)}
          </div>
        )}

        {!isEditing && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSource(!showSource);
            }}
            className="mt-1 text-[9px] text-gray-400 hover:text-gray-600 underline cursor-pointer"
          >
            {showSource ? 'Show Display Equation' : 'View LaTeX Code'}
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================
// 30. STRUCTURED JSON / YAML TREE VIEWER
// Renders PlantUML @startjson / @startyaml trees
// ============================================
export const JsonYamlTreeViewer: React.FC<{
  format: 'json' | 'yaml';
  content?: string;
  onUpdateContent?: (content: string) => void;
}> = ({ format, content = '{}', onUpdateContent }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [formatError, setFormatError] = useState<string | null>(null);

  let parsedData: any = null;
  let isJsonValid = false;

  try {
    parsedData = JSON.parse(content);
    isJsonValid = typeof parsedData === 'object' && parsedData !== null;
  } catch (e) {
    isJsonValid = false;
  }

  const handlePrettify = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const parsed = JSON.parse(editContent);
      setEditContent(JSON.stringify(parsed, null, 2));
      setFormatError(null);
    } catch (err: any) {
      setFormatError(err.message);
    }
  };

  const handleSaveContent = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdateContent) {
      onUpdateContent(editContent);
    }
    setIsEditing(false);
  };

  const renderValue = (val: any) => {
    if (typeof val === 'string') {
      return <span className="text-emerald-400">"{val}"</span>;
    }
    if (typeof val === 'number') {
      return <span className="text-sky-400 font-semibold">{val}</span>;
    }
    if (typeof val === 'boolean') {
      return (
        <span className={`px-1 rounded text-[9px] font-bold ${val ? 'bg-emerald-900/60 text-emerald-300' : 'bg-rose-900/60 text-rose-300'}`}>
          {String(val)}
        </span>
      );
    }
    if (val === null) {
      return <span className="text-gray-500 italic">null</span>;
    }
    if (Array.isArray(val)) {
      return <span className="text-amber-400 font-mono">[{val.length} items]</span>;
    }
    if (typeof val === 'object') {
      return <span className="text-purple-300 font-mono">&#123;{Object.keys(val).length} keys&#125;</span>;
    }
    return String(val);
  };

  const renderRows = (obj: Record<string, any>, depth = 0): React.ReactNode => {
    return Object.entries(obj).map(([key, val], idx) => {
      const isNestedObj = typeof val === 'object' && val !== null && !Array.isArray(val);
      const isNestedArr = Array.isArray(val);

      return (
        <div key={idx} style={{ paddingLeft: `${depth * 10}px` }} className="py-0.5">
          <div className="flex items-start gap-1 text-[10px] leading-tight font-mono">
            <span className="text-[#f59e0b] font-semibold select-text">"{key}":</span>
            <div className="flex-1 min-w-0 select-text">
              {renderValue(val)}
            </div>
          </div>
          {isNestedObj && (
            <div className="border-l border-gray-700/60 ml-1.5 my-0.5">
              {renderRows(val, depth + 1)}
            </div>
          )}
          {isNestedArr && val.length > 0 && typeof val[0] === 'object' && (
            <div className="border-l border-gray-700/60 ml-1.5 my-0.5">
              {val.map((item: any, arrIdx: number) => (
                <div key={arrIdx} className="pl-2 border-b border-gray-800/40 pb-0.5">
                  {typeof item === 'object' && item !== null ? renderRows(item, depth + 1) : renderValue(item)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="w-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[10px] rounded-b overflow-hidden">
      {/* Format Ribbon */}
      <div className="bg-[#2d2d2d] px-2 py-1 flex items-center justify-between text-[9px] text-gray-400 border-b border-gray-700">
        <div className="flex items-center gap-1.5">
          <span className="font-bold uppercase tracking-wider text-amber-400">
            @{format.toUpperCase()}
          </span>
          {isJsonValid && !isEditing && (
            <span className="text-gray-400">
              {Object.keys(parsedData).length} keys
            </span>
          )}
        </div>
        {onUpdateContent && (
          <div className="flex items-center gap-1">
            {isEditing && (
              <button
                type="button"
                onClick={handlePrettify}
                className="px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-[9px]"
                title="Auto format JSON"
              >
                Format
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                if (isEditing) {
                  handleSaveContent(e);
                } else {
                  setEditContent(content);
                  setIsEditing(true);
                }
              }}
              className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                isEditing ? 'bg-amber-500 text-gray-950 hover:bg-amber-400' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
              }`}
            >
              {isEditing ? 'Save' : 'Edit'}
            </button>
          </div>
        )}
      </div>

      {/* Tree Content or Editor */}
      <div className="p-2 max-h-56 overflow-auto">
        {isEditing ? (
          <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
            <textarea
              autoFocus
              value={editContent}
              onChange={(e) => {
                setEditContent(e.target.value);
                setFormatError(null);
              }}
              className="w-full h-32 bg-[#121212] text-[#38bdf8] p-1.5 font-mono text-[10px] rounded border border-gray-700 outline-none resize-none leading-tight"
            />
            {formatError && (
              <div className="text-rose-400 text-[9px] font-sans">
                {formatError}
              </div>
            )}
          </div>
        ) : isJsonValid ? (
          <div className="space-y-0.5">
            {renderRows(parsedData)}
          </div>
        ) : (
          <pre className="whitespace-pre-wrap leading-tight text-gray-300">
            {content}
          </pre>
        )}
      </div>
    </div>
  );
};

// ============================================
// 31. WBS WORK BREAKDOWN STRUCTURE CARD
// Renders PlantUML @startwbs hierarchic nodes
// ============================================
export const WbsCardShape: React.FC<{
  level?: number;
  code?: string;
  title: string;
  progress?: number;
  color?: string;
  onUpdateProgress?: (progress: number) => void;
  onUpdateCode?: (code: string) => void;
  onUpdateLevel?: (level: number) => void;
  onUpdateTitle?: (title: string) => void;
}> = ({
  level = 1,
  code = '1.0',
  title,
  progress = 0,
  color = '#A80036',
  onUpdateProgress,
  onUpdateCode,
  onUpdateLevel,
  onUpdateTitle
}) => {
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [tempCode, setTempCode] = useState(code);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  return (
    <div className="w-full h-full bg-white rounded-lg border-2 border-gray-300 shadow-sm overflow-hidden flex flex-col select-none">
      {/* Level bar */}
      <div className="px-2.5 py-1 flex items-center justify-between bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-1">
          {isEditingCode ? (
            <input
              autoFocus
              type="text"
              value={tempCode}
              onChange={(e) => setTempCode(e.target.value)}
              onBlur={() => {
                setIsEditingCode(false);
                if (onUpdateCode && tempCode.trim()) onUpdateCode(tempCode.trim());
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingCode(false);
                  if (onUpdateCode && tempCode.trim()) onUpdateCode(tempCode.trim());
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-16 text-[9px] font-mono font-bold bg-white border border-emerald-500 rounded px-1 py-0.2 outline-none"
            />
          ) : (
            <span
              onClick={(e) => {
                if (onUpdateCode) {
                  e.stopPropagation();
                  setTempCode(code);
                  setIsEditingCode(true);
                }
              }}
              className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded bg-gray-200 text-gray-700 ${
                onUpdateCode ? 'hover:bg-emerald-100 hover:text-emerald-800 cursor-pointer' : ''
              }`}
              title={onUpdateCode ? 'Click to edit code' : undefined}
            >
              L{level} • {code}
            </span>
          )}
        </div>
        <span className="text-[9px] font-sans font-semibold text-gray-500">
          WBS Node
        </span>
      </div>

      {/* Title */}
      <div className="p-2.5 flex-1 flex flex-col justify-center">
        {isEditingTitle ? (
          <input
            autoFocus
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={() => {
              setIsEditingTitle(false);
              if (onUpdateTitle && tempTitle.trim()) onUpdateTitle(tempTitle.trim());
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditingTitle(false);
                if (onUpdateTitle && tempTitle.trim()) onUpdateTitle(tempTitle.trim());
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-bold text-gray-900 font-sans leading-tight bg-gray-50 border border-emerald-500 rounded px-1.5 py-0.5 outline-none"
          />
        ) : (
          <div
            onClick={(e) => {
              if (onUpdateTitle) {
                e.stopPropagation();
                setTempTitle(title);
                setIsEditingTitle(true);
              }
            }}
            className={`text-xs font-bold text-gray-900 font-sans leading-tight ${
              onUpdateTitle ? 'hover:text-emerald-700 cursor-pointer' : ''
            }`}
            title={onUpdateTitle ? 'Click to rename' : undefined}
          >
            {title}
          </div>
        )}

        {/* Interactive Progress indicator */}
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center text-[9px] font-mono text-gray-500 mb-0.5">
            <span>Progress</span>
            {onUpdateProgress ? (
              <div className="flex items-center gap-1">
                {[0, 25, 50, 75, 100].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => onUpdateProgress(pct)}
                    className={`px-1 py-0.2 rounded text-[8.5px] ${
                      progress === pct ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            ) : (
              <span>{progress}%</span>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};


