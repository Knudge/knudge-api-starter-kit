import { IS_TEST, KNUDGE_ORIGIN, KNUDGE_ORIGIN_API, KNUDGE_CLIENT_ID, URL_API } from './config.mjs';

export default {
  'process.env.KNUDGE_CLIENT_ID':   JSON.stringify(KNUDGE_CLIENT_ID),
  'process.env.KNUDGE_ORIGIN':      JSON.stringify(KNUDGE_ORIGIN),
  'process.env.KNUDGE_ORIGIN_API':  JSON.stringify(KNUDGE_ORIGIN_API),
  'process.env.URL_API':            JSON.stringify(URL_API),
  'process.env.IS_TEST':            JSON.stringify(IS_TEST),
};
