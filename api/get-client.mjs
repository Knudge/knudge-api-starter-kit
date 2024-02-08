import { KNUDGE_CLIENT_ID, KNUDGE_SECRET } from '../config.mjs';
import * as kvStore from './fs-key-value-store.mjs';

/**
 * @param {import('koa').Context} ctx 
 */
export default async function getClient(ctx) {
  let usp = new URLSearchParams(ctx.request.search);
  let clientID = usp.get('client_id');
  let clientSecret;

  if (clientID && clientID !== KNUDGE_CLIENT_ID) {
    try {
      ({ clientID, clientSecret } = JSON.parse(
        await kvStore.read(`client-${ clientID }`)
      ))
    } catch (err) {
      console.error(`No secret stored for client ID "${ clientID }"`, err);
      clientID = null;
    }
  }

  clientID ??= KNUDGE_CLIENT_ID;
  clientSecret ??= KNUDGE_SECRET;

  let source = `${ clientID }:${ clientSecret }`;
  let authorizationBase64 = Buffer
    .from(source)
    .toString('base64');

  return { clientID, clientSecret, authorizationBase64 };
}