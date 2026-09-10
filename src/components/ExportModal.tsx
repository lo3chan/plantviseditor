import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Image as ImageIcon, 
  Code, 
  FileCode2,
  Terminal,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { DiagramData } from '../types';
import { generatePlantUML } from '../utils/plantumlGenerator';
import { 
  getPlantUMLPngUrl, 
  getPlantUMLSvgUrl, 
  getPlantUMLTxtUrl, 
  fetchPlantUMLAscii, 
  convertToPureAscii, 
  generateLocalAsciiFallback 
} from '../utils/plantumlEncoder';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagram: DiagramData;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  diagram
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAscii, setCopiedAscii] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [copiedSvgCode, setCopiedSvgCode] = useState(false);
  const [copiedPngImage, setCopiedPngImage] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [isDownloadingSvg, setIsDownloadingSvg] = useState(false);
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);
  const [isCopyingPng, setIsCopyingPng] = useState(false);
  
  // ASCII art states
  const [showAsciiPreview, setShowAsciiPreview] = useState(false);
  const [asciiArt, setAsciiArt] = useState<string | null>(null);
  const [isLoadingAscii, setIsLoadingAscii] = useState(false);
  const [asciiError, setAsciiError] = useState<string | null>(null);
  const [asciiFormat, setAsciiFormat] = useState<'unicode' | 'pure'>('unicode');
  const [wrapAscii, setWrapAscii] = useState(false);

  const pumlCode = generatePlantUML(diagram);
  const svgUrl = getPlantUMLSvgUrl(pumlCode);
  const pngUrl = getPlantUMLPngUrl(pumlCode);

  // Fetch ASCII art from PlantUML server when modal opens or preview is requested
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingAscii(true);
    setAsciiError(null);

    fetchPlantUMLAscii(pumlCode)
      .then((text) => {
        if (isMounted) {
          setAsciiArt(text);
          setIsLoadingAscii(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('PlantUML remote ASCII fetch failed, falling back to local ASCII generator:', err);
          // Fallback to local ASCII generator
          const localFallback = generateLocalAsciiFallback(diagram);
          setAsciiArt(localFallback);
          setAsciiError('Rendered using local ASCII engine (PlantUML server unreachable)');
          setIsLoadingAscii(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, pumlCode, diagram]);

  if (!isOpen) return null;

  const getEffectiveAscii = (): string => {
    const raw = asciiArt || generateLocalAsciiFallback(diagram);
    return asciiFormat === 'pure' ? convertToPureAscii(raw) : raw;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pumlCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyAscii = () => {
    const text = getEffectiveAscii();
    navigator.clipboard.writeText(text);
    setCopiedAscii(true);
    setTimeout(() => setCopiedAscii(false), 2000);
  };

  const handleCopyMarkdown = () => {
    const text = getEffectiveAscii();
    const markdown = `\`\`\`text\n${text}\n\`\`\``;
    navigator.clipboard.writeText(markdown);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  const safeFilename = (suffix: string, ext: string) => {
    const base = (diagram.title || 'diagram').toLowerCase().replace(/[^a-z0-9_-]/gi, '_') || 'diagram';
    return suffix ? `${base}_${suffix}.${ext}` : `${base}.${ext}`;
  };

  const handleDownloadPuml = () => {
    const blob = new Blob([pumlCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeFilename('', 'puml');
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAscii = () => {
    const text = getEffectiveAscii();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeFilename('ascii', 'txt');
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSvg = async () => {
    if (!svgUrl) return;
    setIsDownloadingSvg(true);
    try {
      const response = await fetch(svgUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = safeFilename('', 'svg');
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      // Fallback: direct window open if cross-origin fetch is blocked
      window.open(svgUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setIsDownloadingSvg(false);
    }
  };

  const handleCopySvgCode = async () => {
    if (!svgUrl) return;
    try {
      const res = await fetch(svgUrl);
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopiedSvgCode(true);
      setTimeout(() => setCopiedSvgCode(false), 2000);
    } catch {
      await navigator.clipboard.writeText(svgUrl);
      setCopiedSvgCode(true);
      setTimeout(() => setCopiedSvgCode(false), 2000);
    }
  };

  const handleDownloadPng = async () => {
    if (!pngUrl) return;
    setIsDownloadingPng(true);
    try {
      const response = await fetch(pngUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = safeFilename('', 'png');
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      // Fallback
      window.open(pngUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setIsDownloadingPng(false);
    }
  };

  const handleCopyPngImage = async () => {
    if (!pngUrl) return;
    setIsCopyingPng(true);
    try {
      const response = await fetch(pngUrl);
      const blob = await response.blob();
      // Ensure it's image/png type
      const pngBlob = blob.type === 'image/png' ? blob : new Blob([blob], { type: 'image/png' });
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob })
      ]);
      setCopiedPngImage(true);
      setTimeout(() => setCopiedPngImage(false), 2000);
    } catch (err) {
      console.warn('Clipboard image write failed, copying direct image URL:', err);
      await navigator.clipboard.writeText(pngUrl);
      setCopiedPngImage(true);
      setTimeout(() => setCopiedPngImage(false), 2000);
    } finally {
      setIsCopyingPng(false);
    }
  };

  const handleCopyEmbedMarkdown = () => {
    if (!svgUrl) return;
    const md = `![${diagram.title}](${svgUrl})`;
    navigator.clipboard.writeText(md);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(diagram, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${diagram.title.toLowerCase().replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleRetryAscii = () => {
    setIsLoadingAscii(true);
    setAsciiError(null);
    fetchPlantUMLAscii(pumlCode)
      .then((text) => {
        setAsciiArt(text);
        setIsLoadingAscii(false);
      })
      .catch((err) => {
        console.warn('PlantUML ASCII retry failed:', err);
        const localFallback = generateLocalAsciiFallback(diagram);
        setAsciiArt(localFallback);
        setAsciiError('Rendered using local ASCII engine');
        setIsLoadingAscii(false);
      });
  };

  const officialTxtUrl = getPlantUMLTxtUrl(pumlCode);

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#faf5ee] border border-[#d8d0c8] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-[#d8d0c8]/60 flex items-center justify-between bg-white/60">
          <div>
            <h2 className="font-serif text-lg font-semibold text-[#3a302a] flex items-center gap-2">
              <span>Export Diagram</span>
              <span className="text-[10px] bg-[#A80036]/10 text-[#A80036] font-mono px-2 py-0.5 rounded-full font-bold uppercase">
                PlantUML Native
              </span>
            </h2>
            <p className="text-xs text-[#78706a]">Save your model as ASCII text art, vectors, rasters, or source syntax</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#78706a] hover:text-[#3a302a] hover:bg-[#eae2da] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          
          {/* Featured Option: ASCII / Plain Text Diagram Art */}
          <div className="p-3.5 bg-white rounded-xl border border-[#A80036]/40 shadow-xs hover:border-[#A80036] transition-all flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#fbf0f3] border border-[#A80036]/30 flex items-center justify-center text-[#A80036] shadow-2xs">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1c1917] flex items-center gap-1.5">
                    <span>ASCII / Plain Text Art (.txt)</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded">
                      Supported
                    </span>
                  </div>
                  <div className="text-[11px] text-[#78706a]">
                    Monospace text art diagram for READMEs, code comments, and CLI terminals
                  </div>
                </div>
              </div>

              {/* Action Buttons on Row */}
              <div className="flex items-center gap-1.5">
                <button
                  id="btn-toggle-ascii-preview"
                  onClick={() => setShowAsciiPreview(!showAsciiPreview)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors ${
                    showAsciiPreview 
                      ? 'bg-[#A80036]/10 text-[#A80036] border-[#A80036]/40' 
                      : 'border-[#d8d0c8] text-[#3a302a] hover:bg-[#faf5ee] hover:text-[#A80036]'
                  }`}
                  title="Toggle interactive ASCII preview"
                >
                  {showAsciiPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>{showAsciiPreview ? 'Hide' : 'Preview'}</span>
                </button>

                <button
                  id="btn-copy-ascii"
                  onClick={handleCopyAscii}
                  className="px-2.5 py-1.5 rounded-lg border border-[#d8d0c8] text-xs font-medium text-[#3a302a] hover:text-[#A80036] hover:border-[#A80036] flex items-center gap-1 transition-colors"
                  title="Copy plain ASCII text to clipboard"
                >
                  {copiedAscii ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAscii ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  id="btn-download-ascii"
                  onClick={handleDownloadAscii}
                  className="px-2.5 py-1.5 rounded-lg bg-[#A80036] text-white text-xs font-semibold hover:bg-[#8e002e] flex items-center gap-1 transition-colors shadow-xs"
                  title="Download .txt ASCII diagram"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .txt</span>
                </button>
              </div>
            </div>

            {/* Expandable ASCII Viewer Panel */}
            {showAsciiPreview && (
              <div className="mt-1 pt-2.5 border-t border-[#f2ece4] flex flex-col gap-2 animate-in fade-in duration-150">
                {/* Controls Bar for ASCII Viewer */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {/* Unicode vs Pure ASCII Mode Switch */}
                    <div className="flex items-center bg-[#faf5ee] p-0.5 rounded-lg border border-[#d8d0c8]">
                      <button
                        onClick={() => setAsciiFormat('unicode')}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          asciiFormat === 'unicode' ? 'bg-white font-bold text-[#A80036] shadow-2xs' : 'text-[#78706a] hover:text-[#1c1917]'
                        }`}
                        title="Render with smooth Unicode box lines (┌─┐│└─┘)"
                      >
                        Unicode Box Lines
                      </button>
                      <button
                        onClick={() => setAsciiFormat('pure')}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          asciiFormat === 'pure' ? 'bg-white font-bold text-[#A80036] shadow-2xs' : 'text-[#78706a] hover:text-[#1c1917]'
                        }`}
                        title="Render with strict 7-bit standard ASCII characters (+, -, |)"
                      >
                        Standard 7-bit ASCII
                      </button>
                    </div>

                    <label className="flex items-center gap-1 text-[11px] text-[#78706a] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wrapAscii}
                        onChange={(e) => setWrapAscii(e.target.checked)}
                        className="rounded border-[#d8d0c8] text-[#A80036] focus:ring-[#A80036]"
                      />
                      <span>Soft wrap</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCopyMarkdown}
                      className="px-2 py-1 rounded-md text-[11px] font-medium text-[#3a302a] hover:bg-[#faf5ee] border border-[#d8d0c8] flex items-center gap-1 transition-colors"
                      title="Copy diagram wrapped in markdown code block (```text ... ```)"
                    >
                      {copiedMarkdown ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedMarkdown ? 'Markdown Copied!' : 'Copy Markdown'}</span>
                    </button>

                    {officialTxtUrl && (
                      <a
                        href={officialTxtUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded-md text-[11px] font-medium text-[#78706a] hover:text-[#A80036] hover:bg-[#faf5ee] border border-transparent hover:border-[#d8d0c8] flex items-center gap-1 transition-colors"
                        title="View raw plain text output on plantuml.com server"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Raw PlantUML TXT</span>
                      </a>
                    )}

                    <button
                      onClick={handleRetryAscii}
                      disabled={isLoadingAscii}
                      className="p-1 rounded text-[#78706a] hover:text-[#1c1917] hover:bg-[#faf5ee]"
                      title="Re-generate ASCII from PlantUML server"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAscii ? 'animate-spin text-[#A80036]' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Notice message if using local fallback */}
                {asciiError && (
                  <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 flex items-center justify-between">
                    <span>{asciiError}</span>
                    <button onClick={handleRetryAscii} className="underline hover:text-amber-900 font-semibold">
                      Retry Server
                    </button>
                  </div>
                )}

                {/* Preformatted Terminal Box */}
                <div className="relative">
                  {isLoadingAscii && (
                    <div className="absolute inset-0 bg-[#161b22]/70 backdrop-blur-xs rounded-xl flex items-center justify-center text-xs text-emerald-400 gap-2 z-10">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating ASCII diagram with PlantUML...</span>
                    </div>
                  )}

                  <pre 
                    className={`font-mono text-[11px] leading-snug p-3 bg-[#161b22] text-[#e6edf3] border border-[#30363d] rounded-xl max-h-60 overflow-auto select-all shadow-inner ${
                      wrapAscii ? 'whitespace-pre-wrap' : 'whitespace-pre'
                    }`}
                  >
                    {getEffectiveAscii()}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Option 2: PlantUML Source File (.puml) */}
          <div className="p-3 bg-white rounded-xl border border-[#d8d0c8]/70 hover:border-[#c2652a] flex items-center justify-between transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#fdf2ea] border border-[#e8a87c] flex items-center justify-center text-[#c2652a]">
                <FileCode2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#3a302a]">PlantUML Source (.puml)</div>
                <div className="text-[11px] text-[#78706a]">Standard syntax compatible with all PlantUML tools and plugins</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1.5 rounded-lg border border-[#d8d0c8] text-xs font-medium text-[#3a302a] hover:text-[#c2652a] hover:border-[#c2652a] flex items-center gap-1 transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownloadPuml}
                className="px-2.5 py-1.5 rounded-lg bg-[#c2652a] text-white text-xs font-medium hover:bg-[#a95420] flex items-center gap-1 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Option 3: Rendered Vector SVG */}
          <div className="p-3 bg-white rounded-xl border border-[#d8d0c8]/70 hover:border-[#c2652a] flex items-center justify-between transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#fef7eb] border border-[#e5bf7e] flex items-center justify-center text-[#b87d28]">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#3a302a]">Vector Graphic (SVG)</div>
                <div className="text-[11px] text-[#78706a]">High-resolution vector for documentation, papers, and web embedding</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                id="btn-copy-svg-code"
                onClick={handleCopySvgCode}
                className="px-2.5 py-1.5 rounded-lg border border-[#d8d0c8] text-xs font-medium text-[#3a302a] hover:text-[#c2652a] hover:border-[#c2652a] flex items-center gap-1 transition-colors"
                title="Copy raw SVG markup XML to clipboard"
              >
                {copiedSvgCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSvgCode ? 'Copied' : 'Copy SVG'}</span>
              </button>
              <button
                id="btn-download-svg"
                onClick={handleDownloadSvg}
                disabled={isDownloadingSvg}
                className="px-2.5 py-1.5 rounded-lg bg-[#b87d28] text-white text-xs font-medium hover:bg-[#96641e] flex items-center gap-1 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                title="Download .svg vector file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isDownloadingSvg ? 'Saving...' : 'Download'}</span>
              </button>
              {svgUrl && (
                <a
                  href={svgUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-[#78706a] hover:text-[#3a302a] hover:bg-[#f2ece4] transition-colors"
                  title="Open raw SVG in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Option 4: PNG Image */}
          <div className="p-3 bg-white rounded-xl border border-[#d8d0c8]/70 hover:border-[#c2652a] flex items-center justify-between transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#f0f6f1] border border-[#a6c6ab] flex items-center justify-center text-[#587a5f]">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#3a302a]">High-Res Raster (PNG)</div>
                <div className="text-[11px] text-[#78706a]">Rendered raster graphic for slides, Figma, Slack, and chats</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                id="btn-copy-png-image"
                onClick={handleCopyPngImage}
                disabled={isCopyingPng}
                className="px-2.5 py-1.5 rounded-lg border border-[#d8d0c8] text-xs font-medium text-[#3a302a] hover:text-[#587a5f] hover:border-[#587a5f] flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                title="Copy PNG image directly to clipboard for pasting into Slack, Figma, Word, or Docs"
              >
                {copiedPngImage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPngImage ? 'Image Copied!' : isCopyingPng ? 'Copying...' : 'Copy Image'}</span>
              </button>
              <button
                id="btn-download-png"
                onClick={handleDownloadPng}
                disabled={isDownloadingPng}
                className="px-2.5 py-1.5 rounded-lg bg-[#587a5f] text-white text-xs font-medium hover:bg-[#435e49] flex items-center gap-1 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                title="Download .png file directly to your computer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isDownloadingPng ? 'Saving...' : 'Download'}</span>
              </button>
              {pngUrl && (
                <a
                  href={pngUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-[#78706a] hover:text-[#3a302a] hover:bg-[#f2ece4] transition-colors"
                  title="Open PNG in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Option 5: Markdown / Web Embed Link */}
          <div className="p-3 bg-white rounded-xl border border-[#d8d0c8]/70 hover:border-[#c2652a] flex items-center justify-between transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#fbf0ea] border border-[#f0c2a8] flex items-center justify-center text-[#c2652a]">
                <ExternalLink className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#3a302a]">Markdown Image Link</div>
                <div className="text-[11px] text-[#78706a]">Ready-to-paste markdown code: <code className="bg-[#f2ece4] px-1 py-0.5 rounded text-[10px]">![diagram](url)</code></div>
              </div>
            </div>
            <button
              id="btn-copy-embed-md"
              onClick={handleCopyEmbedMarkdown}
              className="px-2.5 py-1.5 rounded-lg border border-[#d8d0c8] text-xs font-medium text-[#3a302a] hover:text-[#c2652a] hover:border-[#c2652a] flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copiedEmbed ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedEmbed ? 'Link Copied!' : 'Copy Link'}</span>
            </button>
          </div>

          {/* Option 6: Project JSON */}
          <div className="p-3 bg-white rounded-xl border border-[#d8d0c8]/70 hover:border-[#c2652a] flex items-center justify-between transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#f0f3f6] border border-[#aeb6c4] flex items-center justify-center text-[#5c6470]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#3a302a]">Studio Project Backup (JSON)</div>
                <div className="text-[11px] text-[#78706a]">Save complete node coordinates, layouts, and editor state</div>
              </div>
            </div>
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-lg bg-[#f2ece4] text-[#3a302a] hover:bg-white hover:text-[#c2652a] border border-[#d8d0c8] text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save JSON</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-[#d8d0c8]/60 bg-[#f6f0e8]/50 flex items-center justify-between text-xs">
          <span className="text-[#78706a] text-[11px] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#A80036]" />
            Official PlantUML ASCII engine enabled
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-[#78706a] hover:text-[#3a302a] hover:bg-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

