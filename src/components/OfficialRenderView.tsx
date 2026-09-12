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
  Sun
} from 'lucide-react';
import { GlobalCanvasSettings } from '../types';
import { PlantUMLStylePanel } from './PlantUMLStylePanel';
import { OfficialRenderControls } from './Navbar';

interface OfficialRenderViewProps {
  code: string;
  settings?: GlobalCanvasSettings;
  onUpdateSettings?: (patch: Partial<GlobalCanvasSettings>) => void;
  isSequenceDiagram?: boolean;
  isPlainWhite?: boolean;
  onTogglePlainWhite?: () => void;
  onUpdateCode?: (newCode: string) => void;
  onControlsChange?: (controls: OfficialRenderControls | null) => void;
}

export const OfficialRenderView: React.FC<OfficialRenderViewProps> = ({ 
  code,
  settings,
  onUpdateSettings,
  isSequenceDiagram = false,
  isPlainWhite: externalPlainWhite,
  onTogglePlainWhite: externalTogglePlainWhite,
  onUpdateCode,
  onControlsChange
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

  const fitToWindow = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleCopyUrl = useCallback(() => {
    if (svgUrl) {
      navigator.clipboard.writeText(svgUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  }, [svgUrl]);

  const handleCopySvg = useCallback(() => {
    if (svgContent) {
      navigator.clipboard.writeText(svgContent);
      setCopiedSvg(true);
      setTimeout(() => setCopiedSvg(false), 2000);
    }
  }, [svgContent]);

  const handleDownloadSvg = useCallback(() => {
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
  }, [svgContent, svgUrl]);

  const handleDownloadPng = useCallback(async () => {
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
  }, [pngUrl]);

  const handleCopyPngImage = useCallback(async () => {
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
  }, [pngUrl]);

  // Publish SVG controls to parent navbar
  useEffect(() => {
    if (!onControlsChange) return;
    onControlsChange({
      zoom,
      setZoom,
      fitToWindow,
      refresh: () => setRefreshKey(k => k + 1),
      copySvg: handleCopySvg,
      copyUrl: handleCopyUrl,
      downloadSvg: handleDownloadSvg,
      downloadPng: handleDownloadPng,
      copyPngImage: handleCopyPngImage,
      isCopyingPng,
      copiedSvg,
      copiedUrl,
      copiedPng,
      svgUrl,
      pngUrl,
      hasSvg: Boolean(svgContent || svgUrl),
      isStylePanelOpen,
      setIsStylePanelOpen
    });
    return () => onControlsChange(null);
  }, [
    onControlsChange,
    zoom,
    fitToWindow,
    handleCopySvg,
    handleCopyUrl,
    handleDownloadSvg,
    handleDownloadPng,
    handleCopyPngImage,
    isCopyingPng,
    copiedSvg,
    copiedUrl,
    copiedPng,
    svgUrl,
    pngUrl,
    svgContent,
    isStylePanelOpen
  ]);

  const canvasCursor = isPanning 
    ? 'cursor-grabbing' 
    : isSpacePressed 
      ? 'cursor-grab' 
      : 'cursor-default';

  return (
    <div className="w-full h-full flex overflow-hidden relative bg-[#faf5ee]">
      {/* SVG Canvas Area */}
      <div className="flex-1 h-full flex flex-col relative overflow-hidden">
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
                    onClick={() => setRefreshKey(k => k + 1)}
                    className="px-3.5 py-1.5 bg-[#c2652a] text-white text-xs font-medium rounded-lg hover:bg-[#a95420] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Render</span>
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

          {/* Bottom-right Floating Toolbar: Plain White Background Toggle */}
          <aside
            aria-label="SVG Canvas Display Controls"
            className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-[#d8d0c8] p-1.5 rounded-xl shadow-md text-xs select-none"
          >
            <button
              id="btn-svg-bottom-toggle-plain-white"
              onClick={handleTogglePlainWhite}
              className={`px-2 py-1 rounded-lg transition-colors flex items-center gap-1.5 text-xs cursor-pointer ${
                isPlainWhite 
                  ? 'bg-[#c2652a] text-white font-medium shadow-xs' 
                  : 'text-[#78706a] hover:bg-[#faf5ee] hover:text-[#2b2622]'
              }`}
              title={isPlainWhite ? 'Canvas Background: Plain White (Click to switch to Warm Grid)' : 'Canvas Background: Warm Grid (Click to switch to Plain White)'}
            >
              <div className={`w-3.5 h-3.5 rounded-xs border transition-colors ${isPlainWhite ? 'border-white bg-white shadow-xs' : 'border-[#8f8377] bg-[#faf5ee]'}`} />
              <span className="font-mono text-[11px]">Plain White</span>
            </button>
          </aside>
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
