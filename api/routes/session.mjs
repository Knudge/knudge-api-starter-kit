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
  const cookie = ctx.cookies.get('session');

  if (!cookie) {
    ctx.body = null;
    return;
  }

  const STORAGE_KEY = `session-${ cookie }`;

  let oauth = await kvStore.read(STORAGE_KEY);

  if (!oauth) {
    ctx.body = null;
    return;
  }

  try {
    oauth = JSON.parse(oauth)
  } catch (err) {
    console.error(err);
    await kvStore.remove(STORAGE_KEY)
    ctx.body = null;
    return;
  }

  // TODO fetch user info from Knudge
  ctx.body = {};
}
