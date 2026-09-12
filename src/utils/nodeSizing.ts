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
    return {
      width: Math.max(340, node.width || 340),
      height: Math.max(240, node.height || 240)
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
  return {
    ...node,
    width: Math.max(node.width || optimal.width, optimal.width),
    height: Math.max(node.height || optimal.height, optimal.height)
  };
}
