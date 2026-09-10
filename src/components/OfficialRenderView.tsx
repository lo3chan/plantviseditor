import React, { useState, useEffect, useRef } from 'react';
import { 
  getPlantUMLSvgUrl, 
  getPlantUMLPngUrl 
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
  Palette
} from 'lucide-react';
import { GlobalCanvasSettings } from '../types';
import { PlantUMLStylePanel } from './PlantUMLStylePanel';

interface OfficialRenderViewProps {
  code: string;
  settings?: GlobalCanvasSettings;
  onUpdateSettings?: (patch: Partial<GlobalCanvasSettings>) => void;
  isSequenceDiagram?: boolean;
}

export const OfficialRenderView: React.FC<OfficialRenderViewProps> = ({ 
  code,
  settings,
  onUpdateSettings,
  isSequenceDiagram = false
}) => {
  const [svgUrl, setSvgUrl] = useState<string>('');
  const [pngUrl, setPngUrl] = useState<string>('');
  const [svgContent, setSvgContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [zoom, setZoom] = useState<number>(1);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [copiedSvg, setCopiedSvg] = useState<boolean>(false);
  const [copiedPng, setCopiedPng] = useState<boolean>(false);
  const [isCopyingPng, setIsCopyingPng] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isStylePanelOpen, setIsStylePanelOpen] = useState<boolean>(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        setError(false);
        setErrorDetails('');
        const sUrl = getPlantUMLSvgUrl(code);
        const pUrl = getPlantUMLPngUrl(code);
        setSvgUrl(sUrl);
        setPngUrl(pUrl);

        // Fetch SVG directly for inline crispness and error parsing
        const res = await fetch(sUrl);
        const text = await res.text();
        
        if (res.status === 200 && !text.includes('Syntax Error')) {
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
        // If fetch fails (e.g. offline or transient network), fallback to img tag with sUrl
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
  }, [code, refreshKey]);

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

  return (
    <div className="w-full h-full flex overflow-hidden relative bg-[#faf5ee]">
      {/* SVG Canvas Area */}
      <div className="flex-1 h-full flex flex-col relative overflow-hidden">
        {/* Top Floating Control Bar */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-[#d8d0c8] p-1.5 rounded-xl shadow-md text-xs select-none">
          <span className="text-[11px] font-semibold text-[#78706a] px-2 border-r border-[#d8d0c8] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            PlantUML Server Engine
          </span>

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

          {/* Zoom Controls */}
          <button
            onClick={() => setZoom(z => Math.max(0.4, +(z - 0.2).toFixed(1)))}
            className="p-1 rounded-lg hover:bg-[#faf5ee] text-[#3a302a] transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-[#78706a] min-w-[40px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(z => Math.min(3, +(z + 0.2).toFixed(1)))}
            className="p-1 rounded-lg hover:bg-[#faf5ee] text-[#3a302a] transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1 rounded-lg hover:bg-[#faf5ee] text-[#3a302a] transition-colors cursor-pointer"
            title="Reset Zoom"
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

        {/* SVG Canvas Area with Locked 1-1 Brick Texture */}
        <div 
          className="flex-1 overflow-auto flex items-center justify-center p-8 relative canvas-brick-bg"
        >
          {loading && (
            <div className="absolute top-6 left-6 z-10 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-xs rounded-lg border border-[#d8d0c8] shadow-xs text-xs text-[#78706a]">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c2652a]" />
              <span>Rendering official PlantUML SVG...</span>
            </div>
          )}

          {error ? (
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
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setRefreshKey(k => k + 1)}
                  className="px-3.5 py-1.5 bg-[#c2652a] text-white text-xs font-medium rounded-lg hover:bg-[#a95420] transition-colors cursor-pointer"
                >
                  Retry Render
                </button>
              </div>
            </div>
          ) : (
            <div 
              className="transition-transform duration-100 origin-center bg-white p-6 rounded-2xl shadow-xl border border-[#d8d0c8]/80 max-w-[95%] max-h-[90%] overflow-auto relative"
              style={{ transform: `scale(${zoom})` }}
            >
              {svgContent && svgContent.includes('<svg') ? (
                <div 
                  className="w-full h-full flex items-center justify-center [&>svg]:max-w-none [&>svg]:transition-opacity"
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              ) : (
                svgUrl && (
                  <img
                    key={svgUrl}
                    src={svgUrl}
                    alt="PlantUML Diagram Render"
                    className="max-w-none transition-opacity"
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
          )}
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
