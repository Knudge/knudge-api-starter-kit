import { KNUDGE_ORIGIN_API } from '../../config.mjs'
import getClient from '../get-client.mjs';

const BODYABLE = new Set([
  'PATCH',
  'POST',
  'PUT'
]);

const PREFIX = '/api/passthrough/';

/**
 * @param {import('koa').Context} ctx
 */
export default async function passthrough(ctx) {
  let d = new Date().toLocaleTimeString();
  if (!ctx.request.path.startsWith(PREFIX)) {
    return false;
  }

  let knudgeAPIPath = ctx.request.path.substring(PREFIX.length);

  if (!knudgeAPIPath) {
    return ctx.throw(400, 'Empty passthrough path');
  }

  let { oauthSession } = ctx.state;

  if (new URLSearchParams(ctx.request.search).has('client-only'))
    oauthSession = null;

  let authorization;

  if (oauthSession) {
    console.log(`${ d } ${ ctx.request.method } ${ ctx.request.path } (session)`);
    authorization = `bearer ${ oauthSession.access_token }`;
  } else {
    console.log(`${ d } ${ ctx.request.method } ${ ctx.request.path } (client)`);
    let { authorizationBase64 } = await getClient(ctx);
    authorization = `basic ${ authorizationBase64 }`;
  }

  let url = `${ KNUDGE_ORIGIN_API }/${ knudgeAPIPath }${ ctx.request.search }`

  let result = await fetch(url, {
    headers: {
      'authorization': authorization,
      'accept': ctx.headers.accept,
      'content-type': ctx.headers['content-type'],
      'knudge-api-version': ctx.headers['knudge-api-version'] ?? '',
      'x-content-format': ctx.headers['x-content-format'] ?? ''
    },
    body: BODYABLE.has(ctx.request.method)
      ? JSON.stringify(ctx.request.body)
      : undefined,
    method: ctx.request.method
  });

  result.headers.forEach((value, key) => ctx.set(key, value));
  ctx.status = result.status;
  ctx.message = result.statusText;
  ctx.response.set('content-type', result.headers.get('content-type'));
  try {
    ctx.body = await result.json();
  } catch {
    ctx.body = result.body;
  }

  return true;
}
