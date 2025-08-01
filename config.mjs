import 'dotenv/config'
import devCertificateFor from './dev-certificates-for.mjs';

// DEFINITIONS /////////////////////////////////////////////////////////////////

export const APP_NAME_SUFFIX = await getAppNameSuffix();

export const CERTIFICATE = await getCertificate();

export const HOSTNAME = getHostname();

export const IS_TEST = getIsTest();

export const KNUDGE_CLIENT_ID = getKnudgeClientID();

export const KNUDGE_ORIGIN = getKnudgeOrigin();

export const KNUDGE_ORIGIN_API = getKnudgeOriginAPI();

export const KNUDGE_SECRET = getKnudgeSecret();

export const ORIGIN_API = getOriginAPI();

export const ORIGIN_WEB = getOriginWeb();

export const PORT_API = getPortAPI();

export const PORT_WEB = getPortWeb();

export const URL_API = getURLAPI();

export const URL_WEB = getURLWeb();

if (!getPortAPI()) {
  console.warn(new Error(
    `.env file likely did not load correctly, please copy .env.example`
  ));
}

// GETTERS /////////////////////////////////////////////////////////////////////

function getAppNameSuffix() {
  return process.env.APP_NAME_SUFFIX ?? '';
}

async function getCertificate() {
  return await devCertificateFor(getHostname(), {
    getCaPath: true
  });
}

function getHostname() {
  return 'knudge-api-starter-kit.local';
}

function getIsTest() {
  return process.env.IS_TEST ?? false;
}

function getKnudgeClientID() {
  return process.env.KNUDGE_CLIENT_ID;
}

function getKnudgeOrigin() {
  return process.env.KNUDGE_ORIGIN;
}

function getKnudgeOriginAPI() {
  return process.env.KNUDGE_ORIGIN_API;
}

function getKnudgeSecret() {
  return process.env.KNUDGE_SECRET;
}

function getOriginAPI() {
  return `https://${ getHostname() }:${ getPortAPI() }`;
}

function getOriginWeb() {
  return `https://${ getHostname() }:${ getPortWeb() }`;
}

function getPortAPI() {
  return process.env.PORT_API;
}

function getPortWeb() {
  return process.env.PORT_WEB;
}

function getURLAPI() {
  return new URL(`${ getOriginAPI() }/api`)
}

function getURLWeb() {
  return new URL(`${ getOriginWeb() }`);
}
