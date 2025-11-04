import { HOSTNAME, KNUDGE_ORIGIN_API } from '../../config.mjs'

// ROUTES //////////////////////////////////////////////////////////////////////

/** @param {import('koa').Context} ctx */
export default {
  '/api/session': {
    'DELETE': {
      handle: deleteSession
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
  ctx.status = 404;
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
