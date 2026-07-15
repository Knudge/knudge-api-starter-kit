import { ORIGIN_API, ORIGIN_WEB } from '../../config.mjs';
import { webSocketManager } from '../websocket-manager.mjs';

const PATH_PATTERN = /^\/api\/oauth\/client-meta\/([a-zA-Z0-9]+)\.json$/;

/**
 * @param {import('koa').Context} ctx
 */
export default async function webhook(ctx) {
  let match = PATH_PATTERN.exec(ctx.request.path);

  if (!match)
    return false;

  let [ , clientID ] = match;

  const { oauthSession } = ctx.state;

  ctx.status = 200;
  ctx.body = {
    client_id: new URL(ctx.request.path, ORIGIN_API).href,
    client_name: `Knudge Starter Kit Generated ${ clientID }`,
    redirect_uris: [ new URL('/oauth/knudge', ORIGIN_WEB).href ]
  };

  return true;
}
