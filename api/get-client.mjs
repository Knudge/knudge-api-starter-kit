import { KNUDGE_CLIENT_ID, KNUDGE_SECRET } from '../config.mjs';

export default async function getClient(ctx) {
  let { client_id: clientID } = ctx.request.search;
  let clientSecret;

  if (clientID) {
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

  let source = `${ ctx.request.search.client_id ?? KNUDGE_CLIENT_ID }:${ KNUDGE_SECRET }`;
  let authorizationBase64 = Buffer
    .from(source)
    .toString('base64');

  return { clientID, clientSecret, authorizationBase64 };
}