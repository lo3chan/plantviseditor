import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Image as ImageIcon, 
  Code, 
  FileCode2 
} from 'lucide-react';
import { DiagramData } from '../types';
import { generatePlantUML } from '../utils/plantumlGenerator';
import { getPlantUMLPngUrl, getPlantUMLSvgUrl } from '../utils/plantumlEncoder';

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
  const [copied, setCopied] = useState(false);
  const pumlCode = generatePlantUML(diagram);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pumlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPuml = () => {
    const blob = new Blob([pumlCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${diagram.title.toLowerCase().replace(/\s+/g, '_')}.puml`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSvg = () => {
    const url = getPlantUMLSvgUrl(pumlCode);
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = `${diagram.title.toLowerCase().replace(/\s+/g, '_')}.svg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  const handleDownloadPng = () => {
    const url = getPlantUMLPngUrl(pumlCode);
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = `${diagram.title.toLowerCase().replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
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

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#faf5ee] border border-[#d8d0c8] rounded-2xl max-w-lg w-full shadow-xl overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-[#d8d0c8]/60 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-semibold text-[#3a302a]">
              Export Diagram
            </h2>
            <p className="text-xs text-[#78706a]">Save your PlantUML model or generate image assets</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#78706a] hover:text-[#3a302a] hover:bg-[#eae2da] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3">
          {/* Option 1: PlantUML File (.puml) */}
          <div className="p-3 bg-white rounded-xl border border-[#d8d0c8]/70 hover:border-[#c2652a] flex items-center justify-between transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#fdf2ea] border border-[#e8a87c] flex items-center justify-center text-[#c2652a]">
                <FileCode2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#3a302a]">PlantUML Source (.puml)</div>
                <div className="text-[11px] text-[#78706a]">Standard syntax compatible with all PlantUML tools</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1.5 rounded-lg border border-[#d8d0c8] text-xs font-medium text-[#3a302a] hover:text-[#c2652a] hover:border-[#c2652a] flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
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

          {/* Option 2: Rendered Vector SVG */}
          <div className="p-3 bg-white rounded-xl border border-[#d8d0c8]/70 hover:border-[#c2652a] flex items-center justify-between transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#fef7eb] border border-[#e5bf7e] flex items-center justify-center text-[#b87d28]">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#3a302a]">Vector Graphic (SVG)</div>
                <div className="text-[11px] text-[#78706a]">High-resolution vector for documentation and presentations</div>
              </div>
            </div>
            <button
              onClick={handleDownloadSvg}
              className="px-3 py-1.5 rounded-lg bg-[#f2ece4] text-[#3a302a] hover:bg-white hover:text-[#c2652a] border border-[#d8d0c8] text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Open SVG</span>
            </button>
          </div>

          {/* Option 3: PNG Image */}
          <div className="p-3 bg-white rounded-xl border border-[#d8d0c8]/70 hover:border-[#c2652a] flex items-center justify-between transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#f0f6f1] border border-[#a6c6ab] flex items-center justify-center text-[#587a5f]">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#3a302a]">High-Res Raster (PNG)</div>
                <div className="text-[11px] text-[#78706a]">Rendered image with standard styling</div>
              </div>
            </div>
            <button
              onClick={handleDownloadPng}
              className="px-3 py-1.5 rounded-lg bg-[#f2ece4] text-[#3a302a] hover:bg-white hover:text-[#c2652a] border border-[#d8d0c8] text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Open PNG</span>
            </button>
          </div>

          {/* Option 4: Project JSON */}
          <div className="p-3 bg-white rounded-xl border border-[#d8d0c8]/70 hover:border-[#c2652a] flex items-center justify-between transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#f0f3f6] border border-[#aeb6c4] flex items-center justify-center text-[#5c6470]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#3a302a]">Studio Project Backup (JSON)</div>
                <div className="text-[11px] text-[#78706a]">Save complete coordinates, styles, and view mode state</div>
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
        <div className="p-3 border-t border-[#d8d0c8]/60 bg-[#f6f0e8]/50 flex justify-end">
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
