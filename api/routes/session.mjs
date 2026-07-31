import { HOSTNAME, KNUDGE_ORIGIN_API } from '../../config.mjs'
import * as kvStore from '../fs-key-value-store.mjs';

// ROUTES //////////////////////////////////////////////////////////////////////

/** @param {import('koa').Context} ctx */
export default {
  '/api/session': {
    'DELETE': {
      // Public so a broken/expired session cookie can still be cleared.
      handle: deleteSession,
      public: true
    },
    'GET': {
      handle: getSession,
      public: true
    }
  }
}

// HANDLERS ////////////////////////////////////////////////////////////////////

/** @param {import('koa').Context} ctx */
async function deleteSession(ctx) {
  let cookie = ctx.cookies.get('sesh');

  if (cookie)
    await kvStore.remove(`sesh-${ cookie }`);

  ctx.cookies.set('sesh', null, {
    domain: HOSTNAME,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 14,
    overwrite: true,
    sameSite: 'lax',
    secure: true
  });
  ctx.status = 204;
}

/** @param {import('koa').Context} ctx */
async function getSession(ctx) {
  const cookie = ctx.cookies.get('sesh');

  if (!cookie) {
    ctx.status = 404;
    return;
  }

  let { oauthSession } = ctx.state;

  let selfResult = oauthSession && await fetch(
    `${ KNUDGE_ORIGIN_API }/v1/self`,
    {
      headers: {
        'authorization': `bearer ${ oauthSession.access_token }`,
        'accept': 'application/json'
      },
      method: 'GET'
    }
  );

  if (!selfResult?.ok) {
    if (cookie)
      await kvStore.remove(`sesh-${ cookie }`);

    ctx.status = 200;
    ctx.body = {};
    ctx.cookies.set('sesh', null, {
      domain: HOSTNAME,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 14,
      overwrite: true,
      sameSite: 'lax',
      secure: true
    });
    return;
  }

  const resultJSON = await selfResult.json();

  ctx.status = selfResult.status;
  ctx.message = selfResult.statusText;
  ctx.body = resultJSON;
}
