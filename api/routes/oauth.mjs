import { customAlphabet } from 'nanoid/async';
import joi from 'joi';
import * as keyValueStore from '../fs-key-value-store.mjs';
import { KNUDGE_ORIGIN } from '../../config.mjs'

const generateCookie = customAlphabet('23456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 20);

const STORAGE_KEY = 'knudge-oauth-token';

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
  const tokenResult = await fetch(`${ KNUDGE_ORIGIN }/api/✨/oauth/token`, {
    headers: {
      'accept': 'application/json',
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      code: ctx.body.code,
      grant_type: 'authorization_code'
    }).toString()
  });

  if (!tokenResult.ok) {
    return ctx.throw(tokenResult.status, tokenResult.statusText);
  }

  const cookie = await generateCookie();
  const tokenJSON = await tokenResult.json();
  await keyValueStore.write(STORAGE_KEY, JSON.stringify(tokenJSON));
  ctx.cookies.set('session', cookie)
  await keyValueStore.write(`session-${ cookie }`, JSON.stringify(tokenJSON));
  ctx.status = 200;
}

async function handleUnlink(ctx) {
  ctx.cookies.set('session', null);
  await keyValueStore.remove(STORAGE_KEY);
}
