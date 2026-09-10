import React from 'react';

// Regexes for PlantUML tokens
const DIRECTIVE_REGEX = /^\s*(!theme|!define|!include|!ifdef|!endif|!else|!includeurl|!pragma)\b.*/i;
const START_END_REGEX = /^\s*(@startuml|@enduml)\b.*/i;
const COMMENT_LINE_REGEX = /^\s*'.*/;
const BLOCK_KEYWORD_REGEX = /\b(class|interface|enum|abstract|entity|component|package|namespace|node|database|cloud|queue|actor|participant|boundary|control|collections|state|usecase|artifact|folder|frame|storage|rectangle|agent|card|json|yaml|map|salt|ditaa|math)\b/i;
const FLOW_KEYWORD_REGEX = /\b(alt|else|opt|loop|group|critical|break|par|end|note|activate|deactivate|return|skinparam|autonumber|title|scale|hide|show|as|is|direction|allowmixing|together)\b/i;
const ARROW_REGEX = /(-->|<--|->|<-|<\|--|--\|>|\*--|--\*|o--|--o|\.\.>|<\.\.|\.\.\|>|<\|\.\.|\+--|x--|\|\|--\|\{|\}\|--\|\||\|\|--\|\||\|o--o\||\}\o--o\{|--)/;

export interface HighlightToken {
  text: string;
  type: 
    | 'normal' 
    | 'directive' 
    | 'root' 
    | 'comment' 
    | 'string' 
    | 'keyword' 
    | 'flow' 
    | 'arrow' 
    | 'stereotype' 
    | 'visibility' 
    | 'color';
}

/**
 * Tokenizes a single line of PlantUML code into semantic colored tokens
 */
export function tokenizePlantUMLLine(line: string): HighlightToken[] {
  // 1. Comments
  if (COMMENT_LINE_REGEX.test(line)) {
    return [{ text: line, type: 'comment' }];
  }

  // 2. Directives (!theme, !define)
  if (DIRECTIVE_REGEX.test(line)) {
    return [{ text: line, type: 'directive' }];
  }

  // 3. @startuml / @enduml
  if (START_END_REGEX.test(line)) {
    return [{ text: line, type: 'root' }];
  }

  const tokens: HighlightToken[] = [];
  let remaining = line;

  while (remaining.length > 0) {
    // String literal "..."
    const strMatch = remaining.match(/^"([^"\\]|\\.)*"/);
    if (strMatch) {
      tokens.push({ text: strMatch[0], type: 'string' });
      remaining = remaining.slice(strMatch[0].length);
      continue;
    }

    // Inline comment ' ...
    const inlineCommentMatch = remaining.match(/^'.*/);
    if (inlineCommentMatch) {
      tokens.push({ text: inlineCommentMatch[0], type: 'comment' });
      remaining = remaining.slice(inlineCommentMatch[0].length);
      continue;
    }

    // Stereotype <<...>> or «...»
    const stereoMatch = remaining.match(/^(<<[^>]+>>|«[^»]+»)/);
    if (stereoMatch) {
      tokens.push({ text: stereoMatch[0], type: 'stereotype' });
      remaining = remaining.slice(stereoMatch[0].length);
      continue;
    }

    // Colors / Hex #abc or #abcdef
    const colorMatch = remaining.match(/^#[0-9a-fA-F]{3,8}\b/);
    if (colorMatch) {
      tokens.push({ text: colorMatch[0], type: 'color' });
      remaining = remaining.slice(colorMatch[0].length);
      continue;
    }

    // Arrows and relationships
    const arrowMatch = remaining.match(ARROW_REGEX);
    if (arrowMatch && remaining.indexOf(arrowMatch[0]) === 0) {
      tokens.push({ text: arrowMatch[0], type: 'arrow' });
      remaining = remaining.slice(arrowMatch[0].length);
      continue;
    }

    // Visibility markers: +, -, #, ~ at start of member
    const visMatch = remaining.match(/^(\s*)([+\-#~])(\s+)/);
    if (visMatch) {
      if (visMatch[1]) tokens.push({ text: visMatch[1], type: 'normal' });
      tokens.push({ text: visMatch[2], type: 'visibility' });
      if (visMatch[3]) tokens.push({ text: visMatch[3], type: 'normal' });
      remaining = remaining.slice(visMatch[0].length);
      continue;
    }

    // Words (keywords, identifiers)
    const wordMatch = remaining.match(/^([a-zA-Z0-9_$]+)/);
    if (wordMatch) {
      const word = wordMatch[0];
      if (BLOCK_KEYWORD_REGEX.test(word)) {
        tokens.push({ text: word, type: 'keyword' });
      } else if (FLOW_KEYWORD_REGEX.test(word)) {
        tokens.push({ text: word, type: 'flow' });
      } else {
        tokens.push({ text: word, type: 'normal' });
      }
      remaining = remaining.slice(word.length);
      continue;
    }

    // Whitespace or non-word symbols
    const miscMatch = remaining.match(/^(\s+|[^\s\w"'#<+~-]+)/);
    if (miscMatch) {
      tokens.push({ text: miscMatch[0], type: 'normal' });
      remaining = remaining.slice(miscMatch[0].length);
      continue;
    }

    // Fallback single character
    tokens.push({ text: remaining[0], type: 'normal' });
    remaining = remaining.slice(1);
  }

  return tokens;
}

/**
 * Returns Tailwind text color classes for token types
 */
export function getTokenClass(type: HighlightToken['type']): string {
  switch (type) {
    case 'directive':
      return 'text-sky-400 font-semibold';
    case 'root':
      return 'text-amber-500 font-bold';
    case 'keyword':
      return 'text-amber-300 font-semibold';
    case 'flow':
      return 'text-purple-300 font-semibold';
    case 'arrow':
      return 'text-emerald-400 font-bold';
    case 'string':
      return 'text-orange-200';
    case 'comment':
      return 'text-stone-400 italic';
    case 'stereotype':
      return 'text-blue-300';
    case 'visibility':
      return 'text-amber-400 font-bold';
    case 'color':
      return 'text-pink-400 font-mono';
    case 'normal':
    default:
      return 'text-[#faf5ee]';
  }
}
