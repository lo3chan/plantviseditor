import { deflateRaw } from 'pako';
import { GlobalCanvasSettings } from '../types';

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
 * Decodes standard HTML entities that can corrupt PlantUML titles, stereotypes, or directives
 */
export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/**
 * Prepares PlantUML text by ensuring standard delimiter tags if omitted,
 * sanitizing HTML entities, correcting legacy/typo theme names,
 * and automatically injecting 'allowmixing' when diagrams combine classes/entities
 * with components, databases, clouds, nodes, or actors.
 */
export function preparePlantUMLText(pumlText: string): string {
  let trimmed = decodeHtmlEntities((pumlText || '').trim());
  if (!trimmed) {
    return '@startuml\n@enduml';
  }

  // Normalize unicode guillemets to standard PlantUML ASCII << >>
  trimmed = trimmed.replace(/«/g, '<<').replace(/»/g, '>>');

  // Fix common theme typos / nonexistent theme names (PlantUML built-in theme is 'minty', not 'mint')
  trimmed = trimmed
    .replace(/!theme\s+mint\b/gi, '!theme minty')
    .replace(/!theme\s+resume-light\b/gi, '!theme mimeograph');

  // Check if text already starts with any PlantUML diagram start delimiter
  const startMatch = trimmed.match(/^@start([a-z0-9_-]+)/i);
  if (!startMatch) {
    trimmed = `@startuml\n${trimmed}\n@enduml`;
  } else {
    const diagType = startMatch[1].toLowerCase();
    const expectedEnd = `@end${diagType}`;
    if (!new RegExp(`@end${diagType}\\b`, 'i').test(trimmed)) {
      trimmed = `${trimmed}\n${expectedEnd}`;
    }
  }

  // PlantUML requires 'allowmixing' when OO classifiers (classes, entities, interfaces)
  // are mixed with other structural shapes (databases, clouds, components, nodes, actors, etc.)
  // NOTE: archimate diagrams must NEVER have allowmixing (causes PlantUML syntax error)
  // Only applies to standard @startuml diagrams!
  if (trimmed.startsWith('@startuml')) {
    const hasArchimate = /\barchimate\b/i.test(trimmed);
    const hasClassifiers = /\b(class|entity|interface|enum|abstract\s+class|struct|protocol)\b/i.test(trimmed);
    const hasOtherElements = /\b(database|cloud|component|node|actor|agent|queue|storage|artifact|folder|frame|card|hexagon|collections|boundary|control)\b/i.test(trimmed);

    if (!hasArchimate && hasClassifiers && hasOtherElements && !trimmed.toLowerCase().includes('allowmixing')) {
      trimmed = trimmed.replace(/^(@startuml[^\n\r]*)/m, '$1\nallowmixing');
    }
  }

  return trimmed;
}

/**
 * Automatically repairs common PlantUML syntax errors:
 * - Unrecognized themes (mint -> minty, resume-light -> mimeograph)
 * - HTML entities in text (&amp; -> &)
 * - Missing start/end delimiters
 * - Duplicate start/end blocks
 */
export function autoFixPlantUMLSyntax(pumlText: string): string {
  let text = decodeHtmlEntities(pumlText || '');
  text = text
    .replace(/!theme\s+mint\b/gi, '!theme minty')
    .replace(/!theme\s+resume-light\b/gi, '!theme mimeograph');

  const lines = text.split(/\r?\n/);
  const cleaned: string[] = [];
  let foundStart = false;
  let startTag = '@startuml';

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^\s*@start([a-z0-9_-]*)/i.test(l)) {
      if (!foundStart) {
        foundStart = true;
        startTag = l.trim();
        cleaned.push(startTag);
      }
    } else if (/^\s*@end/i.test(l)) {
      // Ignored here; will be cleanly placed at the very end
    } else {
      cleaned.push(l);
    }
  }

  if (!foundStart) {
    cleaned.unshift('@startuml');
    cleaned.push('@enduml');
  } else {
    const tagMatch = startTag.match(/^@start([a-z0-9_-]+)/i);
    const endTag = tagMatch && tagMatch[1] ? `@end${tagMatch[1]}` : '@enduml';
    cleaned.push(endTag);
  }

  return preparePlantUMLText(cleaned.join('\n'));
}

/**
 * Injects or updates GlobalCanvasSettings (theme, direction, linetype, styling, etc.)
 * directly into a PlantUML code string so all render syntax is plumbed into the SVG viewer.
 */
export function plumbSettingsIntoPlantUMLCode(
  rawCode: string,
  settings?: GlobalCanvasSettings,
  isSequence?: boolean
): string {
  if (!rawCode || !rawCode.trim()) return '@startuml\n@enduml';
  if (!settings) return preparePlantUMLText(rawCode);

  let code = decodeHtmlEntities(rawCode.trim());
  if (!code.startsWith('@start')) {
    code = `@startuml\n${code}\n@enduml`;
  }

  const isUml = code.startsWith('@startuml');
  const isSequenceDiagram = isSequence || 
    (/\b(autonumber|participant|actor|boundary|control|entity|database|collections)\b/i.test(code) &&
     /\b(-->|->|->>|-->>|alt|opt|loop|par|group)\b/i.test(code));

  const lines = code.split(/\r?\n/);
  const startLineIdx = lines.findIndex(l => l.trim().startsWith('@start'));
  if (startLineIdx === -1) return preparePlantUMLText(code);

  const startLine = lines[startLineIdx];
  let endLineIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim().startsWith('@end')) {
      endLineIdx = i;
      break;
    }
  }
  const actualEndIdx = endLineIdx !== -1 ? endLineIdx : lines.length;

  let bodyLines = lines.slice(startLineIdx + 1, actualEndIdx);

  // 1. Theme handling
  bodyLines = bodyLines.filter(l => !/^\s*!theme\b/i.test(l));
  if (settings.theme && settings.theme !== 'none') {
    const safeTheme = settings.theme === 'mint' ? 'minty' : (settings.theme === 'resume-light' ? 'mimeograph' : settings.theme);
    bodyLines.unshift(`!theme ${safeTheme}`);
  }

  if (isUml) {
    // 2. Strict UML / Monochrome
    bodyLines = bodyLines.filter(l => !/^\s*skinparam\s+(style\s+strictuml|monochrome)\b/i.test(l));
    if (settings.strictuml) {
      bodyLines.push('skinparam style strictuml');
    } else if (settings.monochromeReverse) {
      bodyLines.push('skinparam monochrome reverse');
    } else if (settings.monochrome) {
      bodyLines.push('skinparam monochrome true');
    }

    // 3. Direction (for non-sequence diagrams)
    if (!isSequenceDiagram && settings.direction) {
      bodyLines = bodyLines.filter(l => !/^\s*(left to right|top to bottom|right to left|bottom to top)\s+direction\b/i.test(l));
      if (settings.direction === 'LR') {
        bodyLines.push('left to right direction');
      } else if (settings.direction === 'BT') {
        bodyLines.push('bottom to top direction');
      } else if (settings.direction === 'RL') {
        bodyLines.push('right to left direction');
      } else {
        bodyLines.push('top to bottom direction');
      }
    }

    // 4. Linetype
    if (settings.linetype && settings.linetype !== 'straight') {
      bodyLines = bodyLines.filter(l => !/^\s*skinparam\s+linetype\b/i.test(l));
      bodyLines.push(`skinparam linetype ${settings.linetype}`);
    }

    // 5. Handwritten & Shadowing
    bodyLines = bodyLines.filter(l => !/^\s*skinparam\s+(handwritten|shadowing)\b/i.test(l));
    if (settings.handwritten) {
      bodyLines.push('skinparam handwritten true');
    }
    if (settings.shadowing !== undefined) {
      bodyLines.push(`skinparam shadowing ${settings.shadowing}`);
    }

    // 6. Roundcorner & DiagonalCorner
    bodyLines = bodyLines.filter(l => !/^\s*skinparam\s+(roundcorner|diagonalCorner)\b/i.test(l));
    if (settings.diagonalCorner && settings.diagonalCorner > 0) {
      bodyLines.push(`skinparam diagonalCorner ${settings.diagonalCorner}`);
    } else if (settings.roundcorner !== undefined) {
      bodyLines.push(`skinparam roundcorner ${settings.roundcorner}`);
    }

    // 7. Arrow styling
    if (settings.arrowColor) {
      bodyLines = bodyLines.filter(l => !/^\s*skinparam\s+(ArrowColor|sequenceLifeLineBorderColor)\b/i.test(l));
      bodyLines.push(`skinparam ArrowColor ${settings.arrowColor}`);
      if (isSequenceDiagram) {
        bodyLines.push(`skinparam sequenceLifeLineBorderColor ${settings.arrowColor}`);
      }
    }
    if (settings.arrowThickness) {
      bodyLines = bodyLines.filter(l => !/^\s*skinparam\s+ArrowThickness\b/i.test(l));
      bodyLines.push(`skinparam ArrowThickness ${settings.arrowThickness}`);
    }

    // 8. Fonts & Typography
    if (settings.defaultFontName) {
      bodyLines = bodyLines.filter(l => !/^\s*skinparam\s+defaultFontName\b/i.test(l));
      bodyLines.push(`skinparam defaultFontName ${settings.defaultFontName}`);
    }
    if (settings.defaultFontSize) {
      bodyLines = bodyLines.filter(l => !/^\s*skinparam\s+defaultFontSize\b/i.test(l));
      bodyLines.push(`skinparam defaultFontSize ${settings.defaultFontSize}`);
    }

    // 9. DPI & Scale
    if (settings.dpi) {
      bodyLines = bodyLines.filter(l => !/^\s*skinparam\s+dpi\b/i.test(l));
      bodyLines.push(`skinparam dpi ${settings.dpi}`);
    }
    if (settings.scale) {
      bodyLines = bodyLines.filter(l => !/^\s*scale\b/i.test(l));
      if (typeof settings.scale === 'number' && settings.scale !== 1) {
        bodyLines.push(`scale ${settings.scale}`);
      } else if (typeof settings.scale === 'string' && settings.scale.trim()) {
        bodyLines.push(`scale ${settings.scale.trim()}`);
      }
    }

    // 10. Node and Layout Spacing
    if (settings.nodesep) {
      bodyLines = bodyLines.filter(l => !/^\s*skinparam\s+nodesep\b/i.test(l));
      bodyLines.push(`skinparam nodesep ${settings.nodesep}`);
    }
    if (settings.ranksep) {
      bodyLines = bodyLines.filter(l => !/^\s*skinparam\s+ranksep\b/i.test(l));
      bodyLines.push(`skinparam ranksep ${settings.ranksep}`);
    }
    if (settings.padding) {
      bodyLines = bodyLines.filter(l => !/^\s*skinparam\s+padding\b/i.test(l));
      bodyLines.push(`skinparam padding ${settings.padding}`);
    }
    if (settings.margin) {
      bodyLines = bodyLines.filter(l => !/^\s*skinparam\s+margin\b/i.test(l));
      bodyLines.push(`skinparam margin ${settings.margin}`);
    }
    if (settings.minClassWidth) {
      bodyLines = bodyLines.filter(l => !/^\s*skinparam\s+minClassWidth\b/i.test(l));
      bodyLines.push(`skinparam minClassWidth ${settings.minClassWidth}`);
    }

    // 11. Sequence diagram specifics
    if (isSequenceDiagram) {
      if (settings.hideFootbox) {
        bodyLines = bodyLines.filter(l => !/^\s*hide\s+footbox\b/i.test(l));
        bodyLines.push('hide footbox');
      }
      if (settings.responseMessageBelowArrow) {
        bodyLines = bodyLines.filter(l => !/^\s*skinparam\s+responseMessageBelowArrow\b/i.test(l));
        bodyLines.push('skinparam responseMessageBelowArrow true');
      }
      if (settings.autonumberFormat) {
        bodyLines = bodyLines.filter(l => !/^\s*autonumber\b/i.test(l));
        if (settings.autonumberFormat === 'bold-bracket') {
          bodyLines.push('autonumber "<b>[00]</b>"');
        } else if (settings.autonumberFormat === 'parentheses') {
          bodyLines.push('autonumber "<b>(##)</b>"');
        } else if (settings.autonumberFormat === 'increment5') {
          bodyLines.push('autonumber 10 5 "<b>(<u>##</u>)</b>"');
        } else if (settings.autonumberFormat === 'standard') {
          bodyLines.push('autonumber');
        }
      }
      if (settings.participantPadding) {
        bodyLines = bodyLines.filter(l => !/^\s*skinparam\s+ParticipantPadding\b/i.test(l));
        bodyLines.push(`skinparam ParticipantPadding ${settings.participantPadding}`);
      }
      if (settings.boxPadding) {
        bodyLines = bodyLines.filter(l => !/^\s*skinparam\s+BoxPadding\b/i.test(l));
        bodyLines.push(`skinparam BoxPadding ${settings.boxPadding}`);
      }
    }
  }

  // Re-assemble
  const endTag = actualEndIdx < lines.length ? lines[actualEndIdx] : (isUml ? '@enduml' : `@end${startLine.replace(/^@start/, '')}`);
  const reconstructed = [startLine, ...bodyLines, endTag].join('\n');
  return preparePlantUMLText(reconstructed);
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


