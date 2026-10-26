import test from 'node:test';
import assert from 'node:assert/strict';
import netlifyAiTutorHandler from '../netlify/functions/ai-tutor.js';

test('Netlify Function: GET /api/ai-tutor returns status JSON with CORS headers', async () => {
  const req = new Request('http://localhost/api/ai-tutor', {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  const response = await netlifyAiTutorHandler(req, {});
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'application/json');
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');

  const data = await response.json();
  assert.equal(data.status, 'ok');
  assert.equal(typeof data.configured, 'boolean');
});

test('Netlify Function: OPTIONS returns 204 preflight', async () => {
  const req = new Request('http://localhost/api/ai-tutor', {
    method: 'OPTIONS',
  });

  const response = await netlifyAiTutorHandler(req, {});
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
});

test('Netlify Function: POST with invalid payload returns 400 validation error', async () => {
  const req = new Request('http://localhost/api/ai-tutor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: '' }),
  });

  const response = await netlifyAiTutorHandler(req, {});
  assert.equal(response.status, 400);
  const data = await response.json();
  assert.equal(data.success, false);
});
