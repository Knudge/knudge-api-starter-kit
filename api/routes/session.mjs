import * as kvStore from '../fs-key-value-store.mjs';

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
    ctx.body = {};
    return;
  }

  let { oauth } = ctx.state;

  console.log('--oauth--', oauth);

  if (!oauth) {
    ctx.body = null;
    return;
  }

  ctx.status = 418;

  // TODO fetch user info from Knudge
  ctx.body = {};
}
