import util from 'node:util';

import { customAlphabet } from 'nanoid';
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
    'PATCH': {
      handle: handleRefresh,
      searchParamsSchema: joi.object({
        client_id: joi.string()
      }),
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
  let { body } = ctx.request;

  try {
    let { authorizationBase64 } = await getClient(ctx);

    tokenResult = await fetch(`${ KNUDGE_ORIGIN_API }/v1/oauth/token`, {
      body: new URLSearchParams({
        code: body.code,
        grant_type: 'authorization_code'
      }).toString(),
      headers: {
        'authorization': `basic ${ authorizationBase64 }`,
        'accept': 'application/json',
        'content-type': 'application/x-www-form-urlencoded'
      },
      method: 'POST'
    });
  } catch (err) {
    console.error(util.inspect(err, { depth: Infinity, colors: true }))
  }

  if (!tokenResult?.ok) {
    console.error(util.inspect(tokenResult, { depth: Infinity, colors: true }))

    if (tokenResult?.body) {
      console.error(await tokenResult.text());
    }

    return ctx.throw(
      tokenResult?.status ?? 500,
      `Knudge response: ${ tokenResult?.statusText ?? 'Internal Server Error' }`
    );
  }

  if (tokenResult.bodyUsed)
    throw new Error('Body used');

  const tokenJSON = await tokenResult.json();
  const cookie = generateCookie();

  await kvStore.write(`sesh-${ cookie }`, JSON.stringify(tokenJSON, null, 2));
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

/**
 * Example of how to refresh an API token. This would normally be done by some
 * 2-week cron job, or if the current access token is determined to be expired
 * when making an API request to Knudge, but we wrap it up in an endpoint to
 * make it easier to play around with.
 *
 * @param {import('koa').Context} ctx
 */
async function handleRefresh(ctx) {
  let tokenResult;

  try {
    let { authorizationBase64 } = await getClient(ctx);
    let { refresh_token } = JSON.parse(await kvStore.read(`sesh-${ cookie }`));

    tokenResult = await fetch(`${ KNUDGE_ORIGIN_API }/v1/oauth/token`, {
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token
      }).toString(),
      headers: {
        'authorization': `basic ${ authorizationBase64 }`,
        'accept': 'application/json',
        'content-type': 'application/x-www-form-urlencoded'
      },
      method: 'POST'
    });
  } catch (err) {
    console.error(util.inspect(err, { depth: Infinity, colors: true }))
  }

  if (!tokenResult?.ok) {
    console.error(util.inspect(tokenResult, { depth: Infinity, colors: true }))

    if (tokenResult?.body) {
      console.error(await tokenResult.text());
    }

    return ctx.throw(
      tokenResult?.status ?? 500,
      `Knudge response: ${ tokenResult?.statusText ?? 'Internal Server Error' }`
    );
  }

  if (tokenResult.bodyUsed)
    throw new Error('Body used');

  const tokenJSON = await tokenResult.json();
  const cookie = generateCookie();

  // Update our copy of the token with the latest data
  await kvStore.write(`sesh-${ cookie }`, JSON.stringify(tokenJSON, null, 2));

  ctx.status = 200;
  ctx.body = {};
}

