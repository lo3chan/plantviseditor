import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Copy, 
  Check, 
  Download, 
  Play, 
  Sparkles, 
  FileCode, 
  Terminal,
  Search,
  ChevronUp,
  ChevronDown,
  X,
  AlignLeft,
  WrapText,
  Type,
  AlertCircle,
  CheckCircle2,
  Bookmark,
  Layers,
  HelpCircle
} from 'lucide-react';
import { fetchPlantUMLAscii } from '../utils/plantumlEncoder';
import { tokenizePlantUMLLine, getTokenClass } from '../utils/plantumlHighlighter';
import { autoFormatPlantUML, validatePlantUML } from '../utils/overlapResolver';

interface AutocompleteItem {
  label: string;
  insertText?: string;
  detail: string;
  type: 'keyword' | 'skinparam' | 'snippet' | 'arrow';
}

const PLANTUML_AUTOCOMPLETE_ITEMS: AutocompleteItem[] = [
  // Core document keywords
  { label: '@startuml', insertText: '@startuml\n', detail: 'Document start', type: 'keyword' },
  { label: '@enduml', insertText: '@enduml\n', detail: 'Document end', type: 'keyword' },
  { label: 'left to right direction', insertText: 'left to right direction\n', detail: 'Horizontal orientation', type: 'keyword' },
  { label: 'top to bottom direction', insertText: 'top to bottom direction\n', detail: 'Vertical orientation', type: 'keyword' },
  { label: 'hide empty members', insertText: 'hide empty members\n', detail: 'Clean class boxes', type: 'keyword' },
  { label: 'hide footbox', insertText: 'hide footbox\n', detail: 'Remove sequence footers', type: 'keyword' },
  { label: 'autonumber', insertText: 'autonumber\n', detail: 'Step numbering', type: 'keyword' },
  { label: 'title', insertText: 'title "Diagram Title"\n', detail: 'Diagram title', type: 'keyword' },
  { label: 'header', insertText: 'header "Header Text"\n', detail: 'Document header', type: 'keyword' },
  { label: 'footer', insertText: 'footer "Footer Text"\n', detail: 'Document footer', type: 'keyword' },

  // Diagram Entities & Snippets
  { 
    label: 'class', 
    insertText: 'class ClassName {\n  +id: string\n  +title: string\n  +execute(): void\n}\n', 
    detail: 'Class definition', 
    type: 'snippet' 
  },
  { 
    label: 'interface', 
    insertText: 'interface InterfaceName {\n  +execute(): void\n}\n', 
    detail: 'Interface definition', 
    type: 'snippet' 
  },
  { 
    label: 'abstract class', 
    insertText: 'abstract class AbstractName {\n  {abstract} +calculate(): number\n}\n', 
    detail: 'Abstract class', 
    type: 'snippet' 
  },
  { 
    label: 'enum', 
    insertText: 'enum Status {\n  PENDING\n  ACTIVE\n  ARCHIVED\n}\n', 
    detail: 'Enum definition', 
    type: 'snippet' 
  },
  { 
    label: 'entity', 
    insertText: 'entity EntityName {\n  *id: number\n  --\n  name: string\n}\n', 
    detail: 'Database entity', 
    type: 'snippet' 
  },
  { 
    label: 'package', 
    insertText: 'package "PackageName" {\n  class InsideClass\n}\n', 
    detail: 'Package grouping', 
    type: 'snippet' 
  },
  { 
    label: 'namespace', 
    insertText: 'namespace NamespaceName {\n  class InsideClass\n}\n', 
    detail: 'Namespace container', 
    type: 'snippet' 
  },
  { 
    label: 'rectangle', 
    insertText: 'rectangle "Container Box" as BoxName {\n}\n', 
    detail: 'Rectangle container', 
    type: 'snippet' 
  },
  { 
    label: 'node', 
    insertText: 'node "Server Node" as ServerNode {\n}\n', 
    detail: 'Deployment node', 
    type: 'snippet' 
  },
  { 
    label: 'database', 
    insertText: 'database DatabaseName as "Database"\n', 
    detail: 'Database lifeline', 
    type: 'snippet' 
  },
  { 
    label: 'participant', 
    insertText: 'participant ParticipantName as "DisplayName"\n', 
    detail: 'Sequence participant', 
    type: 'snippet' 
  },
  { 
    label: 'actor', 
    insertText: 'actor User as "User"\n', 
    detail: 'Actor lifeline', 
    type: 'snippet' 
  },
  { 
    label: 'queue', 
    insertText: 'queue MessageQueue as "Message Queue"\n', 
    detail: 'Message queue', 
    type: 'snippet' 
  },
  { 
    label: 'boundary', 
    insertText: 'boundary BoundaryUI as "UI"\n', 
    detail: 'UI boundary', 
    type: 'snippet' 
  },
  { 
    label: 'control', 
    insertText: 'control Controller as "Controller"\n', 
    detail: 'Control lifeline', 
    type: 'snippet' 
  },

  // Sequence Flow Blocks
  { 
    label: 'alt', 
    insertText: 'alt condition\n  \nelse fallback\n  \nend\n', 
    detail: 'Alternative condition', 
    type: 'snippet' 
  },
  { 
    label: 'opt', 
    insertText: 'opt condition\n  \nend\n', 
    detail: 'Optional execution', 
    type: 'snippet' 
  },
  { 
    label: 'loop', 
    insertText: 'loop 5 times\n  \nend\n', 
    detail: 'Repetition loop', 
    type: 'snippet' 
  },
  { 
    label: 'par', 
    insertText: 'par parallel branch\n  \nelse other branch\n  \nend\n', 
    detail: 'Parallel execution', 
    type: 'snippet' 
  },
  { 
    label: 'critical', 
    insertText: 'critical transaction\n  \nend\n', 
    detail: 'Critical section', 
    type: 'snippet' 
  },
  { 
    label: 'group', 
    insertText: 'group GroupName\n  \nend\n', 
    detail: 'Custom group block', 
    type: 'snippet' 
  },
  { 
    label: 'note right', 
    insertText: 'note right: Note text here\n', 
    detail: 'Right sticky note', 
    type: 'snippet' 
  },
  { 
    label: 'note left', 
    insertText: 'note left: Note text here\n', 
    detail: 'Left sticky note', 
    type: 'snippet' 
  },
  { 
    label: 'note over', 
    insertText: 'note over Participant1, Participant2: Note text here\n', 
    detail: 'Spanned note', 
    type: 'snippet' 
  },
  { 
    label: 'map', 
    insertText: 'map ConfigMap {\n  key => "value"\n  port => 8080\n}\n', 
    detail: 'Key-value map', 
    type: 'snippet' 
  },
  { 
    label: 'json', 
    insertText: 'json DataTree {\n  "name": "diagram",\n  "version": 1\n}\n', 
    detail: 'JSON tree', 
    type: 'snippet' 
  },
  { 
    label: 'yaml', 
    insertText: 'yaml ConfigTree {\n  name: diagram\n  version: 1.0\n  enabled: true\n}\n', 
    detail: 'YAML tree', 
    type: 'snippet' 
  },
  { 
    label: 'salt', 
    insertText: 'card "Login Window" as win <<salt>>\nnote bottom of win\n  {{\n    salt\n    {\n      <b>Login Screen\n      Username: | "admin"\n      Password: | "****"\n      [Submit] | [Cancel]\n    }\n  }}\nend note\n', 
    detail: 'Salt GUI wireframe', 
    type: 'snippet' 
  },
  { 
    label: 'ditaa', 
    insertText: 'card "System Flow" as ditaa_box <<ditaa>>\nnote bottom of ditaa_box\n  {{\n    ditaa\n    +--------+  TCP  +--------+\n    | Client | ----> | Server |\n    +--------+       +--------+\n  }}\nend note\n', 
    detail: 'Ditaa ASCII art diagram', 
    type: 'snippet' 
  },
  { 
    label: 'math', 
    insertText: 'card "Loss Function\\n<math>L(\\theta) = -\\sum y_i \\log(\\hat{y}_i)</math>" as math_box <<math>>\n', 
    detail: 'LaTeX Math formula', 
    type: 'snippet' 
  },
  { 
    label: 'wbs', 
    insertText: 'card "Work Package" as wbs_box <<wbs>>\n', 
    detail: 'WBS Work breakdown item', 
    type: 'snippet' 
  },

  // Skinparam directives
  { label: 'skinparam linetype ortho', insertText: 'skinparam linetype ortho\n', detail: 'Orthogonal 90° lines', type: 'skinparam' },
  { label: 'skinparam linetype polyline', insertText: 'skinparam linetype polyline\n', detail: 'Segmented polyline', type: 'skinparam' },
  { label: 'skinparam style strictuml', insertText: 'skinparam style strictuml\n', detail: 'Strict OMG UML 2.5', type: 'skinparam' },
  { label: 'skinparam monochrome true', insertText: 'skinparam monochrome true\n', detail: 'Monochrome black & white', type: 'skinparam' },
  { label: 'skinparam monochrome reverse', insertText: 'skinparam monochrome reverse\n', detail: 'Dark invert canvas', type: 'skinparam' },
  { label: 'skinparam handwritten true', insertText: 'skinparam handwritten true\n', detail: 'Organic sketch lines', type: 'skinparam' },
  { label: 'skinparam roundcorner', insertText: 'skinparam roundcorner 10\n', detail: 'Rounded corners (px)', type: 'skinparam' },
  { label: 'skinparam diagonalCorner', insertText: 'skinparam diagonalCorner 10\n', detail: 'Chamfered corners (px)', type: 'skinparam' },
  { label: 'skinparam nodesep', insertText: 'skinparam nodesep 40\n', detail: 'Horizontal node spacing', type: 'skinparam' },
  { label: 'skinparam ranksep', insertText: 'skinparam ranksep 50\n', detail: 'Vertical rank spacing', type: 'skinparam' },
  { label: 'skinparam padding', insertText: 'skinparam padding 8\n', detail: 'Inner box padding', type: 'skinparam' },
  { label: 'skinparam margin', insertText: 'skinparam margin 8\n', detail: 'Outer box margin', type: 'skinparam' },
  { label: 'skinparam ArrowColor', insertText: 'skinparam ArrowColor #c2652a\n', detail: 'Arrow stroke color', type: 'skinparam' },
  { label: 'skinparam ArrowThickness', insertText: 'skinparam ArrowThickness 2\n', detail: 'Arrow thickness', type: 'skinparam' },
  { label: 'skinparam defaultFontSize', insertText: 'skinparam defaultFontSize 12\n', detail: 'Base typography size', type: 'skinparam' },
  { label: 'skinparam defaultFontName', insertText: 'skinparam defaultFontName "sans-serif"\n', detail: 'Global font family', type: 'skinparam' },
  { label: 'skinparam responseMessageBelowArrow', insertText: 'skinparam responseMessageBelowArrow true\n', detail: 'Text below arrow', type: 'skinparam' },
  { label: 'skinparam minClassWidth', insertText: 'skinparam minClassWidth 120\n', detail: 'Minimum element width', type: 'skinparam' },
  { label: 'skinparam wrapWidth', insertText: 'skinparam wrapWidth 140\n', detail: 'Label text auto-wrap', type: 'skinparam' },
  { label: 'skinparam ParticipantPadding', insertText: 'skinparam ParticipantPadding 35\n', detail: 'Lifeline spacing', type: 'skinparam' },
  { label: 'skinparam BoxPadding', insertText: 'skinparam BoxPadding 10\n', detail: 'Participant box padding', type: 'skinparam' },

  // Themes
  { label: '!theme materia', insertText: '!theme materia\n', detail: 'Google Material theme', type: 'skinparam' },
  { label: '!theme blueprint', insertText: '!theme blueprint\n', detail: 'Technical blueprint', type: 'skinparam' },
  { label: '!theme cyborg', insertText: '!theme cyborg\n', detail: 'Cyborg dark theme', type: 'skinparam' },
  { label: '!theme sketchy', insertText: '!theme sketchy\n', detail: 'Hand-drawn marker theme', type: 'skinparam' },
  { label: '!theme crt-amber', insertText: '!theme crt-amber\n', detail: 'CRT Amber terminal', type: 'skinparam' },
  { label: '!theme crt-green', insertText: '!theme crt-green\n', detail: 'CRT Green terminal', type: 'skinparam' },
  { label: '!theme mint', insertText: '!theme mint\n', detail: 'Pastel mint UI', type: 'skinparam' },
  { label: '!theme sandstone', insertText: '!theme sandstone\n', detail: 'Warm sandstone tones', type: 'skinparam' },

  // Relationship Connectors & Arrows
  { label: '-->', insertText: '--> ', detail: 'Directed association', type: 'arrow' },
  { label: '<|--', insertText: '<|-- ', detail: 'Inheritance / Generalization', type: 'arrow' },
  { label: '..|>', insertText: '..|> ', detail: 'Interface realization', type: 'arrow' },
  { label: '*--', insertText: '*-- ', detail: 'Composition (Solid Diamond)', type: 'arrow' },
  { label: 'o--', insertText: 'o-- ', detail: 'Aggregation (Hollow Diamond)', type: 'arrow' },
  { label: '..>', insertText: '..> ', detail: 'Dependency (Dashed)', type: 'arrow' },
  { label: '<->', insertText: '<-> ', detail: 'Bidirectional link', type: 'arrow' }
];

interface CodePanelProps {
  code: string;
  onApplyCode: (newCode: string) => void;
  isSplitView?: boolean;
  onClose?: () => void;
  highlightedLine?: number | null;
  highlightedLines?: number[];
  onCursorLineChange?: (lineNumber: number, lineText: string) => void;
}

type SnippetCategory = 'uml' | 'sequence' | 'styling' | 'data';

export const CodePanel: React.FC<CodePanelProps> = ({
  code,
  onApplyCode,
  isSplitView = false,
  onClose,
  highlightedLine,
  highlightedLines,
  onCursorLineChange
}) => {
  const [editableCode, setEditableCode] = useState(code);
  const [copied, setCopied] = useState(false);
  const [copiedAscii, setCopiedAscii] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('Synced');
  
  // Readability Settings
  const [fontSize, setFontSize] = useState<number>(12); // in px
  const [wordWrap, setWordWrap] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSearchIndex, setActiveSearchIndex] = useState<number>(0);
  const [cursorLine, setCursorLine] = useState<number>(1);
  const [cursorCol, setCursorCol] = useState<number>(1);
  const [snippetCategory, setSnippetCategory] = useState<SnippetCategory>('uml');
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);

  // Tab Autocomplete State
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState<boolean>(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<AutocompleteItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [currentPrefix, setCurrentPrefix] = useState<string>('');
  const [autocompletePos, setAutocompletePos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync external code changes when not actively typing
  useEffect(() => {
    setEditableCode(code);
    setIsAutocompleteOpen(false);
  }, [code]);

  // Debounced auto-apply while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (editableCode !== code) {
        onApplyCode(editableCode);
        setStatusMessage('Auto-compiled');
        setTimeout(() => setStatusMessage('Synced'), 1500);
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [editableCode, code, onApplyCode]);

  // Auto-scroll and text-selection when external highlightedLine or highlightedLines change
  useEffect(() => {
    const activeLines = (highlightedLines && highlightedLines.length > 0)
      ? [...highlightedLines].sort((a, b) => a - b)
      : (highlightedLine ? [highlightedLine] : []);

    if (activeLines.length > 0 && textareaRef.current) {
      const textarea = textareaRef.current;
      const minLine = activeLines[0];
      const maxLine = activeLines[activeLines.length - 1];

      // Calculate character offsets for text selection
      const rawLines = editableCode.split('\n');
      let charStart = 0;
      for (let i = 0; i < minLine - 1 && i < rawLines.length; i++) {
        charStart += rawLines[i].length + 1; // +1 for \n
      }

      let charEnd = charStart;
      for (let i = minLine - 1; i < maxLine && i < rawLines.length; i++) {
        charEnd += rawLines[i].length + (i < rawLines.length - 1 ? 1 : 0);
      }

      try {
        textarea.setSelectionRange(charStart, charEnd);
      } catch {
        // ignore if not focused/supported
      }

      const lineHeight = fontSize * 1.5;
      const targetScroll = Math.max(0, (minLine - 3) * lineHeight);
      textarea.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  }, [highlightedLine, highlightedLines, editableCode, fontSize]);

  // Synchronized scrolling between textarea, highlight layer, and line number gutter
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollLeft = scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = scrollTop;
    }
  };

  // Track cursor position for active line indicator and trigger tab autocomplete
  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const isFocused = document.activeElement === textarea;

    const pos = textarea.selectionStart;
    const textBefore = editableCode.substring(0, pos);
    const lines = textBefore.split('\n');
    const currentLine = lines.length;
    const currentLineText = lines[lines.length - 1];
    const currentCol = currentLineText.length + 1;
    setCursorLine(currentLine);
    setCursorCol(currentCol);
    onCursorLineChange?.(currentLine, currentLineText);

    // If editor is not actively focused by user, NEVER open autocomplete
    if (!isFocused) {
      setIsAutocompleteOpen(false);
      return;
    }

    // Extract word/token prefix right before cursor
    const prefixMatch = currentLineText.match(/([@!a-zA-Z0-9_#.-]+)$/);
    const prefix = prefixMatch ? prefixMatch[1] : '';
    setCurrentPrefix(prefix);

    if (prefix.length >= 1) {
      const pLower = prefix.toLowerCase();
      const matches = PLANTUML_AUTOCOMPLETE_ITEMS.filter(item => {
        const lLower = item.label.toLowerCase();
        return lLower.startsWith(pLower) || (lLower.includes(pLower) && prefix.length >= 2);
      });

      // If user has already fully typed the exact word and there's only 1 match identical to it, don't popup
      if (matches.length === 1 && matches[0].label.toLowerCase() === pLower) {
        setIsAutocompleteOpen(false);
        return;
      }

      if (matches.length > 0) {
        setFilteredSuggestions(matches);
        setSelectedIndex(0);
        setIsAutocompleteOpen(true);

        // Calculate visual screen position near cursor
        const lineHeight = fontSize * 1.5;
        const top = Math.max(6, (currentLine * lineHeight) - textarea.scrollTop + 8);
        const left = Math.min(240, Math.max(12, ((currentCol - prefix.length) * (fontSize * 0.58)) - textarea.scrollLeft));
        setAutocompletePos({ top, left });
        return;
      }
    }

    setIsAutocompleteOpen(false);
  };

  // Apply selected autocomplete suggestion
  const applySuggestion = (item: AutocompleteItem) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const textToInsert = item.insertText || `${item.label} `;
    const cursorPos = textarea.selectionStart;
    const wordStartPos = Math.max(0, cursorPos - currentPrefix.length);
    const afterCursor = editableCode.substring(textarea.selectionEnd);

    const updated = editableCode.substring(0, wordStartPos) + textToInsert + afterCursor;
    setEditableCode(updated);
    onApplyCode(updated);
    setIsAutocompleteOpen(false);

    setTimeout(() => {
      textarea.focus();
      const newPos = wordStartPos + textToInsert.length;
      textarea.setSelectionRange(newPos, newPos);
      updateCursorPosition();
    }, 25);
  };

  // Insert standard 2-space tab indent when autocomplete is not active
  const insertTabIndent = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const updated = editableCode.substring(0, start) + '  ' + editableCode.substring(end);

    setEditableCode(updated);
    onApplyCode(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 2);
      updateCursorPosition();
    }, 20);
  };

  // Syntax diagnostics
  const diagnostics = useMemo(() => {
    return validatePlantUML(editableCode);
  }, [editableCode]);

  // Code outline items (classes, interfaces, lifelines, packages)
  const outlineItems = useMemo(() => {
    const lines = editableCode.split('\n');
    const items: Array<{ line: number; label: string; type: string }> = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      const lineNum = idx + 1;

      const classMatch = trimmed.match(/^(class|interface|enum|abstract\s+class|entity)\s+([a-zA-Z0-9_]+)/i);
      if (classMatch) {
        items.push({ line: lineNum, label: classMatch[2], type: classMatch[1] });
        return;
      }

      const participantMatch = trimmed.match(/^(participant|actor|database|queue|boundary|control)\s+([^\s{]+)/i);
      if (participantMatch) {
        items.push({ line: lineNum, label: participantMatch[2].replace(/"/g, ''), type: participantMatch[1] });
        return;
      }

      const packageMatch = trimmed.match(/^(package|namespace)\s+([^\s{]+)/i);
      if (packageMatch) {
        items.push({ line: lineNum, label: packageMatch[2], type: 'package' });
      }
    });

    return items;
  }, [editableCode]);

  // Search matches
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const matches: Array<{ start: number; end: number; line: number }> = [];
    const query = searchQuery.toLowerCase();
    const text = editableCode.toLowerCase();
    let index = 0;

    while ((index = text.indexOf(query, index)) !== -1) {
      const line = editableCode.substring(0, index).split('\n').length;
      matches.push({ start: index, end: index + query.length, line });
      index += query.length;
    }

    return matches;
  }, [editableCode, searchQuery]);

  // Jump to search match
  const jumpToMatch = (index: number) => {
    if (searchMatches.length === 0 || !textareaRef.current) return;
    const clampedIndex = (index + searchMatches.length) % searchMatches.length;
    setActiveSearchIndex(clampedIndex);

    const match = searchMatches[clampedIndex];
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(match.start, match.end);

    // Scroll line into view
    const lineHeight = fontSize * 1.5;
    const targetScrollTop = (match.line - 3) * lineHeight;
    textareaRef.current.scrollTop = Math.max(0, targetScrollTop);
    updateCursorPosition();
  };

  // Jump to specific line from Outline or Diagnostics
  const jumpToLine = (lineNumber: number) => {
    if (!textareaRef.current) return;
    const lines = editableCode.split('\n');
    let charOffset = 0;
    for (let i = 0; i < Math.min(lineNumber - 1, lines.length); i++) {
      charOffset += lines[i].length + 1;
    }
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(charOffset, charOffset + (lines[lineNumber - 1]?.length || 0));
    const lineHeight = fontSize * 1.5;
    textareaRef.current.scrollTop = Math.max(0, (lineNumber - 3) * lineHeight);
    updateCursorPosition();
  };

  // Auto format indentation
  const handleAutoFormat = () => {
    const formatted = autoFormatPlantUML(editableCode);
    setEditableCode(formatted);
    onApplyCode(formatted);
    setStatusMessage('Formatted');
    setTimeout(() => setStatusMessage('Synced'), 1500);
  };

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

  const handleCopyAscii = async () => {
    setStatusMessage('Rendering ASCII...');
    try {
      const ascii = await fetchPlantUMLAscii(editableCode);
      await navigator.clipboard.writeText(ascii);
      setCopiedAscii(true);
      setStatusMessage('ASCII Copied!');
      setTimeout(() => {
        setCopiedAscii(false);
        setStatusMessage('Synced');
      }, 2000);
    } catch {
      setStatusMessage('ASCII Failed');
      setTimeout(() => setStatusMessage('Synced'), 2000);
    }
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
      updateCursorPosition();
    }, 50);
  };

  const lines = editableCode.split('\n');
  const lineCount = lines.length;

  return (
    <aside className={`h-full bg-[#241f1a] text-[#faf5ee] flex flex-col z-20 select-none shadow-md ${
      isSplitView ? 'w-full h-full border-r border-[#453c35]' : 'w-[450px] border-l border-[#453c35]'
    }`}>
      {/* Editor Main Header */}
      <div className="px-3 py-2 border-b border-[#453c35] bg-[#1d1915] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-[#c2652a]" />
          <span className="text-xs font-semibold text-[#faf5ee] tracking-wide">PlantUML Script Editor</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#342a22] text-[#c2652a] font-mono font-medium">
            {statusMessage}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            id="btn-compile-script"
            onClick={handleManualApply}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#c2652a] text-white hover:bg-[#a95420] text-[11px] font-semibold rounded-md transition-colors shadow-2xs cursor-pointer"
            title="Compile PlantUML to canvas immediately (Ctrl+Enter)"
          >
            <Play className="w-3 h-3" />
            <span>Compile</span>
          </button>

          <button
            id="btn-copy-script"
            onClick={handleCopy}
            className="p-1.5 rounded-md bg-[#2d251f] hover:bg-[#3d322a] text-[#d8d0c8] hover:text-white transition-colors cursor-pointer"
            title="Copy PlantUML Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            id="btn-ascii-art"
            onClick={handleCopyAscii}
            className="p-1.5 rounded-md bg-[#2d251f] hover:bg-[#3d322a] text-[#d8d0c8] hover:text-[#e8a87c] transition-colors cursor-pointer"
            title="Quick Copy ASCII Diagram Art"
          >
            {copiedAscii ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Terminal className="w-3.5 h-3.5" />}
          </button>

          <button
            id="btn-download-script"
            onClick={handleDownload}
            className="p-1.5 rounded-md bg-[#2d251f] hover:bg-[#3d322a] text-[#d8d0c8] hover:text-white transition-colors cursor-pointer"
            title="Download .puml File"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-[#3d322a] text-[#a09489] hover:text-white transition-colors cursor-pointer ml-1"
              title="Close script panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Readability & Tooling Subheader */}
      <div className="px-2.5 py-1 bg-[#28221c] border-b border-[#3d342c] flex items-center justify-between gap-2 text-xs">
        {/* Left: Find & Readability Controls */}
        <div className="flex items-center gap-1.5">
          {/* Search Toggle */}
          <button
            id="btn-editor-search-toggle"
            onClick={() => {
              setShowSearch(!showSearch);
              if (!showSearch) {
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }
            }}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              showSearch ? 'bg-[#c2652a] text-white' : 'bg-[#342a22] text-[#d8d0c8] hover:bg-[#43362c]'
            }`}
            title="Search / Find in script (Ctrl+F)"
          >
            <Search className="w-3 h-3" />
            <span>Find</span>
          </button>

          {/* Auto Format / Indent */}
          <button
            id="btn-editor-format"
            onClick={handleAutoFormat}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#342a22] text-[#d8d0c8] hover:bg-[#43362c] text-[11px] font-medium transition-colors cursor-pointer"
            title="Auto-indent and format PlantUML syntax"
          >
            <AlignLeft className="w-3 h-3 text-[#c2652a]" />
            <span>Format</span>
          </button>

          {/* Word Wrap Toggle */}
          <button
            id="btn-editor-wrap-toggle"
            onClick={() => setWordWrap(!wordWrap)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              wordWrap ? 'bg-[#c2652a]/30 text-[#e8a87c] border border-[#c2652a]/40' : 'bg-[#342a22] text-[#d8d0c8] hover:bg-[#43362c]'
            }`}
            title={wordWrap ? 'Word wrap active' : 'Click to enable word wrap'}
          >
            <WrapText className="w-3 h-3" />
            <span>{wordWrap ? 'Wrap On' : 'Wrap Off'}</span>
          </button>

          {/* Font Size Selector */}
          <div className="flex items-center bg-[#342a22] rounded px-1.5 py-0.5 gap-1 text-[11px]">
            <Type className="w-3 h-3 text-[#9e9083]" />
            <button
              onClick={() => setFontSize(Math.max(10, fontSize - 1))}
              disabled={fontSize <= 10}
              className="px-1 text-[#d8d0c8] hover:text-white disabled:opacity-30 cursor-pointer"
              title="Decrease font size"
            >
              -
            </button>
            <span className="font-mono text-[10px] text-[#faf5ee] w-4 text-center">{fontSize}</span>
            <button
              onClick={() => setFontSize(Math.min(18, fontSize + 1))}
              disabled={fontSize >= 18}
              className="px-1 text-[#d8d0c8] hover:text-white disabled:opacity-30 cursor-pointer"
              title="Increase font size"
            >
              +
            </button>
          </div>
        </div>

        {/* Right: Diagnostics & Outline indicator */}
        <div className="flex items-center gap-2">
          {/* Syntax Diagnostics Indicator */}
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
              diagnostics.errors.length > 0 
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800' 
                : diagnostics.warnings.length > 0
                ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
            }`}
            title="Click to view syntax diagnostics"
          >
            {diagnostics.errors.length > 0 ? (
              <>
                <AlertCircle className="w-3 h-3 text-rose-400" />
                <span>{diagnostics.errors.length} error{diagnostics.errors.length > 1 ? 's' : ''}</span>
              </>
            ) : diagnostics.warnings.length > 0 ? (
              <>
                <AlertCircle className="w-3 h-3 text-amber-400" />
                <span>{diagnostics.warnings.length} notice</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Syntax OK</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive Search Bar Popdown */}
      {showSearch && (
        <div className="px-3 py-1.5 bg-[#1d1915] border-b border-[#453c35] flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-[#c2652a] shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActiveSearchIndex(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (e.shiftKey) {
                    jumpToMatch(activeSearchIndex - 1);
                  } else {
                    jumpToMatch(activeSearchIndex + 1);
                  }
                } else if (e.key === 'Escape') {
                  setShowSearch(false);
                }
              }}
              placeholder="Find in PlantUML script..."
              className="w-full bg-[#2b241d] text-[#faf5ee] px-2 py-0.5 rounded text-xs border border-[#4a3d31] outline-none focus:border-[#c2652a]"
            />
          </div>

          <div className="flex items-center gap-1 text-[11px] text-[#9e9083]">
            {searchQuery && (
              <span className="font-mono text-[10px] mr-1">
                {searchMatches.length > 0 
                  ? `${activeSearchIndex + 1}/${searchMatches.length}` 
                  : '0 matches'}
              </span>
            )}

            <button
              onClick={() => jumpToMatch(activeSearchIndex - 1)}
              disabled={searchMatches.length === 0}
              className="p-1 rounded bg-[#2b241d] hover:bg-[#3d322a] disabled:opacity-30 cursor-pointer text-[#d8d0c8]"
              title="Previous Match (Shift+Enter)"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => jumpToMatch(activeSearchIndex + 1)}
              disabled={searchMatches.length === 0}
              className="p-1 rounded bg-[#2b241d] hover:bg-[#3d322a] disabled:opacity-30 cursor-pointer text-[#d8d0c8]"
              title="Next Match (Enter)"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => setShowSearch(false)}
              className="p-1 rounded hover:bg-[#3d322a] text-[#9e9083] hover:text-white cursor-pointer ml-1"
              title="Close Search"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Diagnostics Panel Dropdown */}
      {showDiagnostics && (
        <div className="p-2.5 bg-[#1a1613] border-b border-[#453c35] text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-stone-200 text-[11px]">PlantUML Syntax Diagnostics</span>
            <button 
              onClick={() => setShowDiagnostics(false)}
              className="text-[#9e9083] hover:text-white text-[10px]"
            >
              Close
            </button>
          </div>
          {diagnostics.errors.length === 0 && diagnostics.warnings.length === 0 ? (
            <div className="text-emerald-400 text-[11px] flex items-center gap-1.5 py-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>No syntax issues detected. Your PlantUML code is valid!</span>
            </div>
          ) : (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {diagnostics.errors.map((err, idx) => (
                <button
                  key={`err_${idx}`}
                  onClick={() => jumpToLine(err.line)}
                  className="w-full text-left flex items-start gap-1.5 text-rose-300 hover:bg-rose-950/40 p-1 rounded transition-colors cursor-pointer text-[11px]"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>Line {err.line}: {err.message}</span>
                </button>
              ))}
              {diagnostics.warnings.map((warn, idx) => (
                <button
                  key={`warn_${idx}`}
                  onClick={() => jumpToLine(warn.line)}
                  className="w-full text-left flex items-start gap-1.5 text-amber-300 hover:bg-amber-950/40 p-1 rounded transition-colors cursor-pointer text-[11px]"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Line {warn.line}: {warn.message}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Outline Jump Bar (if elements exist) */}
      {outlineItems.length > 0 && (
        <div className="px-2.5 py-1 bg-[#201b17] border-b border-[#3d342c] flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[10px]">
          <span className="font-semibold text-[#8a7f75] uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Bookmark className="w-2.5 h-2.5 text-[#c2652a]" />
            Jump:
          </span>
          {outlineItems.slice(0, 8).map((item, idx) => (
            <button
              key={`outline_${idx}`}
              onClick={() => jumpToLine(item.line)}
              className="px-1.5 py-0.5 rounded bg-[#2e2620] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer border border-[#3d342c]"
              title={`Jump to line ${item.line}: ${item.type} ${item.label}`}
            >
              <span className="text-[#a09489] text-[9px] mr-1">{item.type}</span>
              {item.label}
            </button>
          ))}
          {outlineItems.length > 8 && (
            <span className="text-[#70655c] text-[9px]">+{outlineItems.length - 8} more</span>
          )}
        </div>
      )}

      {/* Snippet Insert Categories */}
      <div className="px-2.5 py-1 bg-[#1a1613] border-b border-[#352d26] flex items-center gap-1 text-[11px] overflow-x-auto scrollbar-none">
        <span className="text-[10px] uppercase font-bold text-[#8a7f75] mr-1 shrink-0">Snippets:</span>
        <button
          onClick={() => setSnippetCategory('uml')}
          className={`px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
            snippetCategory === 'uml' ? 'bg-[#c2652a] text-white font-bold' : 'text-[#a09489] hover:text-[#d8d0c8]'
          }`}
        >
          Classes & UML
        </button>
        <button
          onClick={() => setSnippetCategory('sequence')}
          className={`px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
            snippetCategory === 'sequence' ? 'bg-[#c2652a] text-white font-bold' : 'text-[#a09489] hover:text-[#d8d0c8]'
          }`}
        >
          Sequence
        </button>
        <button
          onClick={() => setSnippetCategory('styling')}
          className={`px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
            snippetCategory === 'styling' ? 'bg-[#c2652a] text-white font-bold' : 'text-[#a09489] hover:text-[#d8d0c8]'
          }`}
        >
          Skinparam
        </button>
        <button
          onClick={() => setSnippetCategory('data')}
          className={`px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
            snippetCategory === 'data' ? 'bg-[#c2652a] text-white font-bold' : 'text-[#a09489] hover:text-[#d8d0c8]'
          }`}
        >
          JSON & Map
        </button>
      </div>

      {/* Snippets Toolbar Items */}
      <div className="px-2.5 py-1 bg-[#201b17] border-b border-[#352d26] flex items-center gap-1 overflow-x-auto scrollbar-none text-[11px]">
        {snippetCategory === 'uml' && (
          <>
            <button
              onClick={() => insertSnippet('\nclass OrderService {\n  +id: Long\n  +status: String\n  --\n  +processOrder(): void\n}\n')}
              className="px-2 py-0.5 rounded bg-[#2e2620] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
            >
              + class
            </button>
            <button
              onClick={() => insertSnippet('\ninterface IRepository<T> {\n  +findById(id: Long): T\n  +save(entity: T): void\n}\n')}
              className="px-2 py-0.5 rounded bg-[#2e2620] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
            >
              + interface
            </button>
            <button
              onClick={() => insertSnippet('\nentity Customer {\n  *id : Long <<PK>>\n  --\n  #user_id : Long <<FK>>\n  name : String\n  email : String\n}\n')}
              className="px-2 py-0.5 rounded bg-[#2e2620] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
            >
              + entity (ER)
            </button>
            <button
              onClick={() => insertSnippet('\nParent <|-- Child : inherits\n')}
              className="px-2 py-0.5 rounded bg-[#2e2620] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
            >
              &lt;|--
            </button>
            <button
              onClick={() => insertSnippet('\nService --> Database : calls\n')}
              className="px-2 py-0.5 rounded bg-[#2e2620] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
            >
              --&gt;
            </button>
            <button
              onClick={() => insertSnippet('\nTableA ||--|{ TableB : contains\n')}
              className="px-2 py-0.5 rounded bg-[#2e2620] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
            >
              ||--|&#123;
            </button>
          </>
        )}

        {snippetCategory === 'sequence' && (
          <>
            <button
              onClick={() => insertSnippet('\nactor "User" as user\nparticipant "API Gateway" as gw\nparticipant "Order Service" as svc\n')}
              className="px-2 py-0.5 rounded bg-[#2e2620] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
            >
              + participants
            </button>
            <button
              onClick={() => insertSnippet('\nuser -> gw: POST /checkout\nactivate gw\ngw -> svc: ProcessPayment()\nactivate svc\nsvc --> gw: 200 OK (receipt)\ndeactivate svc\ngw --> user: Success confirmation\ndeactivate gw\n')}
              className="px-2 py-0.5 rounded bg-[#2e2620] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
            >
              + interaction call
            </button>
            <button
              onClick={() => insertSnippet('\nalt status == 200\n  svc --> gw: Success\nelse error\n  svc --> gw: Payment Failed\nend\n')}
              className="px-2 py-0.5 rounded bg-[#2e2620] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
            >
              + alt block
            </button>
            <button
              onClick={() => insertSnippet('\nloop for each item in cart\n  svc -> db: checkStock(item.id)\nend\n')}
              className="px-2 py-0.5 rounded bg-[#2e2620] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
            >
              + loop block
            </button>
          </>
        )}

        {snippetCategory === 'styling' && (
          <>
            <button
              onClick={() => insertSnippet('\nskinparam linetype ortho\n')}
              className="px-2 py-0.5 rounded bg-[#2e2620] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
            >
              + ortho lines
            </button>
            <button
              onClick={() => insertSnippet('\nskinparam roundcorner 10\n')}
              className="px-2 py-0.5 rounded bg-[#2e2620] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
            >
              + roundcorner
            </button>
            <button
              onClick={() => insertSnippet('\nskinparam ArrowColor #c2652a\nskinparam ArrowThickness 2\n')}
              className="px-2 py-0.5 rounded bg-[#2e2620] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
            >
              + arrow style
            </button>
            <button
              onClick={() => insertSnippet('\nskinparam defaultFontName "EB Garamond"\n')}
              className="px-2 py-0.5 rounded bg-[#2e2620] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
            >
              + typography
            </button>
          </>
        )}

        {snippetCategory === 'data' && (
          <>
            <button
              onClick={() => insertSnippet('\nmap AppConfig {\n  host => "127.0.0.1"\n  port => 8080\n  env => "production"\n  ssl => true\n}\n')}
              className="px-2 py-0.5 rounded bg-[#2e2620] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
            >
              + map table
            </button>
            <button
              onClick={() => insertSnippet('\njson Payload {\n  "service": "billing",\n  "status": "healthy",\n  "replicas": 3,\n  "regions": ["us-central", "eu-west"]\n}\n')}
              className="px-2 py-0.5 rounded bg-[#2e2620] hover:bg-[#c2652a] hover:text-white text-[#d8d0c8] shrink-0 font-mono transition-colors cursor-pointer"
            >
              + json tree
            </button>
          </>
        )}
      </div>

      {/* Editor Body: Gutter + Syntax Highlight Layer + Native Transparent Textarea */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Line Numbers Gutter */}
        <div 
          ref={gutterRef}
          className="w-11 py-3 pr-2 select-none text-right font-mono text-[#786c60] bg-[#1d1915] border-r border-[#382f27] overflow-hidden shrink-0"
          style={{ fontSize: `${fontSize}px`, lineHeight: '1.5rem' }}
        >
          {Array.from({ length: Math.max(lineCount, 1) }, (_, i) => {
            const lineNum = i + 1;
            const isActive = lineNum === cursorLine;
            const isHighlighted = (highlightedLines && highlightedLines.includes(lineNum)) || (highlightedLine !== undefined && highlightedLine !== null && lineNum === highlightedLine);
            return (
              <div 
                key={lineNum} 
                className={`h-6 flex items-center justify-end px-1 rounded-xs transition-colors ${
                  isHighlighted
                    ? 'text-white font-bold bg-[#c2652a] shadow-xs'
                    : isActive 
                      ? 'text-[#c2652a] font-bold bg-[#2e241c]' 
                      : 'text-[#6e6255]'
                }`}
              >
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Editor Container with Synchronized Highlight Layer and Textarea */}
        <div className="flex-1 relative overflow-hidden bg-[#241f1a]">
          {/* Syntax Highlight Overlay (Underneath) */}
          <div
            ref={highlightRef}
            aria-hidden="true"
            className={`absolute inset-0 p-3 font-mono pointer-events-none select-none overflow-hidden ${
              wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre overflow-x-auto'
            }`}
            style={{ 
              fontSize: `${fontSize}px`, 
              lineHeight: '1.5rem',
              fontFamily: "'JetBrains Mono', monospace"
            }}
          >
            {lines.map((lineText, lineIdx) => {
              const lineNum = lineIdx + 1;
              const isActive = lineNum === cursorLine;
              const isHighlighted = (highlightedLines && highlightedLines.includes(lineNum)) || (highlightedLine !== undefined && highlightedLine !== null && lineNum === highlightedLine);
              const tokens = tokenizePlantUMLLine(lineText);

              return (
                <div 
                  key={lineIdx} 
                  className={`min-h-[1.5rem] rounded-xs transition-colors ${
                    isHighlighted 
                      ? 'bg-[#c2652a]/25 ring-1 ring-[#c2652a]/60 font-medium' 
                      : isActive 
                        ? 'bg-[#312720]/60' 
                        : ''
                  }`}
                >
                  {tokens.map((tok, tokIdx) => {
                    const colorClass = getTokenClass(tok.type);
                    return (
                      <span key={tokIdx} className={colorClass}>
                        {tok.text}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Native Textarea Layer (On Top, text transparent to reveal highlighted spans) */}
          <textarea
            ref={textareaRef}
            id="plantuml-code-textarea"
            value={editableCode}
            onChange={(e) => {
              setEditableCode(e.target.value);
              updateCursorPosition();
            }}
            onKeyUp={updateCursorPosition}
            onClick={updateCursorPosition}
            onSelect={() => {
              if (document.activeElement === textareaRef.current) {
                updateCursorPosition();
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                setIsAutocompleteOpen(false);
              }, 150);
            }}
            onScroll={handleScroll}
            onKeyDown={(e) => {
              // Autocomplete navigation and insertion
              if (isAutocompleteOpen && filteredSuggestions.length > 0) {
                if (e.key === 'Tab' || e.key === 'Enter') {
                  e.preventDefault();
                  applySuggestion(filteredSuggestions[selectedIndex]);
                  return;
                }
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSelectedIndex((prev) => (prev + 1) % filteredSuggestions.length);
                  return;
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSelectedIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
                  return;
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setIsAutocompleteOpen(false);
                  return;
                }
              }

              // Standard Tab indentation when autocomplete is closed
              if (e.key === 'Tab') {
                e.preventDefault();
                insertTabIndent();
                return;
              }

              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleManualApply();
              } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                setShowSearch(true);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }
            }}
            className={`absolute inset-0 p-3 bg-transparent text-transparent caret-white selection:bg-[#c2652a]/45 font-mono outline-none resize-none z-10 ${
              wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre overflow-x-auto'
            }`}
            style={{ 
              fontSize: `${fontSize}px`, 
              lineHeight: '1.5rem',
              fontFamily: "'JetBrains Mono', monospace"
            }}
            spellCheck={false}
            placeholder="@startuml&#10;...&#10;@enduml"
          />

          {/* Floating PlantUML Tab Autocomplete Popup */}
          {isAutocompleteOpen && filteredSuggestions.length > 0 && (
            <div
              className="absolute z-30 w-72 max-h-56 bg-[#1a1613] border border-[#c2652a] rounded-lg shadow-2xl overflow-hidden flex flex-col font-mono text-xs select-none"
              style={{
                top: `${autocompletePos.top}px`,
                left: `${autocompletePos.left}px`,
              }}
            >
              <div className="px-2.5 py-1 bg-[#2b221a] border-b border-[#3d342c] flex items-center justify-between text-[10px] text-[#c2652a]">
                <span className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> PlantUML Autocomplete
                </span>
                <span className="bg-[#3d2a1c] px-1.5 py-0.2 rounded text-[9px] text-[#e0a96d]">
                  Tab or ↵
                </span>
              </div>
              <div className="overflow-y-auto max-h-44 p-1 space-y-0.5">
                {filteredSuggestions.map((item, idx) => (
                  <div
                    key={item.label}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applySuggestion(item);
                    }}
                    className={`px-2 py-1 rounded cursor-pointer flex items-center justify-between transition-colors ${
                      idx === selectedIndex
                        ? 'bg-[#c2652a] text-white font-bold shadow-2xs'
                        : 'text-[#d8cfc4] hover:bg-[#2d241d]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={`text-[9px] px-1 py-0.2 rounded uppercase font-semibold shrink-0 ${
                        item.type === 'snippet'
                          ? 'bg-amber-900/60 text-amber-300'
                          : item.type === 'skinparam'
                          ? 'bg-blue-900/60 text-blue-300'
                          : item.type === 'arrow'
                          ? 'bg-rose-900/60 text-rose-300'
                          : 'bg-purple-900/60 text-purple-300'
                      }`}>
                        {item.type}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>
                    <span className={`text-[9px] shrink-0 ml-2 ${
                      idx === selectedIndex ? 'text-white/80' : 'text-[#8a7f75]'
                    }`}>
                      {item.detail}
                    </span>
                  </div>
                ))}
              </div>
              <div className="px-2 py-0.5 bg-[#120f0d] border-t border-[#29221b] text-[9px] text-[#786c60] flex items-center justify-between">
                <span>↑↓ Navigate</span>
                <span>Esc Dismiss</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor Status & Metrics Footer */}
      <div className="px-3 py-1 bg-[#1a1613] border-t border-[#3d342c] text-[10px] text-[#8a7f75] flex items-center justify-between font-mono">
        <div className="flex items-center gap-3">
          <span>Ln {cursorLine}, Col {cursorCol}</span>
          <span className="text-[#554b42]">|</span>
          <span>{lineCount} lines ({editableCode.length} chars)</span>
          <span className="text-[#554b42]">|</span>
          <span>Font: {fontSize}px</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#e0a96d] font-semibold">Tab: Complete</span>
          <span className="text-[#554b42]">|</span>
          <span className="text-[#786c60]">Ctrl+Enter: Compile</span>
          <span className="text-[#554b42]">|</span>
          <span className="text-[#786c60]">Ctrl+F: Find</span>
        </div>
      </div>
    </aside>
  );
};
