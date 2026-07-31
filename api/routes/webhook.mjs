import { webSocketManager } from '../websocket-manager.mjs';

const PREFIX = '/api/webhook/';

/**
 * @param {import('koa').Context} ctx
 */
export default async function webhook(ctx) {
  if (!ctx.request.path.startsWith(PREFIX)) {
    return false;
  }

  // Optional receiver auth matching Pubic webhook-registration
  // `headerAuthBasic` (joined with ':' and base64'd into Authorization).
  // Set WEBHOOK_AUTH_BASIC=part1:part2 in .env to require it.
  let webhookAuthBasic = process.env.WEBHOOK_AUTH_BASIC;
  if (webhookAuthBasic) {
    let expected =
      `Basic ${ Buffer.from(webhookAuthBasic).toString('base64') }`;
    if (ctx.get('authorization') !== expected)
      return ctx.throw(401, 'Unauthorized webhook');
  }

  const name = ctx.request.path.substring(PREFIX.length);

  // Broadcast webhook data to WebSocket clients
  const webhookData = {
    method: ctx.request.method,
    headers: ctx.headers,
    body: ctx.request.body,
    query: ctx.query,
    name
  };

  // Broadcast to WebSocket clients
  webSocketManager.broadcast(webhookData);

  ctx.status = 200;
  ctx.body = { message: 'Webhook received' };

  return true;
}
