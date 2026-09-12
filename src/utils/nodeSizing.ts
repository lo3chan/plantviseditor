import { DiagramNode } from '../types';

export interface NodeDimensions {
  width: number;
  height: number;
}

/**
 * Computes optimal, content-aware bounding dimensions for any DiagramNode
 * to ensure all headers, stereotypes, attributes, methods, columns, and buttons
 * start out sized so everything is 100% visible, while serving as the content floor
 * during interactive resizing.
 */
export function getOptimalNodeDimensions(node: DiagramNode): NodeDimensions {
  const type = node.type || 'class';
  const category = node.category || '';
  const data = node.data || {};

  // 0. Specialized Activity & State Shapes (Circular & Compact)
  if (type === 'activity-start') {
    return { width: (node.width && node.width <= 60) ? node.width : 30, height: (node.height && node.height <= 60) ? node.height : 30 };
  }
  if (type === 'activity-stop') {
    return { width: (node.width && node.width <= 60) ? node.width : 34, height: (node.height && node.height <= 60) ? node.height : 34 };
  }
  if (type === 'activity-flow-final') {
    return { width: (node.width && node.width <= 60) ? node.width : 32, height: (node.height && node.height <= 60) ? node.height : 32 };
  }
  if (type === 'state-history' || data.shape === 'history') {
    return { width: (node.width && node.width <= 60) ? node.width : 34, height: (node.height && node.height <= 60) ? node.height : 34 };
  }
  if (type === 'activity-fork' || type === 'sync-bar' || data.shape === 'sync-bar') {
    return { width: node.width || 120, height: (node.height && node.height <= 30) ? node.height : 8 };
  }
  if (type === 'activity-decision' || data.shape === 'diamond') {
    return { width: (node.width && node.width <= 160) ? node.width : 110, height: (node.height && node.height <= 100) ? node.height : 64 };
  }
  if (type === 'interface-lollipop' || data.shape === 'lollipop') {
    return { width: (node.width && node.width <= 60) ? node.width : 32, height: (node.height && node.height <= 60) ? node.height : 32 };
  }
  if (type === 'entity-circle') {
    return { width: (node.width && node.width <= 60) ? node.width : 36, height: (node.height && node.height <= 60) ? node.height : 36 };
  }

  // 1. ER Database Table / Entity
  const isErTable = type === 'entity' || type === 'er-table' || category === 'data-schema' || Boolean(data.columns);
  if (isErTable && Array.isArray(data.columns) && data.columns.length > 0) {
    // Header: stereotype (<<entity>>), E circle spot, label, margins
    const headerH = (node.sublabel ? 20 : 0) + 48;
    
    // Body: each column row (py-0.5 + text + space-y-1 = 28px), padding (16px), Add Column button (36px), bottom port clearance (16px)
    const colCount = data.columns.length;
    const bodyH = 16 + colCount * 28 + 36 + 16;
    const minHeight = headerH + bodyH;

    // Width calculation: scan column names and types
    let maxContentLen = (node.label || '').length + 6;
    for (const col of data.columns) {
      const colLen = (col.name || '').length + (col.type || '').length;
      if (colLen > maxContentLen) maxContentLen = colLen;
    }
    // 8px per char + badges (PK + FK) + padding + action buttons
    const estimatedWidth = Math.max(240, maxContentLen * 8 + 110);

    return {
      width: Math.round(estimatedWidth),
      height: Math.round(minHeight)
    };
  }

  // 2. Class, Interface, Abstract Class, Enum, Struct, Protocol, Exception
  const isClassOrOO = [
    'class', 'interface', 'abstract-class', 'enum', 'struct', 'protocol', 'exception', 'annotation', 'metaclass'
  ].includes(type) || category === 'code';
  if (isClassOrOO && !isErTable) {
    const attrs = data.attributes || [];
    const methods = data.methods || [];

    // Compact Spot Badge for Empty Classifiers (e.g. Kernel, N1..N5)
    if (attrs.length === 0 && methods.length === 0 && !data.generics) {
      if (node.sublabel) {
        const maxTextLen = Math.max((node.label || '').length, (node.sublabel || '').length);
        return {
          width: Math.max(90, Math.min(220, Math.round(maxTextLen * 8.5 + 36))),
          height: 48
        };
      }
      const nameLen = (node.label || '').length;
      return {
        width: Math.max(52, Math.min(120, Math.round(nameLen * 8.5 + 32))),
        height: 28
      };
    }

    // Header: stereotype, generics tag, spot circle, name
    const headerH = (node.sublabel ? 20 : 0) + (data.generics ? 10 : 0) + 48;

    // Attributes partition: header title (Attributes [+]), padding, rows
    const attrsH = attrs.length > 0 ? (24 + 16 + attrs.length * 24 + 2) : 0;

    // Methods partition: header title (Methods [+]), padding, rows
    const methodsH = (type !== 'enum' && methods.length > 0) ? (24 + 16 + methods.length * 24 + 2) : 0;

    const bodyH = (attrsH + methodsH > 0) ? (attrsH + methodsH + 18) : 54;
    const minHeight = headerH + bodyH;

    let maxLen = (node.label || '').length + 6;
    for (const a of attrs) {
      if (a.length > maxLen) maxLen = a.length;
    }
    for (const m of methods) {
      if (m.length > maxLen) maxLen = m.length;
    }
    const estimatedWidth = Math.max(230, maxLen * 7.8 + 60);

    return {
      width: Math.round(estimatedWidth),
      height: Math.round(minHeight)
    };
  }

  // 3. Map (Dictionary / Key-Value Table)
  if (type === 'map' || Boolean(data.mapEntries)) {
    const entries = data.mapEntries || [];
    const headerH = (node.sublabel ? 20 : 0) + 48;
    const bodyH = 16 + entries.length * 28 + 36 + 16;
    let maxLen = (node.label || '').length;
    for (const e of entries) {
      const len = (e.key || '').length + (e.value || '').length + 6;
      if (len > maxLen) maxLen = len;
    }
    return {
      width: Math.max(220, maxLen * 8.5 + 40),
      height: Math.round(headerH + bodyH)
    };
  }

  // 4. Object (Instance / Slots)
  if (type === 'object' || Boolean(data.slots)) {
    const slots = data.slots || [];
    const headerH = (node.sublabel ? 20 : 0) + 48;
    const bodyH = 16 + slots.length * 28 + 36 + 16;
    let maxLen = (node.label || '').length;
    for (const s of slots) {
      const len = (s.key || '').length + (s.value || '').length + 6;
      if (len > maxLen) maxLen = len;
    }
    return {
      width: Math.max(220, maxLen * 8.5 + 40),
      height: Math.round(headerH + bodyH)
    };
  }

  // 5. State (State Machine)
  if (type === 'state' || data.shape === 'state') {
    const acts = data.attributes || [];
    const headerH = (node.sublabel ? 20 : 0) + 48;
    const bodyH = acts.length > 0 ? (16 + acts.length * 24 + 18) : 40;
    let maxLen = (node.label || '').length;
    for (const a of acts) {
      if (a.length > maxLen) maxLen = a.length;
    }
    return {
      width: Math.max(210, maxLen * 8 + 40),
      height: Math.round(headerH + bodyH)
    };
  }

  // 6. C4 Architecture Elements (Person, System, Container, Component, Queue, Database)
  if (type.startsWith('c4-') || category === 'c4' || Boolean(data.c4Type)) {
    const desc = data.description || '';
    const tech = data.technology || '';
    const descLines = desc ? Math.ceil((desc.length * 6.5) / 180) : 0;
    const techH = tech ? 22 : 0;
    const height = Math.max(135, 88 + techH + descLines * 18 + 16);
    return {
      width: Math.max(220, Math.min(320, (node.label || '').length * 8.5 + 60)),
      height: Math.round(height)
    };
  }

  // 7. Containers (Package, Frame, Folder, Boundary)
  if (type === 'package' || type === 'frame' || type === 'folder' || type === 'namespace' || category === 'container' || Boolean(data.isContainer)) {
    const rawText = (node.label || '') + '\n' + (data.description || '');
    const cleanText = rawText.replace(/\\n/g, '\n').trim();
    const textLines = cleanText.split('\n').filter(Boolean);

    if (textLines.length > 1) {
      let maxLineLen = 0;
      textLines.forEach(l => {
        const stripped = l.replace(/\*\*|\/\//g, '').trim();
        if (stripped.length > maxLineLen) maxLineLen = stripped.length;
      });
      const optimalW = Math.max(480, Math.min(650, Math.round(maxLineLen * 7.4 + 60)));
      let totalVisualLines = 0;
      textLines.forEach(l => {
        const stripped = l.replace(/\*\*|\/\//g, '').trim();
        totalVisualLines += Math.max(1, Math.ceil((stripped.length * 7.4) / (optimalW - 36)));
      });
      const optimalH = Math.max(340, Math.round(70 + totalVisualLines * 22 + 36));
      return {
        width: Math.max(optimalW, node.width || 0),
        height: Math.max(optimalH, node.height || 0)
      };
    }

    return {
      width: Math.max(480, node.width || 480),
      height: Math.max(340, node.height || 340)
    };
  }

  // 8. Note
  if (type === 'note' || data.shape === 'note') {
    const text = data.noteText || data.description || node.label || '';
    const lines = text.split('\n');
    let maxLine = 0;
    for (const l of lines) {
      if (l.length > maxLine) maxLine = l.length;
    }
    return {
      width: Math.max(190, maxLine * 8 + 40),
      height: Math.max(90, 50 + lines.length * 22)
    };
  }

  // 9. Standard Shapes fallback
  return {
    width: Math.max(node.width || 180, 180),
    height: Math.max(node.height || 85, 85)
  };
}

/**
 * Returns a clone of the node with guaranteed visibility dimensions
 */
export function ensureNodeDimensions(node: DiagramNode): DiagramNode {
  const optimal = getOptimalNodeDimensions(node);
  const isSmallShape = [
    'activity-start',
    'activity-stop',
    'activity-flow-final',
    'state-history',
    'activity-fork',
    'sync-bar',
    'activity-decision',
    'interface-lollipop',
    'entity-circle'
  ].includes(node.type) || ['sync-bar', 'diamond', 'lollipop', 'history', 'stop'].includes(node.data?.shape || '');

  const isClassOrOO = [
    'class', 'interface', 'abstract-class', 'enum', 'struct', 'protocol', 'exception', 'annotation', 'metaclass'
  ].includes(node.type) || node.category === 'code';
  const isEmptyClassifier = isClassOrOO && (!node.data?.attributes || node.data.attributes.length === 0) && (!node.data?.methods || node.data.methods.length === 0) && !node.data?.generics && !node.sublabel;

  if (isSmallShape || isEmptyClassifier) {
    return {
      ...node,
      width: optimal.width,
      height: optimal.height
    };
  }

  return {
    ...node,
    width: Math.max(node.width || optimal.width, optimal.width),
    height: Math.max(node.height || optimal.height, optimal.height)
  };
}
