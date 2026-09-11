import { DiagramData, DiagramNode, DiagramEdge } from '../types';
import { getColorConfig } from './assetsData';

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
 * Strips or formats HTML labels for Draw.io cell values
 */
function formatNodeLabel(node: DiagramNode): string {
  const parts: string[] = [];

  // Stereotype / Sublabel
  if (node.sublabel) {
    const cleanSublabel = node.sublabel.replace(/^«|»$/g, '').trim();
    parts.push(`&lt;i&gt;&amp;#171;${escapeXml(cleanSublabel)}&amp;#187;&lt;/i&gt;`);
  }

  // Primary Label
  parts.push(`&lt;b&gt;${escapeXml(node.label)}&lt;/b&gt;`);

  // Attributes / Fields
  if (node.data?.attributes && node.data.attributes.length > 0) {
    parts.push('&lt;hr size="1" style="border-top: 1px solid #d8d0c8; margin: 4px 0;"/&gt;');
    node.data.attributes.forEach(attr => {
      parts.push(`+ ${escapeXml(attr)}`);
    });
  }

  // Methods
  if (node.data?.methods && node.data.methods.length > 0) {
    if (!node.data.attributes || node.data.attributes.length === 0) {
      parts.push('&lt;hr size="1" style="border-top: 1px solid #d8d0c8; margin: 4px 0;"/&gt;');
    }
    node.data.methods.forEach(m => {
      parts.push(`+ ${escapeXml(m)}()`);
    });
  }

  return parts.join('&lt;br/&gt;');
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

  switch (shapeType) {
    case 'actor':
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
      return `swimlane;startSize=26;fontStyle=1;align=center;verticalAlign=top;collapsible=1;${baseStyle}`;
    case 'frame':
      return `shape=folder;fontStyle=1;tabWidth=110;tabHeight=26;tabPosition=left;boundedLbl=1;labelInHeader=1;${baseStyle}`;
    case 'component':
      return `shape=component;align=left;spacingLeft=36;${baseStyle}`;
    case 'interface':
      return `ellipse;aspect=fixed;${baseStyle}`;
    case 'node':
    case 'node3d':
      return `shape=cube;boundedLbl=1;backgroundOutline=1;darkOpacity=0.05;darkOpacity2=0.1;size=15;${baseStyle}`;
    case 'diamond':
      return `rhombus;${baseStyle}`;
    case 'circle':
    case 'usecase':
      return `ellipse;${baseStyle}`;
    case 'note':
      return `shape=note;backgroundOutline=1;darkOpacity=0.05;size=14;${baseStyle}`;
    case 'card':
    case 'rounded':
      return `rounded=1;arcSize=10;${baseStyle}`;
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
    default:
      style += 'endArrow=block;endFill=1;';
      break;
  }

  return style;
}

/**
 * Generates standard mxGraphModel XML string (.drawio format)
 */
export function generateDrawioXml(diagram: DiagramData): string {
  const isSequence = diagram.type === 'sequence' || (diagram.participants && diagram.participants.length > 0);
  const now = new Date().toISOString();
  const diagramTitle = diagram.title || 'Untitled Diagram';

  let cellsXml = '';

  if (isSequence && diagram.participants && diagram.participants.length > 0) {
    // --- SEQUENCE DIAGRAM EXPORT ---
    const participants = diagram.participants;
    const messages = diagram.messages || [];
    const blocks = diagram.blocks || [];

    const spacing = 190;
    const startX = 80;
    const participantY = 40;
    const lifelineHeight = Math.max(500, 100 + messages.length * 60 + (blocks.length * 50));

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
      }

      const label = `&lt;b&gt;${escapeXml(p.name)}&lt;/b&gt;${p.stereotype ? `&lt;br/&gt;&lt;i&gt;${escapeXml(p.stereotype)}&lt;/i&gt;` : ''}`;

      cellsXml += `        <mxCell id="part_${escapeXml(p.id)}" value="${label}" style="${pStyle}" vertex="1" parent="1">\n`;
      cellsXml += `          <mxGeometry x="${px}" y="${participantY}" width="120" height="${lifelineHeight}" as="geometry"/>\n`;
      cellsXml += `        </mxCell>\n`;
    });

    // Sequence Blocks (alt, opt, loop, par)
    blocks.forEach((block, idx) => {
      const bY = 90 + idx * 70;
      const bWidth = Math.max(300, participants.length * spacing);
      const bStyle = 'shape=umlFrame;whiteSpace=wrap;html=1;width=80;height=22;fillColor=#faf5ee;strokeColor=#a89f91;fontColor=#2b2622;';
      const bLabel = `&lt;b&gt;[${escapeXml(block.type.toUpperCase())}]&lt;/b&gt; ${escapeXml(block.condition || block.label || '')}`;

      cellsXml += `        <mxCell id="block_${idx}" value="${bLabel}" style="${bStyle}" vertex="1" parent="1">\n`;
      cellsXml += `          <mxGeometry x="${startX - 20}" y="${bY}" width="${bWidth}" height="100" as="geometry"/>\n`;
      cellsXml += `        </mxCell>\n`;
    });

    // Sequence Messages
    messages.forEach((msg, idx) => {
      const sourcePart = participantMap.get(msg.from);
      const targetPart = participantMap.get(msg.to);
      const mY = 120 + idx * 55;

      const sourceId = `part_${escapeXml(msg.from)}`;
      const targetId = `part_${escapeXml(msg.to)}`;

      let edgeStyle = 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#78706a;fontColor=#2b2622;';
      if (msg.isDotted) {
        edgeStyle += 'dashed=1;endArrow=open;';
      } else {
        edgeStyle += 'endArrow=block;';
      }

      const msgNumber = msg.number ? `${msg.number}. ` : `${idx + 1}. `;
      const label = `${escapeXml(msgNumber)}${escapeXml(msg.label || '')}`;

      // Anchor connection points on lifelines
      const sourceX = sourcePart ? sourcePart.x + 60 : 100;
      const targetX = targetPart ? targetPart.x + 60 : 250;

      cellsXml += `        <mxCell id="msg_${idx}" value="${label}" style="${edgeStyle}" edge="1" parent="1" source="${sourceId}" target="${targetId}">\n`;
      cellsXml += `          <mxGeometry relative="1" as="geometry">\n`;
      cellsXml += `            <mxPoint x="${sourceX}" y="${mY}" as="sourcePoint"/>\n`;
      cellsXml += `            <mxPoint x="${targetX}" y="${mY}" as="targetPoint"/>\n`;
      cellsXml += `          </mxGeometry>\n`;
      cellsXml += `        </mxCell>\n`;
    });

  } else {
    // --- 2D UNIFIED ARCHITECTURE / CLASS / COMPONENT EXPORT ---
    const nodes = diagram.nodes || [];
    const edges = diagram.edges || [];

    // Identify containers vs child nodes
    const containerNodes = nodes.filter(n => n.data?.isContainer || ['package', 'frame', 'namespace', 'rectangle', 'together'].includes(n.type));
    const containerIdSet = new Set(containerNodes.map(c => c.id));

    // Render containers first so they appear in background
    containerNodes.forEach(cNode => {
      const cStyle = getNodeDrawioStyle(cNode);
      const cLabel = `&lt;b&gt;${escapeXml(cNode.label)}&lt;/b&gt;`;
      cellsXml += `        <mxCell id="${escapeXml(cNode.id)}" value="${cLabel}" style="${cStyle}" vertex="1" parent="1">\n`;
      cellsXml += `          <mxGeometry x="${Math.round(cNode.x)}" y="${Math.round(cNode.y)}" width="${Math.round(cNode.width)}" height="${Math.round(cNode.height)}" as="geometry"/>\n`;
      cellsXml += `        </mxCell>\n`;
    });

    // Render regular nodes
    nodes.filter(n => !containerIdSet.has(n.id)).forEach(node => {
      // Find parent container if enclosed
      let parentId = '1';
      let renderX = node.x;
      let renderY = node.y;

      const parentContainer = containerNodes.find(c => {
        if (c.data?.enclosedNodeIds && c.data.enclosedNodeIds.includes(node.id)) return true;
        // Bounding box inclusion check
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

    // Render edges
    edges.forEach((edge, idx) => {
      const edgeStyle = getEdgeDrawioStyle(edge);
      const edgeLabel = escapeXml(edge.label || '');
      const sourceId = escapeXml(edge.source);
      const targetId = escapeXml(edge.target);

      cellsXml += `        <mxCell id="edge_${escapeXml(edge.id || `e_${idx}`)}" value="${edgeLabel}" style="${edgeStyle}" edge="1" parent="1" source="${sourceId}" target="${targetId}">\n`;
      cellsXml += `          <mxGeometry relative="1" as="geometry"/>\n`;
      cellsXml += `        </mxCell>\n`;
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
export function downloadDrawioFile(diagram: DiagramData, customFilename?: string): void {
  const xml = generateDrawioXml(diagram);
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
export function getDrawioWebUrl(diagram: DiagramData): string {
  const xml = generateDrawioXml(diagram);
  return `https://app.diagrams.net/#R${encodeURIComponent(xml)}`;
}

/**
 * Opens diagram directly in a new tab on diagrams.net
 */
export function openInDrawioWeb(diagram: DiagramData): void {
  const url = getDrawioWebUrl(diagram);
  window.open(url, '_blank', 'noopener,noreferrer');
}
