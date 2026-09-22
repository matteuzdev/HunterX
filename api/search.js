import { searchLeads } from '../lib/engine.js';
import { methodNotAllowed, readJsonBody, sendJson } from '../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    const body = await readJsonBody(req);
    const result = await searchLeads(body.keyword, body.city);
    return sendJson(res, 200, result);
  } catch (error) {
    const status = error.statusCode || (String(error.message).includes('OUTSCRAPER') ? 502 : 500);
    return sendJson(res, status, {
      error: error.message || 'Erro interno',
      ...(status === 502 ? { hint: 'Confira DATA_PROVIDER e OUTSCRAPER_API_KEY.' } : {})
    });
  }
}
