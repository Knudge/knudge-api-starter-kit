import proxy from 'koa-proxies';

import devCertificateFor from './web-dev-server/dev-certificates-for.mjs';

const hostname = 'knudge-api-starter-kit.local'

const urlAPI = new URL(`https://${ hostname }:10443`);
const urlWeb = new URL(`https://${ hostname }:9443`);

const certificate = await devCertificateFor(hostname);

export default /** @type {import('@web/dev-server').DevServerConfig} */ ({
  // Routing
  hostname,
  port: +urlWeb.port,

  // HTTP/2 (forces https) and SSL
  http2: true,
  sslCert: certificate.certPath,
  sslKey: certificate.keyPath,

  open: '/',
  watch: true,

  // Resolve bare module imports
  nodeResolve: {
    exportConditions: ['browser', 'development'],
  },

  middleware: [
    proxy('/api', {
      target: urlAPI.toString()
    })
  ],

  // Compile JS for older browsers. Requires @web/dev-server-esbuild plugin
  // esbuildTarget: 'auto'

  // Enables SPA routing
  appIndex: './index.html',

  // See documentation for all available options
});
