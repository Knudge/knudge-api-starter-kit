import fs from 'node:fs/promises';

const TEMP_PATH = './tmp/db';

export async function remove(key: string): Promise<void> {
  await fs.rm(getPath(key));
}

export async function write(key: string, data: string): Promise<void> {
  if (!await fs.stat(TEMP_PATH).then(stat => stat.isDirectory())) {
    await fs.mkdir(TEMP_PATH, { recursive: true });
  }

  await fs.writeFile(getPath(key), data, {
    encoding: 'utf8'
  });
}

export async function read(key: string): Promise<string> {
  return (await fs.readFile(getPath(key))).toString('utf8');
}

function getPath(key: string) {
  return `${ TEMP_PATH }/${ key }`;
}