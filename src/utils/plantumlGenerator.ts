import { DiagramData, DiagramNode, DiagramEdge, ErColumn, ObjectSlot, MapEntry, GlobalCanvasSettings } from '../types';

export function sanitizeId(str: string): string {
  const clean = str.replace(/[^a-zA-Z0-9_]/g, '_');
  return /^[0-9]/.test(clean) ? `id_${clean}` : clean || 'node';
}

/**
 * Generates exhaustive, 1-1 valid PlantUML string from DiagramData
 * matching the entire Unified Structural Canvas Catalog
 */
export function generatePlantUML(diagram: DiagramData): string {
  const lines: string[] = [];
  lines.push('@startuml');
  lines.push('allowmixing');

  if (diagram.title) {
    lines.push(`title ${diagram.title}`);
  }

  // 1. Global Canvas Layout & Styling Directives
  const settings: GlobalCanvasSettings = diagram.settings || {
    direction: 'TB',
    linetype: 'ortho',
    monochrome: false,
    handwritten: false,
    shadowing: false
  };

  if (settings.direction === 'LR') {
    lines.push('left to right direction');
  } else {
    lines.push('top to bottom direction');
  }

  if (settings.linetype === 'ortho') {
    lines.push('skinparam linetype ortho');
  } else if (settings.linetype === 'polyline') {
    lines.push('skinparam linetype polyline');
  }

  if (settings.shadowing === false) {
    lines.push('skinparam shadowing false');
  }

  if (settings.monochrome) {
    lines.push('skinparam monochrome true');
  }

  if (settings.handwritten) {
    lines.push('skinparam handwritten true');
  }

  lines.push('skinparam roundcorner 8');
  lines.push('skinparam ArrowColor #c2652a');
  lines.push('skinparam classAttributeIconSize 0');
  lines.push('');

  // 2. Elements Declarations
  diagram.nodes.forEach(node => {
    const id = sanitizeId(node.id);
    const label = (node.label || id).replace(/"/g, '\\"');
    const generics = node.data?.generics ? node.data.generics : '';
    const spotStr = node.data?.spot ? ` << (${node.data.spot.character}, ${node.data.spot.colorHex}) >>` : '';
    const stereotype = node.sublabel ? ` <<${node.sublabel.replace(/[<>]/g, '')}>>` : spotStr;

    // Embedded Sub-engines (Salt, Ditaa, Math)
    if (node.type === 'embedded-salt' || node.data?.embeddedType === 'salt') {
      const content = node.data?.embeddedContent || '{\n  [Button]\n}';
      lines.push(`card ${id} as "` + label + `"`);
      lines.push(`note bottom of ${id}`);
      lines.push('  {{');
      lines.push('    salt');
      lines.push(content.split('\n').map(l => `    ${l}`).join('\n'));
      lines.push('  }}');
      lines.push('end note');
      return;
    }

    if (node.type === 'embedded-ditaa' || node.data?.embeddedType === 'ditaa') {
      const content = node.data?.embeddedContent || '+---+   +---+\n| A |-->| B |\n+---+   +---+';
      lines.push(`card ${id} as "` + label + `"`);
      lines.push(`note bottom of ${id}`);
      lines.push('  {{');
      lines.push('    ditaa');
      lines.push(content.split('\n').map(l => `    ${l}`).join('\n'));
      lines.push('  }}');
      lines.push('end note');
      return;
    }

    // Interactive JSON block
    if (node.type === 'data-json' || node.type === 'json') {
      let content = '{}';
      try {
        content = JSON.stringify(JSON.parse(node.data?.treeContent || '{}'), null, 2);
      } catch {
        content = node.data?.treeContent || '{}';
      }
      lines.push(`json ${id} {`);
      lines.push(content.split('\n').map(l => `  ${l}`).join('\n'));
      lines.push('}');
      return;
    }

    // Interactive YAML block
    if (node.type === 'data-yaml' || node.type === 'yaml') {
      lines.push(`yaml ${id} {`);
      const yml = node.data?.treeContent || 'key: value';
      lines.push(yml.split('\n').map(l => `  ${l}`).join('\n'));
      lines.push('}');
      return;
    }

    // Map Dictionary Table (key => value)
    if (node.type === 'map' || node.data?.mapEntries) {
      lines.push(`map "${label}" as ${id}${stereotype} {`);
      const entries = node.data?.mapEntries || [];
      entries.forEach(e => lines.push(`  ${e.key} => ${e.value}`));
      lines.push('}');
      return;
    }

    // Relational Database Table (Entity with Crow's Foot)
    if (node.type === 'entity' || node.type === 'er-table' || node.category === 'data-schema') {
      const tableName = node.data?.tableName || label;
      lines.push(`entity "${tableName}" as ${id}${stereotype} {`);
      const cols = node.data?.columns || [];
      const pkCols = cols.filter(c => c.isPk);
      const nonPkCols = cols.filter(c => !c.isPk);

      pkCols.forEach(c => {
        const uq = c.isUnique ? ' <<UNIQUE>>' : '';
        lines.push(`  * ${c.name} : ${c.type}${uq} <<PK>>`);
      });

      if (pkCols.length > 0 && nonPkCols.length > 0) {
        lines.push('  --');
      }

      nonPkCols.forEach(c => {
        const marker = c.isFk ? '# ' : '  ';
        const uq = c.isUnique ? ' <<UNIQUE>>' : '';
        const fk = c.isFk ? ' <<FK>>' : '';
        lines.push(`  ${marker}${c.name} : ${c.type}${fk}${uq}`);
      });

      lines.push('}');
      return;
    }

    // Object Instance
    if (node.type === 'object') {
      const clsName = node.data?.className ? ` : ${node.data.className}` : '';
      lines.push(`object "${label}${clsName}" as ${id}${stereotype} {`);
      const slots = node.data?.slots || [];
      slots.forEach(s => lines.push(`  ${s.key} = ${s.value}`));
      lines.push('}');
      return;
    }

    // C4 Architecture Elements
    if (node.type === 'c4-person') {
      const desc = node.data?.description ? `, "${node.data.description}"` : '';
      lines.push(`actor "${label}" as ${id} <<Person>>${desc}`);
      return;
    }
    if (node.type === 'c4-system') {
      const desc = node.data?.description ? `, "${node.data.description}"` : '';
      lines.push(`rectangle "${label}" as ${id} <<System>>${desc}`);
      return;
    }
    if (node.type === 'c4-container') {
      const tech = node.data?.technology ? ` [${node.data.technology}]` : '';
      lines.push(`component "${label}${tech}" as ${id} <<Container>>`);
      return;
    }

    // Code & OO Classifiers (class, abstract class, interface, enum, struct, protocol, exception)
    if (
      node.category === 'code' || 
      ['class', 'abstract-class', 'interface', 'enum', 'struct', 'protocol', 'exception', 'annotation', 'metaclass'].includes(node.type)
    ) {
      let kw = 'class';
      if (node.type === 'interface') kw = 'interface';
      else if (node.type === 'abstract-class') kw = 'abstract class';
      else if (node.type === 'enum') kw = 'enum';
      else if (node.type === 'struct') kw = 'struct';
      else if (node.type === 'protocol') kw = 'protocol';
      else if (node.type === 'exception') kw = 'exception';
      else if (node.type === 'annotation') kw = 'annotation';
      else if (node.type === 'metaclass') kw = 'metaclass';

      lines.push(`${kw} "${label}${generics}" as ${id}${stereotype} {`);
      if (node.data?.attributes && node.data.attributes.length > 0) {
        node.data.attributes.forEach(attr => lines.push(`  ${attr}`));
      }
      if (node.data?.methods && node.data.methods.length > 0) {
        lines.push('  --');
        node.data.methods.forEach(m => lines.push(`  ${m}`));
      }
      lines.push('}');
      return;
    }

    // Boundary & Grouping Containers
    if (node.type === 'package' || node.type === 'namespace' || node.data?.isContainer) {
      const kw = node.data?.containerType === 'namespace' ? 'namespace' : 'package';
      lines.push(`${kw} "${label}" as ${id}${stereotype} {`);
      lines.push('}');
      return;
    }

    // Notes
    if (node.type === 'note') {
      const desc = node.data?.description || label;
      lines.push(`note "${desc}" as ${id}`);
      return;
    }

    // Specific Shape Keywords
    switch (node.type) {
      case 'node':
        lines.push(`node "${label}" as ${id}${stereotype}`);
        break;
      case 'database':
        lines.push(`database "${label}" as ${id}${stereotype}`);
        break;
      case 'storage':
        lines.push(`storage "${label}" as ${id}${stereotype}`);
        break;
      case 'cloud':
      case 'cloud-aws':
      case 'cloud-gcp':
      case 'cloud-azure':
      case 'cloud-k8s':
        lines.push(`cloud "${label}" as ${id}${stereotype}`);
        break;
      case 'queue':
        lines.push(`queue "${label}" as ${id}${stereotype}`);
        break;
      case 'stack':
        lines.push(`stack "${label}" as ${id}${stereotype}`);
        break;
      case 'artifact':
        lines.push(`artifact "${label}" as ${id}${stereotype}`);
        break;
      case 'file':
        lines.push(`file "${label}" as ${id}${stereotype}`);
        break;
      case 'folder':
        lines.push(`folder "${label}" as ${id}${stereotype}`);
        break;
      case 'frame':
        lines.push(`frame "${label}" as ${id}${stereotype}`);
        break;
      case 'card':
        lines.push(`card "${label}" as ${id}${stereotype}`);
        break;
      case 'hexagon':
        lines.push(`hexagon "${label}" as ${id}${stereotype}`);
        break;
      case 'collections':
        lines.push(`collections "${label}" as ${id}${stereotype}`);
        break;
      case 'boundary':
        lines.push(`boundary "${label}" as ${id}${stereotype}`);
        break;
      case 'control':
        lines.push(`control "${label}" as ${id}${stereotype}`);
        break;
      case 'entity-circle':
        lines.push(`entity "${label}" as ${id}${stereotype}`);
        break;
      case 'interface-lollipop':
        lines.push(`interface () "${label}" as ${id}`);
        break;
      case 'actor':
        lines.push(`actor "${label}" as ${id}${stereotype}`);
        break;
      case 'agent':
        lines.push(`agent "${label}" as ${id}${stereotype}`);
        break;
      case 'component':
        lines.push(`[${label}] as ${id}${stereotype}`);
        break;
      default:
        lines.push(`rectangle "${label}" as ${id}${stereotype}`);
        break;
    }
  });

  lines.push('');

  // 3. Connectors & Relationships
  diagram.edges.forEach(edge => {
    const src = sanitizeId(edge.source);
    const tgt = sanitizeId(edge.target);
    const srcCard = edge.cardinalitySource ? `"${edge.cardinalitySource}" ` : '';
    const tgtCard = edge.cardinalityTarget ? ` "${edge.cardinalityTarget}"` : '';
    const readingDir = edge.readingDirection ? ` ${edge.readingDirection}` : '';
    const label = edge.label ? ` : ${edge.label}${readingDir}` : '';

    // Arrow length dashes
    const dashLen = edge.length || (edge.style === 'dashed' ? 2 : 2);
    const dashChar = edge.style === 'dashed' || edge.style === 'dotted' ? '.' : '-';
    const mainDashes = dashChar.repeat(Math.max(1, dashLen));

    // Direction hint (e.g. -up->, -down->, -left->, -right->)
    let dirTag = '';
    if (edge.directionHint) {
      dirTag = edge.directionHint[0]; // 'u', 'd', 'l', 'r'
    }

    // Color tag (e.g. -[#0000FF]-> or -[#c2652a,bold]->)
    let colorTag = '';
    if (edge.color) {
      const boldStyle = edge.style === 'thick' ? ',bold' : '';
      colorTag = `[${edge.color}${boldStyle}]`;
    }

    let arrow = '-->';

    switch (edge.arrowType) {
      // Crow's Foot & ER
      case 'crows-foot-one':
        arrow = '||--||';
        break;
      case 'crows-foot-many':
        arrow = '||--|{';
        break;
      case 'crows-foot-zero-many':
        arrow = '||--o{';
        break;
      case 'crows-foot-zero-one':
        arrow = '||--o|';
        break;
      case 'crows-foot-many-many':
        arrow = '}|--|{';
        break;
      case 'crows-foot-zero-zero':
        arrow = '}o--o{';
        break;
      case 'crows-foot-opt-opt':
        arrow = '|o--o|';
        break;

      // OOP Relationships
      case 'inheritance':
        arrow = '--|>';
        break;
      case 'realization':
        arrow = '..|>';
        break;
      case 'composition':
        arrow = '*--';
        break;
      case 'aggregation':
        arrow = 'o--';
        break;
      case 'nesting':
        arrow = '+--';
        break;
      case 'cancellation':
        arrow = 'x--';
        break;
      case 'socket-ball':
        arrow = '-0)';
        break;
      case 'lollipop':
        arrow = '()--';
        break;
      case 'dependency':
        arrow = '..>';
        break;
      case 'bi-arrow':
        arrow = '<-->';
        break;
      case 'none':
        arrow = '--';
        break;
      default:
        if (dirTag || colorTag) {
          arrow = `-${colorTag}${dirTag}->`;
        } else if (edge.style === 'dashed' || edge.style === 'dotted') {
          arrow = '..>';
        } else if (edge.style === 'thick') {
          arrow = '==>';
        } else {
          arrow = '-->';
        }
        break;
    }

    lines.push(`${src} ${srcCard}${arrow}${tgtCard} ${tgt}${label}`);
  });

  lines.push('');
  lines.push('@enduml');
  return lines.join('\n');
}

/**
 * 1-1 PlantUML Parser
 * Parses valid PlantUML script into DiagramData with automatic layout calculation
 */
export function parsePlantUML(text: string): Partial<DiagramData> {
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];
  const nodeMap = new Map<string, DiagramNode>();

  let title = 'PlantUML Diagram';
  const settings: GlobalCanvasSettings = {
    direction: 'TB',
    linetype: 'ortho',
    monochrome: false,
    handwritten: false,
    shadowing: false
  };

  // Pre-process: strip block comments /' ... '/
  const cleanText = text.replace(/\/'[\s\S]*?'\//g, '');
  const lines = cleanText.split('\n');

  let currentBlock: {
    type: string;
    id: string;
    label: string;
    generics?: string;
    stereotype?: string;
    spot?: { character: string; colorHex: string };
    lines: string[];
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (
      !rawLine || 
      rawLine.startsWith("'") || 
      rawLine.startsWith('!') || 
      rawLine.startsWith('@') || 
      rawLine.toLowerCase() === 'allowmixing'
    ) continue;

    // Check title directive
    const titleMatch = rawLine.match(/^title\s+(.+)$/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
      continue;
    }

    // Check direction directives
    if (rawLine.includes('left to right direction')) {
      settings.direction = 'LR';
      continue;
    }
    if (rawLine.includes('top to bottom direction')) {
      settings.direction = 'TB';
      continue;
    }

    // Check skinparam directives
    if (rawLine.includes('skinparam linetype ortho')) settings.linetype = 'ortho';
    if (rawLine.includes('skinparam linetype polyline')) settings.linetype = 'polyline';
    if (rawLine.includes('skinparam monochrome true')) settings.monochrome = true;
    if (rawLine.includes('skinparam handwritten true')) settings.handwritten = true;
    if (rawLine.includes('skinparam shadowing true')) settings.shadowing = true;

    // Inside a multi-line block
    if (currentBlock) {
      if (rawLine === '}' || rawLine.endsWith('}')) {
        finishBlock(currentBlock, nodes, nodeMap);
        currentBlock = null;
      } else {
        currentBlock.lines.push(rawLine);
      }
      continue;
    }

    // Check for block start:
    // class "Name<T>" as id <<stereotype>> { OR struct Name { OR entity Name { OR json id {
    const blockStartMatch = rawLine.match(/^(class|abstract\s+class|interface|enum|annotation|struct|protocol|exception|metaclass|entity|object|map|package|namespace|node|component|database|json|yaml)\s+(?:"([^"]+)"\s+as\s+([a-zA-Z0-9_]+)|([a-zA-Z0-9_]+)(?:<([^>]+)>)?(?:\s+as\s+([a-zA-Z0-9_]+))?)(?:\s*<<\s*(?:\(([A-Z]),\s*(#[a-fA-F0-9]{3,6})\)\s*)?([^>]*)>>)?\s*\{/i);
    if (blockStartMatch) {
      const type = blockStartMatch[1].toLowerCase().replace(/\s+/, '-');
      const label = blockStartMatch[2] || blockStartMatch[4];
      const generics = blockStartMatch[5] ? `<${blockStartMatch[5]}>` : undefined;
      const id = blockStartMatch[3] || blockStartMatch[6] || blockStartMatch[4];
      const spotChar = blockStartMatch[7];
      const spotColor = blockStartMatch[8];
      const stereotype = blockStartMatch[9]?.trim();

      currentBlock = {
        type,
        id: sanitizeId(id),
        label,
        generics,
        stereotype,
        spot: spotChar && spotColor ? { character: spotChar, colorHex: spotColor } : undefined,
        lines: []
      };
      continue;
    }

    // Single-line declaration:
    // keyword "label" as id <<stereotype>>
    const declMatch = rawLine.match(/^(actor|agent|component|database|storage|cloud|node|queue|stack|artifact|file|folder|frame|card|hexagon|collections|boundary|control|interface|class|enum|entity|object|state|usecase|rectangle)\s+(?:"([^"]+)"\s+as\s+([a-zA-Z0-9_]+)|([a-zA-Z0-9_]+)(?:\s+as\s+([a-zA-Z0-9_]+))?)(?:\s*<<([^>]+)>>)?/i);
    if (declMatch) {
      const type = declMatch[1].toLowerCase();
      const label = declMatch[2] || declMatch[4];
      const id = sanitizeId(declMatch[3] || declMatch[5] || declMatch[4]);
      const stereotype = declMatch[6]?.trim();

      if (!nodeMap.has(id)) {
        const node: DiagramNode = {
          id,
          type,
          category: getCategoryForType(type),
          label,
          sublabel: stereotype ? `<<${stereotype}>>` : undefined,
          x: 0,
          y: 0,
          width: 190,
          height: 85,
          color: getColorForType(type),
          data: {}
        };
        nodes.push(node);
        nodeMap.set(id, node);
      }
      continue;
    }

    // Bracket notation: [Component Label] as id OR [Component Label]
    const bracketMatch = rawLine.match(/^\[([^\]]+)\](?:\s+as\s+([a-zA-Z0-9_]+))?(?:\s*<<([^>]+)>>)?/i);
    if (bracketMatch) {
      const label = bracketMatch[1];
      const id = sanitizeId(bracketMatch[2] || label);
      const stereotype = bracketMatch[3];
      if (!nodeMap.has(id)) {
        const node: DiagramNode = {
          id,
          type: 'component',
          category: 'component',
          label,
          sublabel: stereotype ? `<<${stereotype}>>` : undefined,
          x: 0,
          y: 0,
          width: 180,
          height: 80,
          color: 'sienna'
        };
        nodes.push(node);
        nodeMap.set(id, node);
      }
      continue;
    }

    // Note declaration: note "Text" as id
    const noteMatch = rawLine.match(/^note\s+"([^"]+)"\s+as\s+([a-zA-Z0-9_]+)/i);
    if (noteMatch) {
      const label = noteMatch[1];
      const id = sanitizeId(noteMatch[2]);
      if (!nodeMap.has(id)) {
        const node: DiagramNode = {
          id,
          type: 'note',
          category: 'annotation',
          label,
          x: 0,
          y: 0,
          width: 190,
          height: 80,
          color: 'gold',
          data: { description: label }
        };
        nodes.push(node);
        nodeMap.set(id, node);
      }
      continue;
    }

    // Arrow / Connection match:
    // Support: ||--||, ||--|{, ||--o{, ||--o|, }|--|{, }o--o{, |o--o|, <|--, --|>, ..|>, *--, o--, +--, x--, -0), ()--, -->, ..>, <-->
    const arrowRegex = /([a-zA-Z0-9_]+)\s*(?:"([^"]*)")?\s*(\|\|--\|\||\|\|--\|\{|\|\|--o\{|\|\|--o\||\}\|--\|\{|\}o--o\{|\|o--o\||<\|--|--\|>|\.\.\|>|<\.\.\|\*--|--\*|o--|--o|\+--|--\+|x--|--x|-0\)|-0\(|\(\)--|--\(\)|\.\.>|<\.\.|\.\.|-->|<--|<-->|--|==>)\s*(?:"([^"]*)")?\s*([a-zA-Z0-9_]+)(?:\s*:\s*(.+))?/;
    const arrowMatch = rawLine.match(arrowRegex);
    if (arrowMatch) {
      const srcId = sanitizeId(arrowMatch[1]);
      const srcCard = arrowMatch[2]?.trim();
      const arrowOp = arrowMatch[3];
      const tgtCard = arrowMatch[4]?.trim();
      const tgtId = sanitizeId(arrowMatch[5]);
      let edgeLabel = arrowMatch[6]?.trim();

      // Check reading direction < or >
      let readingDirection: '>' | '<' | undefined = undefined;
      if (edgeLabel?.endsWith('>')) {
        readingDirection = '>';
        edgeLabel = edgeLabel.replace(/\s*>$/, '').trim();
      } else if (edgeLabel?.endsWith('<')) {
        readingDirection = '<';
        edgeLabel = edgeLabel.replace(/\s*<$/, '').trim();
      }

      ensureImplicitNode(srcId, arrowMatch[1], nodes, nodeMap);
      ensureImplicitNode(tgtId, arrowMatch[5], nodes, nodeMap);

      let arrowType: DiagramEdge['arrowType'] = 'arrow';
      let style: DiagramEdge['style'] = 'solid';

      if (arrowOp === '||--||') arrowType = 'crows-foot-one';
      else if (arrowOp === '||--|{' || arrowOp === '}|--||') arrowType = 'crows-foot-many';
      else if (arrowOp === '||--o{' || arrowOp === '}o--||') arrowType = 'crows-foot-zero-many';
      else if (arrowOp === '||--o|' || arrowOp === '|o--||') arrowType = 'crows-foot-zero-one';
      else if (arrowOp === '}|--|{') arrowType = 'crows-foot-many-many';
      else if (arrowOp === '}o--o{') arrowType = 'crows-foot-zero-zero';
      else if (arrowOp === '|o--o|') arrowType = 'crows-foot-opt-opt';
      else if (arrowOp === '<|--' || arrowOp === '--|>') arrowType = 'inheritance';
      else if (arrowOp === '..|>' || arrowOp === '<|..') {
        arrowType = 'realization';
        style = 'dashed';
      } else if (arrowOp === '*--' || arrowOp === '--*') arrowType = 'composition';
      else if (arrowOp === 'o--' || arrowOp === '--o') arrowType = 'aggregation';
      else if (arrowOp === '+--' || arrowOp === '--+') arrowType = 'nesting';
      else if (arrowOp === 'x--' || arrowOp === '--x') arrowType = 'cancellation';
      else if (arrowOp === '-0)' || arrowOp === '-0(') arrowType = 'socket-ball';
      else if (arrowOp === '()--' || arrowOp === '--()') arrowType = 'lollipop';
      else if (arrowOp === '..>' || arrowOp === '<..') {
        arrowType = 'dependency';
        style = 'dashed';
      } else if (arrowOp === '<-->') arrowType = 'bi-arrow';
      else if (arrowOp === '--') arrowType = 'none';
      else if (arrowOp === '==>') style = 'thick';

      edges.push({
        id: `edge_${srcId}_${tgtId}_${edges.length}`,
        source: arrowOp.startsWith('<') && !arrowOp.includes('-->') ? tgtId : srcId,
        target: arrowOp.startsWith('<') && !arrowOp.includes('-->') ? srcId : tgtId,
        label: edgeLabel,
        cardinalitySource: srcCard,
        cardinalityTarget: tgtCard,
        readingDirection,
        style,
        arrowType
      });
    }
  }

  // Automatic Layout
  applyAutoLayout(nodes, edges);

  return {
    title,
    settings,
    nodes,
    edges
  };
}

function finishBlock(
  block: { 
    type: string; 
    id: string; 
    label: string; 
    generics?: string; 
    stereotype?: string; 
    spot?: { character: string; colorHex: string }; 
    lines: string[] 
  },
  nodes: DiagramNode[],
  nodeMap: Map<string, DiagramNode>
) {
  const { type, id, label, generics, stereotype, spot, lines } = block;

  if (type === 'entity') {
    const columns: ErColumn[] = [];
    lines.forEach(l => {
      const clean = l.trim();
      if (!clean || clean === '--') return;
      const isPk = clean.startsWith('*') || clean.includes('<<PK>>');
      const isFk = clean.startsWith('#') || clean.includes('<<FK>>');
      const isUnique = clean.includes('<<UNIQUE>>');
      const content = clean.replace(/^[*#]\s*/, '').replace(/<<[^>]+>>/g, '');
      const parts = content.split(':').map(p => p.trim());
      columns.push({
        name: parts[0] || 'column',
        type: parts[1] || 'varchar',
        isPk,
        isFk,
        isUnique
      });
    });

    const node: DiagramNode = {
      id,
      type: 'entity',
      category: 'data-schema',
      label,
      sublabel: stereotype ? `<<${stereotype}>>` : '<<entity>>',
      x: 0,
      y: 0,
      width: 230,
      height: Math.max(90, 60 + columns.length * 24),
      color: 'ochre',
      data: {
        tableName: label,
        columns
      }
    };
    nodes.push(node);
    nodeMap.set(id, node);
    return;
  }

  if (type === 'map') {
    const mapEntries: MapEntry[] = [];
    lines.forEach(l => {
      const clean = l.trim();
      if (!clean) return;
      const parts = clean.split('=>').map(p => p.trim());
      if (parts.length >= 2) {
        mapEntries.push({ key: parts[0], value: parts[1] });
      }
    });

    const node: DiagramNode = {
      id,
      type: 'map',
      category: 'code',
      label,
      sublabel: stereotype ? `<<${stereotype}>>` : undefined,
      x: 0,
      y: 0,
      width: 210,
      height: Math.max(80, 50 + mapEntries.length * 22),
      color: 'sand',
      data: { mapEntries }
    };
    nodes.push(node);
    nodeMap.set(id, node);
    return;
  }

  if (type === 'object') {
    const slots: ObjectSlot[] = [];
    lines.forEach(l => {
      const clean = l.trim();
      if (!clean) return;
      const parts = clean.split('=').map(p => p.trim());
      if (parts.length >= 2) {
        slots.push({ key: parts[0], value: parts[1] });
      }
    });

    const node: DiagramNode = {
      id,
      type: 'object',
      category: 'code',
      label,
      sublabel: stereotype ? `<<${stereotype}>>` : undefined,
      x: 0,
      y: 0,
      width: 210,
      height: Math.max(80, 50 + slots.length * 22),
      color: 'terracotta',
      data: { slots }
    };
    nodes.push(node);
    nodeMap.set(id, node);
    return;
  }

  if (type === 'json' || type === 'yaml') {
    const node: DiagramNode = {
      id,
      type: `data-${type}`,
      category: 'data-schema',
      label,
      x: 0,
      y: 0,
      width: 240,
      height: 180,
      color: 'sand',
      data: {
        treeFormat: type as 'json' | 'yaml',
        treeContent: lines.join('\n')
      }
    };
    nodes.push(node);
    nodeMap.set(id, node);
    return;
  }

  // Class, Struct, Interface, Enum, Exception
  const attributes: string[] = [];
  const methods: string[] = [];
  let readingMethods = false;

  lines.forEach(l => {
    const clean = l.trim();
    if (!clean) return;
    if (clean === '--' || clean === '__') {
      readingMethods = true;
      return;
    }
    if (clean.includes('(') || readingMethods) {
      methods.push(clean);
    } else {
      attributes.push(clean);
    }
  });

  const node: DiagramNode = {
    id,
    type,
    category: 'code',
    label,
    sublabel: stereotype ? `<<${stereotype}>>` : undefined,
    x: 0,
    y: 0,
    width: 220,
    height: Math.max(90, 50 + (attributes.length + methods.length) * 20),
    color: getColorForType(type),
    data: {
      spot,
      generics,
      attributes,
      methods
    }
  };
  nodes.push(node);
  nodeMap.set(id, node);
}

function ensureImplicitNode(id: string, rawLabel: string, nodes: DiagramNode[], nodeMap: Map<string, DiagramNode>) {
  if (nodeMap.has(id)) return;
  const node: DiagramNode = {
    id,
    type: 'class',
    category: 'code',
    label: rawLabel,
    x: 0,
    y: 0,
    width: 170,
    height: 70,
    color: 'sienna'
  };
  nodes.push(node);
  nodeMap.set(id, node);
}

function getCategoryForType(type: string): DiagramNode['category'] {
  if (['class', 'interface', 'abstract-class', 'enum', 'struct', 'protocol', 'exception', 'annotation', 'metaclass', 'object', 'map'].includes(type)) {
    return 'code';
  }
  if (['component', 'port', 'interface-lollipop', 'collections', 'boundary', 'control'].includes(type)) {
    return 'component';
  }
  if (['node', 'database', 'storage', 'cloud', 'queue', 'stack', 'artifact', 'file', 'folder', 'frame', 'card', 'hexagon'].includes(type)) {
    return 'infrastructure';
  }
  if (['entity', 'json', 'yaml'].includes(type)) {
    return 'data-schema';
  }
  if (['package', 'namespace', 'rectangle'].includes(type)) {
    return 'container';
  }
  if (['actor', 'agent'].includes(type)) {
    return 'actor-agent';
  }
  if (['note'].includes(type)) {
    return 'annotation';
  }
  return 'code';
}

function getColorForType(type: string): string {
  switch (type) {
    case 'class': return 'sienna';
    case 'abstract-class': return 'terracotta';
    case 'interface': return 'sage';
    case 'enum': return 'sand';
    case 'entity': return 'ochre';
    case 'object': return 'ochre';
    case 'database': return 'ochre';
    case 'storage': return 'sand';
    case 'cloud': return 'sage';
    case 'queue': return 'terracotta';
    case 'stack': return 'slate';
    case 'node': return 'slate';
    case 'note': return 'gold';
    default: return 'sienna';
  }
}

/**
 * Applies a hierarchical rank layout
 */
export function applyAutoLayout(nodes: DiagramNode[], edges: DiagramEdge[]) {
  if (nodes.length === 0) return;

  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  nodes.forEach(n => {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  });

  edges.forEach(e => {
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    const neighbors = adj.get(e.source) || [];
    neighbors.push(e.target);
    adj.set(e.source, neighbors);
  });

  const levels = new Map<string, number>();
  const queue: string[] = [];

  nodes.forEach(n => {
    if ((inDegree.get(n.id) || 0) === 0) {
      levels.set(n.id, 0);
      queue.push(n.id);
    }
  });

  if (queue.length === 0 && nodes.length > 0) {
    levels.set(nodes[0].id, 0);
    queue.push(nodes[0].id);
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currLevel = levels.get(curr) || 0;
    const neighbors = adj.get(curr) || [];

    neighbors.forEach(nxt => {
      const existing = levels.get(nxt);
      if (existing === undefined || existing < currLevel + 1) {
        levels.set(nxt, currLevel + 1);
        queue.push(nxt);
      }
    });
  }

  nodes.forEach(n => {
    if (!levels.has(n.id)) {
      levels.set(n.id, 0);
    }
  });

  const rankGroups = new Map<number, DiagramNode[]>();
  nodes.forEach(n => {
    const lvl = levels.get(n.id) || 0;
    const group = rankGroups.get(lvl) || [];
    group.push(n);
    rankGroups.set(lvl, group);
  });

  const START_X = 60;
  const START_Y = 50;
  const GAP_X = 50;
  const GAP_Y = 70;

  let currentY = START_Y;
  const sortedRanks = Array.from(rankGroups.keys()).sort((a, b) => a - b);

  sortedRanks.forEach(rank => {
    const group = rankGroups.get(rank)!;
    let currentX = START_X;
    let maxH = 0;

    group.forEach(node => {
      node.x = currentX;
      node.y = currentY;
      currentX += node.width + GAP_X;
      if (node.height > maxH) {
        maxH = node.height;
      }
    });

    currentY += maxH + GAP_Y;
  });
}
