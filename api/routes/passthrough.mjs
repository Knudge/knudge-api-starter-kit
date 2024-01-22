import { KNUDGE_ORIGIN_API } from '../../config.mjs'

let BODYABLE = new Set([
  'PATCH',
  'POST',
  'PUT'
]);

/**
 * @param {import('koa').Context} ctx 
 */
export default async function passthrough(ctx) {
  let prefix = '/api/passthrough/';

  if (!ctx.request.path.startsWith(prefix)) {
    return false;
  }

  let knudgeAPIPath = ctx.request.path.substring(prefix.length);

  if (!knudgeAPIPath) {
    return ctx.throw(400, 'Empty passthrough path');
  }

  let { oauthSession } = ctx.state;

  if (!oauthSession) {
    return ctx.throw(401, 'OAuth authorization not completed')
  }

  let url = `${ KNUDGE_ORIGIN_API }/${ knudgeAPIPath }`

  let result = await fetch(url, {
    headers: {
      'authorization': `bearer ${ oauthSession.access_token }`,
      'accept': ctx.headers.accept,
      'content-type': ctx.headers['content-type']
    },
    body: BODYABLE.has(ctx.request.method) ? ctx.request.body : undefined,
    method: ctx.request.method
  });

  if (!result.ok) {
    ctx.status = result.status;
    ctx.message = result.statusText;
    ctx.response.set('content-type', result.headers.get('content-type'));
    ctx.body = result.body;
    return true;
  }

  try {
    ctx.body = await result.json();
  } catch (err) {
    console.error(err);
  }

  return true;
}
