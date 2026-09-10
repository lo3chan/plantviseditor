import { deflateRaw } from 'pako';

// PlantUML uses a customized base64 alphabet
const PLANTUML_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';

function encode6bit(b: number): string {
  if (b < 10) return String.fromCharCode(48 + b);
  b -= 10;
  if (b < 26) return String.fromCharCode(65 + b);
  b -= 26;
  if (b < 26) return String.fromCharCode(97 + b);
  b -= 26;
  if (b === 0) return '-';
  if (b === 1) return '_';
  return '?';
}

function append3bytes(b1: number, b2: number, b3: number): string {
  const c1 = b1 >> 2;
  const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
  const c3 = ((b2 & 0xf) << 2) | (b3 >> 6);
  const c4 = b3 & 0x3f;
  return encode6bit(c1 & 0x3f) + encode6bit(c2 & 0x3f) + encode6bit(c3 & 0x3f) + encode6bit(c4 & 0x3f);
}

function encode64(data: Uint8Array): string {
  let r = '';
  for (let i = 0; i < data.length; i += 3) {
    if (i + 2 === data.length) {
      r += append3bytes(data[i], data[i + 1], 0);
    } else if (i + 1 === data.length) {
      r += append3bytes(data[i], 0, 0);
    } else {
      r += append3bytes(data[i], data[i + 1], data[i + 2]);
    }
  }
  return r;
}

/**
 * Prepares PlantUML text by ensuring standard delimiter tags if omitted
 * and automatically injecting 'allowmixing' when diagrams combine classes/entities
 * with components, databases, clouds, nodes, or actors.
 */
export function preparePlantUMLText(pumlText: string): string {
  let trimmed = pumlText.trim();
  if (!trimmed) {
    return '@startuml\n@enduml';
  }

  // Normalize unicode guillemets to standard PlantUML ASCII << >>
  trimmed = trimmed.replace(/«/g, '<<').replace(/»/g, '>>');

  if (!trimmed.startsWith('@start')) {
    trimmed = `@startuml\n${trimmed}\n@enduml`;
  }

  // PlantUML requires 'allowmixing' when OO classifiers (classes, entities, interfaces)
  // are mixed with other structural shapes (databases, clouds, components, nodes, actors, etc.)
  // NOTE: archimate diagrams must NEVER have allowmixing (causes PlantUML syntax error)
  const hasArchimate = /\barchimate\b/i.test(trimmed);
  const hasClassifiers = /\b(class|entity|interface|enum|abstract\s+class|struct|protocol)\b/i.test(trimmed);
  const hasOtherElements = /\b(database|cloud|component|node|actor|agent|queue|storage|artifact|folder|frame|card|hexagon|collections|boundary|control)\b/i.test(trimmed);

  if (!hasArchimate && hasClassifiers && hasOtherElements && !trimmed.toLowerCase().includes('allowmixing')) {
    trimmed = trimmed.replace(/^(@startuml[^\n\r]*)/m, '$1\nallowmixing');
  }

  return trimmed;
}

/**
 * Encodes PlantUML text into the format used by plantuml.com server URLs.
 * Note: PlantUML standard Deflate URL encoding does NOT take a ~1 prefix.
 * (~1 is reserved for raw Huffman encoding which produces 'bad URL' errors for deflate).
 */
export function encodePlantUML(pumlText: string): string {
  try {
    const textToEncode = preparePlantUMLText(pumlText);
    const utf8 = new TextEncoder().encode(textToEncode);
    const deflated = deflateRaw(utf8, { level: 9 });
    return encode64(deflated);
  } catch (err) {
    console.error('PlantUML encode error:', err);
    return '';
  }
}

/**
 * Gets direct SVG URL from official PlantUML server
 */
export function getPlantUMLSvgUrl(pumlText: string): string {
  const encoded = encodePlantUML(pumlText);
  if (!encoded) return '';
  return `https://www.plantuml.com/plantuml/svg/${encoded}`;
}

/**
 * Gets direct PNG URL from official PlantUML server
 */
export function getPlantUMLPngUrl(pumlText: string): string {
  const encoded = encodePlantUML(pumlText);
  if (!encoded) return '';
  return `https://www.plantuml.com/plantuml/png/${encoded}`;
}

/**
 * Gets direct ASCII / Unicode plain text URL from official PlantUML server
 */
export function getPlantUMLTxtUrl(pumlText: string): string {
  const encoded = encodePlantUML(pumlText);
  if (!encoded) return '';
  return `https://www.plantuml.com/plantuml/txt/${encoded}`;
}

/**
 * Converts Unicode box-drawing characters to standard 7-bit ASCII
 */
export function convertToPureAscii(text: string): string {
  return text
    // corners and intersections
    .replace(/[┌┐└┘├┤┬┴┼╔╗╚╝╠╣╦╩╬╒╕╘╛╞╡╤╧╪]/g, '+')
    // horizontal lines
    .replace(/[─━═—–]/g, '-')
    // vertical lines
    .replace(/[│┃║|]/g, '|')
    // arrow heads
    .replace(/[▶►▸]/g, '>')
    .replace(/[◀◄◂]/g, '<')
    .replace(/[▲▴]/g, '^')
    .replace(/[▼▾]/g, 'v')
    // diamonds and shapes
    .replace(/[◆◇◈◊]/g, '*')
    .replace(/[○●⚬]/g, 'o')
    .replace(/[×✕]/g, 'x');
}

/**
 * Fetches rendered ASCII/Unicode diagram text from the official PlantUML server
 */
export async function fetchPlantUMLAscii(pumlText: string): Promise<string> {
  const url = getPlantUMLTxtUrl(pumlText);
  if (!url) {
    throw new Error('Unable to encode PlantUML text');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const text = await response.text();
    // Verify it is not an HTML error page
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      throw new Error('Invalid syntax: PlantUML server returned an error');
    }

    if (!text.trim()) {
      throw new Error('No ASCII diagram generated for this model');
    }

    return text;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Generates an instant local ASCII diagram representation without network dependency
 */
export function generateLocalAsciiFallback(diagram: {
  title: string;
  nodes: Array<{ id: string; label: string; type: string; attributes?: string[]; methods?: string[] }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
    arrowType?: string;
    cardinalitySource?: string;
    cardinalityTarget?: string;
  }>;
}): string {
  const lines: string[] = [];
  const title = diagram.title || 'Untitled Diagram';
  lines.push(`+-------------------------------------------------------------+`);
  lines.push(`| PlantUML ASCII Art Diagram: ${title.padEnd(32).slice(0, 32)} |`);
  lines.push(`+-------------------------------------------------------------+`);
  lines.push(``);

  lines.push(`-- [ NODES / ENTITIES ] --`);
  diagram.nodes.forEach((node) => {
    const typeLabel = node.type.toUpperCase();
    const name = node.label || node.id;
    lines.push(`  .------------------------------------------.`);
    lines.push(`  | [${typeLabel}] ${name.padEnd(38 - typeLabel.length).slice(0, 38 - typeLabel.length)} |`);
    
    if (node.attributes && node.attributes.length > 0) {
      lines.push(`  |------------------------------------------|`);
      node.attributes.forEach((attr) => {
        lines.push(`  |  + ${attr.padEnd(38).slice(0, 38)} |`);
      });
    }

    if (node.methods && node.methods.length > 0) {
      lines.push(`  |------------------------------------------|`);
      node.methods.forEach((m) => {
        lines.push(`  |  # ${m.padEnd(38).slice(0, 38)} |`);
      });
    }

    lines.push(`  '------------------------------------------'`);
    lines.push(``);
  });

  if (diagram.edges && diagram.edges.length > 0) {
    lines.push(`-- [ RELATIONSHIPS ] --`);
    diagram.edges.forEach((edge) => {
      const srcNode = diagram.nodes.find((n) => n.id === edge.source)?.label || edge.source;
      const tgtNode = diagram.nodes.find((n) => n.id === edge.target)?.label || edge.target;
      const srcC = edge.cardinalitySource ? `[${edge.cardinalitySource}] ` : '';
      const tgtC = edge.cardinalityTarget ? ` [${edge.cardinalityTarget}]` : '';

      let arrow = '-->';
      switch (edge.arrowType) {
        case 'inheritance': arrow = '--|>'; break;
        case 'composition': arrow = '*--'; break;
        case 'aggregation': arrow = 'o--'; break;
        case 'dependency': arrow = '..>'; break;
        case 'realization': arrow = '..|>'; break;
        case 'crows-foot-many': arrow = '--|{'; break;
        case 'crows-foot-one': arrow = '--||'; break;
        case 'crows-foot-zero-many': arrow = '--o{'; break;
        case 'crows-foot-zero-one': arrow = '--o|'; break;
        case 'socket-ball': arrow = '-0)'; break;
        case 'lollipop': arrow = '()--'; break;
        case 'bi-arrow': arrow = '<-->'; break;
        case 'none': arrow = '---'; break;
        default: arrow = '-->'; break;
      }

      const label = edge.label ? ` : "${edge.label}"` : '';
      lines.push(`  ${srcNode} ${srcC}${arrow}${tgtC} ${tgtNode}${label}`);
    });
  }

  return lines.join('\n');
}


