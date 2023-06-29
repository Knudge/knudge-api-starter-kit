import proxy from 'koa-proxies';

import rollupReplace from '@rollup/plugin-replace'
import { fromRollup } from '@web/dev-server-rollup';

import replacements from './rollup-replacements.mjs';

const replace = fromRollup(rollupReplace);

import {
  CERTIFICATE,
  HOSTNAME,
  URL_API,
  URL_WEB
} from './config.mjs';

export default /** @type {import('@web/dev-server').DevServerConfig} */ ({
  // Routing
  hostname: HOSTNAME,
  port: +URL_WEB.port,

  // HTTP/2 (forces https) and SSL
  http2: true,
  sslCert: CERTIFICATE.certPath,
  sslKey: CERTIFICATE.keyPath,

  watch: true,

  // Resolve bare module imports
  nodeResolve: {
    exportConditions: ['browser', 'development']
  },

  plugins: [
    replace({ preventAssignment: true, values: replacements }),
  ],

  middleware: [
    proxy('/api', {
      target: URL_API.toString()
    })
  ],

  // Compile JS for older browsers. Requires @web/dev-server-esbuild plugin
  // esbuildTarget: 'auto'

  // Enables SPA routing
  appIndex: './index.html',
});
