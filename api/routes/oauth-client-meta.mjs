import crypto from 'node:crypto';

import { ORIGIN_API, ORIGIN_WEB } from '../../config.mjs';

const PATH_PATTERN =
  /^\/api\/oauth\/client-meta\/(?:(public)\/)?([a-zA-Z0-9]+)\.json$/;

// Stable-for-process public JWKS so CIMD docs satisfy Knudge validation.
const { publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const JWKS = {
  keys: [
    {
      ...publicKey.export({ format: 'jwk' }),
      kid: 'starter-kit',
      use: 'sig',
      alg: 'RS256',
    },
  ],
};

/**
 * @param {import('koa').Context} ctx
 */
export default async function oauthClientMeta(ctx) {
  let match = PATH_PATTERN.exec(ctx.request.path);

  if (!match) return false;

  let [, visibility, clientID] = match;
  let isPublic = visibility === 'public';

  ctx.status = 200;
  ctx.body = {
    client_id: new URL(ctx.request.path, ORIGIN_API).href,
    client_name: `Knudge Starter Kit Generated ${clientID}`,
    ...isPublic ? {} : { jwks: JWKS },
    redirect_uris: [new URL('/oauth/knudge', ORIGIN_WEB).href],
    grant_types: [
      'authorization_code',
      'refresh_token',
      'urn:ietf:params:oauth:grant-type:jwt-bearer',
    ],
    response_types: ['code'],
    token_endpoint_auth_method: isPublic ? 'none' : 'private_key_jwt',
  };

  return true;
}
