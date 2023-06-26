import devcert from 'devcert';
import fs from 'node:fs/promises';

export default async function devCertificateFor(domains, {
  prefix = './certs',
  name = 'tls'
}={}) {
  let { key, cert } = await devcert.certificateFor(domains);

  let certPath = `${ prefix }/${ name }.cert`;
  let keyPath = `${ prefix }/${ name }.key`;

  try {
    await fs.mkdir(prefix);
  } catch (err) {
    console.error(err);
  }

  await Promise.all([
    fs.writeFile(certPath, cert),
    fs.writeFile(keyPath, key)
  ]);

  return { certPath, keyPath };
}