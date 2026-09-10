import { DiagramData, DiagramNode, DiagramEdge, SequenceParticipant, SequenceMessage, SequenceBlock } from '../types';
import { sanitizeId } from './plantumlGenerator';

export type SelectedElementType = 'node' | 'edge' | 'participant' | 'message' | 'block';

export interface SelectedCanvasElement {
  type: SelectedElementType;
  id: string;
  label?: string;
  source?: string;
  target?: string;
}

/**
 * Accurately finds the 1-based line number in the PlantUML code string that corresponds
 * to the currently selected visual canvas element. Returns the primary (first) line.
 */
export function findPlantUMLLinesForElement(
  code: string,
  element: SelectedCanvasElement | null,
  diagram?: DiagramData
): number | null {
  const allLines = findPlantUMLAllLinesForElement(code, element, diagram);
  return allLines.length > 0 ? allLines[0] : null;
}

export function findPlantUMLAllLinesForElement(
  code: string,
  element: SelectedCanvasElement | null,
  diagram?: DiagramData
): number[] {
  if (!element || !code) return [];

  const rawLines = code.split('\n');

  if (element.type === 'node') {
    const node = diagram?.nodes?.find(n => n.id === element.id);
    const targetId = element.id;
    const sanitizedId = sanitizeId(targetId);
    const label = node?.label || element.label || '';
    const sanitizedLabel = label ? sanitizeId(label) : '';

    const idRegexParts = [targetId, sanitizedId];
    if (sanitizedLabel && sanitizedLabel !== sanitizedId) idRegexParts.push(sanitizedLabel);
    const idPattern = idRegexParts.map(escapeRegExp).join('|');

    // 1. Check for multi-line block definitions:
    // class "Name" as id { ... } OR entity id { ... }
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      if (!line || line.startsWith("'")) continue;

      const isBlockStart = line.includes('{') && (
        new RegExp(`\\bas\\s+["']?(${idPattern})["']?\\b`, 'i').test(line) ||
        new RegExp(`\\b(class|abstract\\s+class|interface|enum|entity|struct|component|node|package|namespace|database|json|yaml|state)\\s+["']?(${idPattern})["']?\\b`, 'i').test(line) ||
        (label && line.includes(`"${label}"`))
      );

      if (isBlockStart) {
        // Enclose all lines in this block
        const matchedLines: number[] = [];
        let braceDepth = 0;
        for (let j = i; j < rawLines.length; j++) {
          matchedLines.push(j + 1); // 1-based line number
          const openCount = (rawLines[j].match(/\{/g) || []).length;
          const closeCount = (rawLines[j].match(/\}/g) || []).length;
          braceDepth += openCount - closeCount;
          if (braceDepth <= 0 && j > i) {
            break;
          }
        }
        return matchedLines;
      }
    }

    // 2. Check for single-line declarations:
    // class "Name" as id, [Component] as id, actor :Actor: as id, Person(id, ...), note "..." as id
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      if (!line || line.startsWith("'")) continue;

      const isSingleDecl = (
        new RegExp(`\\bas\\s+["']?(${idPattern})["']?\\b`, 'i').test(line) ||
        new RegExp(`^\\s*(actor|agent|component|database|storage|cloud|node|queue|stack|artifact|file|folder|frame|card|hexagon|collections|boundary|control|interface|class|enum|entity|state|usecase|rectangle)\\s+["']?(${idPattern})["']?\\b`, 'i').test(line) ||
        new RegExp(`^\\s*(Person|Person_Ext|System|System_Ext|SystemDb|Container|ContainerDb|Component)\\s*\\(\\s*(${idPattern})\\b`, 'i').test(line) ||
        new RegExp(`^\\s*note\\s+.*\\bas\\s+(${idPattern})\\b`, 'i').test(line) ||
        (label && (line.startsWith(`"${label}"`) || line.startsWith(`[${label}]`) || line.startsWith(`(${label})`) || line.startsWith(`:${label}:`)))
      );

      if (isSingleDecl) {
        return [i + 1];
      }
    }

    // 3. Fallback: match any line starting with the node identifier
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      if (!line || line.startsWith("'") || line.startsWith('@')) continue;

      if (
        new RegExp(`^["']?(${idPattern})["']?\\b`, 'i').test(line) ||
        (label && line.includes(`"${label}"`))
      ) {
        return [i + 1];
      }
    }
  }

  if (element.type === 'edge') {
    const edge = diagram?.edges?.find(e => e.id === element.id);
    const sourceId = edge?.source || element.source || '';
    const targetId = edge?.target || element.target || '';
    const edgeLabel = edge?.label || element.label;

    const srcNode = diagram?.nodes?.find(n => n.id === sourceId);
    const tgtNode = diagram?.nodes?.find(n => n.id === targetId);

    const srcNames = [sourceId, sanitizeId(sourceId), srcNode?.label].filter(Boolean) as string[];
    const tgtNames = [targetId, sanitizeId(targetId), tgtNode?.label].filter(Boolean) as string[];

    const srcPattern = srcNames.map(escapeRegExp).join('|');
    const tgtPattern = tgtNames.map(escapeRegExp).join('|');

    // Find arrow connection lines between src and tgt
    const candidateLines: { lineNum: number; score: number }[] = [];

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      if (!line || line.startsWith("'") || line.startsWith('@')) continue;

      const hasSrc = new RegExp(`(^|\\W)(${srcPattern})($|\\W)`, 'i').test(line);
      const hasTgt = new RegExp(`(^|\\W)(${tgtPattern})($|\\W)`, 'i').test(line);

      if (hasSrc && hasTgt) {
        let score = 2;
        // Prioritize if line contains the edge label
        if (edgeLabel && line.toLowerCase().includes(edgeLabel.toLowerCase())) {
          score += 5;
        }
        // Prioritize if line contains arrow operators
        if (/[-.=]{1,4}[>|*o+#x{<]/.test(line) || /Rel\s*\(|Rel_\w+\s*\(/.test(line)) {
          score += 3;
        }
        candidateLines.push({ lineNum: i + 1, score });
      }
    }

    if (candidateLines.length > 0) {
      candidateLines.sort((a, b) => b.score - a.score);
      return [candidateLines[0].lineNum];
    }
  }

  if (element.type === 'participant') {
    const p = diagram?.participants?.find(part => part.id === element.id);
    const id = p?.id || element.id;
    const name = p?.name || element.label || '';
    const idPattern = [id, name].filter(Boolean).map(escapeRegExp).join('|');

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      if (
        new RegExp(`^\\s*(participant|actor|boundary|control|entity|database|collections|queue)\\s+.*\\b(${idPattern})\\b`, 'i').test(line)
      ) {
        return [i + 1];
      }
    }
  }

  if (element.type === 'message') {
    const msg = diagram?.messages?.find(m => m.id === element.id);
    if (msg) {
      for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i].trim();
        if (
          line.includes(msg.from) && 
          line.includes(msg.to) && 
          (!msg.label || line.includes(msg.label))
        ) {
          return [i + 1];
        }
      }
    }
  }

  if (element.type === 'block') {
    const block = diagram?.blocks?.find(b => b.id === element.id);
    if (block) {
      for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i].trim();
        if (
          new RegExp(`^\\s*${block.type}\\b`, 'i').test(line) &&
          (!block.condition || line.includes(block.condition))
        ) {
          const matched: number[] = [i + 1];
          // Find matching 'end'
          for (let j = i + 1; j < rawLines.length; j++) {
            matched.push(j + 1);
            if (/^\s*end\b/i.test(rawLines[j])) {
              break;
            }
          }
          return matched;
        }
      }
    }
  }

  return [];
}

/**
 * Maps a line of PlantUML code (from editor cursor position) back to a Diagram element
 * (node, edge, participant, or message).
 */
export function findDiagramElementForCodeLine(
  lineText: string,
  diagram: DiagramData
): SelectedCanvasElement | null {
  try {
    if (!lineText || !diagram) return null;
    const rawLine = lineText.trim();
    if (!rawLine || rawLine.startsWith("'") || rawLine.startsWith('@')) return null;

    // Strip inline comments (e.g., "A -> B : call ' inline note")
    const line = rawLine.replace(/'.*$/, '').trim();
    if (!line) return null;

    // 1. Check Sequence Diagram elements if applicable
    if (diagram.messages && diagram.messages.length > 0) {
      for (const msg of diagram.messages) {
        const fromPart = diagram.participants?.find(p => p.id === msg.from);
        const toPart = diagram.participants?.find(p => p.id === msg.to);
        const fromNames = [msg.from, fromPart?.name].filter(Boolean) as string[];
        const toNames = [msg.to, toPart?.name].filter(Boolean) as string[];

        const matchesFrom = fromNames.some(n => new RegExp(`(^|\\W)("?${escapeRegExp(n)}"?)(?=\\W|$)`, 'i').test(line));
        const matchesTo = toNames.some(n => new RegExp(`(^|\\W)("?${escapeRegExp(n)}"?)(?=\\W|$)`, 'i').test(line));

        if (matchesFrom && matchesTo) {
          return { type: 'message', id: msg.id, source: msg.from, target: msg.to, label: msg.label };
        }
      }
    }

    if (diagram.participants && diagram.participants.length > 0) {
      for (const p of diagram.participants) {
        const names = [p.id, p.name].filter(Boolean);
        const hasName = names.some(n => new RegExp(`(^|\\W)("?${escapeRegExp(n)}"?)(?=\\W|$)`, 'i').test(line));
        if (hasName) {
          return { type: 'participant', id: p.id, label: p.name };
        }
      }
    }

    if (diagram.blocks && diagram.blocks.length > 0) {
      for (const b of diagram.blocks) {
        if (line.toLowerCase().startsWith(b.type.toLowerCase())) {
          return { type: 'block', id: b.id, label: b.label };
        }
      }
    }

    // 2. Check Edges (Relationships)
    const hasArrow = /(-->|->>|->|\.\.>|\.\.|\.|--|==|<-|<--|<\|--|--\|>)/.test(line);
    if (diagram.edges && diagram.edges.length > 0 && hasArrow) {
      for (const edge of diagram.edges) {
        const srcNode = diagram.nodes?.find(n => n.id === edge.source);
        const tgtNode = diagram.nodes?.find(n => n.id === edge.target);

        const srcMatches = [edge.source, sanitizeId(edge.source), srcNode?.label].filter(Boolean) as string[];
        const tgtMatches = [edge.target, sanitizeId(edge.target), tgtNode?.label].filter(Boolean) as string[];

        const hasSrc = srcMatches.some(name => new RegExp(`(^|\\W)${escapeRegExp(name)}($|\\W)`, 'i').test(line));
        const hasTgt = tgtMatches.some(name => new RegExp(`(^|\\W)${escapeRegExp(name)}($|\\W)`, 'i').test(line));

        if (hasSrc && hasTgt) {
          return { type: 'edge', id: edge.id, source: edge.source, target: edge.target, label: edge.label };
        }
      }
    }

    // 3. Check Nodes
    if (diagram.nodes && diagram.nodes.length > 0) {
      // Check "as <id>" first
      const asMatch = line.match(/\bas\s+["']?([a-zA-Z0-9_]+)["']?/i);
      if (asMatch) {
        const asId = asMatch[1];
        const found = diagram.nodes.find(n => n.id === asId || sanitizeId(n.id) === asId || (n.label && sanitizeId(n.label) === asId));
        if (found) {
          return { type: 'node', id: found.id, label: found.label };
        }
      }

      // Check node id or label in declaration
      for (const node of diagram.nodes) {
        const id = node.id;
        const sanId = sanitizeId(node.id);
        const label = node.label;
        const patternParts = [id, sanId, label].filter(Boolean);
        if (patternParts.length === 0) continue;
        const pattern = patternParts.map(escapeRegExp).join('|');

        if (new RegExp(`(^|\\W)(${pattern})($|\\W)`, 'i').test(line)) {
          return { type: 'node', id: node.id, label: node.label };
        }
      }
    }

    return null;
  } catch (err) {
    console.warn('Error matching diagram element for code line:', err);
    return null;
  }
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
