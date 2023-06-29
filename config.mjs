import devCertificateFor from './dev-certificates-for.mjs';

// DEFINITIONS /////////////////////////////////////////////////////////////////

export const CERTIFICATE = await getCertificate();

export const HOSTNAME = getHostname();

export const KNUDGE_ORIGIN = getKnudgeOrigin();

export const URL_API = getURLAPI();

export const URL_WEB = getURLWeb();


// GETTERS /////////////////////////////////////////////////////////////////////

async function getCertificate() {
  return await devCertificateFor(getHostname());
}

function getHostname() {
  return 'knudge-api-starter-kit.local';
}

function getKnudgeOrigin() {
  return 'https://app.knudge.com';
}

function getURLAPI() {
  return new URL(`https://${ getHostname() }:10443`)
}

function getURLWeb() {
  return new URL(`https://${ getHostname() }:9443`);
}