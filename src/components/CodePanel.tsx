import React, { useState, useEffect, useRef } from 'react';
import { 
  Copy, 
  Check, 
  Download, 
  Play, 
  Sparkles,
  FileCode,
  RotateCcw,
  Zap,
  Info
} from 'lucide-react';

interface CodePanelProps {
  code: string;
  onApplyCode: (newCode: string) => void;
  isSplitView?: boolean;
  onClose?: () => void;
}

export const CodePanel: React.FC<CodePanelProps> = ({
  code,
  onApplyCode,
  isSplitView = false,
  onClose
}) => {
  const [editableCode, setEditableCode] = useState(code);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('Synced');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync external code changes when not actively typing
  useEffect(() => {
    setEditableCode(code);
  }, [code]);

  // Debounced auto-apply while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (editableCode !== code) {
        onApplyCode(editableCode);
        setStatusMessage('Auto-compiled');
        setTimeout(() => setStatusMessage('Synced'), 1500);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [editableCode, code, onApplyCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editableCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([editableCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'diagram.puml';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleManualApply = () => {
    onApplyCode(editableCode);
    setStatusMessage('Applied!');
    setTimeout(() => setStatusMessage('Synced'), 1500);
  };

  // Helper to insert snippets into code
  const insertSnippet = (snippet: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      const updated = editableCode.replace('@enduml', `${snippet}\n@enduml`);
      setEditableCode(updated);
      onApplyCode(updated);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = editableCode.substring(0, start);
    const after = editableCode.substring(end);

    const updated = before + snippet + after;
    setEditableCode(updated);
    onApplyCode(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 50);
  };

  const lineCount = editableCode.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);

  return (
    <aside className={`h-[calc(100vh-3.5rem)] bg-[#2b2520] text-[#faf5ee] flex flex-col z-20 select-none shadow-md ${
      isSplitView ? 'w-full h-full border-r border-[#453c35]' : 'w-[440px] border-l border-[#453c35]'
    }`}>
      {/* Editor Header */}
      <div className="p-2.5 border-b border-[#453c35] bg-[#241f1a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-[#c2652a]" />
          <span className="text-xs font-semibold text-[#faf5ee] tracking-wide">PlantUML Script Editor</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#3a3028] text-[#c2652a] font-mono">
            {statusMessage}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleManualApply}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#c2652a] text-white hover:bg-[#a95420] text-[11px] font-semibold rounded transition-colors shadow-2xs cursor-pointer"
            title="Compile PlantUML to canvas immediately"
          >
            <Play className="w-3 h-3" />
            <span>Compile</span>
          </button>

          <button
            onClick={handleCopy}
            className="p-1 rounded bg-[#3a3028] hover:bg-[#453c35] text-[#d8d0c8] hover:text-white transition-colors cursor-pointer"
            title="Copy PlantUML Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-1 rounded bg-[#3a3028] hover:bg-[#453c35] text-[#d8d0c8] hover:text-white transition-colors cursor-pointer"
            title="Download .puml File"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Snippet Inserter Toolbar */}
      <div className="px-2.5 py-1.5 bg-[#1f1a16] border-b border-[#453c35] flex items-center gap-1 overflow-x-auto scrollbar-none text-[11px]">
        <span className="text-[10px] uppercase font-bold text-[#8a7f75] mr-1 shrink-0">Insert:</span>
        <button
          onClick={() => insertSnippet('\nclass NewClass {\n  +id: Long\n  +name: String\n  --\n  +process(): void\n}\n')}
          className="px-2 py-0.5 rounded bg-[#322a24] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
        >
          + class
        </button>
        <button
          onClick={() => insertSnippet('\ninterface IService {\n  +handle(): Result\n}\n')}
          className="px-2 py-0.5 rounded bg-[#322a24] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
        >
          + interface
        </button>
        <button
          onClick={() => insertSnippet('\nentity TableName {\n  *id : Long\n  --\n  #user_id : Long\n  created_at : Timestamp\n}\n')}
          className="px-2 py-0.5 rounded bg-[#322a24] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
        >
          + entity (ER)
        </button>
        <button
          onClick={() => insertSnippet('\nmap ConfigMap {\n  host => "127.0.0.1"\n  port => 8080\n  env => "prod"\n}\n')}
          className="px-2 py-0.5 rounded bg-[#322a24] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
        >
          + map
        </button>
        <button
          onClick={() => insertSnippet('\njson ConfigJson {\n  "version": "1.0",\n  "enabled": true\n}\n')}
          className="px-2 py-0.5 rounded bg-[#322a24] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
        >
          + json
        </button>
        <button
          onClick={() => insertSnippet('\nskinparam linetype ortho\n')}
          className="px-2 py-0.5 rounded bg-[#322a24] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
        >
          + ortho
        </button>
        <button
          onClick={() => insertSnippet('\n[ServiceComponent] as svc\n')}
          className="px-2 py-0.5 rounded bg-[#322a24] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
        >
          + [comp]
        </button>
        <button
          onClick={() => insertSnippet('\ndatabase "Database" as db\n')}
          className="px-2 py-0.5 rounded bg-[#322a24] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
        >
          + db
        </button>
        <button
          onClick={() => insertSnippet('\ncloud "AWS Gateway" as cloud\n')}
          className="px-2 py-0.5 rounded bg-[#322a24] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
        >
          + cloud
        </button>
        <button
          onClick={() => insertSnippet('\nnode "Server Node" as srv\n')}
          className="px-2 py-0.5 rounded bg-[#322a24] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
        >
          + node
        </button>
        <button
          onClick={() => insertSnippet('\nnote "Important note" as n1\n')}
          className="px-2 py-0.5 rounded bg-[#322a24] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
        >
          + note
        </button>
        <button
          onClick={() => insertSnippet('\nSource --> Target : calls\n')}
          className="px-2 py-0.5 rounded bg-[#322a24] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
        >
          --&gt;
        </button>
        <button
          onClick={() => insertSnippet('\nParent <|-- Child\n')}
          className="px-2 py-0.5 rounded bg-[#322a24] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
        >
          &lt;|--
        </button>
        <button
          onClick={() => insertSnippet('\nTableA ||--|{ TableB : has\n')}
          className="px-2 py-0.5 rounded bg-[#322a24] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
        >
          ||--|&#123;
        </button>
      </div>

      {/* Editor Body with Line Numbers */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Line Numbers */}
        <div className="w-10 py-3 pr-2 select-none text-right font-mono text-[11px] text-[#6d6257] bg-[#241f1a] border-r border-[#3a3028] overflow-hidden">
          {lineNumbers.map(n => (
            <div key={n} className="leading-5 h-5">
              {n}
            </div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={editableCode}
          onChange={(e) => setEditableCode(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleManualApply();
            }
          }}
          className="flex-1 p-3 bg-transparent text-[#faf5ee] font-mono text-xs leading-5 outline-none resize-none overflow-y-auto selection:bg-[#c2652a]/40"
          spellCheck={false}
          placeholder="@startuml&#10;...&#10;@enduml"
        />
      </div>

      {/* Footer Info */}
      <div className="px-3 py-1.5 bg-[#1f1a16] border-t border-[#453c35] text-[11px] text-[#8a7f75] flex items-center justify-between">
        <span>PlantUML 1:1 Live Sync Active</span>
        <span className="font-mono text-[10px]">Ctrl+Enter to compile</span>
      </div>
    </aside>
  );
};
