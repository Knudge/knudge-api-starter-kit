import { KNUDGE_ORIGIN_API } from '../../config.mjs'

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

async function getSession(ctx) {
  const cookie = ctx.cookies.get('sesh');

  if (!cookie) {
    ctx.status = 404;
    return;
  }

  let { oauth } = ctx.state;

  if (!oauth) {
    ctx.status = 404;
    ctx.body = null;
    return;
  }

  let selfResult = await fetch(`${ KNUDGE_ORIGIN_API }/v1/self`, {
      headers: {
        'authorization': `bearer ${ oauth.access_token }`,
        'accept': 'application/json'
      },
      method: 'GET'
  });

  ctx.body = await selfResult.json();
}
