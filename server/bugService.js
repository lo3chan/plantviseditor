/**
 * server/bugService.js
 * Core storage and archive service for bug submissions.
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const archiver = require('archiver');

export function getStorageDir() {
  const dir = process.env.STORAGE_DIR || path.resolve(process.cwd(), 'data', 'bugs');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function sanitizeForFilename(str) {
  return (str || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 40);
}

function formatDateForFolder(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${y}-${m}-${d}_${hh}-${mm}-${ss}`;
}

export async function saveBugReport({
  title = 'Untitled Bug',
  description = '',
  severity = 'medium',
  telemetry = null,
  logs = '',
  pumlCode = '',
  diagramState = null,
  files = []
}) {
  const storageDir = getStorageDir();
  const now = new Date();
  const timestampPrefix = formatDateForFolder(now);
  const safeTitle = sanitizeForFilename(title);
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const folderName = `${timestampPrefix}_${safeTitle}_${randomSuffix}`;
  const bugDir = path.join(storageDir, folderName);

  fs.mkdirSync(bugDir, { recursive: true });
  const attachmentsDir = path.join(bugDir, 'attachments');
  if (files.length > 0) {
    fs.mkdirSync(attachmentsDir, { recursive: true });
  }

  // 1. Process uploaded files
  const savedFiles = [];
  for (const file of files) {
    const safeName = path.basename(file.originalname || file.name || 'attachment');
    const targetPath = path.join(attachmentsDir, safeName);
    
    if (file.buffer) {
      fs.writeFileSync(targetPath, file.buffer);
    } else if (file.path && fs.existsSync(file.path)) {
      fs.copyFileSync(file.path, targetPath);
      try { fs.unlinkSync(file.path); } catch { /* ignore */ }
    }
    savedFiles.push({
      name: safeName,
      size: file.size || (fs.existsSync(targetPath) ? fs.statSync(targetPath).size : 0),
      mimetype: file.mimetype || 'application/octet-stream'
    });
  }

  // 2. Save active diagram code if provided
  if (pumlCode) {
    fs.writeFileSync(path.join(bugDir, 'current_diagram.puml'), pumlCode, 'utf8');
  }

  // 3. Save diagram visual state JSON if provided
  if (diagramState) {
    const stateStr = typeof diagramState === 'string' ? diagramState : JSON.stringify(diagramState, null, 2);
    fs.writeFileSync(path.join(bugDir, 'diagram_state.json'), stateStr, 'utf8');
  }

  // 4. Save system & debug logs
  if (logs) {
    fs.writeFileSync(path.join(bugDir, 'system_debug.log'), logs, 'utf8');
  }

  // 5. Generate human-readable report.md
  let parsedTelemetry = null;
  if (telemetry) {
    try {
      parsedTelemetry = typeof telemetry === 'string' ? JSON.parse(telemetry) : telemetry;
    } catch {
      parsedTelemetry = telemetry;
    }
  }

  const markdownReport = [
    `# Bug Report: ${title}`,
    ``,
    `| Property | Value |`,
    `| --- | --- |`,
    `| **Submission ID** | \`${folderName}\` |`,
    `| **Date & Time** | ${now.toISOString()} |`,
    `| **Severity** | **${severity.toUpperCase()}** |`,
    `| **Attached Files** | ${savedFiles.length} |`,
    ``,
    `## Description / Reproduction Steps`,
    description ? description : '_No description provided._',
    ``,
    `## Environment & Telemetry`,
    parsedTelemetry ? [
      `- **User Agent**: \`${parsedTelemetry.userAgent || 'Unknown'}\``,
      `- **Platform**: \`${parsedTelemetry.platform || 'Unknown'}\``,
      `- **Screen Resolution**: ${parsedTelemetry.screenResolution || 'Unknown'}`,
      `- **Viewport Size**: ${parsedTelemetry.windowInnerSize || 'Unknown'} (DPR: ${parsedTelemetry.devicePixelRatio || 1})`,
      `- **App URL**: \`${parsedTelemetry.url || 'Unknown'}\``,
      `- **Online**: ${parsedTelemetry.online ? 'Yes' : 'No'}`
    ].join('\n') : '_No telemetry collected._',
    ``,
    `## Included Artifacts in this Directory`,
    `- \`report.md\`: This summary report`,
    `- \`report.json\`: Machine-readable metadata`,
    pumlCode ? `- \`current_diagram.puml\`: Active PlantUML code at moment of report` : null,
    diagramState ? `- \`diagram_state.json\`: Visual canvas nodes & connections state` : null,
    logs ? `- \`system_debug.log\`: Runtime console and browser execution logs` : null,
    savedFiles.length > 0 ? `\n### User Attachments (\`attachments/\`):` : null,
    ...savedFiles.map(f => `- \`${f.name}\` (${Math.round(f.size / 1024)} KB)`),
    ``
  ].filter(line => line !== null).join('\n');

  fs.writeFileSync(path.join(bugDir, 'report.md'), markdownReport, 'utf8');

  // 6. Generate machine-readable report.json
  const metadata = {
    id: folderName,
    title,
    severity,
    createdAt: now.toISOString(),
    folderName,
    hasDiagramCode: Boolean(pumlCode),
    hasDiagramState: Boolean(diagramState),
    hasSystemLogs: Boolean(logs),
    telemetry: parsedTelemetry,
    attachments: savedFiles
  };

  fs.writeFileSync(path.join(bugDir, 'report.json'), JSON.stringify(metadata, null, 2), 'utf8');

  return {
    success: true,
    id: folderName,
    folderName,
    path: bugDir,
    filesCount: savedFiles.length + (pumlCode ? 1 : 0) + (diagramState ? 1 : 0) + (logs ? 1 : 0) + 2
  };
}

export function listBugReports() {
  const storageDir = getStorageDir();
  if (!fs.existsSync(storageDir)) return [];

  const entries = fs.readdirSync(storageDir, { withFileTypes: true });
  const reports = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const bugDir = path.join(storageDir, entry.name);
      const jsonPath = path.join(bugDir, 'report.json');
      if (fs.existsSync(jsonPath)) {
        try {
          const content = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          reports.push(content);
        } catch {
          reports.push({ id: entry.name, folderName: entry.name, title: entry.name });
        }
      } else {
        reports.push({ id: entry.name, folderName: entry.name, title: entry.name });
      }
    }
  }

  // Sort descending by creation date
  reports.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  return reports;
}

function createZipInstance(options = { zlib: { level: 9 } }) {
  if (typeof archiver === 'function') {
    return archiver('zip', options);
  }
  if (archiver.ZipArchive) {
    return new archiver.ZipArchive(options);
  }
  if (archiver.default && typeof archiver.default === 'function') {
    return archiver.default('zip', options);
  }
  throw new Error('Unsupported archiver export format');
}

export function createZipArchive(res) {
  const storageDir = getStorageDir();
  const archive = createZipInstance({
    zlib: { level: 9 }
  });

  archive.on('error', (err) => {
    throw err;
  });

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="plantvis_bugs_export_${formatDateForFolder()}.zip"`);

  archive.pipe(res);

  // Add the entire storage directory into the zip preserving each bug's subfolder
  if (fs.existsSync(storageDir)) {
    archive.directory(storageDir, false);
  }

  return archive.finalize();
}
