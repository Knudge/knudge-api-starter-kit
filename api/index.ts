import Koa from 'koa';
import https from 'node:https';
import handleAPIRequest from './handle-api-request.js';
import devCertificateFor from '../dev-certificates-for.mjs';

const app = new Koa(); 

app.use(async (ctx) => {
  if (ctx.request.path.startsWith('/api/')) {
    await handleAPIRequest(ctx);
  } else {
    ctx.throw(404, 'Unsupported path');
  }
});

const { key, cert } = await devCertificateFor();

const options = {
  key: await fs.readFile(),
  cert: 
};

https.createServer(options, app.callback()).listen(10443);
