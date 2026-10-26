import { processAiTutorQuery } from '../../server/aiTutorService.js';
import { getAiConfig } from '../../server/env.js';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Netlify Function v2 Handler for Kannada Mitra AI Tutor
 */
export default async function handler(req, context) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // GET /api/ai-tutor - Status & Configuration Check
  if (req.method === 'GET') {
    const config = getAiConfig();
    return new Response(
      JSON.stringify({
        status: 'ok',
        configured: config.isConfigured,
        model: config.model,
        provider: config.provider,
        quotas: config.quotas,
      }),
      { status: 200, headers: corsHeaders }
    );
  }

  // POST /api/ai-tutor - Chat & Conversation Practice
  if (req.method === 'POST') {
    try {
      const payload = await req.json();
      const outcome = await processAiTutorQuery(payload);
      return new Response(JSON.stringify(outcome.body), {
        status: outcome.status,
        headers: corsHeaders,
      });
    } catch (err) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INTERNAL_ERROR',
          message: err?.message || 'Internal server error.',
          origin: 'backend',
        }),
        { status: 500, headers: corsHeaders }
      );
    }
  }

  return new Response(
    JSON.stringify({ success: false, error: 'METHOD_NOT_ALLOWED', message: 'Use GET or POST' }),
    { status: 405, headers: corsHeaders }
  );
}

export const config = {
  path: ['/api/ai-tutor', '/api/ai-tutor/*'],
};
