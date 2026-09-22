import { enrichLeadWebsite } from '../lib/engine.js';
import { methodNotAllowed, readJsonBody, sendJson } from '../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    const body = await readJsonBody(req);
    const result = await enrichLeadWebsite(body.website, body.lead || {});
    return sendJson(res, 200, result);
  } catch (error) {
    return sendJson(res, error.statusCode || 500, { error: error.message || 'Erro interno' });
  }
}
