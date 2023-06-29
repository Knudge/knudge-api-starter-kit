import Koa from 'koa';
import https from 'node:https';
import handleAPIRequest from './handle-api-request.mjs';
import devCertificateFor from '../dev-certificates-for.mjs';

import {
  CERTIFICATE
} from '../config.mjs';

const app = new Koa(); 

app.use(async ctx => {
  const sessionCookie = ctx.cookies.get('session');

  if (sessionCookie) {
    const oauth = await kvStore.read(`session-${ sessionCookie }`)

    if (oauth) {
      ctx.state.oauth = oauth;
    } else {
      ctx.cookies.set('session', null);
    }
  }
});

app.use(async ctx => {
  if (ctx.request.path.startsWith('/api/')) {
    await handleAPIRequest(ctx);
  } else {
    ctx.throw(404, 'Unsupported path');
  }
});

const { key, cert } = CERTIFICATE;

const serverOptions = { cert, key };

https.createServer(serverOptions, app.callback()).listen(10443);
