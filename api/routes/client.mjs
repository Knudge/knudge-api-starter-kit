import joi from 'joi';

import * as kvStore from '../fs-key-value-store.mjs';

// ROUTES //////////////////////////////////////////////////////////////////////

export default {
  ...process.env.IS_TEST ? {
    '/api/client': {
      'PUT': {
        handle: handleClientSet,
        bodySchema: joi.object({
          clientID: joi.string().required(),
          clientSecret: joi.string().required()
        }),
        public: true
      }
    }
  } : {}
};

// HANDLERS ////////////////////////////////////////////////////////////////////

/**
 * Stores a client secret to be used if a given ID is explicitly passed into
 * the UI. This is mainly useful for automated testing, where one can reuse the
 * same knudge-api-starter-kit server for multiple tests and just pass it the
 * client ID when forwarding a client.
 * 
 * @param {import('koa').Context} ctx 
 */
async function handleClientSet(ctx) {
  const { clientID, clientSecret } = ctx.request.body;
  await kvStore.write(`client-${ clientID }`, JSON.stringify({
    clientID,
    clientSecret
  }));
  ctx.status = 200;
  ctx.body = {
    clientID
  };
}
