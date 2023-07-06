import devcert from 'devcert';
import fs from 'node:fs/promises';

export default async function devCertificateFor(domains, {
  getCaPath,
  prefix = './certs',
  name = 'tls'
}={}) {
  let { key, cert, ...etc } = await devcert.certificateFor(domains, {
    getCaPath
  });

  let certPath = `${ prefix }/${ name }.cert`;
  let keyPath = `${ prefix }/${ name }.key`;

  try {
    await fs.mkdir(prefix);
  } catch {}

  await Promise.all([
    fs.writeFile(certPath, cert),
    fs.writeFile(keyPath, key)
  ]);

  return { cert, certPath, key, keyPath, ...etc };
}