import Koa from 'koa';
import https from 'node:https';
import handleAPIRequest from './handle-api-request.mjs';
import cors from '@koa/cors';

import bodyParser from 'koa-bodyparser';

import { CERTIFICATE, URL_WEB } from '../config.mjs';

const app = new Koa(); 

app.use(cors({ origin: URL_WEB.origin }));

app.use(async (ctx, next) => {
  const sessionCookie = ctx.cookies.get('session');

  if (sessionCookie) {
    let sessionStorageKey = `session-${ sessionCookie }`;
    let sessionData = await kvStore.read(sessionStorageKey);

    if (sessionData) {
      try {
        ctx.state.oauth = await JSON.parse(sessionData);
      } catch (err) {
        console.error(err);
        await kvStore.remove(sessionStorageKey)
      }
    }

    if (!ctx.state.oauth) {
      ctx.cookies.set('session', null);
    }
  }

  await next();
});

app.use(bodyParser());

app.use(async (ctx, next) => {
  if (ctx.request.path.startsWith('/api/')) {
    ctx.request.jsonBody
    await handleAPIRequest(ctx);
  } else {
    ctx.throw(404, 'Unsupported path');
  }

  await next();
});

const { key, cert } = CERTIFICATE;
const serverOptions = { cert, key };

https.createServer(serverOptions, app.callback())
  .once('listening', () => console.log('API server listening'))
  .listen(10443)
