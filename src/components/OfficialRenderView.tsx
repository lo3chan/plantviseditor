import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  getPlantUMLSvgUrl, 
  getPlantUMLPngUrl,
  plumbSettingsIntoPlantUMLCode,
  autoFixPlantUMLSyntax
} from '../utils/plantumlEncoder';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  ExternalLink, 
  Download, 
  RefreshCw, 
  Check, 
  Copy,
  AlertCircle,
  Loader2,
  Palette,
  Move,
  Code,
  Wand2,
  Sun,
  X,
  Play
} from 'lucide-react';
import { GlobalCanvasSettings } from '../types';
import { PlantUMLStylePanel } from './PlantUMLStylePanel';

interface OfficialRenderViewProps {
  code: string;
  settings?: GlobalCanvasSettings;
  onUpdateSettings?: (patch: Partial<GlobalCanvasSettings>) => void;
  isSequenceDiagram?: boolean;
  isPlainWhite?: boolean;
  onTogglePlainWhite?: () => void;
  onUpdateCode?: (newCode: string) => void;
}

export const OfficialRenderView: React.FC<OfficialRenderViewProps> = ({ 
  code,
  settings,
  onUpdateSettings,
  isSequenceDiagram = false,
  isPlainWhite: externalPlainWhite,
  onTogglePlainWhite: externalTogglePlainWhite,
  onUpdateCode
}) => {
  const [svgUrl, setSvgUrl] = useState<string>('');
  const [pngUrl, setPngUrl] = useState<string>('');
  const [svgContent, setSvgContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<string>('');
  
  // Local plain white background state (synced with localStorage or external prop)
  const [localPlainWhite, setLocalPlainWhite] = useState<boolean>(() => {
    try {
      return localStorage.getItem('plantvis_canvas_plain_white') === 'true';
    } catch {
      return false;
    }
  });

  const isPlainWhite = externalPlainWhite !== undefined ? externalPlainWhite : localPlainWhite;
  const handleTogglePlainWhite = () => {
    if (externalTogglePlainWhite) {
      externalTogglePlainWhite();
    } else {
      setLocalPlainWhite(prev => {
        const next = !prev;
        try { localStorage.setItem('plantvis_canvas_plain_white', String(next)); } catch { /* ignore */ }
        return next;
      });
    }
  };

  // Plumb all settings (theme, direction, linetype, styling, etc.) directly into code
  const effectiveCode = useMemo(() => {
    return plumbSettingsIntoPlantUMLCode(code, settings, isSequenceDiagram);
  }, [code, settings, isSequenceDiagram]);

  // Syntax Inspector Drawer state
  const [isCodeDrawerOpen, setIsCodeDrawerOpen] = useState<boolean>(false);
  const [editableCode, setEditableCode] = useState<string>(effectiveCode);

  useEffect(() => {
    setEditableCode(effectiveCode);
  }, [effectiveCode]);

  // Detect diagram type for top-bar badge
  const detectedType = useMemo(() => {
    const trimmed = (code || '').trim();
    const match = trimmed.match(/^@start([a-z0-9_-]+)/i);
    if (match) return `@start${match[1].toLowerCase()}`;
    if (isSequenceDiagram) return '@startsequence';
    return '@startuml';
  }, [code, isSequenceDiagram]);

  // Interactive Pan & Zoom state (Draw.io scheme)
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [copiedSvg, setCopiedSvg] = useState<boolean>(false);
  const [copiedPng, setCopiedPng] = useState<boolean>(false);
  const [isCopyingPng, setIsCopyingPng] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isStylePanelOpen, setIsStylePanelOpen] = useState<boolean>(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Spacebar Hand Tool panning state
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isRightDragging, setIsRightDragging] = useState<boolean>(false);
  const rightMouseDownPos = useRef<{ x: number; y: number } | null>(null);

  // Debounced SVG and PNG fetching using fully plumbed effectiveCode
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        setError(false);
        setErrorDetails('');
        const sUrl = getPlantUMLSvgUrl(effectiveCode);
        const pUrl = getPlantUMLPngUrl(effectiveCode);
        setSvgUrl(sUrl);
        setPngUrl(pUrl);

        // Fetch SVG directly for inline crispness and error parsing
        const res = await fetch(sUrl);
        const text = await res.text();
        
        if (res.status === 200 && !text.includes('Syntax Error') && !text.includes('Cannot load theme')) {
          setSvgContent(text);
          setError(false);
          setErrorDetails('');
        } else {
          // PlantUML returned an error SVG
          setSvgContent(text);
          setError(true);
          const match = text.match(/<text[^>]*>([^<]+)<\/text>/gi);
          const errs = match ? match.map(m => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean).join(' ') : 'PlantUML syntax error';
          setErrorDetails(errs);
        }
      } catch (e) {
        console.warn('PlantUML preview fetch error:', e);
        setError(false);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [effectiveCode, refreshKey]);

  // Spacebar Keydown / Keyup Listeners for Hand Tool
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName || '') || target?.isContentEditable) {
        return;
      }
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        setIsSpacePressed(false);
      }
    };

    const handleBlur = () => {
      setIsSpacePressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Draw.io Wheel Scheme: Ctrl+Wheel zoom centered at cursor, Shift+Wheel horizontal pan, Normal wheel vertical pan
  const handleWheel = useCallback((e: WheelEvent | React.WheelEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && (
      target.closest('.overflow-y-auto') || 
      target.closest('.overflow-x-auto') || 
      target.closest('.overflow-auto') || 
      target.closest('[data-scrollable]') ||
      target.closest('textarea')
    )) {
      return;
    }

    if (e.cancelable) {
      e.preventDefault();
    }

    // 1. Ctrl / Cmd + Wheel: Zoom centered at mouse cursor
    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
      const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.15), 5.0);

      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;

        const newX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
        const newY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

        setZoom(newZoom);
        setPan({ x: newX, y: newY });
      }
      return;
    }

    // 2. Shift + Wheel: Horizontal pan
    if (e.shiftKey) {
      const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
      setPan(prev => ({ ...prev, x: prev.x - delta }));
      return;
    }

    // 3. Normal Wheel: Vertical pan (and deltaX if trackpad 2D scrolling)
    setPan(prev => ({
      x: prev.x - (e.deltaX || 0),
      y: prev.y - e.deltaY
    }));
  }, [zoom, pan.x, pan.y]);

  const handleWheelRef = useRef(handleWheel);
  handleWheelRef.current = handleWheel;

  // Native non-passive listener to prevent browser page zoom on Ctrl+Wheel
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onNativeWheel = (e: WheelEvent) => {
      handleWheelRef.current(e);
    };

    container.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onNativeWheel);
    };
  }, []);

  // Mouse Drag Panning (Left, Middle, Right click, and Space key)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('a') || 
      target.closest('input') || 
      target.closest('select') || 
      target.closest('textarea') ||
      target.closest('#svg-syntax-drawer')
    ) {
      return;
    }

    // Middle click (button 1) always pans
    if (e.button === 1) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
      return;
    }

    // Right click (button 2) starts Draw.io pan; if dragged > 4px, suppresses context menu
    if (e.button === 2) {
      rightMouseDownPos.current = { x: e.clientX, y: e.clientY };
      setIsRightDragging(false);
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
      return;
    }

    // Left click (button 0)
    if (e.button === 0) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    }
  }, [pan.x, pan.y]);

  const handleMouseMove = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (rightMouseDownPos.current) {
      const dist = Math.hypot(e.clientX - rightMouseDownPos.current.x, e.clientY - rightMouseDownPos.current.y);
      if (dist > 4) {
        setIsRightDragging(true);
      }
    }

    if (!isPanning) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    setPan({
      x: panStartRef.current.panX + dx,
      y: panStartRef.current.panY + dy
    });
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    rightMouseDownPos.current = null;
    setTimeout(() => setIsRightDragging(false), 50);
  }, []);

  // Global window mousemove/mouseup listeners so panning never freezes out of bounds
  useEffect(() => {
    if (!isPanning) return;

    const onWindowMouseMove = (e: MouseEvent) => handleMouseMove(e);
    const onWindowMouseUp = () => handleMouseUp();

    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
    };
  }, [isPanning, handleMouseMove, handleMouseUp]);

  // Intercept right clicks on canvas to completely suppress native browser context menu during drag/pan
  useEffect(() => {
    const handleGlobalContextMenu = (e: MouseEvent) => {
      const container = containerRef.current;
      if (container && (container.contains(e.target as Node) || isRightDragging || isPanning)) {
        e.preventDefault();
      }
    };

    window.addEventListener('contextmenu', handleGlobalContextMenu, { capture: true });
    return () => {
      window.removeEventListener('contextmenu', handleGlobalContextMenu, { capture: true });
    };
  }, [isRightDragging, isPanning]);

  // Double click to zoom in or reset
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('textarea')) return;
    
    if (zoom !== 1 || pan.x !== 0 || pan.y !== 0) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;
      const newZoom = 1.6;
      setPan({
        x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
        y: mouseY - (mouseY - pan.y) * (newZoom / zoom)
      });
      setZoom(newZoom);
    }
  }, [zoom, pan.x, pan.y]);

  const handleCopyUrl = () => {
    if (svgUrl) {
      navigator.clipboard.writeText(svgUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleCopySvg = () => {
    if (svgContent) {
      navigator.clipboard.writeText(svgContent);
      setCopiedSvg(true);
      setTimeout(() => setCopiedSvg(false), 2000);
    }
  };

  const handleDownloadSvg = () => {
    if (!svgContent && !svgUrl) return;
    if (svgContent) {
      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'diagram.svg';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } else {
      const a = document.createElement('a');
      a.href = svgUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = 'diagram.svg';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  const handleDownloadPng = async () => {
    if (!pngUrl) return;
    try {
      const res = await fetch(pngUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'diagram.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      window.open(pngUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyPngImage = async () => {
    if (!pngUrl) return;
    setIsCopyingPng(true);
    try {
      const res = await fetch(pngUrl);
      const blob = await res.blob();
      const pngBlob = blob.type === 'image/png' ? blob : new Blob([blob], { type: 'image/png' });
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob })
      ]);
      setCopiedPng(true);
      setTimeout(() => setCopiedPng(false), 2000);
    } catch (err) {
      console.warn('Clipboard image write failed, copying direct image URL:', err);
      await navigator.clipboard.writeText(pngUrl);
      setCopiedPng(true);
      setTimeout(() => setCopiedPng(false), 2000);
    } finally {
      setIsCopyingPng(false);
    }
  };

  const handleAutoFix = () => {
    const fixed = autoFixPlantUMLSyntax(editableCode || effectiveCode);
    setEditableCode(fixed);
    if (onUpdateCode) {
      onUpdateCode(fixed);
    }
    setRefreshKey(k => k + 1);
  };

  const handleApplyEditedCode = () => {
    if (onUpdateCode) {
      onUpdateCode(editableCode);
    }
    setRefreshKey(k => k + 1);
    setIsCodeDrawerOpen(false);
  };

  const canvasCursor = isPanning 
    ? 'cursor-grabbing' 
    : isSpacePressed 
      ? 'cursor-grab' 
      : 'cursor-default';

  return (
    <div className="w-full h-full flex overflow-hidden relative bg-[#faf5ee]">
      {/* SVG Canvas Area */}
      <div className="flex-1 h-full flex flex-col relative overflow-hidden">
        {/* Top Floating Control Bar */}
        <div className="absolute top-4 right-4 max-w-[calc(100%-2rem)] z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-[#d8d0c8] p-1.5 rounded-xl shadow-md text-xs select-none overflow-x-auto">
          {/* Engine & Syntax Type Badge */}
          <span className="text-[11px] font-semibold text-[#78706a] px-2 border-r border-[#d8d0c8] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>PlantUML Server</span>
            <span className="font-mono text-[10px] bg-[#f5ede4] text-[#c2652a] px-1.5 py-0.5 rounded-md font-bold">
              {detectedType}
            </span>
          </span>

          {/* Quick Syntax Editor Toggle */}
          <button
            id="btn-toggle-code-drawer"
            onClick={() => setIsCodeDrawerOpen(!isCodeDrawerOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              isCodeDrawerOpen 
                ? 'bg-[#3a302a] text-white border-[#3a302a] shadow-xs' 
                : 'bg-white hover:bg-[#faf5ee] text-[#3a302a] border-[#d8d0c8]'
            }`}
            title="Inspect or edit plumbed PlantUML render syntax"
          >
            <Code className={`w-3.5 h-3.5 ${isCodeDrawerOpen ? 'text-amber-400' : 'text-[#c2652a]'}`} />
            <span className="text-[11px] font-semibold">Syntax</span>
          </button>

          {/* PlantUML Style & Visual Options Toggle */}
          {settings && onUpdateSettings && (
            <button
              onClick={() => setIsStylePanelOpen(!isStylePanelOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                isStylePanelOpen 
                  ? 'bg-[#c2652a] text-white border-[#c2652a] shadow-xs' 
                  : 'bg-white hover:bg-[#faf5ee] text-[#3a302a] border-[#d8d0c8]'
              }`}
              title="Toggle PlantUML Visual Options Panel"
            >
              <Palette className={`w-3.5 h-3.5 ${isStylePanelOpen ? 'text-white' : 'text-[#c2652a]'}`} />
              <span className="text-[11px] font-semibold">Visual Options</span>
            </button>
          )}

          <div className="w-px h-4 bg-[#d8d0c8] mx-0.5" />

          {/* Plain White / Sahara Canvas Background Toggle */}
          <button
            id="btn-svg-toggle-plain-white"
            onClick={handleTogglePlainWhite}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isPlainWhite 
                ? 'bg-amber-100 text-[#c2652a] border border-amber-300' 
                : 'hover:bg-[#faf5ee] text-[#3a302a]'
            }`}
            title={isPlainWhite ? "Switch to Sahara Grid Canvas" : "Switch to Plain White Canvas"}
          >
            <Sun className={`w-4 h-4 ${isPlainWhite ? 'text-[#c2652a]' : 'text-[#78706a]'}`} />
          </button>

          <div className="w-px h-4 bg-[#d8d0c8] mx-0.5" />

          {/* Zoom Controls */}
          <button
            onClick={() => setZoom(z => Math.max(0.15, +(z * 0.85).toFixed(2)))}
            className="p-1 rounded-lg hover:bg-[#faf5ee] text-[#3a302a] transition-colors cursor-pointer"
            title="Zoom Out (Ctrl + Wheel down)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span 
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="text-[11px] font-mono text-[#78706a] min-w-[44px] text-center hover:text-[#c2652a] cursor-pointer"
            title="Click to reset zoom to 100%"
          >
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(z => Math.min(5.0, +(z * 1.15).toFixed(2)))}
            className="p-1 rounded-lg hover:bg-[#faf5ee] text-[#3a302a] transition-colors cursor-pointer"
            title="Zoom In (Ctrl + Wheel up)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="p-1 rounded-lg hover:bg-[#faf5ee] text-[#3a302a] transition-colors cursor-pointer"
            title="Reset Zoom & Pan"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-[#d8d0c8] mx-0.5" />

          {/* Reload button */}
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="p-1 rounded-lg hover:bg-[#faf5ee] text-[#3a302a] transition-colors cursor-pointer"
            title="Refresh diagram render"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#c2652a]' : ''}`} />
          </button>

          {/* Copy SVG Markup button */}
          <button
            onClick={handleCopySvg}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#faf5ee] text-[#3a302a] transition-colors cursor-pointer"
            title="Copy raw SVG vector XML code"
          >
            {copiedSvg ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#78706a]" />}
            <span className="text-[11px]">Copy SVG</span>
          </button>

          {/* Copy SVG URL */}
          <button
            onClick={handleCopyUrl}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#faf5ee] text-[#3a302a] transition-colors cursor-pointer"
            title="Copy direct PlantUML server SVG URL"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ExternalLink className="w-3.5 h-3.5 text-[#78706a]" />}
            <span className="text-[11px]">Copy URL</span>
          </button>

          {/* Download SVG */}
          <button
            onClick={handleDownloadSvg}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#faf5ee] text-[#3a302a] transition-colors cursor-pointer"
            title="Download vector SVG file"
          >
            <Download className="w-3.5 h-3.5 text-[#78706a]" />
            <span className="text-[11px]">SVG</span>
          </button>

          {/* Download PNG */}
          <button
            onClick={handleDownloadPng}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#faf5ee] text-[#3a302a] transition-colors cursor-pointer"
            title="Download raster PNG image"
          >
            <Download className="w-3.5 h-3.5 text-[#78706a]" />
            <span className="text-[11px]">PNG</span>
          </button>

          {/* Copy PNG Image */}
          <button
            onClick={handleCopyPngImage}
            disabled={isCopyingPng}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#faf5ee] text-[#3a302a] transition-colors cursor-pointer disabled:opacity-50"
            title="Copy PNG image bitmap to clipboard (paste into Figma, Slack, Word, Docs)"
          >
            {copiedPng ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#78706a]" />}
            <span className="text-[11px]">{copiedPng ? 'Copied Image' : isCopyingPng ? 'Copying...' : 'Copy Image'}</span>
          </button>

          {/* Open in new tab */}
          {svgUrl && (
            <a
              href={svgUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#c2652a] text-white hover:bg-[#a95420] transition-colors cursor-pointer font-medium shadow-xs"
              title="Open raw SVG in new browser tab"
            >
              <span className="text-[11px]">Open Link</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Quick Syntax Inspector Drawer */}
        {isCodeDrawerOpen && (
          <div 
            id="svg-syntax-drawer"
            className="absolute top-16 right-4 z-30 w-96 max-h-[70vh] flex flex-col bg-[#1f1b18] text-[#e8dfd5] border border-[#4a4036] rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#3a302a] bg-[#161311]">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-[#c2652a]" />
                <span className="text-xs font-semibold text-white">Plumbed PlantUML Syntax</span>
              </div>
              <button
                onClick={() => setIsCodeDrawerOpen(false)}
                className="p-1 rounded-lg hover:bg-[#2b2420] text-[#a89b91] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-3 flex-1 flex flex-col gap-2 overflow-hidden">
              <p className="text-[11px] text-[#a89b91]">
                The exact PlantUML code with all visual styling directives plumbed and sent to the rendering engine:
              </p>
              <textarea
                value={editableCode}
                onChange={(e) => setEditableCode(e.target.value)}
                className="w-full flex-1 min-h-[220px] bg-[#141210] border border-[#3a302a] rounded-lg p-2.5 text-xs font-mono text-[#f3ede6] focus:outline-none focus:border-[#c2652a] resize-none selection:bg-[#c2652a]/40"
                spellCheck={false}
              />
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(editableCode);
                  }}
                  className="px-2.5 py-1 text-[11px] text-[#a89b91] hover:text-white bg-[#2b2420] rounded-md transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Code</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAutoFix}
                    className="px-2.5 py-1 text-[11px] text-[#c2652a] hover:text-white hover:bg-[#c2652a] bg-[#2b2420] border border-[#c2652a]/40 rounded-md transition-all cursor-pointer flex items-center gap-1 font-medium"
                    title="Sanitize syntax and auto-fix theme typos"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>Auto-Fix</span>
                  </button>
                  <button
                    onClick={handleApplyEditedCode}
                    className="px-3 py-1 text-[11px] text-white bg-[#c2652a] hover:bg-[#a95420] rounded-md transition-colors cursor-pointer flex items-center gap-1 font-semibold shadow-xs"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Apply & Render</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SVG Canvas Area with Interactive Pan and Zoom (Draw.io scheme) */}
        <div 
          id="official-svg-container"
          ref={containerRef}
          className={`flex-1 overflow-hidden relative select-none ${canvasCursor}`}
          style={{
            backgroundColor: isPlainWhite ? '#ffffff' : '#faf5ee',
            backgroundImage: isPlainWhite ? 'none' : `
              linear-gradient(335deg, rgba(194, 101, 42, 0.04) ${23 * zoom}px, transparent ${23 * zoom}px),
              linear-gradient(155deg, rgba(194, 101, 42, 0.04) ${23 * zoom}px, transparent ${23 * zoom}px),
              linear-gradient(335deg, rgba(194, 101, 42, 0.04) ${23 * zoom}px, transparent ${23 * zoom}px),
              linear-gradient(155deg, rgba(194, 101, 42, 0.04) ${23 * zoom}px, transparent ${23 * zoom}px)
            `,
            backgroundSize: `${58 * zoom}px ${58 * zoom}px`,
            backgroundPosition: `${0 * zoom + pan.x}px ${2 * zoom + pan.y}px, ${4 * zoom + pan.x}px ${35 * zoom + pan.y}px, ${29 * zoom + pan.x}px ${31 * zoom + pan.y}px, ${34 * zoom + pan.x}px ${6 * zoom + pan.y}px`
          }}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
        >
          {loading && (
            <div className="absolute top-6 left-6 z-10 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-xs rounded-lg border border-[#d8d0c8] shadow-xs text-xs text-[#78706a]">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c2652a]" />
              <span>Rendering official PlantUML SVG...</span>
            </div>
          )}

          {error ? (
            <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-auto">
              <div className="flex flex-col items-center max-w-2xl gap-3 p-6 bg-white/95 rounded-2xl border border-rose-300 text-rose-800 shadow-xl">
                <div className="flex items-center gap-2 text-rose-700 font-semibold text-sm">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  <span>PlantUML Syntax Notice</span>
                </div>
                {errorDetails && (
                  <p className="text-xs font-mono bg-rose-50 border border-rose-200 p-2.5 rounded-lg text-rose-900 w-full overflow-x-auto">
                    {errorDetails}
                  </p>
                )}
                {svgContent && svgContent.includes('<svg') && (
                  <div 
                    className="w-full max-h-72 overflow-auto bg-neutral-900 text-white p-3 rounded-lg border border-neutral-700 [&>svg]:mx-auto"
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                  />
                )}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={handleAutoFix}
                    className="px-3.5 py-1.5 bg-[#c2652a] text-white text-xs font-medium rounded-lg hover:bg-[#a95420] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    title="Automatically repair theme typos and syntax tags"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Auto-Fix & Retry</span>
                  </button>
                  <button
                    onClick={() => setIsCodeDrawerOpen(true)}
                    className="px-3 py-1.5 bg-white text-[#78706a] border border-[#d8d0c8] text-xs font-medium rounded-lg hover:bg-[#f5ede4] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Code className="w-3.5 h-3.5 text-[#c2652a]" />
                    <span>Inspect & Edit Code</span>
                  </button>
                  <button
                    onClick={() => setRefreshKey(k => k + 1)}
                    className="px-3 py-1.5 bg-[#f5ede4] text-[#4a4036] text-xs font-medium rounded-lg hover:bg-[#ede3d8] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div 
              id="official-svg-stage"
              className="absolute top-1/2 left-1/2 will-change-transform"
              style={{ 
                transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
                transformOrigin: 'center center'
              }}
            >
              <div 
                id="official-svg-image"
                className="bg-white p-6 rounded-2xl shadow-xl border border-[#d8d0c8]/80 max-w-none inline-block"
              >
                {svgContent && svgContent.includes('<svg') ? (
                  <div 
                    className="w-full h-full flex items-center justify-center [&>svg]:max-w-none [&>svg]:h-auto [&>svg]:w-auto [&>svg]:transition-opacity select-none pointer-events-none"
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                  />
                ) : (
                  svgUrl && (
                    <img
                      key={svgUrl}
                      src={svgUrl}
                      alt="PlantUML Diagram Render"
                      className="max-w-none transition-opacity select-none pointer-events-none"
                      referrerPolicy="no-referrer"
                      onLoad={() => setLoading(false)}
                      onError={() => {
                        setError(true);
                        setLoading(false);
                      }}
                    />
                  )
                )}
              </div>
            </div>
          )}

          {/* Mini Pan hint indicator */}
          <div className="absolute bottom-4 left-4 pointer-events-none text-[11px] text-[#78706a]/80 flex items-center gap-1.5 bg-white/90 px-2.5 py-1 rounded-md border border-[#d8d0c8]/60 backdrop-blur-xs shadow-2xs z-10 select-none">
            <Move className="w-3.5 h-3.5 text-[#c2652a]" />
            <span>Right-click or Middle-click or Space+Drag to pan • Wheel to scroll / Ctrl+Wheel to zoom</span>
          </div>
        </div>
      </div>

      {/* Right Side: Official PlantUML Aesthetic & Style Options Panel */}
      {isStylePanelOpen && settings && onUpdateSettings && (
        <PlantUMLStylePanel
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          isSequenceDiagram={isSequenceDiagram}
          onClose={() => setIsStylePanelOpen(false)}
        />
      )}
    </div>
  );
};
