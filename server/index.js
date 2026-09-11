/**
 * server/index.js
 * Production HTTP and API server for PlantUML Visual Studio.
 * Serves the React SPA dist build and persistent bug reporting endpoints.
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { saveBugReport, listBugReports, createZipArchive, getStorageDir } from './bugService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80;
const DIST_PATH = process.env.DIST_PATH || path.resolve(__dirname, '..', 'dist');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer in-memory storage for uploaded files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max per file
    files: 20
  }
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    storageDir: getStorageDir()
  });
});

app.get('/api/bugs', (req, res) => {
  try {
    const reports = listBugReports();
    res.json({ success: true, reports });
  } catch (err) {
    console.error('Error listing bugs:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/bugs', upload.array('files', 20), async (req, res) => {
  try {
    const { title, description, severity, telemetry, logs, pumlCode, diagramState } = req.body;
    const files = req.files || [];

    const result = await saveBugReport({
      title,
      description,
      severity,
      telemetry,
      logs,
      pumlCode,
      diagramState,
      files
    });

    res.json({ success: true, result });
  } catch (err) {
    console.error('Error saving bug report:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/bugs/export', async (req, res) => {
  try {
    await createZipArchive(res);
  } catch (err) {
    console.error('Error generating bugs zip export:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

// Serve frontend static assets if dist directory exists
if (fs.existsSync(DIST_PATH)) {
  console.log(`Serving static assets from ${DIST_PATH}`);
  app.use(express.static(DIST_PATH));

  // SPA fallback
  app.use((req, res) => {
    res.sendFile(path.join(DIST_PATH, 'index.html'));
  });
} else {
  console.warn(`Static dist directory not found at ${DIST_PATH}. Running in API-only mode.`);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`PlantUML Visual Studio server listening on http://0.0.0.0:${PORT}`);
  console.log(`Bug storage directory: ${getStorageDir()}`);
});
