import { KNUDGE_ORIGIN_API } from '../../config.mjs'

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
  if (!ctx.request.path.startsWith(PREFIX)) {
    return false;
  }

  let knudgeAPIPath = ctx.request.path.substring(PREFIX.length);

  if (!knudgeAPIPath) {
    return ctx.throw(400, 'Empty passthrough path');
  }

  let { oauthSession } = ctx.state;

  if (!oauthSession) {
    return ctx.throw(401, 'OAuth authorization not completed')
  }

  let url = `${ KNUDGE_ORIGIN_API }/${ knudgeAPIPath }${ ctx.request.search }`

  let result = await fetch(url, {
    headers: {
      'authorization': `bearer ${ oauthSession.access_token }`,
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
