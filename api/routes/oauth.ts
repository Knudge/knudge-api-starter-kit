import joi from 'joi';
import { Context } from 'koa';
import { Routes } from './types';
import * as keyValueStore from '../fs-key-value-store.js';
import { KNUDGE_ORIGIN } from '../../config.mjs'
const STORAGE_KEY = 'knudge-oauth-token';

const routes: Routes = {
  '/api/oauth/knudge': {
    'DELETE': {
      handle: handleUnlink
    },
    'POST': {
      handle: handleLink,
      bodySchema: joi.object({
        code: joi.string().required()
      })
    }
  }
};

export default routes;

// HANDLERS ////////////////////////////////////////////////////////////////////

/**
 * Take the authorization code from the client and exchange it with Knudge's API
 * for an access token, which will allow further requests to be made on behalf
 * of the user.
 */
async function handleLink(ctx: Context) {
  const body = ctx.body as { code: string };
  const tokenResult = await fetch(`${ KNUDGE_ORIGIN }/api/✨/oauth/token`, {
    headers: {
      'accept': 'application/json',
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      code: body.code,
      grant_type: 'authorization_code'
    }).toString()
  });

  if (tokenResult.ok) {
    const tokenJSON = await tokenResult.json() as OAuthResponse;
    await keyValueStore.write(STORAGE_KEY, JSON.stringify(tokenJSON));
  } else {
    ctx.throw(tokenResult.status, tokenResult.statusText);
  }
}

async function handleUnlink(ctx: Context) {
  await keyValueStore.remove(STORAGE_KEY);
}

interface OAuthResponse extends Object {
  'access_token':  string,
  'created_at':    number,
  'expires_in':    number,
  'refresh_token': string,
  'scope':         string,
  'token_type':    string
}