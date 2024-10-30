import fs from 'node:fs/promises';
import { APP_NAME_SUFFIX } from '../config.mjs';

const DB_PATH = `./.tmp/db${ APP_NAME_SUFFIX && `-${ APP_NAME_SUFFIX }` }`;

export async function remove(key) {
  await fs.rm(getPath(key));
}

export async function write(key, data) {
  await ensureDir(DB_PATH);

  await fs.writeFile(getPath(key), data, {
    encoding: 'utf8'
  });
}

export async function read(key) {
  try {
    return (await fs.readFile(getPath(key))).toString('utf8');
  } catch {
    return null;
  }
}

function getPath(key) {
  return `${ DB_PATH }/${ key }`;
}

async function ensureDir(path) {
  let isDir = false;

  try {
    isDir = await fs.stat(path).then(stat => stat.isDirectory())
  } catch {}

  if (!isDir) {
    await fs.mkdir(path, { recursive: true });
  }
}
