import { handleAiTutorHttp } from './aiTutorService.js';

/**
 * Kannada Mitra — Vite Server Plugin for AI Tutor Endpoint
 * Intercepts requests to /api/ai-tutor during `npm run dev` and `npm run preview`.
 * Runs strictly in the Node.js dev server environment so AI credentials never leak to the client.
 */
export function aiTutorPlugin() {
  return {
    name: 'kannada-ai-tutor-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (url === '/api/ai-tutor' || url.startsWith('/api/ai-tutor?') || url.startsWith('/api/ai-tutor/')) {
          try {
            await handleAiTutorHttp(req, res);
          } catch (err) {
            console.error('[AiTutorPlugin] Middleware error:', err);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'SERVER_ERROR', message: 'Internal server error.' }));
            }
          }
          return;
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (url === '/api/ai-tutor' || url.startsWith('/api/ai-tutor?') || url.startsWith('/api/ai-tutor/')) {
          try {
            await handleAiTutorHttp(req, res);
          } catch (err) {
            console.error('[AiTutorPlugin] Preview middleware error:', err);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'SERVER_ERROR', message: 'Internal server error.' }));
            }
          }
          return;
        }
        next();
      });
    },
  };
}
