import { DiagramNode, DiagramEdge, PortPosition } from '../types';

/**
 * Checks if two bounding boxes overlap, accounting for a safety margin
 */
export function doNodesOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
  margin: number = 32
): boolean {
  return !(
    a.x + a.width + margin <= b.x ||
    b.x + b.width + margin <= a.x ||
    a.y + a.height + margin <= b.y ||
    b.y + b.height + margin <= a.y
  );
}

/**
 * Resolves overlapping nodes in a diagram by pushing colliding bounding boxes apart
 * using multi-pass iterative relaxation with non-overlap collision resolution.
 */
export function resolveOverlaps(
  nodes: DiagramNode[],
  minMargin: number = 36
): DiagramNode[] {
  if (!nodes || nodes.length <= 1) return nodes ? [...nodes] : [];

  const cloned: DiagramNode[] = nodes.map(n => ({
    ...n,
    x: Number.isFinite(n.x) ? n.x : 40,
    y: Number.isFinite(n.y) ? n.y : 40,
    width: Math.max(Number.isFinite(n.width) ? n.width : 160, 40),
    height: Math.max(Number.isFinite(n.height) ? n.height : 80, 30)
  }));

  // Separate container nodes (packages, namespaces, frames, folders) from loose nodes
  const containerIds = new Set<string>();
  cloned.forEach(n => {
    if (
      n.type === 'package' ||
      n.type === 'namespace' ||
      n.type === 'frame' ||
      n.type === 'folder' ||
      n.category === 'container' ||
      Boolean(n.data?.isContainer) ||
      n.data?.containerType === 'frame' ||
      n.data?.containerType === 'package'
    ) {
      containerIds.add(n.id);
    }
  });

  // Determine if a node is currently inside a container bounding box
  const isInsideContainer = (child: DiagramNode, container: DiagramNode): boolean => {
    if (child.data?.parentId === container.id) return true;
    const childCenterX = child.x + child.width / 2;
    const childCenterY = child.y + child.height / 2;
    return (
      childCenterX >= container.x &&
      childCenterX <= container.x + container.width &&
      childCenterY >= container.y &&
      childCenterY <= container.y + container.height
    );
  };

  // Group child nodes belonging to each container
  const containerChildrenMap = new Map<string, DiagramNode[]>();
  cloned.forEach(c => {
    if (containerIds.has(c.id)) {
      const children = cloned.filter(
        n => n.id !== c.id && (n.data?.parentId === c.id || (!n.data?.parentId && isInsideContainer(n, c) && !containerIds.has(n.id)))
      );
      containerChildrenMap.set(c.id, children);
    }
  });

  // 1. First resolve overlaps among children within each container
  containerChildrenMap.forEach((children, cId) => {
    if (children.length > 1) {
      relaxNodeGroup(children, minMargin);
    }
    // Resize container so it safely encloses all children with generous padding
    const container = cloned.find(n => n.id === cId);
    if (container && children.length > 0) {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      children.forEach(ch => {
        minX = Math.min(minX, ch.x);
        minY = Math.min(minY, ch.y);
        maxX = Math.max(maxX, ch.x + ch.width);
        maxY = Math.max(maxY, ch.y + ch.height);
      });
      const padX = 36;
      const padTop = 50; // Extra room for package header
      const padBottom = 36;
      container.x = Math.max(20, minX - padX);
      container.y = Math.max(20, minY - padTop);
      container.width = (maxX - minX) + padX * 2;
      container.height = (maxY - minY) + padTop + padBottom;
    }
  });

  // 2. Resolve overlaps among top-level nodes (containers + loose nodes not inside any container)
  const isAnchorNode = (n: DiagramNode) =>
    (n.type === 'class' || n.category === 'code') &&
    (!n.data?.attributes || n.data.attributes.length === 0) &&
    (!n.data?.methods || n.data.methods.length === 0) &&
    /^N\d+$/i.test(n.label || n.id);

  const topLevelNodes = cloned.filter(n => {
    if (isAnchorNode(n)) return false;
    if (n.data?.parentId && containerIds.has(n.data.parentId)) return false;
    for (const [, children] of containerChildrenMap) {
      if (children.some(ch => ch.id === n.id)) return false;
    }
    return true;
  });

  const prevContainerPositions = new Map<string, { x: number; y: number }>();
  topLevelNodes.forEach(n => {
    if (containerIds.has(n.id)) {
      prevContainerPositions.set(n.id, { x: n.x, y: n.y });
    }
  });

  relaxNodeGroup(topLevelNodes, minMargin);

  // Synchronize children of containers that moved during relaxation
  topLevelNodes.forEach(n => {
    if (containerIds.has(n.id)) {
      const prev = prevContainerPositions.get(n.id);
      if (prev) {
        const dx = n.x - prev.x;
        const dy = n.y - prev.y;
        if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
          const children = containerChildrenMap.get(n.id);
          if (children) {
            children.forEach(ch => {
              ch.x += dx;
              ch.y += dy;
            });
          }
        }
      }
    }
  });

  // 3. Keep all nodes comfortably within canvas bounds, ensuring at least 140px left margin for flanking edge badges
  let minX = Infinity;
  let minY = Infinity;
  cloned.forEach(n => {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
  });
  const shiftX = minX < 140 ? 140 - minX : 0;
  const shiftY = minY < 40 ? 40 - minY : 0;
  if (shiftX > 0 || shiftY > 0) {
    cloned.forEach(n => {
      n.x += shiftX;
      n.y += shiftY;
    });
  }

  return cloned;
}

/**
 * Runs iterative relaxation on a list of nodes to push them apart until no overlap exists.
 */
function relaxNodeGroup(nodes: DiagramNode[], minMargin: number) {
  const MAX_ITERATIONS = 15;

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    let hadCollision = false;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];

        if (!doNodesOverlap(a, b, minMargin)) continue;

        hadCollision = true;

        // If nodes are stacked directly on top of each other, nudge slightly to break tie
        if (Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1) {
          b.x += 16;
          b.y += 16;
        }

        const centerAX = a.x + a.width / 2;
        const centerAY = a.y + a.height / 2;
        const centerBX = b.x + b.width / 2;
        const centerBY = b.y + b.height / 2;

        const diffX = centerBX - centerAX;
        const diffY = centerBY - centerAY;

        const requiredDistX = (a.width + b.width) / 2 + minMargin;
        const requiredDistY = (a.height + b.height) / 2 + minMargin;

        const overlapX = requiredDistX - Math.abs(diffX);
        const overlapY = requiredDistY - Math.abs(diffY);

        if (overlapX > 0 && overlapY > 0) {
          // Push apart along the axis with smaller required shift
          if (overlapX < overlapY * 1.2) {
            const shiftX = (overlapX / 2) + 2;
            if (diffX >= 0) {
              a.x -= shiftX;
              b.x += shiftX;
            } else {
              a.x += shiftX;
              b.x -= shiftX;
            }
          } else {
            const shiftY = (overlapY / 2) + 2;
            if (diffY >= 0) {
              a.y -= shiftY;
              b.y += shiftY;
            } else {
              a.y += shiftY;
              b.y -= shiftY;
            }
          }

          // Boundary prevention
          if (a.x < 40) a.x = 40;
          if (a.y < 40) a.y = 40;
          if (b.x < 40) b.x = 40;
          if (b.y < 40) b.y = 40;
        }
      }
    }

    if (!hadCollision) break;
  }
}

/**
 * Finds a nearby vacant position for placing a new node without overlapping existing nodes.
 */
export function findVacantPosition(
  existingNodes: DiagramNode[],
  preferredX: number = 240,
  preferredY: number = 160,
  width: number = 200,
  height: number = 100,
  minMargin: number = 36
): { x: number; y: number } {
  if (!existingNodes || existingNodes.length === 0) {
    return { x: Math.max(40, preferredX), y: Math.max(40, preferredY) };
  }

  const candidate = { x: preferredX, y: preferredY, width, height };

  const hasOverlap = (cand: { x: number; y: number; width: number; height: number }) => {
    return existingNodes.some(n => doNodesOverlap(n, cand, minMargin));
  };

  if (!hasOverlap(candidate)) {
    return { x: candidate.x, y: candidate.y };
  }

  // Spiral search on a 40px grid to find the closest vacant space
  const GRID_STEP_X = 60;
  const GRID_STEP_Y = 50;

  for (let radius = 1; radius <= 10; radius++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;

        const testX = Math.max(40, preferredX + dx * GRID_STEP_X);
        const testY = Math.max(40, preferredY + dy * GRID_STEP_Y);

        const testBox = { x: testX, y: testY, width, height };
        if (!hasOverlap(testBox)) {
          return { x: testX, y: testY };
        }
      }
    }
  }

  // Fallback: place below the lowest existing node
  let maxY = 40;
  existingNodes.forEach(n => {
    maxY = Math.max(maxY, n.y + n.height);
  });

  return { x: Math.max(40, preferredX), y: maxY + minMargin };
}

/**
 * Auto-formats PlantUML code with clean, readable indentation
 */
export function autoFormatPlantUML(code: string): string {
  if (!code) return '';

  const lines = code.split('\n');
  const formattedLines: string[] = [];
  let indentLevel = 0;

  const INDENT = '  ';

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (!line) {
      // Don't produce multiple consecutive empty lines
      if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== '') {
        formattedLines.push('');
      }
      continue;
    }

    // Check for decrease in indentation before line
    if (
      line.startsWith('}') ||
      line.startsWith('end') ||
      line.startsWith('else') ||
      line.startsWith('deactivate')
    ) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    // Apply current indentation
    const prefix = INDENT.repeat(indentLevel);
    formattedLines.push(prefix + line);

    // Check for increase in indentation after line
    if (
      line.endsWith('{') ||
      line.startsWith('alt ') ||
      line.startsWith('loop ') ||
      line.startsWith('group ') ||
      line.startsWith('critical ') ||
      line.startsWith('opt ') ||
      line.startsWith('else') ||
      line.startsWith('activate ')
    ) {
      indentLevel++;
    }
  }

  return formattedLines.join('\n');
}

/**
 * Syntax validator for PlantUML scripts
 */
export function validatePlantUML(code: string): {
  isValid: boolean;
  errors: Array<{ line: number; message: string }>;
  warnings: Array<{ line: number; message: string }>;
} {
  const errors: Array<{ line: number; message: string }> = [];
  const warnings: Array<{ line: number; message: string }> = [];

  if (!code || !code.trim()) {
    warnings.push({ line: 1, message: 'Script is empty' });
    return { isValid: true, errors, warnings };
  }

  const lines = code.split('\n');
  let hasStartUml = false;
  let hasEndUml = false;
  let inMultiLineComment = false;
  let inNoteBlock = false;
  let inLegendBlock = false;
  let openBraceCount = 0;
  const braceStack: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    let line = lines[i];

    // Handle multiline comments /' ... '/
    if (inMultiLineComment) {
      const endIdx = line.indexOf("'/");
      if (endIdx !== -1) {
        inMultiLineComment = false;
        line = line.substring(endIdx + 2);
      } else {
        continue;
      }
    }

    const startCommentIdx = line.indexOf("/'");
    if (startCommentIdx !== -1) {
      const endCommentIdx = line.indexOf("'/", startCommentIdx + 2);
      if (endCommentIdx !== -1) {
        line = line.substring(0, startCommentIdx) + ' ' + line.substring(endCommentIdx + 2);
      } else {
        inMultiLineComment = true;
        line = line.substring(0, startCommentIdx);
      }
    }

    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("'")) {
      continue;
    }

    if (trimmed.startsWith('@startuml')) hasStartUml = true;
    if (trimmed.startsWith('@enduml')) hasEndUml = true;

    // Handle legend ... endlegend blocks (freeform markdown/markup inside)
    if (/^legend\b/i.test(trimmed)) {
      inLegendBlock = true;
      continue;
    }
    if (inLegendBlock) {
      if (/^end\s*legend\b|^endlegend\b/i.test(trimmed)) {
        inLegendBlock = false;
      }
      continue;
    }

    // Handle note ... end note blocks (freeform documentation inside)
    if (/^(?:note|rnote|hnote)\b/i.test(trimmed)) {
      // If it's a single-line note like 'note right: text' or 'note "text" as N', don't enter block
      const isSingleLine = /^(?:note|rnote|hnote)\s+.*:\s*.+$/i.test(trimmed) ||
                           /^(?:note|rnote|hnote)\s+"[^"]+"\s+as\s+\w+$/i.test(trimmed);
      if (!isSingleLine && !/end\s*(?:note|rnote|hnote)/i.test(trimmed)) {
        inNoteBlock = true;
        continue;
      }
    }
    if (inNoteBlock) {
      if (/^end\s*(?:note|rnote|hnote)\b|^endnote\b|^endrnote\b|^endhnote\b/i.test(trimmed)) {
        inNoteBlock = false;
      }
      continue;
    }

    // Check unclosed quotes (ignoring escaped quotes \")
    const sanitizedQuotes = trimmed.replace(/\\"/g, '');
    const quoteCount = (sanitizedQuotes.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      errors.push({ line: lineNum, message: 'Unmatched quotation marks (")' });
    }

    // Strip content inside quotes so quotes and characters inside strings don't interfere
    let cleanLine = trimmed.replace(/"([^"\\]|\\.)*"/g, '""');

    // Strip relationship arrows that contain braces, e.g. ||--|{, ||--o{, }|--|{, }o--o{, --{, }--, }|..|{, etc.
    cleanLine = cleanLine.replace(/(\|\||\|o|o\||}[|o]|[|o]{)?[-.<>=0\(\)\^x#\+\*]*(?:--|\.\.|==)[-.<>=0\(\)\^x#\+\*]*([|o]?[{\[])?/g, ' -- ');
    cleanLine = cleanLine.replace(/(?:--|\.\.|==)[|o]?[{\[]/g, '--');
    cleanLine = cleanLine.replace(/[}\]][|o]?(?:--|\.\.|==)/g, '--');
    cleanLine = cleanLine.replace(/\|\{/g, ' ');
    cleanLine = cleanLine.replace(/o\{/g, ' ');
    cleanLine = cleanLine.replace(/\}\|/g, ' ');
    cleanLine = cleanLine.replace(/\}o/g, ' ');

    // Strip inline PlantUML stereotyping, modifiers, or variables like {field}, {method}, {static}, {abstract}, {var}
    cleanLine = cleanLine.replace(/\{[a-zA-Z0-9_-]+\}/g, ' ');

    // Track block braces
    for (let charIdx = 0; charIdx < cleanLine.length; charIdx++) {
      const char = cleanLine[charIdx];
      if (char === '{') {
        openBraceCount++;
        braceStack.push(lineNum);
      } else if (char === '}') {
        if (openBraceCount > 0) {
          openBraceCount--;
          braceStack.pop();
        } else {
          errors.push({ line: lineNum, message: 'Unexpected closing brace "}"' });
        }
      }
    }
  }

  if (!hasStartUml) {
    warnings.push({ line: 1, message: 'Missing @startuml declaration' });
  }
  if (!hasEndUml) {
    warnings.push({ line: lines.length, message: 'Missing @enduml closing tag' });
  }
  if (braceStack.length > 0) {
    errors.push({
      line: braceStack[braceStack.length - 1],
      message: `Unclosed opening brace "{" (missing matching "}")`
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Computes exact port coordinate for a diagram node
 */
function getNodePortCoord(node: DiagramNode, port?: PortPosition): { x: number; y: number } {
  switch (port) {
    case 'top': return { x: node.x + node.width / 2, y: node.y };
    case 'right': return { x: node.x + node.width, y: node.y + node.height / 2 };
    case 'bottom': return { x: node.x + node.width / 2, y: node.y + node.height };
    case 'left': return { x: node.x, y: node.y + node.height / 2 };
    default: return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
  }
}

/**
 * Checks if a box overlaps a node's bounding box with a margin
 */
function doesBoxOverlapNode(
  box: { x: number; y: number; width: number; height: number },
  node: DiagramNode,
  margin: number = 8
): boolean {
  return !(
    box.x + box.width + margin <= node.x ||
    node.x + node.width + margin <= box.x ||
    box.y + box.height + margin <= node.y ||
    node.y + node.height + margin <= box.y
  );
}

/**
 * Checks if two bounding boxes collide with a safety margin
 */
function doBoxesCollide(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
  margin: number = 6
): boolean {
  return !(
    a.x + a.width + margin <= b.x ||
    b.x + b.width + margin <= a.x ||
    a.y + a.height + margin <= b.y ||
    b.y + b.height + margin <= a.y
  );
}

/**
 * Resolves overlapping and obscured edge/link labels so that labels are:
 * 1. Never obscured by diagram nodes (classes, entities, packages)
 * 2. Never obscured by other edge labels (parallel links, crossing links)
 * 3. Positioned along unobstructed clear corridors
 */
/**
 * Determines whether a string represents actual numeric multiplicity/cardinality
 * (e.g. "1", "*", "0..1", "1..*", "0..*") rather than descriptive technology or protocols.
 */
export function isMultiplicity(val?: string): boolean {
  if (!val) return false;
  const clean = val.trim();
  if (clean.length > 10) return false;
  return /^[\d.*+?~-]+(\.\.[\d.*+?~-]+)?$/.test(clean) || /^(0\.\.1|0\.\.\*|1\.\.\*|\*|1|n|m|\?|\+)$/i.test(clean);
}

/**
 * Resolves overlapping edge labels and sets optimal `labelOffset` properties
 * using candidate position generation along edge midpoints and perpendicular normals.
 */
export function resolveEdgeLabelOverlaps(
  nodes: DiagramNode[],
  edges: DiagramEdge[]
): DiagramEdge[] {
  if (!edges || edges.length === 0) return [];
  if (!nodes || nodes.length === 0) return edges.map(e => ({ ...e }));

  const clonedEdges: DiagramEdge[] = edges.map(e => ({ ...e }));
  const placedLabelBoxes: Array<{ id: string; x: number; y: number; width: number; height: number }> = [];
  const placedCardBoxes: Array<{ id: string; x: number; y: number; width: number; height: number }> = [];

  // Pre-register and anti-collide cardinality badges for all edges (strictly actual multiplicity)
  clonedEdges.forEach(edge => {
    const tgtNode = nodes.find(n => n.id === edge.target);
    if (!tgtNode || !edge.cardinalityTarget || !isMultiplicity(edge.cardinalityTarget)) return;
    const tgtPt = getNodePortCoord(tgtNode, edge.targetHandle);
    const cardW = Math.max(24, edge.cardinalityTarget.length * 7.5 + 14);
    const cardH = 18;
    let cx = tgtPt.x;
    let cy = tgtPt.y - 14 - cardH / 2;

    // Check collision against previously placed card boxes
    let attempts = 0;
    while (placedCardBoxes.some(b => doBoxesCollide({ x: cx - cardW / 2, y: cy - cardH / 2, width: cardW, height: cardH }, b, 6)) && attempts < 4) {
      cy -= 22;
      attempts++;
    }

    placedCardBoxes.push({
      id: `${edge.id}_tgt_card`,
      x: cx - cardW / 2,
      y: cy - cardH / 2,
      width: cardW,
      height: cardH
    });
  });

  // Group edges connecting the same two nodes (regardless of direction) to distribute parallel links
  const pairGroups = new Map<string, DiagramEdge[]>();
  clonedEdges.forEach(edge => {
    const pairKey = [edge.source, edge.target].sort().join(':::');
    if (!pairGroups.has(pairKey)) {
      pairGroups.set(pairKey, []);
    }
    pairGroups.get(pairKey)!.push(edge);
  });

  clonedEdges.forEach(edge => {
    const srcNode = nodes.find(n => n.id === edge.source);
    const tgtNode = nodes.find(n => n.id === edge.target);
    if (!srcNode || !tgtNode) return;

    // Determine label text for estimating badge bounding box (bounded width with wrapping)
    let mainDesc = edge.label || 'relationship';
    let techNote: string | undefined = undefined;
    const bracketMatch = mainDesc.match(/^(.*?)\[(.*?)\]$/);
    if (bracketMatch) {
      mainDesc = bracketMatch[1].trim();
      techNote = bracketMatch[2].trim();
    } else if (edge.cardinalityTarget && !isMultiplicity(edge.cardinalityTarget)) {
      techNote = edge.cardinalityTarget.trim();
    }

    const estimatedWidth = Math.min(220, Math.max(64, mainDesc.length * 6.5 + 24));
    const estimatedHeight = techNote ? 42 : 26;

    // Get connection port positions
    const srcPt = getNodePortCoord(srcNode, edge.sourceHandle);
    const tgtPt = getNodePortCoord(tgtNode, edge.targetHandle);

    const midX = (srcPt.x + tgtPt.x) / 2;
    const midY = (srcPt.y + tgtPt.y) / 2;

    // Special handling for reflexive self-referencing edges
    if (srcNode.id === tgtNode.id) {
      edge.labelOffset = { x: 38, y: -20 };
      placedLabelBoxes.push({
        id: edge.id,
        x: midX + 38 - estimatedWidth / 2,
        y: midY - 20 - estimatedHeight / 2,
        width: estimatedWidth,
        height: estimatedHeight
      });
      return;
    }

    const dx = tgtPt.x - srcPt.x;
    const dy = tgtPt.y - srcPt.y;
    const dist = Math.hypot(dx, dy) || 1;

    // Unit vector along edge
    const ux = dx / dist;
    const uy = dy / dist;

    // Perpendicular normal vector
    const nx = -uy;
    const ny = ux;

    // Check if there are multiple parallel edges between this pair
    const pairKey = [edge.source, edge.target].sort().join(':::');
    const siblingEdges = pairGroups.get(pairKey) || [edge];
    const siblingIndex = siblingEdges.findIndex(e => e.id === edge.id);
    const siblingCount = siblingEdges.length;

    // Base normal shift for parallel links (e.g. 0, +30, -30, +60, -60)
    let parallelNormalShift = 0;
    if (siblingCount > 1) {
      if (siblingIndex === 0) parallelNormalShift = 0;
      else if (siblingIndex % 2 === 1) parallelNormalShift = Math.ceil(siblingIndex / 2) * 32;
      else parallelNormalShift = -Math.ceil(siblingIndex / 2) * 32;
    }

    // Candidate label positions to test for zero collision
    interface Candidate {
      cx: number;
      cy: number;
      offsetX: number;
      offsetY: number;
      penalty: number;
    }

    const candidates: Candidate[] = [];

    // Test a variety of natural perpendicular and longitudinal offsets
    const normalOffsets = [0, 24, -24, 44, -44, 66, -66, 88, -88];
    const alongFractions = [0.5, 0.35, 0.65, 0.22, 0.78];

    alongFractions.forEach(frac => {
      const baseX = srcPt.x + ux * (dist * frac);
      const baseY = srcPt.y + uy * (dist * frac);

      normalOffsets.forEach(normOff => {
        const totalNorm = normOff + parallelNormalShift;
        const candX = baseX + nx * totalNorm;
        const candY = baseY + ny * totalNorm;

        // Distance from ideal midpoint as base penalty
        const distFromMid = Math.hypot(candX - midX, candY - midY);
        candidates.push({
          cx: candX,
          cy: candY,
          offsetX: candX - midX,
          offsetY: candY - midY,
          penalty: distFromMid
        });
      });
    });

    // Score candidates against node overlap and existing label overlap
    let bestCandidate = candidates[0];
    let minCollisions = Infinity;
    let bestPenalty = Infinity;

    for (const cand of candidates) {
      const box = {
        x: cand.cx - estimatedWidth / 2,
        y: cand.cy - estimatedHeight / 2,
        width: estimatedWidth,
        height: estimatedHeight
      };

      let collisions = 0;

      // 1. Node collisions (strictly avoid overlap with intermediate nodes)
      for (const node of nodes) {
        if (node.id === srcNode.id || node.id === tgtNode.id) continue;
        if (doesBoxOverlapNode(box, node, 12)) {
          collisions += 60;
        }
      }

      // 2. Overlap with other edge labels (strict)
      for (const placed of placedLabelBoxes) {
        if (doBoxesCollide(box, placed, 10)) {
          collisions += 40;
        }
      }

      // 3. Overlap with cardinality / tech badges
      for (const cardBox of placedCardBoxes) {
        if (doBoxesCollide(box, cardBox, 8)) {
          collisions += 35;
        }
      }

      // If this candidate has fewer collisions or equal collisions with lower displacement
      if (collisions < minCollisions || (collisions === minCollisions && cand.penalty < bestPenalty)) {
        minCollisions = collisions;
        bestPenalty = cand.penalty;
        bestCandidate = cand;

        // Perfect position found (zero collisions)
        if (minCollisions === 0 && cand.penalty <= 35) {
          break;
        }
      }
    }

    // Save final chosen position to collision buffer
    const finalBox = {
      id: edge.id,
      x: bestCandidate.cx - estimatedWidth / 2,
      y: bestCandidate.cy - estimatedHeight / 2,
      width: estimatedWidth,
      height: estimatedHeight
    };
    placedLabelBoxes.push(finalBox);

    // Apply offset if shifted away from midpoint
    const offX = Math.round(bestCandidate.offsetX);
    const offY = Math.round(bestCandidate.offsetY);
    if (Math.abs(offX) > 2 || Math.abs(offY) > 2) {
      edge.labelOffset = { x: offX, y: offY };
    } else {
      edge.labelOffset = undefined;
    }
  });

  return clonedEdges;
}

/**
 * Combined diagram anti-overlap: resolves both node collisions and link label collisions
 */
export function resolveDiagramOverlaps(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  minMargin: number = 36
): { nodes: DiagramNode[]; edges: DiagramEdge[] } {
  const cleanNodes = resolveOverlaps(nodes, minMargin);
  const cleanEdges = resolveEdgeLabelOverlaps(cleanNodes, edges);
  return { nodes: cleanNodes, edges: cleanEdges };
}

