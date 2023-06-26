import fs from 'node:fs';

export default {
  'process.env.OAUTH_CLIENT_ID':
    loadAsString('./.oauth-client-id'),
  'process.env.OAUTH_CLIENT_SECRET':
    loadAsString('./.oauth-secret')
};

function loadAsString(path) {
  return JSON.stringify(fs.readFileSync(path).toString('utf8'));
}