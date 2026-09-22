import { getRuntimeStatus } from '../lib/engine.js';
import { methodNotAllowed, sendJson } from '../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  return sendJson(res, 200, getRuntimeStatus());
}
