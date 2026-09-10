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
  Loader2
} from 'lucide-react';

interface OfficialRenderViewProps {
  code: string;
}

export const OfficialRenderView: React.FC<OfficialRenderViewProps> = ({ code }) => {
  const [svgUrl, setSvgUrl] = useState<string>('');
  const [pngUrl, setPngUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setLoading(true);
    debounceTimerRef.current = setTimeout(() => {
      try {
        setError(false);
        const sUrl = getPlantUMLSvgUrl(code);
        const pUrl = getPlantUMLPngUrl(code);
        setSvgUrl(sUrl);
        setPngUrl(pUrl);
      } catch (e) {
        setError(true);
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadSvg = () => {
    if (!svgUrl) return;
    const a = document.createElement('a');
    a.href = svgUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.download = 'plantuml_diagram.svg';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDownloadPng = () => {
    if (!pngUrl) return;
    const a = document.createElement('a');
    a.href = pngUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.download = 'plantuml_diagram.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-[#faf5ee]">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-[#d8d0c8] p-1.5 rounded-xl shadow-md text-xs select-none">
        <span className="text-[11px] font-semibold text-[#78706a] px-2 border-r border-[#d8d0c8] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          PlantUML Server Engine
        </span>

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

        <div className="w-px h-4 bg-[#d8d0c8] mx-1" />

        {/* Reload button */}
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="p-1 rounded-lg hover:bg-[#faf5ee] text-[#3a302a] transition-colors cursor-pointer"
          title="Refresh diagram render"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#c2652a]' : ''}`} />
        </button>

        {/* Copy SVG URL */}
        <button
          onClick={handleCopyUrl}
          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#faf5ee] text-[#3a302a] transition-colors cursor-pointer"
          title="Copy direct PlantUML SVG URL"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#78706a]" />}
          <span className="text-[11px]">Copy URL</span>
        </button>

        {/* Download SVG */}
        <button
          onClick={handleDownloadSvg}
          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#faf5ee] text-[#3a302a] transition-colors cursor-pointer"
          title="Download official SVG vector"
        >
          <Download className="w-3.5 h-3.5 text-[#78706a]" />
          <span className="text-[11px]">SVG</span>
        </button>

        {/* Download PNG */}
        <button
          onClick={handleDownloadPng}
          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#faf5ee] text-[#3a302a] transition-colors cursor-pointer"
          title="Download official PNG image"
        >
          <Download className="w-3.5 h-3.5 text-[#78706a]" />
          <span className="text-[11px]">PNG</span>
        </button>

        {/* Open in new tab */}
        {svgUrl && (
          <a
            href={svgUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#c2652a] text-white hover:bg-[#a95420] transition-colors cursor-pointer font-medium shadow-xs"
            title="Open raw SVG in new tab"
          >
            <span className="text-[11px]">Open Link</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* SVG Canvas Area with 1-1 Brick Texture */}
      <div 
        className="flex-1 overflow-auto flex items-center justify-center p-8 relative"
        style={{
          backgroundColor: '#faf5ee',
          backgroundImage: `
            linear-gradient(335deg, rgba(194, 101, 42, 0.04) 23px, transparent 23px),
            linear-gradient(155deg, rgba(194, 101, 42, 0.04) 23px, transparent 23px),
            linear-gradient(335deg, rgba(194, 101, 42, 0.04) 23px, transparent 23px),
            linear-gradient(155deg, rgba(194, 101, 42, 0.04) 23px, transparent 23px)
          `,
          backgroundSize: '58px 58px',
          backgroundPosition: '0px 2px, 4px 35px, 29px 31px, 34px 6px'
        }}
      >
        {loading && (
          <div className="absolute top-6 left-6 z-10 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-xs rounded-lg border border-[#d8d0c8] shadow-xs text-xs text-[#78706a]">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c2652a]" />
            <span>Rendering diagram...</span>
          </div>
        )}

        {error ? (
          <div className="flex flex-col items-center gap-2 p-6 bg-white/95 rounded-2xl border border-rose-300 text-rose-700 shadow-lg">
            <AlertCircle className="w-8 h-8 text-rose-500" />
            <span className="font-semibold text-sm">Failed to generate PlantUML server preview</span>
            <span className="text-xs text-[#78706a]">Check your PlantUML syntax in the code editor</span>
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              className="mt-2 px-3 py-1 bg-[#c2652a] text-white text-xs rounded-lg hover:bg-[#a95420] transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div 
            className="transition-transform duration-100 origin-center bg-white p-6 rounded-2xl shadow-xl border border-[#d8d0c8]/80 max-w-[95%] max-h-[90%] overflow-auto relative"
            style={{ transform: `scale(${zoom})` }}
          >
            {svgUrl && (
              <img
                key={svgUrl}
                src={svgUrl}
                alt="PlantUML Diagram Render"
                className="max-w-none transition-opacity"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setError(true);
                  setLoading(false);
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
