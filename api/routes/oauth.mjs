import util from 'node:util';

import { customAlphabet } from 'nanoid/async';
import joi from 'joi';

import * as kvStore from '../fs-key-value-store.mjs';
import { HOSTNAME, KNUDGE_ORIGIN_API } from '../../config.mjs'
import getClient from '../get-client.mjs';

const generateCookie = customAlphabet('23456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 20);

// ROUTES //////////////////////////////////////////////////////////////////////

export default {
  '/api/oauth/knudge': {
    'DELETE': {
      handle: handleUnlink
    },
    'POST': {
      handle: handleLink,
      bodySchema: joi.object({
        code: joi.string().required()
      }),
      public: true,
      searchParamsSchema: joi.object({
        client_id: joi.string()
      }),
    }
  }
};

// HANDLERS ////////////////////////////////////////////////////////////////////

/**
 * Take the authorization code from the client and exchange it with Knudge's API
 * for an access token, which will allow further requests to be made on behalf
 * of the user.
 * 
 * @param {import('koa').Context} ctx 
 */
async function handleLink(ctx) {
  let tokenResult;

  try {
    let { authorizationBase64 } = await getClient(ctx);

    tokenResult = await fetch(`${ KNUDGE_ORIGIN_API }/v1/oauth/token`, {
      headers: {
        'authorization': `basic ${ authorizationBase64 }`,
        'accept': 'application/json',
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code: ctx.request.body.code,
        grant_type: 'authorization_code'
      }).toString(),
      method: 'POST'
    });
  } catch (err) {
    console.error(util.inspect(err, { depth: Infinity, colors: true }))
  }

  if (!tokenResult?.ok) {
    console.error(util.inspect(tokenResult, { depth: Infinity, colors: true }))

    if (tokenResult?.body) {
      console.error(Buffer.from(await tokenResult.arrayBuffer()).toString());
    }

    return ctx.throw(
      tokenResult.status,
      `Knudge response: ${ tokenResult.statusText }`
    );
  }

  const tokenJSON = await tokenResult.json();
  const cookie = await generateCookie();

  await kvStore.write(`sesh-${ cookie }`, JSON.stringify(tokenJSON));
  ctx.cookies.set('sesh', cookie, {
    domain: HOSTNAME,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 14,
    overwrite: true,
    sameSite: 'lax',
    secure: true
  })
  ctx.status = 200;
  ctx.body = {};
}

async function handleUnlink(ctx) {
  let cookie = ctx.cookies.get('sesh');
  ctx.cookies.set('sesh', null);
  await kvStore.remove(`session-${ cookie }`);
}
