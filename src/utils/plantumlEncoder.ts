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
  if (!trimmed.startsWith('@start')) {
    trimmed = `@startuml\n${trimmed}\n@enduml`;
  }

  // PlantUML requires 'allowmixing' when OO classifiers (classes, entities, interfaces)
  // are mixed with other structural shapes (databases, clouds, components, nodes, actors, etc.)
  const hasClassifiers = /\b(class|entity|interface|enum|abstract\s+class|struct|protocol)\b/i.test(trimmed);
  const hasOtherElements = /\b(database|cloud|component|node|actor|agent|queue|storage|artifact|folder|frame|card|hexagon|collections|boundary|control)\b/i.test(trimmed);

  if (hasClassifiers && hasOtherElements && !trimmed.toLowerCase().includes('allowmixing')) {
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
