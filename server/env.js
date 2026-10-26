import fs from 'node:fs';
import path from 'node:path';

/**
 * Kannada Mitra — Server Environment Variable Loader
 * Safely parses server-side environment variables from .env and .env.local
 * without exposing them to browser bundles.
 */

export const PLACEHOLDER_API_KEY = 'your_api_key_here';

export function loadServerEnv(rootDir = process.cwd()) {
  const envFiles = ['.env', '.env.local'];

  for (const file of envFiles) {
    const fullPath = path.resolve(rootDir, file);
    if (!fs.existsSync(fullPath)) continue;

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          // Strip surrounding quotes
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }
          if (process.env[key] === undefined) {
            process.env[key] = val;
          }
        }
      }
    } catch {
      // Ignore read errors
    }
  }
}

/**
 * Returns the configured AI API credentials and validation status
 */
export function getAiConfig() {
  loadServerEnv();

  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '';
  const model = process.env.AI_MODEL || 'gemini-3.5-flash-lite';
  const provider = process.env.AI_PROVIDER || 'gemini';

  const isPlaceholder =
    !apiKey ||
    apiKey === PLACEHOLDER_API_KEY ||
    apiKey === 'your_api_key_here' ||
    apiKey === 'your_gemini_api_key_here' ||
    apiKey === 'PLACEHOLDER_KEY';

  return {
    apiKey: isPlaceholder ? '' : apiKey,
    rawKeyProvided: Boolean(apiKey),
    isConfigured: !isPlaceholder && apiKey.length > 10,
    model,
    provider,
    quotas: {
      rpm: 15,
      rpd: 1500,
      tpm: 1000000,
    },
  };
}
