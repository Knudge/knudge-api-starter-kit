import { KNUDGE_ORIGIN, KNUDGE_CLIENT_ID, URL_API } from './config.mjs';

export default {
  'process.env.KNUDGE_CLIENT_ID': JSON.stringify(KNUDGE_CLIENT_ID),
  'process.env.KNUDGE_ORIGIN':    JSON.stringify(KNUDGE_ORIGIN),
  'process.env.URL_API':          JSON.stringify(URL_API),
};
