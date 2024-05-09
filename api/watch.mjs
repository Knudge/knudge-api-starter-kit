import { fork } from 'node:child_process';
import process from 'node:process';
import path from 'node:path';

import chokidar from 'chokidar';
import debounce from 'lodash.debounce';

import { CERTIFICATE } from '../config.mjs';

const cwd = process.cwd();

void async function startWatch() {
  const reloadAll = getReloadAll();

  chokidar
    .watch(path.join(cwd, 'api'), { ignoreInitial: true, ignored: [
      /node_modules/,
      /ui-testing/
    ] })
    .on('all', reloadAll)
    .on('ready', reloadAll)
    .on('error', exit);
}();

function createAppProcess(appProcess) {
  const msg = appProcess ? 'restarted' : 'started';

  appProcess = fork('./api/index.mjs', {
    env: {
      ...process.env,
      NODE_EXTRA_CA_CERTS: CERTIFICATE.caPath
    },
    stdio: 'inherit'
  })
    .on('error', onAppProcessError)
    .on('exit', onAppProcessExit);

  console.log(`API server ${ msg } (${ appProcess.pid })`);

  return appProcess;
}

function exit(err) {
  console.error(err);
  process.exit(1);
}

async function killAppProcess(appProcess) {
  if (!appProcess?.connected) {
    return;
  }

  return await new Promise(resolve => {
    appProcess.on('exit', resolve);
    appProcess.kill();
  });
}

function getReloadAll() {
  let appProcess;

  return debounce(async (action, filepath) => {
    if (filepath) {
      console.log('API server', action, filepath);
    } else {
      console.log(`API server watch started`);
    }

    await killAppProcess(appProcess);
    appProcess = createAppProcess(appProcess);
  }, 500, { maxWait: 1_000, leading: false, trailing: true });
}

function onAppProcessError() {
  console.log(`API server stopped due to an error`);
  console.log('making changes in the cod will cause a restart attempt');
}

function onAppProcessExit() {
  console.log(`API server stopped`);
}

process.on('unhandledRejection', err => {
  console.error(err);
});