import fs from 'node:fs';
import { KNUDGE_ORIGIN } from './config.mjs';

export default {
  'process.env.KNUDGE_ORIGIN':       JSON.stringify(KNUDGE_ORIGIN),
  'process.env.OAUTH_CLIENT_ID':     loadAsString('./.oauth-client-id'),
  'process.env.OAUTH_CLIENT_SECRET': loadAsString('./.oauth-secret')
};

function loadAsString(path) {
  return JSON.stringify(fs.readFileSync(path).toString('utf8'));
}