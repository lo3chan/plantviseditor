import { DiagramData, DiagramNode, DiagramEdge, SequenceParticipant, SequenceMessage, SequenceBlock } from '../types';
import { getColorConfig } from './assetsData';
import { parsePlantUML } from './plantumlGenerator';

/**
 * Escapes text for XML attribute and entity values
 */
function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Strips or formats rich HTML labels for Draw.io cell values
 */
function formatNodeLabel(node: DiagramNode): string {
  const parts: string[] = [];

  // 1. C4 Architecture Entity
  if (node.category === 'c4' || node.type?.startsWith('c4-')) {
    const c4Type = node.data?.c4Type || node.type.replace('c4-', '');
    let tag = 'Software System';
    if (c4Type.includes('person')) tag = 'Person';
    else if (c4Type.includes('container-db') || c4Type.includes('system-db')) tag = 'Database';
    else if (c4Type.includes('container-queue') || c4Type.includes('system-queue')) tag = 'Queue';
    else if (c4Type.includes('container')) tag = 'Container';
    else if (c4Type.includes('component')) tag = 'Component';
    else if (c4Type.includes('node') || c4Type.includes('boundary')) tag = 'Boundary';

    parts.push(`&lt;b style="font-size:13px;"&gt;${escapeXml(node.label)}&lt;/b&gt;`);
    parts.push(`&lt;span style="font-size:10px;color:#78706a;"&gt;[${escapeXml(tag)}]&lt;/span&gt;`);

    if (node.data?.technology) {
      parts.push(`&lt;span style="font-size:10px;color:#5a504a;"&gt;[${escapeXml(node.data.technology)}]&lt;/span&gt;`);
    }
    if (node.data?.description) {
      parts.push(`&lt;span style="font-size:10px;display:block;margin-top:4px;"&gt;${escapeXml(node.data.description)}&lt;/span&gt;`);
    }
    return parts.join('&lt;br/&gt;');
  }

  // 2. ER Data Table (columns, keys, data types)
  if (node.data?.columns && node.data.columns.length > 0) {
    parts.push(`&lt;b style="font-size:12px;"&gt;${escapeXml(node.label)}&lt;/b&gt;`);
    if (node.sublabel) {
      parts.push(`&lt;i style="font-size:10px;"&gt;&amp;#171;${escapeXml(node.sublabel.replace(/^«|»$/g, ''))}&amp;#187;&lt;/i&gt;`);
    }
    parts.push('&lt;hr size="1" style="border-top: 1px solid #c2b8ad; margin: 4px 0;"/&gt;');
    node.data.columns.forEach(col => {
      const keyIcon = col.isPk ? '🔑 ' : col.isFk ? '🔗 ' : '  ';
      const colName = escapeXml(col.name);
      const colType = col.type ? ` : &lt;i&gt;${escapeXml(col.type)}&lt;/i&gt;` : '';
      parts.push(`&lt;div style="text-align:left;font-family:monospace;font-size:11px;"&gt;${keyIcon}&lt;b&gt;${colName}&lt;/b&gt;${colType}&lt;/div&gt;`);
    });
    return parts.join('');
  }

  // 3. State Machine State
  if (node.type === 'state' || node.data?.shape === 'state') {
    parts.push(`&lt;b style="font-size:12px;"&gt;${escapeXml(node.label)}&lt;/b&gt;`);
    if (node.data?.attributes && node.data.attributes.length > 0) {
      parts.push('&lt;hr size="1" style="border-top: 1px solid #c2b8ad; margin: 4px 0;"/&gt;');
      node.data.attributes.forEach(attr => {
        parts.push(`&lt;div style="text-align:left;font-size:10px;"&gt;${escapeXml(attr)}&lt;/div&gt;`);
      });
      return parts.join('');
    }
    return parts.join('&lt;br/&gt;');
  }

  // 4. Note Element
  if (node.type === 'note' || node.data?.shape === 'note') {
    const noteText = node.data?.noteText || node.label || '';
    return `&lt;div style="text-align:left;font-size:11px;white-space:pre-wrap;"&gt;${escapeXml(noteText)}&lt;/div&gt;`;
  }

  // 5. Standard UML Class / Interface / Struct / Enum / Component
  // Classifier Spot Badge (e.g. C for class, I for interface, E for enum)
  let spotBadge = '';
  if (node.data?.spot) {
    const char = escapeXml(node.data.spot.character);
    const hex = escapeXml(node.data.spot.colorHex || '#2e7d32');
    spotBadge = `&lt;span style="display:inline-block;width:14px;height:14px;line-height:14px;border-radius:50%;background-color:${hex};color:#fff;font-size:9px;font-weight:bold;margin-right:4px;text-align:center;"&gt;${char}&lt;/span&gt;`;
  }

  // Stereotype
  if (node.sublabel) {
    const cleanSublabel = node.sublabel.replace(/^«|»$/g, '').trim();
    parts.push(`&lt;i style="font-size:10px;"&gt;&amp;#171;${escapeXml(cleanSublabel)}&amp;#187;&lt;/i&gt;`);
  }

  // Primary Label with optional Generics
  const generics = node.data?.generics ? `&amp;lt;${escapeXml(node.data.generics.replace(/^<|>$/g, ''))}&amp;gt;` : '';
  parts.push(`${spotBadge}&lt;b style="font-size:12px;"&gt;${escapeXml(node.label)}${generics}&lt;/b&gt;`);

  // Attributes / Fields
  if (node.data?.attributes && node.data.attributes.length > 0) {
    parts.push('&lt;hr size="1" style="border-top: 1px solid #d8d0c8; margin: 4px 0;"/&gt;');
    node.data.attributes.forEach(attr => {
      parts.push(`&lt;div style="text-align:left;font-size:11px;"&gt;${escapeXml(attr)}&lt;/div&gt;`);
    });
  }

  // Methods
  if (node.data?.methods && node.data.methods.length > 0) {
    if (!node.data.attributes || node.data.attributes.length === 0) {
      parts.push('&lt;hr size="1" style="border-top: 1px solid #d8d0c8; margin: 4px 0;"/&gt;');
    }
    node.data.methods.forEach(m => {
      const cleanM = m.endsWith('()') ? m : `${m}()`;
      parts.push(`&lt;div style="text-align:left;font-size:11px;"&gt;${escapeXml(cleanM)}&lt;/div&gt;`);
    });
  }

  // Slots / Map Entries
  if (node.data?.slots && node.data.slots.length > 0) {
    parts.push('&lt;hr size="1" style="border-top: 1px solid #d8d0c8; margin: 4px 0;"/&gt;');
    node.data.slots.forEach(slot => {
      parts.push(`&lt;div style="text-align:left;font-size:11px;"&gt;&lt;b&gt;${escapeXml(slot.key)}&lt;/b&gt; = ${escapeXml(slot.value)}&lt;/div&gt;`);
    });
  }

  if (node.data?.mapEntries && node.data.mapEntries.length > 0) {
    parts.push('&lt;hr size="1" style="border-top: 1px solid #d8d0c8; margin: 4px 0;"/&gt;');
    node.data.mapEntries.forEach(entry => {
      parts.push(`&lt;div style="text-align:left;font-size:11px;"&gt;&lt;b&gt;${escapeXml(entry.key)}&lt;/b&gt; =&amp;gt; ${escapeXml(entry.value)}&lt;/div&gt;`);
    });
  }

  // Embedded tree format (JSON / YAML)
  if (node.data?.treeContent) {
    parts.push('&lt;hr size="1" style="border-top: 1px solid #d8d0c8; margin: 4px 0;"/&gt;');
    parts.push(`&lt;pre style="text-align:left;font-size:10px;margin:0;font-family:monospace;"&gt;${escapeXml(node.data.treeContent)}&lt;/pre&gt;`);
  }

  return parts.join(parts.some(p => p.startsWith('&lt;div') || p.startsWith('&lt;pre')) ? '' : '&lt;br/&gt;');
}

/**
 * Maps PlantUML Studio node shape/type and color to Draw.io mxGraph style string
 */
function getNodeDrawioStyle(node: DiagramNode): string {
  const shapeType = node.data?.shape || node.type;
  const colorCfg = getColorConfig(node.color);
  const fill = colorCfg.bgHex;
  const stroke = colorCfg.hex;
  const font = '#2b2622';

  const baseStyle = `html=1;whiteSpace=wrap;fillColor=${fill};strokeColor=${stroke};fontColor=${font};`;

  // Check state machine special points
  if (shapeType === 'start' || node.label === '[*]' && (node.data?.shape === 'start' || !node.data?.shape)) {
    return 'shape=ellipse;fillColor=#2b2622;strokeColor=#2b2622;aspect=fixed;html=1;';
  }
  if (shapeType === 'stop' || shapeType === 'flow-final') {
    return 'ellipse;shape=doubleEllipse;fillColor=#2b2622;strokeColor=#2b2622;aspect=fixed;html=1;strokeWidth=2;';
  }
  if (shapeType === 'history') {
    return `shape=ellipse;aspect=fixed;html=1;fontStyle=1;fillColor=${fill};strokeColor=${stroke};fontColor=${font};`;
  }
  if (shapeType === 'sync-bar') {
    return 'shape=rect;fillColor=#2b2622;strokeColor=#2b2622;html=1;';
  }
  if (shapeType === 'choice' || shapeType === 'diamond') {
    return `rhombus;${baseStyle}`;
  }

  // C4 Architecture Elements
  if (shapeType === 'c4-person' || shapeType === 'c4-person-ext' || node.data?.c4Type === 'person' || node.data?.c4Type === 'person-ext') {
    return `shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=${fill};strokeColor=${stroke};fontColor=${font};`;
  }
  if (shapeType === 'c4-container-db' || shapeType === 'c4-system-db' || shapeType === 'c4-component-db' || node.data?.c4Type?.includes('db')) {
    return `shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=15;${baseStyle}`;
  }
  if (shapeType === 'c4-container-queue' || shapeType === 'c4-system-queue' || shapeType === 'c4-component-queue' || node.data?.c4Type?.includes('queue')) {
    return `shape=mxgraph.flowchart.direct_data;${baseStyle}`;
  }
  if (shapeType === 'c4-deployment-node' || shapeType === 'c4-boundary' || node.data?.c4Type?.includes('boundary')) {
    return `swimlane;startSize=26;dashed=1;fontStyle=1;align=left;spacingLeft=10;${baseStyle}`;
  }

  // Robustness Analysis Shapes
  if (shapeType === 'boundary') {
    return `shape=mxgraph.uml.boundary;html=1;verticalAlign=top;aspect=fixed;fillColor=${fill};strokeColor=${stroke};fontColor=${font};`;
  }
  if (shapeType === 'control') {
    return `shape=mxgraph.uml.control;html=1;verticalAlign=top;aspect=fixed;fillColor=${fill};strokeColor=${stroke};fontColor=${font};`;
  }
  if (shapeType === 'entity-circle') {
    return `shape=mxgraph.uml.entity;html=1;verticalAlign=top;aspect=fixed;fillColor=${fill};strokeColor=${stroke};fontColor=${font};`;
  }

  // Standard UML & Structural Shapes
  switch (shapeType) {
    case 'actor':
    case 'agent':
      return `shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=${fill};strokeColor=${stroke};fontColor=${font};`;
    case 'database':
      return `shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=15;${baseStyle}`;
    case 'cloud':
      return `ellipse;shape=cloud;${baseStyle}`;
    case 'queue':
      return `shape=mxgraph.flowchart.direct_data;${baseStyle}`;
    case 'package':
    case 'namespace':
    case 'container':
    case 'together':
      return `swimlane;startSize=26;fontStyle=1;align=center;verticalAlign=top;collapsible=1;${baseStyle}`;
    case 'frame':
      return `shape=folder;fontStyle=1;tabWidth=110;tabHeight=26;tabPosition=left;boundedLbl=1;labelInHeader=1;${baseStyle}`;
    case 'folder':
      return `shape=folder;fontStyle=1;tabWidth=90;tabHeight=22;tabPosition=left;boundedLbl=1;labelInHeader=1;${baseStyle}`;
    case 'component':
      return `shape=component;align=left;spacingLeft=36;${baseStyle}`;
    case 'interface':
    case 'circle':
      return `ellipse;aspect=fixed;${baseStyle}`;
    case 'node':
    case 'node3d':
      return `shape=cube;boundedLbl=1;backgroundOutline=1;darkOpacity=0.05;darkOpacity2=0.1;size=15;${baseStyle}`;
    case 'usecase':
      return `ellipse;${baseStyle}`;
    case 'note':
      return `shape=note;backgroundOutline=1;darkOpacity=0.05;size=14;fillColor=#fff9db;strokeColor=#e5bf7e;fontColor=${font};`;
    case 'card':
      return `rounded=1;arcSize=10;${baseStyle}`;
    case 'state':
      return `rounded=1;arcSize=24;${baseStyle}`;
    case 'hexagon':
      return `shape=hexagon;perimeter=hexagonPerimeter2;fixedSize=1;${baseStyle}`;
    case 'wbs':
    case 'mindmap':
      return `rounded=1;arcSize=12;${baseStyle}`;
    case 'class':
    case 'struct':
    case 'enum':
    case 'annotation':
    case 'protocol':
    case 'entity':
      return `rounded=1;arcSize=8;${baseStyle}`;
    default:
      return `rounded=1;arcSize=6;${baseStyle}`;
  }
}

/**
 * Maps PlantUML Studio edge style & arrows to Draw.io connector style string
 */
function getEdgeDrawioStyle(edge: DiagramEdge): string {
  let style = 'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;';

  const stroke = edge.color || '#78706a';
  style += `strokeColor=${stroke};fontColor=#2b2622;`;

  if (edge.style === 'dashed') {
    style += 'dashed=1;';
  } else if (edge.style === 'dotted') {
    style += 'dashed=1;dashPattern=1 4;';
  } else if (edge.style === 'thick') {
    style += 'strokeWidth=2;';
  }

  // Port attachment handles
  if (edge.sourceHandle === 'top') style += 'exitX=0.5;exitY=0;exitPerimeter=1;';
  else if (edge.sourceHandle === 'bottom') style += 'exitX=0.5;exitY=1;exitPerimeter=1;';
  else if (edge.sourceHandle === 'left') style += 'exitX=0;exitY=0.5;exitPerimeter=1;';
  else if (edge.sourceHandle === 'right') style += 'exitX=1;exitY=0.5;exitPerimeter=1;';

  if (edge.targetHandle === 'top') style += 'entryX=0.5;entryY=0;entryPerimeter=1;';
  else if (edge.targetHandle === 'bottom') style += 'entryX=0.5;entryY=1;entryPerimeter=1;';
  else if (edge.targetHandle === 'left') style += 'entryX=0;entryY=0.5;entryPerimeter=1;';
  else if (edge.targetHandle === 'right') style += 'entryX=1;entryY=0.5;entryPerimeter=1;';

  switch (edge.arrowType) {
    case 'arrow':
      style += 'endArrow=block;endFill=1;';
      break;
    case 'bi-arrow':
      style += 'startArrow=block;startFill=1;endArrow=block;endFill=1;';
      break;
    case 'none':
      style += 'endArrow=none;';
      break;
    case 'inheritance':
      style += 'endArrow=block;endFill=0;';
      break;
    case 'realization':
      style += 'dashed=1;endArrow=block;endFill=0;';
      break;
    case 'composition':
      style += 'startArrow=diamond;startFill=1;endArrow=none;';
      break;
    case 'aggregation':
      style += 'startArrow=diamond;startFill=0;endArrow=none;';
      break;
    case 'dependency':
      style += 'dashed=1;endArrow=open;';
      break;
    case 'nesting':
      style += 'startArrow=circlePlus;endArrow=none;';
      break;
    case 'cancellation':
      style += 'endArrow=cross;';
      break;
    case 'socket-ball':
      style += 'endArrow=oval;endFill=0;';
      break;
    case 'lollipop':
      style += 'startArrow=oval;startFill=0;endArrow=none;';
      break;
    case 'crows-foot-many':
      style += 'endArrow=ERmany;';
      break;
    case 'crows-foot-one':
      style += 'endArrow=ERone;';
      break;
    case 'crows-foot-zero-many':
      style += 'endArrow=ERzeroToMany;';
      break;
    case 'crows-foot-zero-one':
      style += 'endArrow=ERzeroToOne;';
      break;
    case 'crows-foot-many-many':
      style += 'startArrow=ERmany;endArrow=ERmany;';
      break;
    case 'crows-foot-zero-zero':
      style += 'startArrow=ERzeroToMany;endArrow=ERzeroToMany;';
      break;
    case 'crows-foot-opt-opt':
      style += 'startArrow=ERzeroToOne;endArrow=ERzeroToOne;';
      break;
    default:
      style += 'endArrow=block;endFill=1;';
      break;
  }

  return style;
}

/**
 * Resolves effective diagram model from diagram state and optional raw PlantUML script
 */
function resolveEffectiveDiagram(diagram: DiagramData, rawPlantUML?: string): DiagramData {
  if (rawPlantUML && (!diagram.nodes?.length && !diagram.participants?.length)) {
    const parsed = parsePlantUML(rawPlantUML);
    return {
      title: parsed.title || diagram.title || 'PlantUML Diagram',
      type: parsed.type || diagram.type,
      nodes: parsed.nodes || [],
      edges: parsed.edges || [],
      participants: parsed.participants || [],
      messages: parsed.messages || [],
      blocks: parsed.blocks || [],
      settings: parsed.settings || diagram.settings
    };
  }
  return diagram;
}

/**
 * Generates standard mxGraphModel XML string (.drawio format) supporting ALL PlantUML diagram models
 */
export function generateDrawioXml(diagram: DiagramData, rawPlantUML?: string): string {
  const effective = resolveEffectiveDiagram(diagram, rawPlantUML);
  const isSequence = effective.type === 'sequence' || (effective.participants && effective.participants.length > 0);
  const now = new Date().toISOString();
  const diagramTitle = effective.title || 'Untitled Diagram';

  let cellsXml = '';

  if (isSequence && effective.participants && effective.participants.length > 0) {
    // --- 1. SEQUENCE DIAGRAMS ---
    const participants = effective.participants;
    const messages = effective.messages || [];
    const blocks = effective.blocks || [];

    const spacing = 200;
    const startX = 80;
    const participantY = 40;
    const lifelineHeight = Math.max(520, 120 + messages.length * 60 + (blocks.length * 60));

    // Map participant IDs to coordinates
    const participantMap = new Map<string, { x: number; y: number }>();

    participants.forEach((p, index) => {
      const px = startX + index * spacing;
      participantMap.set(p.id, { x: px, y: participantY });

      const colorCfg = getColorConfig(p.color);
      const fill = colorCfg.bgHex;
      const stroke = colorCfg.hex;

      let pStyle = `shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;fillColor=${fill};strokeColor=${stroke};fontColor=#2b2622;`;
      if (p.type === 'actor') {
        pStyle += 'participant=umlActor;';
      } else if (p.type === 'boundary') {
        pStyle += 'participant=umlBoundary;';
      } else if (p.type === 'control') {
        pStyle += 'participant=umlControl;';
      } else if (p.type === 'entity') {
        pStyle += 'participant=umlEntity;';
      } else if (p.type === 'database') {
        pStyle += 'shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=15;';
      }

      const stereotype = p.stereotype ? `&lt;br/&gt;&lt;i style="font-size:10px;"&gt;&amp;#171;${escapeXml(p.stereotype.replace(/^«|»$/g, ''))}&amp;#187;&lt;/i&gt;` : '';
      const label = `&lt;b style="font-size:12px;"&gt;${escapeXml(p.name)}&lt;/b&gt;${stereotype}`;

      cellsXml += `        <mxCell id="part_${escapeXml(p.id)}" value="${label}" style="${pStyle}" vertex="1" parent="1">\n`;
      cellsXml += `          <mxGeometry x="${px}" y="${participantY}" width="120" height="${lifelineHeight}" as="geometry"/>\n`;
      cellsXml += `        </mxCell>\n`;
    });

    // Sequence Interaction Blocks (alt, opt, loop, par, critical, break, group)
    blocks.forEach((block, idx) => {
      const bY = 95 + idx * 75;
      const bWidth = Math.max(340, participants.length * spacing);
      const bStyle = 'shape=umlFrame;whiteSpace=wrap;html=1;width=85;height=22;fillColor=#faf5ee;strokeColor=#a89f91;fontColor=#2b2622;';
      const bLabel = `&lt;b&gt;[${escapeXml(block.type.toUpperCase())}]&lt;/b&gt; ${escapeXml(block.condition || block.label || '')}`;

      cellsXml += `        <mxCell id="block_${idx}" value="${bLabel}" style="${bStyle}" vertex="1" parent="1">\n`;
      cellsXml += `          <mxGeometry x="${startX - 20}" y="${bY}" width="${bWidth}" height="100" as="geometry"/>\n`;
      cellsXml += `        </mxCell>\n`;
    });

    // Sequence Messages
    messages.forEach((msg, idx) => {
      const sourcePart = participantMap.get(msg.from);
      const targetPart = participantMap.get(msg.to);
      const mY = 125 + idx * 55;

      const sourceId = `part_${escapeXml(msg.from)}`;
      const targetId = `part_${escapeXml(msg.to)}`;

      const isSelf = msg.from === msg.to;
      const sourceX = sourcePart ? sourcePart.x + 60 : 100;
      const targetX = targetPart ? targetPart.x + 60 : 250;

      let arrowStyle = 'endArrow=block;endFill=1;';
      if (msg.arrowType === 'async') {
        arrowStyle = 'endArrow=open;';
      } else if (msg.isDotted || msg.arrowType === 'return') {
        arrowStyle = 'dashed=1;endArrow=open;';
      } else if (msg.arrowType === 'lost') {
        arrowStyle = 'endArrow=cross;';
      } else if (msg.arrowType === 'found') {
        arrowStyle = 'startArrow=oval;startFill=1;endArrow=block;';
      }

      const msgNumber = msg.number ? `${msg.number}. ` : `${idx + 1}. `;
      const label = `${escapeXml(msgNumber)}${escapeXml(msg.label || '')}`;

      if (isSelf) {
        // Self-calling loop arrow back to the same lifeline
        const loopStyle = `edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#78706a;fontColor=#2b2622;${arrowStyle}`;
        cellsXml += `        <mxCell id="msg_${idx}" value="${label}" style="${loopStyle}" edge="1" parent="1" source="${sourceId}" target="${sourceId}">\n`;
        cellsXml += `          <mxGeometry relative="1" as="geometry">\n`;
        cellsXml += `            <mxPoint x="${sourceX}" y="${mY}" as="sourcePoint"/>\n`;
        cellsXml += `            <mxPoint x="${sourceX}" y="${mY + 24}" as="targetPoint"/>\n`;
        cellsXml += `            <Array as="points">\n`;
        cellsXml += `              <mxPoint x="${sourceX + 45}" y="${mY}"/>\n`;
        cellsXml += `              <mxPoint x="${sourceX + 45}" y="${mY + 24}"/>\n`;
        cellsXml += `            </Array>\n`;
        cellsXml += `          </mxGeometry>\n`;
        cellsXml += `        </mxCell>\n`;
      } else {
        // Horizontal message between lifelines
        const edgeStyle = `edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#78706a;fontColor=#2b2622;${arrowStyle}`;
        cellsXml += `        <mxCell id="msg_${idx}" value="${label}" style="${edgeStyle}" edge="1" parent="1" source="${sourceId}" target="${targetId}">\n`;
        cellsXml += `          <mxGeometry relative="1" as="geometry">\n`;
        cellsXml += `            <mxPoint x="${sourceX}" y="${mY}" as="sourcePoint"/>\n`;
        cellsXml += `            <mxPoint x="${targetX}" y="${mY}" as="targetPoint"/>\n`;
        cellsXml += `          </mxGeometry>\n`;
        cellsXml += `        </mxCell>\n`;
      }
    });

  } else {
    // --- 2. UNIFIED 2D / CLASS / COMPONENT / C4 / STATE / ER DIAGRAMS ---
    const nodes = effective.nodes || [];
    const edges = effective.edges || [];

    // Group containers vs child nodes
    const containerNodes = nodes.filter(n => n.data?.isContainer || ['package', 'frame', 'folder', 'namespace', 'rectangle', 'together'].includes(n.type));
    const containerIdSet = new Set(containerNodes.map(c => c.id));

    // Render containers first so they appear behind children
    containerNodes.forEach(cNode => {
      const cStyle = getNodeDrawioStyle(cNode);
      const cLabel = `&lt;b&gt;${escapeXml(cNode.label)}&lt;/b&gt;`;
      cellsXml += `        <mxCell id="${escapeXml(cNode.id)}" value="${cLabel}" style="${cStyle}" vertex="1" parent="1">\n`;
      cellsXml += `          <mxGeometry x="${Math.round(cNode.x)}" y="${Math.round(cNode.y)}" width="${Math.round(cNode.width)}" height="${Math.round(cNode.height)}" as="geometry"/>\n`;
      cellsXml += `        </mxCell>\n`;
    });

    // Render regular nodes
    nodes.filter(n => !containerIdSet.has(n.id)).forEach(node => {
      let parentId = '1';
      let renderX = node.x;
      let renderY = node.y;

      const parentContainer = containerNodes.find(c => {
        if (c.data?.enclosedNodeIds && c.data.enclosedNodeIds.includes(node.id)) return true;
        return node.x >= c.x && node.y >= c.y && 
               (node.x + node.width) <= (c.x + c.width) && 
               (node.y + node.height) <= (c.y + c.height);
      });

      if (parentContainer) {
        parentId = escapeXml(parentContainer.id);
        renderX = Math.round(node.x - parentContainer.x);
        renderY = Math.round(node.y - parentContainer.y);
      } else {
        renderX = Math.round(node.x);
        renderY = Math.round(node.y);
      }

      const style = getNodeDrawioStyle(node);
      const label = formatNodeLabel(node);

      cellsXml += `        <mxCell id="${escapeXml(node.id)}" value="${label}" style="${style}" vertex="1" parent="${parentId}">\n`;
      cellsXml += `          <mxGeometry x="${renderX}" y="${renderY}" width="${Math.round(node.width)}" height="${Math.round(node.height)}" as="geometry"/>\n`;
      cellsXml += `        </mxCell>\n`;
    });

    // Render edges with optional cardinality labels
    edges.forEach((edge, idx) => {
      const edgeId = escapeXml(edge.id || `e_${idx}`);
      const edgeStyle = getEdgeDrawioStyle(edge);
      let edgeLabel = escapeXml(edge.label || '');

      // Append reading direction indicator
      if (edge.readingDirection === '>') edgeLabel += ' &amp;#9658;';
      else if (edge.readingDirection === '<') edgeLabel = '&amp;#9668; ' + edgeLabel;

      const sourceId = escapeXml(edge.source);
      const targetId = escapeXml(edge.target);

      cellsXml += `        <mxCell id="edge_${edgeId}" value="${edgeLabel}" style="${edgeStyle}" edge="1" parent="1" source="${sourceId}" target="${targetId}">\n`;
      cellsXml += `          <mxGeometry relative="1" as="geometry"/>\n`;
      cellsXml += `        </mxCell>\n`;

      // Source Cardinality Label (e.g. "1", "0..*")
      if (edge.cardinalitySource) {
        const srcVal = escapeXml(edge.cardinalitySource);
        cellsXml += `        <mxCell id="edge_${edgeId}_src" value="${srcVal}" style="edgeLabel;html=1;align=left;verticalAlign=bottom;resizable=0;points=[];fontSize=10;fontColor=#5a504a;" vertex="1" connectable="0" parent="edge_${edgeId}">\n`;
        cellsXml += `          <mxGeometry x="-0.8" relative="1" as="geometry"><mxPoint as="offset"/></mxGeometry>\n`;
        cellsXml += `        </mxCell>\n`;
      }

      // Target Cardinality Label (e.g. "0..*", "1..*")
      if (edge.cardinalityTarget) {
        const tgtVal = escapeXml(edge.cardinalityTarget);
        cellsXml += `        <mxCell id="edge_${edgeId}_tgt" value="${tgtVal}" style="edgeLabel;html=1;align=right;verticalAlign=bottom;resizable=0;points=[];fontSize=10;fontColor=#5a504a;" vertex="1" connectable="0" parent="edge_${edgeId}">\n`;
        cellsXml += `          <mxGeometry x="0.8" relative="1" as="geometry"><mxPoint as="offset"/></mxGeometry>\n`;
        cellsXml += `        </mxCell>\n`;
      }
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="${now}" agent="PlantUML Visual Studio" version="24.0.0">
  <diagram name="${escapeXml(diagramTitle)}" id="puml_studio_${Date.now()}">
    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" background="#faf5ee">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
${cellsXml}      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

  return xml;
}

/**
 * Triggers a browser download for the .drawio XML file
 */
export function downloadDrawioFile(diagram: DiagramData, rawPlantUML?: string, customFilename?: string): void {
  const xml = generateDrawioXml(diagram, rawPlantUML);
  const blob = new Blob([xml], { type: 'application/vnd.jgraph.mxfile;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  const rawTitle = customFilename || diagram.title || 'diagram';
  const cleanTitle = rawTitle.toLowerCase().replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'diagram';
  a.download = `${cleanTitle}.drawio`;

  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generates an instant Open in diagrams.net URL hash
 */
export function getDrawioWebUrl(diagram: DiagramData, rawPlantUML?: string): string {
  const xml = generateDrawioXml(diagram, rawPlantUML);
  return `https://app.diagrams.net/#R${encodeURIComponent(xml)}`;
}

/**
 * Opens diagram directly in a new tab on diagrams.net
 */
export function openInDrawioWeb(diagram: DiagramData, rawPlantUML?: string): void {
  const url = getDrawioWebUrl(diagram, rawPlantUML);
  window.open(url, '_blank', 'noopener,noreferrer');
}
