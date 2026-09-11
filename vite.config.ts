import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import express from 'express';
import multer from 'multer';
import { saveBugReport, listBugReports, createZipArchive } from './server/bugService.js';

function bugApiPlugin(): Plugin {
  return {
    name: 'bug-api-plugin',
    configureServer(server) {
      const api = express();
      const upload = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: 50 * 1024 * 1024, files: 20 }
      });

      api.use(express.json({ limit: '50mb' }));
      api.use(express.urlencoded({ extended: true, limit: '50mb' }));

      api.get('/api/health', (_req, res) => {
        res.json({ status: 'ok', dev: true });
      });

      api.get('/api/bugs', (_req, res) => {
        try {
          const reports = listBugReports();
          res.json({ success: true, reports });
        } catch (err: any) {
          res.status(500).json({ success: false, error: err.message });
        }
      });

      api.post('/api/bugs', upload.array('files', 20), async (req: any, res: any) => {
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
        } catch (err: any) {
          res.status(500).json({ success: false, error: err.message });
        }
      });

      api.get('/api/bugs/export', async (_req, res) => {
        try {
          await createZipArchive(res);
        } catch (err: any) {
          if (!res.headersSent) {
            res.status(500).json({ success: false, error: err.message });
          }
        }
      });

      server.middlewares.use(api);
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), bugApiPlugin()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
