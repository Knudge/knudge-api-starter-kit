import util from 'node:util';

import { customAlphabet } from 'nanoid/async';
import joi from 'joi';

import * as kvStore from '../fs-key-value-store.mjs';
import { KNUDGE_CLIENT_ID, KNUDGE_ORIGIN, KNUDGE_SECRET } from '../../config.mjs'

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
      public: true
    }
  }
};

// HANDLERS ////////////////////////////////////////////////////////////////////

/**
 * Take the authorization code from the client and exchange it with Knudge's API
 * for an access token, which will allow further requests to be made on behalf
 * of the user.
 */
async function handleLink(ctx) {
  let tokenResult;

  try {
    let authorizationBase64 = Buffer
      .from(`${ KNUDGE_CLIENT_ID }:${ KNUDGE_SECRET }`)
      .toString('base64');
    tokenResult = await fetch(`${ KNUDGE_ORIGIN }/api/xn--0ci/oauth/token`, {
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

    if (tokenResult.body) {
      console.error(Buffer.from(await tokenResult.arrayBuffer()).toString());
    }

    return ctx.throw(
      tokenResult.status,
      `Knudge response: ${ tokenResult.statusText }`
    );
  }

  const tokenJSON = await tokenResult.json();
  const cookie = await generateCookie();

  await kvStore.write(`session-${ cookie }`, JSON.stringify(tokenJSON));
  ctx.cookies.set('session', cookie)
  ctx.status = 200;
  ctx.body = {};
}

async function handleUnlink(ctx) {
  let cookie = ctx.cookies.get('session');
  ctx.cookies.set('session', null);
  await kvStore.remove(`session-${ cookie }`);
}
