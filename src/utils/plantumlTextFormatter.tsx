import React from 'react';

/**
 * Inline vector sprites for PlantUML <$sprite> tags
 */
export const renderInlineSprite = (spriteName: string, key?: string | number): React.ReactNode => {
  const norm = spriteName.toLowerCase().replace(/[-_]/g, '');

  // Docker
  if (norm.includes('docker')) {
    return (
      <span key={key} className="inline-flex items-center align-middle mx-1" title="Docker">
        <svg className="w-4 h-4 text-[#2496ed]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.186.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.186.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.186.186.186m5.893 2.715h2.118a.186.186 0 00.186-.186V9.006a.186.186 0 00-.186-.186h-2.118a.186.186 0 00-.186.185v1.888c0 .102.082.185.186.185m-2.929 0h2.119a.185.185 0 00.185-.186V9.006a.185.185 0 00-.185-.186H8.1a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.186V9.006a.185.185 0 00-.185-.186H5.136a.186.186 0 00-.186.185v1.888c0 .102.084.185.186.185m-2.928 0h2.119a.185.185 0 00.185-.186V9.006a.185.185 0 00-.185-.186H2.208a.186.186 0 00-.186.185v1.888c0 .102.084.185.186.185M23.79 12.19c-.38-.264-1.25-.373-2.19-.187-.14-.49-.44-.92-.88-1.23l-.53-.33-.36.52c-.65.94-.78 2.05-.75 2.87-.58.33-1.4.52-2.38.52H1.27c-.42 0-.76.34-.76.76 0 3.84 2.37 7.02 6.55 7.49 1.13.13 2.34.15 3.59.04 4.54-.39 7.78-2.61 9.57-6.55.77-.07 2.09-.34 2.85-1.92.17-.34.11-.79-.19-1.07" />
        </svg>
      </span>
    );
  }

  // Kubernetes
  if (norm.includes('kube') || norm === 'k8s') {
    return (
      <span key={key} className="inline-flex items-center align-middle mx-1" title="Kubernetes">
        <svg className="w-4 h-4 text-[#326ce5]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.25a.75.75 0 00-.36.09L3.75 6.72a.75.75 0 00-.39.66v8.74a.75.75 0 00.39.66l7.89 4.38a.75.75 0 00.72 0l7.89-4.38a.75.75 0 00.39-.66V7.38a.75.75 0 00-.39-.66l-7.89-4.38a.75.75 0 00-.36-.09zm0 3.19l5.88 3.26-2.13 1.19-3.75-2.08-3.75 2.08-2.13-1.19L12 5.44zm-5.88 5.75l2.13 1.19v3.74l-2.13-1.18v-3.75zm11.76 0v3.75l-2.13 1.18v-3.74l2.13-1.19zm-4.38 2.44v3.25L12 17.75l-1.5-1.07v-3.25l1.5.83 1.5-.83z" />
        </svg>
      </span>
    );
  }

  // Kafka
  if (norm.includes('kafka')) {
    return (
      <span key={key} className="inline-flex items-center align-middle mx-1" title="Kafka">
        <svg className="w-4 h-4 text-[#231f20]" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="17.5" cy="5.5" r="3" fill="#e01a22" />
          <circle cx="17.5" cy="18.5" r="3" fill="#e01a22" />
          <circle cx="6.5" cy="12" r="3" fill="#e01a22" />
          <path d="M6.5 12l11-6.5M6.5 12l11 6.5" stroke="#231f20" strokeWidth="2" />
        </svg>
      </span>
    );
  }

  // Postgres / PostgreSQL
  if (norm.includes('postgres') || norm.includes('pgsql')) {
    return (
      <span key={key} className="inline-flex items-center align-middle mx-1" title="PostgreSQL">
        <svg className="w-4 h-4 text-[#336791]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5c-1.5 0-2.5-.8-2.5-2.2 0-1.7 1.5-2.8 3.5-2.8.5 0 1 .1 1.4.2v-.4c0-1.1-.7-1.7-1.9-1.7-1 0-1.8.3-2.5.7l-.6-1.2c.9-.6 2.1-.9 3.4-.9 2.2 0 3.6 1.1 3.6 3.2v4.8h-1.6l-.1-.8c-.6.6-1.5 1.1-2.8 1.1z" />
        </svg>
      </span>
    );
  }

  // Redis
  if (norm.includes('redis')) {
    return (
      <span key={key} className="inline-flex items-center align-middle mx-1" title="Redis">
        <svg className="w-4 h-4 text-[#dc382d]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zm0 9L4.5 7.25 12 3.5l7.5 3.75L12 11zm10 2l-10 5-10-5 2.5-1.25L12 15.5l7.5-3.75L22 13zm0 4l-10 5-10-5 2.5-1.25L12 19.5l7.5-3.75L22 17z" />
        </svg>
      </span>
    );
  }

  // React
  if (norm.includes('react')) {
    return (
      <span key={key} className="inline-flex items-center align-middle mx-1" title="React">
        <svg className="w-4 h-4 text-[#61dafb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <ellipse cx="12" cy="12" rx="4" ry="11" />
          <ellipse cx="12" cy="12" rx="4" ry="11" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="4" ry="11" transform="rotate(120 12 12)" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      </span>
    );
  }

  // Node.js
  if (norm.includes('node')) {
    return (
      <span key={key} className="inline-flex items-center align-middle mx-1" title="Node.js">
        <svg className="w-4 h-4 text-[#539e43]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2zm0 2.31L5.34 8.15v7.7L12 19.69l6.66-3.84v-7.7L12 4.31z" />
        </svg>
      </span>
    );
  }

  // Python
  if (norm.includes('python')) {
    return (
      <span key={key} className="inline-flex items-center align-middle mx-1" title="Python">
        <svg className="w-4 h-4 text-[#3776ab]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.91 2c-4.48 0-4.2 1.94-4.2 1.94l.01 2.01h4.29v.61H5.85S2 6.09 2 10.63s3.36 4.37 3.36 4.37h2v-2.82s-.11-3.36 3.31-3.36h5.68s3.21.05 3.21-3.13c0-3.18-3.08-3.69-3.08-3.69s-.87-.04-4.57 0zm-2.3 1.34a.8.8 0 11.01 1.6.8.8 0 01-.01-1.6zm2.48 18.66c4.48 0 4.2-1.94 4.2-1.94l-.01-2.01H12v-.61h6.16s3.85.47 3.85-4.07-3.36-4.37-3.36-4.37h-2v2.82s.11 3.36-3.31 3.36H7.66s-3.21-.05-3.21 3.13c0 3.18 3.08 3.69 3.08 3.69s.87.04 4.56 0zm2.3-1.34a.8.8 0 11-.01-1.6.8.8 0 01.01 1.6z" />
        </svg>
      </span>
    );
  }

  // Java
  if (norm.includes('java')) {
    return (
      <span key={key} className="inline-flex items-center align-middle mx-1" title="Java">
        <svg className="w-4 h-4 text-[#e76f00]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.85 16.84c0 .08.2.14.45.14s.45-.06.45-.14v-2.35c0-.08-.2-.14-.45-.14s-.45.06-.45.14v2.35zm3.15 0c0 .08.2.14.45.14s.45-.06.45-.14v-3.25c0-.08-.2-.14-.45-.14s-.45.06-.45.14v3.25zm3.15 0c0 .08.2.14.45.14s.45-.06.45-.14v-1.85c0-.08-.2-.14-.45-.14s-.45.06-.45.14v1.85zM4 19.5c2.5 1 13.5 1 16 0-3-1.5-13-1.5-16 0zm7.5-17C9.5 4.5 7.5 6 9.5 8c1 1 2 2 1.5 3.5-1-1.5-1.5-2.5-1-3.5 1-2 3-3.5 1.5-5.5z" />
        </svg>
      </span>
    );
  }

  // Database generic
  if (norm.includes('db') || norm.includes('database')) {
    return (
      <span key={key} className="inline-flex items-center align-middle mx-1" title="Database">
        <svg className="w-4 h-4 text-[#0284c7]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 3.79 2 6v12c0 2.21 4.48 4 10 4s10-1.79 10-4V6c0-2.21-4.48-4-10-4zm0 2c4.42 0 8 1.34 8 2s-3.58 2-8 2-8-1.34-8-2 3.58-2 8-2zm8 14c0 .66-3.58 2-8 2s-8-1.34-8-2v-2.14c1.94 1.31 5.05 2.14 8 2.14s6.06-.83 8-2.14V18zm0-4.5c0 .66-3.58 2-8 2s-8-1.34-8-2V11.36c1.94 1.31 5.05 2.14 8 2.14s6.06-.83 8-2.14V13.5z" />
        </svg>
      </span>
    );
  }

  // Cloud generic
  if (norm.includes('cloud')) {
    return (
      <span key={key} className="inline-flex items-center align-middle mx-1" title="Cloud">
        <svg className="w-4 h-4 text-[#3b82f6]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
        </svg>
      </span>
    );
  }

  // Server generic
  if (norm.includes('server')) {
    return (
      <span key={key} className="inline-flex items-center align-middle mx-1" title="Server">
        <svg className="w-4 h-4 text-[#475569]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 4h16a2 2 0 012 2v3a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm0 8h16a2 2 0 012 2v3a2 2 0 01-2 2H4a2 2 0 01-2-2v-3a2 2 0 012-2zm2-5a1 1 0 100 2 1 1 0 000-2zm0 8a1 1 0 100 2 1 1 0 000-2z" />
        </svg>
      </span>
    );
  }

  // Default badge for other sprites
  return (
    <span key={key} className="inline-flex items-center px-1 py-0.5 mx-0.5 rounded text-[10px] font-mono bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1]">
      {spriteName}
    </span>
  );
};

/**
 * Parses PlantUML Creole & HTML inline formatting tags and sprites into rich React nodes
 */
export function renderPlantUMLFormattedText(rawText: string): React.ReactNode {
  if (!rawText) return null;

  // Unescape literal \n into real newlines
  const textWithNewlines = rawText.replace(/\\n/g, '\n');
  const lines = textWithNewlines.split('\n');

  return lines.map((line, lineIdx) => {
    const formattedLine = parseLineFormatting(line, lineIdx);
    return (
      <React.Fragment key={lineIdx}>
        {lineIdx > 0 && <br />}
        {formattedLine}
      </React.Fragment>
    );
  });
}

function parseLineFormatting(line: string, lineKey: number): React.ReactNode {
  // Regex to match:
  // 1. Embedded sprites: <$name> or <&name>
  // 2. HTML-like tags: <color:#hex>...</color>, <back:#hex>...</back>, <size:N>...</size>, <b>...</b>, <i>...</i>, <u>...</u>, <s>...</s>
  // 3. Creole: **bold**, //italic//, __underline__, --strike--
  const tokenRegex = /(<\$([a-zA-Z0-9_-]+)>|<&([a-zA-Z0-9_-]+)>|<color:([^>]+)>([\s\S]*?)<\/color>|<back:([^>]+)>([\s\S]*?)<\/back>|<size:([0-9]+)>([\s\S]*?)<\/size>|<b>([\s\S]*?)<\/b>|<i>([\s\S]*?)<\/i>|<u>([\s\S]*?)<\/u>|<s>([\s\S]*?)<\/s>|\*\*([^*]+)\*\*|\/\/([^\/]+)\/\/|__([^_]+)__|--([^-]+)--)/g;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let tokenIdx = 0;

  while ((match = tokenRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      elements.push(<span key={`text_${lineKey}_${tokenIdx++}`}>{line.slice(lastIndex, match.index)}</span>);
    }

    const fullMatch = match[0];
    const k = `fmt_${lineKey}_${tokenIdx++}`;

    if (fullMatch.startsWith('<$') || fullMatch.startsWith('<&')) {
      const spriteName = match[2] || match[3];
      elements.push(renderInlineSprite(spriteName, k));
    } else if (match[4]) {
      // <color:val>...</color>
      const colorVal = match[4].trim();
      const content = match[5];
      elements.push(
        <span key={k} style={{ color: colorVal }}>
          {parseLineFormatting(content, tokenIdx)}
        </span>
      );
    } else if (match[6]) {
      // <back:val>...</back>
      const backVal = match[6].trim();
      const content = match[7];
      elements.push(
        <span key={k} style={{ backgroundColor: backVal, padding: '0 2px', borderRadius: '2px' }}>
          {parseLineFormatting(content, tokenIdx)}
        </span>
      );
    } else if (match[8]) {
      // <size:N>...</size>
      const sizeVal = parseInt(match[8], 10);
      const content = match[9];
      elements.push(
        <span key={k} style={{ fontSize: `${sizeVal}px` }}>
          {parseLineFormatting(content, tokenIdx)}
        </span>
      );
    } else if (match[10] !== undefined || match[14] !== undefined) {
      // <b>...</b> or **...**
      const content = match[10] !== undefined ? match[10] : match[14];
      elements.push(
        <strong key={k} className="font-bold text-[#1c1917]">
          {parseLineFormatting(content, tokenIdx)}
        </strong>
      );
    } else if (match[11] !== undefined || match[15] !== undefined) {
      // <i>...</i> or //...//
      const content = match[11] !== undefined ? match[11] : match[15];
      elements.push(
        <em key={k} className="italic text-[#555]">
          {parseLineFormatting(content, tokenIdx)}
        </em>
      );
    } else if (match[12] !== undefined || match[16] !== undefined) {
      // <u>...</u> or __...__
      const content = match[12] !== undefined ? match[12] : match[16];
      elements.push(
        <span key={k} style={{ textDecoration: 'underline' }}>
          {parseLineFormatting(content, tokenIdx)}
        </span>
      );
    } else if (match[13] !== undefined || match[17] !== undefined) {
      // <s>...</s> or --...--
      const content = match[13] !== undefined ? match[13] : match[17];
      elements.push(
        <del key={k} className="text-[#888]">
          {parseLineFormatting(content, tokenIdx)}
        </del>
      );
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < line.length) {
    elements.push(<span key={`text_${lineKey}_end`}>{line.slice(lastIndex)}</span>);
  }

  return elements.length === 1 ? elements[0] : elements;
}
