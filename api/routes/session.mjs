import { HOSTNAME, KNUDGE_ORIGIN_API } from '../../config.mjs'

// ROUTES //////////////////////////////////////////////////////////////////////

export default {
  '/api/session': {
    'GET': {
      handle: getSession,
      public: true
    }
  }
}

// HANDLERS ////////////////////////////////////////////////////////////////////

/**
 * @param {import('koa').Context} ctx 
 */
async function getSession(ctx) {
  const cookie = ctx.cookies.get('sesh');

  if (!cookie) {
    ctx.status = 404;
    return;
  }

  let { oauthSession } = ctx.state;

  if (!oauthSession) {
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

  let selfResult = await fetch(`${ KNUDGE_ORIGIN_API }/v1/self`, {
      headers: {
        'authorization': `bearer ${ oauthSession.access_token }`,
        'accept': 'application/json'
      },
      method: 'GET'
  });

  ctx.body = await selfResult.json();
}
