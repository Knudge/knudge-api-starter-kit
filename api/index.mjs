import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import https from 'node:https';
import cors from '@koa/cors';
import { WebSocketServer } from 'ws';

import { CERTIFICATE, KNUDGE_ORIGIN_API, URL_WEB } from '../config.mjs';

import * as kvStore from './fs-key-value-store.mjs';
import handleAPIRequest from './handle-api-request.mjs';
import getClient from './get-client.mjs';
import { webSocketManager } from './websocket-manager.mjs';

const app = new Koa();

app.use(cors({
  allowMethods: [
    'DELETE',
    'GET',
    'HEAD',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
    'REPORT'
  ],
  credentials: true,
  exposeHeaders: [
    'server',
    'x-page-last-before',
    'x-page-next-after',
    'x-total-count',
    'x-total-count-threshold',
    'x-content-format',
    'knudge-api-version'
  ],
  origin: URL_WEB.origin
}));

app.use(async (ctx, next) => {
  const sessionCookie = ctx.cookies.get('sesh');

  if (sessionCookie) {
    let sessionStorageKey = `sesh-${ sessionCookie }`;
    let sessionData = await kvStore.read(sessionStorageKey);

    if (sessionData) {
      try {
        sessionData = await JSON.parse(sessionData);
        let expiresAt = new Date(
          (sessionData.created_at + sessionData.expires_in) * 1000
        );
        let nowWithBuffer = new Date();
        nowWithBuffer.setSeconds(nowWithBuffer.getSeconds() + 30);

        if (nowWithBuffer > expiresAt) {
          let { authorizationBase64 } = await getClient(ctx);
          let tokenResult = await fetch(`${ KNUDGE_ORIGIN_API }/v1/oauth/token`, {
            headers: {
              'authorization': `basic ${ authorizationBase64 }`,
              'accept': 'application/json',
              'content-type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: sessionData.refresh_token
            }).toString(),
            method: 'POST'
          });

          try {
            sessionData = await tokenResult.json();
            await kvStore.write(sessionStorageKey, JSON.stringify(sessionData));
          } catch (err) {
            console.error(err);
            await kvStore.remove(sessionStorageKey);
            sessionData = null;
          }
        }

        ctx.state.oauthSession = sessionData;
      } catch (err) {
        console.error(err);
        await kvStore.remove(sessionStorageKey)
      }
    }

    if (!ctx.state.oauthSession) {
      // ctx.cookies.set('sesh', null, {
      //   domain: HOSTNAME,
      //   httpOnly: true,
      //   maxAge: 1000 * 60 * 60 * 24 * 14,
      //   overwrite: true,
      //   sameSite: 'lax',
      //   secure: true
      // });
    }
  }

  await next();
});

app.use(bodyParser());

app.use(async (ctx, next) => {
  console.log(`${ new Date().toLocaleTimeString() } ${ ctx.request.method } ${ ctx.request.path }`);

  if (ctx.request.path.startsWith('/api/')) {
    await handleAPIRequest(ctx);
  } else {
    ctx.throw(404, 'Unsupported path');
  }

  await next();
});

const { key, cert } = CERTIFICATE;
const serverOptions = { cert, key };

const server = https.createServer(serverOptions, app.callback());

// Create WebSocket server
const wss = new WebSocketServer({
  server,
  path: '/ws'
});

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  console.log(`New WebSocket connection from ${req.socket.remoteAddress}`);
  webSocketManager.addClient(ws);
});

wss.on('close', (ws) => {
  console.log('WebSocket connection closed');
  webSocketManager.removeClient(ws);
});

// Handle WebSocket server errors
wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

server
  .once('listening', () => {
    console.log('API server listening on port 10443');
    console.log('WebSocket server available at wss://localhost:10443/ws');
  })
  .listen(10443);
