import 'dotenv/config'
import devCertificateFor from './dev-certificates-for.mjs';

// DEFINITIONS /////////////////////////////////////////////////////////////////

export const CERTIFICATE = await getCertificate();

export const HOSTNAME = getHostname();

export const KNUDGE_CLIENT_ID = getKnudgeClientID();

export const KNUDGE_ORIGIN = getKnudgeOrigin();

export const KNUDGE_SECRET = getKnudgeSecret();

export const URL_API = getURLAPI();

export const URL_WEB = getURLWeb();


// GETTERS /////////////////////////////////////////////////////////////////////

async function getCertificate() {
  return await devCertificateFor(getHostname(), {
    getCaPath: true
  });
}

function getHostname() {
  return 'knudge-api-starter-kit.local';
}

function getKnudgeClientID() {
  return process.env.KNUDGE_CLIENT_ID;
}

function getKnudgeOrigin() {
  return process.env.KNUDGE_ORIGIN;
}

function getKnudgeSecret() {
  return process.env.KNUDGE_SECRET;
}

function getURLAPI() {
  return new URL(`https://${ getHostname() }:10443/api`)
}

function getURLWeb() {
  return new URL(`https://${ getHostname() }:9443`);
}