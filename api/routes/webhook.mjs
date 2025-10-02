import { KNUDGE_ORIGIN_API } from '../../config.mjs';
import { webSocketManager } from '../websocket-manager.mjs';

const BODYABLE = new Set([
  'PATCH',
  'POST',
  'PUT'
]);

const PREFIX = '/api/webhook/';

let websockets = new WeakSet();

/**
 * @param {import('koa').Context} ctx
 */
export default async function passthrough(ctx) {
  if (!ctx.request.path.startsWith(PREFIX)) {
    return false;
  }

  const name = ctx.request.path.substring(PREFIX.length);
  const url = `${KNUDGE_ORIGIN_API}/v1/webhook/${name}`;
  const { oauthSession } = ctx.state;

  // Broadcast webhook data to WebSocket clients
  const webhookData = {
    name,
    method: ctx.request.method,
    headers: ctx.headers,
    body: ctx.request.body,
    query: ctx.query,
    timestamp: new Date().toISOString(),
    type: 'webhook',
    name
  };

  // Broadcast to WebSocket clients
  webSocketManager.broadcast(webhookData);

  // If no OAuth session, return 401
  if (!oauthSession) {
    ctx.status = 401;
    ctx.body = { error: 'Unauthorized' };
    return true;
  }

  try {
    ctx.body = await result.json();
  } catch {
    ctx.body = result.body;
  }

  return true;
}
