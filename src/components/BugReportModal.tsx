/**
 * src/components/BugReportModal.tsx
 * Comprehensive Bug Submission, Diagnostic Telemetry, and Desktop Volume Clone Modal.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bug, 
  X, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  FileCode, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  Download, 
  HardDrive, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight,
  Copy,
  Check,
  FolderArchive
} from 'lucide-react';
import { debugLogger, LogEntry } from '../utils/debugLogger';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  pumlCode: string;
  diagramState?: any;
  diagramTitle?: string;
}

type SeverityLevel = 'low' | 'medium' | 'high' | 'blocker';

interface AttachedFile {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
}

interface SubmittedReport {
  id: string;
  folderName: string;
  title: string;
  severity: SeverityLevel;
  createdAt: string;
  attachments?: Array<{ name: string; size: number }>;
}

export const BugReportModal: React.FC<BugReportModalProps> = ({
  isOpen,
  onClose,
  pumlCode,
  diagramState,
  diagramTitle
}) => {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<SeverityLevel>('medium');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  
  // Checkbox inclusions
  const [includePuml, setIncludePuml] = useState(true);
  const [includeState, setIncludeState] = useState(true);
  const [includeLogs, setIncludeLogs] = useState(true);

  // Debug Log Inspector State
  const [isLogsExpanded, setIsLogsExpanded] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'warn'>('all');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<{ id: string; folderName: string } | null>(null);

  // History State
  const [historyReports, setHistoryReports] = useState<SubmittedReport[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [copiedSyncCmd, setCopiedSyncCmd] = useState(false);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load logs when modal opens
  useEffect(() => {
    if (isOpen) {
      setLogs(debugLogger.getLogs());
      const unsubscribe = debugLogger.subscribe(() => {
        setLogs(debugLogger.getLogs());
      });
      return () => unsubscribe();
    }
  }, [isOpen]);

  // Load history when switching to history tab
  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      loadHistory();
    }
  }, [isOpen, activeTab]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/bugs');
      if (res.ok) {
        const data = await res.json();
        setHistoryReports(data.reports || []);
      }
    } catch (err) {
      console.error('Failed to load bug history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  if (!isOpen) return null;

  // File handling
  const handleFilesAdded = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.puml', '.plantuml', '.md', '.markdown', '.txt'];
    const newAttachments: AttachedFile[] = [];

    Array.from(files).forEach(file => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const isImage = file.type.startsWith('image/');
      const isValidExt = allowedExtensions.includes(ext);

      if (isImage || isValidExt) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        let previewUrl: string | undefined = undefined;
        if (isImage) {
          previewUrl = URL.createObjectURL(file);
        }

        newAttachments.push({
          file,
          id,
          name: file.name,
          size: file.size,
          type: file.type || ext,
          previewUrl
        });
      }
    });

    setAttachedFiles(prev => [...prev, ...newAttachments]);
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles(prev => {
      const target = prev.find(f => f.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFilesAdded(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setSubmitError('Please enter a bug title/summary.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('severity', severity);

      // System Telemetry
      const telemetry = debugLogger.getTelemetry();
      formData.append('telemetry', JSON.stringify(telemetry));

      // Active PlantUML code
      if (includePuml && pumlCode) {
        formData.append('pumlCode', pumlCode);
      }

      // Diagram visual state
      if (includeState && diagramState) {
        formData.append('diagramState', JSON.stringify(diagramState));
      }

      // Captured System & Console logs
      if (includeLogs) {
        const logContent = debugLogger.formatLogFile({
          diagramTitle: diagramTitle || 'Untitled',
          pumlLines: pumlCode ? pumlCode.split('\n').length : 0,
          attachedFilesCount: attachedFiles.length
        });
        formData.append('logs', logContent);
      }

      // User attached files
      for (const item of attachedFiles) {
        formData.append('files', item.file, item.name);
      }

      const response = await fetch('/api/bugs', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server returned ${response.status}`);
      }

      const data = await response.json();
      setSubmittedResult(data.result);
      
      // Clear form
      setTitle('');
      setDescription('');
      setAttachedFiles([]);
    } catch (err: any) {
      console.error('Failed to submit bug report:', err);
      setSubmitError(err.message || 'An unexpected error occurred while saving the bug report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLogs = () => {
    const text = debugLogger.formatLogFile({ diagramTitle: diagramTitle || 'Untitled' });
    navigator.clipboard.writeText(text);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const handleCopySyncCommand = () => {
    const cmd = `powershell -ExecutionPolicy Bypass -File f:\\Documents\\Zim\\workspace_api_lexicon\\sync_plantvis_bugs.ps1`;
    navigator.clipboard.writeText(cmd);
    setCopiedSyncCmd(true);
    setTimeout(() => setCopiedSyncCmd(false), 2500);
  };

  const handleDownloadAllZip = () => {
    window.location.href = '/api/bugs/export';
  };

  const filteredLogs = logs.filter(l => {
    if (logFilter === 'error') return l.level === 'error';
    if (logFilter === 'warn') return l.level === 'warn' || l.level === 'error';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-[#fcfaf7] border border-[#d8d0c8] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-[#3a302a]"
        onClick={e => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-[#e8e0d6] bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c2652a]/10 border border-[#c2652a]/30 flex items-center justify-center text-[#c2652a]">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2c2420] flex items-center gap-2">
                Submit Bug Report & Diagnostics
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Jelly Storage
                </span>
              </h2>
              <p className="text-xs text-[#78706a]">
                Saves images, PUML, markdown notes, and system logs to persistent volume storage.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#78706a] hover:text-[#3a302a] hover:bg-[#f2ece4] transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS HEADER */}
        <div className="flex border-b border-[#e8e0d6] bg-[#f5efe6] px-6 text-xs font-semibold shrink-0">
          <button
            onClick={() => { setActiveTab('new'); setSubmittedResult(null); }}
            className={`py-2.5 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'new'
                ? 'border-[#c2652a] text-[#c2652a] bg-white/70'
                : 'border-transparent text-[#78706a] hover:text-[#3a302a]'
            }`}
          >
            <Bug className="w-3.5 h-3.5" />
            <span>New Report</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2.5 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-[#c2652a] text-[#c2652a] bg-white/70'
                : 'border-transparent text-[#78706a] hover:text-[#3a302a]'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Storage & Desktop Clone</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'new' ? (
            submittedResult ? (
              /* SUCCESS BANNER */
              <div className="p-6 bg-white border border-emerald-200 rounded-xl shadow-sm text-center space-y-4 animate-in zoom-in-95">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-900">Bug Report Saved to Jelly Volume!</h3>
                  <p className="text-xs text-[#78706a] mt-1">
                    Your report and attachments have been safely written to persistent storage in a dedicated folder.
                  </p>
                </div>

                <div className="bg-[#faf5ee] border border-[#e8e0d6] rounded-xl p-3.5 text-left font-mono text-xs space-y-1.5 max-w-lg mx-auto">
                  <div className="text-[#78706a] text-[11px] uppercase tracking-wide">Saved Folder:</div>
                  <div className="text-[#c2652a] font-bold break-all">/data/bugs/{submittedResult.folderName}</div>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setSubmittedResult(null)}
                    className="px-4 py-2 bg-white hover:bg-[#faf5ee] border border-[#d8d0c8] rounded-xl text-xs font-semibold text-[#3a302a] transition-colors cursor-pointer"
                  >
                    Submit Another Report
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="px-4 py-2 bg-[#c2652a] hover:bg-[#a3521e] text-white rounded-xl text-xs font-semibold shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Clone to Desktop</span>
                  </button>
                </div>
              </div>
            ) : (
              /* SUBMISSION FORM */
              <form onSubmit={handleSubmit} className="space-y-4">
                {submitError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Title & Severity */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-[#5a504a] uppercase tracking-wide mb-1">
                      Bug Title / Issue Summary <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Transparent gap beneath classifier card when resizing vertically"
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#d8d0c8] focus:outline-none focus:border-[#c2652a] focus:ring-1 focus:ring-[#c2652a] transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#5a504a] uppercase tracking-wide mb-1">
                      Severity
                    </label>
                    <select
                      value={severity}
                      onChange={e => setSeverity(e.target.value as SeverityLevel)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#d8d0c8] focus:outline-none focus:border-[#c2652a] cursor-pointer"
                    >
                      <option value="low">Low (Cosmetic)</option>
                      <option value="medium">Medium (Standard)</option>
                      <option value="high">High (Broken feature)</option>
                      <option value="blocker">Blocker (Crash / Unusable)</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-[#5a504a] uppercase tracking-wide mb-1">
                    Reproduction Steps & Details
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    placeholder="1. Create a new UML class&#10;2. Drag bottom-right corner handle to resize&#10;3. Observed: Transparent background gap shows canvas dots"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#d8d0c8] focus:outline-none focus:border-[#c2652a] focus:ring-1 focus:ring-[#c2652a] transition-colors resize-y font-sans leading-relaxed"
                  />
                </div>

                {/* ATTACHMENTS DROPZONE */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#5a504a] uppercase tracking-wide">
                      Upload Files (Images, .puml, .md, text)
                    </label>
                    <span className="text-[11px] text-[#78706a]">
                      {attachedFiles.length} attached
                    </span>
                  </div>

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-[#c2652a] bg-[#c2652a]/10 scale-[1.01]'
                        : 'border-[#d8d0c8] hover:border-[#c2652a]/70 bg-white hover:bg-[#faf5ee]'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.puml,.plantuml,.md,.markdown,.txt"
                      onChange={e => handleFilesAdded(e.target.files)}
                      className="hidden"
                    />
                    <Upload className="w-6 h-6 mx-auto text-[#c2652a] mb-1.5 opacity-80" />
                    <p className="text-xs font-semibold text-[#3a302a]">
                      Click to upload or drag & drop files here
                    </p>
                    <p className="text-[10px] text-[#78706a] mt-0.5">
                      Screenshots (.png, .jpg, .svg), diagrams (.puml), Markdown notes (.md), or logs (.txt)
                    </p>
                  </div>

                  {/* Attached Files List */}
                  {attachedFiles.length > 0 && (
                    <div className="mt-2.5 grid grid-cols-2 md:grid-cols-3 gap-2">
                      {attachedFiles.map(file => (
                        <div
                          key={file.id}
                          className="bg-white border border-[#d8d0c8] rounded-xl p-2 flex items-center justify-between gap-2 shadow-xs group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {file.previewUrl ? (
                              <img
                                src={file.previewUrl}
                                alt={file.name}
                                className="w-8 h-8 rounded object-cover border border-gray-200 shrink-0"
                              />
                            ) : file.name.endsWith('.puml') ? (
                              <FileCode className="w-6 h-6 text-[#A80036] shrink-0" />
                            ) : file.name.endsWith('.md') ? (
                              <FileText className="w-6 h-6 text-[#08427B] shrink-0" />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-[#c2652a] shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className="text-[11px] font-semibold text-[#3a302a] truncate">
                                {file.name}
                              </div>
                              <div className="text-[9.5px] text-[#78706a]">
                                {Math.round(file.size / 1024)} KB
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemoveFile(file.id); }}
                            className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                            title="Remove file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AUTOMATIC BUNDLE INCLUSIONS */}
                <div className="p-3.5 bg-white border border-[#e8e0d6] rounded-xl space-y-2.5">
                  <div className="text-xs font-bold text-[#5a504a] uppercase tracking-wide flex items-center justify-between">
                    <span>Auto-Bundled Diagnostics</span>
                    <span className="text-[10px] text-emerald-600 font-semibold font-mono">Ready to bundle</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-[#faf5ee] hover:bg-[#f2ece4] border border-[#e8e0d6] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includePuml}
                        onChange={e => setIncludePuml(e.target.checked)}
                        className="rounded text-[#c2652a] focus:ring-[#c2652a]"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-[#3a302a]">Diagram Code</div>
                        <div className="text-[10px] text-[#78706a] truncate">current_diagram.puml</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-[#faf5ee] hover:bg-[#f2ece4] border border-[#e8e0d6] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeState}
                        onChange={e => setIncludeState(e.target.checked)}
                        className="rounded text-[#c2652a] focus:ring-[#c2652a]"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-[#3a302a]">Canvas State</div>
                        <div className="text-[10px] text-[#78706a] truncate">diagram_state.json</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-[#faf5ee] hover:bg-[#f2ece4] border border-[#e8e0d6] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeLogs}
                        onChange={e => setIncludeLogs(e.target.checked)}
                        className="rounded text-[#c2652a] focus:ring-[#c2652a]"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-[#3a302a]">System &amp; Console</div>
                        <div className="text-[10px] text-[#78706a] truncate">system_debug.log ({logs.length})</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* COLLAPSIBLE LIVE SYSTEM LOG INSPECTOR */}
                <div className="border border-[#e8e0d6] rounded-xl bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setIsLogsExpanded(!isLogsExpanded)}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-[#5a504a] hover:bg-[#faf5ee] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-[#c2652a]" />
                      <span>Inspect Live System Debug Logs ({logs.length} captured entries)</span>
                    </div>
                    {isLogsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>

                  {isLogsExpanded && (
                    <div className="p-3 border-t border-[#e8e0d6] bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[11px] space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-[#333]">
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setLogFilter('all')}
                            className={`px-2 py-0.5 rounded cursor-pointer ${logFilter === 'all' ? 'bg-[#c2652a] text-white' : 'bg-[#333] text-gray-300'}`}
                          >
                            All ({logs.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setLogFilter('warn')}
                            className={`px-2 py-0.5 rounded cursor-pointer ${logFilter === 'warn' ? 'bg-amber-600 text-white' : 'bg-[#333] text-gray-300'}`}
                          >
                            Warnings &amp; Errors
                          </button>
                          <button
                            type="button"
                            onClick={() => setLogFilter('error')}
                            className={`px-2 py-0.5 rounded cursor-pointer ${logFilter === 'error' ? 'bg-red-600 text-white' : 'bg-[#333] text-gray-300'}`}
                          >
                            Errors Only
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleCopyLogs}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#333] hover:bg-[#444] text-gray-300 text-[10px] cursor-pointer transition-colors"
                        >
                          {copiedLogs ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedLogs ? 'Copied' : 'Copy Full Log'}</span>
                        </button>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin">
                        {filteredLogs.length === 0 ? (
                          <div className="text-gray-500 py-2 text-center">No logs match the filter.</div>
                        ) : (
                          filteredLogs.map(l => (
                            <div key={l.id} className="leading-tight break-all">
                              <span className="text-gray-500 text-[9.5px]">[{l.timestamp.slice(11, 19)}]</span>{' '}
                              <span className={`font-bold ${
                                l.level === 'error' ? 'text-red-400' :
                                l.level === 'warn' ? 'text-amber-400' :
                                l.level === 'info' ? 'text-blue-400' : 'text-gray-400'
                              }`}>
                                [{l.level.toUpperCase()}]
                              </span>{' '}
                              <span>{l.message}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ACTION BUTTONS */}
                <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#e8e0d6]">
                  <button
                    type="button"
                    onClick={handleDownloadAllZip}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-[#78706a] hover:text-[#3a302a] hover:bg-[#faf5ee] border border-[#d8d0c8]/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Export all bug reports currently on Jelly as a ZIP archive"
                  >
                    <FolderArchive className="w-4 h-4 text-[#c2652a]" />
                    <span>Download All Submissions (.zip)</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-[#78706a] hover:text-[#3a302a] hover:bg-[#faf5ee] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 bg-[#c2652a] hover:bg-[#a3521e] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving to Jelly...</span>
                        </>
                      ) : (
                        <>
                          <Bug className="w-3.5 h-3.5" />
                          <span>Submit to Jelly</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )
          ) : (
            /* HISTORY & DESKTOP CLONE TAB */
            <div className="space-y-5">
              {/* CLONE TO DESKTOP HERO CARD */}
              <div className="p-4 bg-white border border-[#c2652a]/30 rounded-2xl shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#c2652a]/10 border border-[#c2652a]/30 flex items-center justify-center text-[#c2652a] shrink-0">
                      <HardDrive className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#2c2420]">Clone Volume to Desktop</h4>
                      <p className="text-xs text-[#78706a]">
                        Extracts all bug submission folders into <code className="text-[#c2652a] font-bold">F:\Desktop\plantvis_bugs\</code>.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleDownloadAllZip}
                    className="px-3.5 py-2 bg-[#c2652a] hover:bg-[#a3521e] text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download ZIP</span>
                  </button>
                </div>

                {/* PowerShell 1-Click Sync Command */}
                <div className="bg-[#faf5ee] border border-[#e8e0d6] rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-[#78706a] font-semibold">
                    <span>PowerShell Desktop Sync Sidecar:</span>
                    <button
                      onClick={handleCopySyncCommand}
                      className="flex items-center gap-1 text-[#c2652a] hover:text-[#8a4518] transition-colors cursor-pointer"
                    >
                      {copiedSyncCmd ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSyncCmd ? 'Copied to clipboard' : 'Copy script'}</span>
                    </button>
                  </div>
                  <pre className="p-2 bg-white border border-[#d8d0c8] rounded-lg font-mono text-[11px] text-[#3a302a] overflow-x-auto select-all">
                    powershell -ExecutionPolicy Bypass -File f:\Documents\Zim\workspace_api_lexicon\sync_plantvis_bugs.ps1
                  </pre>
                </div>
              </div>

              {/* SAVED SUBMISSIONS LIST */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#5a504a] uppercase tracking-wide">
                    Persistent Volume Submissions ({historyReports.length})
                  </h4>
                  <button
                    onClick={loadHistory}
                    disabled={isLoadingHistory}
                    className="p-1 rounded text-[#78706a] hover:text-[#3a302a] hover:bg-white transition-colors cursor-pointer text-xs flex items-center gap-1"
                    title="Refresh list"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {isLoadingHistory ? (
                  <div className="p-8 text-center text-xs text-[#78706a]">
                    <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-[#c2652a]" />
                    Loading submissions from Jelly...
                  </div>
                ) : historyReports.length === 0 ? (
                  <div className="p-8 bg-white border border-[#e8e0d6] rounded-xl text-center text-xs text-[#78706a]">
                    No bug submissions recorded yet. Submit a report from the "New Report" tab!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {historyReports.map(rep => (
                      <div
                        key={rep.id}
                        className="p-3 bg-white border border-[#e8e0d6] rounded-xl flex items-center justify-between gap-3 shadow-xs hover:border-[#c2652a]/40 transition-all"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                              rep.severity === 'blocker' ? 'bg-red-100 text-red-700' :
                              rep.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                              rep.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {rep.severity || 'medium'}
                            </span>
                            <span className="font-semibold text-xs text-[#2c2420] truncate">
                              {rep.title || rep.folderName}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#78706a] mt-0.5 font-mono">
                            📁 {rep.folderName} &bull; {rep.attachments?.length || 0} attached files
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-[#78706a]">
                            {rep.createdAt ? new Date(rep.createdAt).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
