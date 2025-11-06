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
export default async function webhook(ctx) {
  if (!ctx.request.path.startsWith(PREFIX)) {
    return false;
  }

  const name = ctx.request.path.substring(PREFIX.length);
  const { oauthSession } = ctx.state;

  // Broadcast webhook data to WebSocket clients
  const webhookData = {
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

  ctx.status = 200;
  ctx.body = { message: 'Webhook received' };

  return true;
}
