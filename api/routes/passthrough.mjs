import { KNUDGE_ORIGIN } from '../../config.mjs'

export default async function passthrough(ctx) {
  let prefix = '/api/passthrough/';

  if (!ctx.request.path.startsWith(prefix)) {
    return false;
  }

  let knudgeAPIPath = ctx.request.path.substring(prefix.length);

  if (!knudgeAPIPath) {
    return ctx.throw(400, 'Empty passthrough path');
  }

  let { oauth } = ctx.state;

  if (!oauth) {
    return ctx.throw(401, 'OAuth authorization not completed')
  }

  let url = `${ KNUDGE_ORIGIN }/xn--0ci/${ knudgeAPIPath }`

  await fetch(url, {
    headers: {
      'authorization': `bearer ${ oauth.access_token }`,
      'accept': ctx.headers.accept,
      'content-type': ctx.headers['content-type']
    },
    body: ctx.request.body,
    method: ctx.request.method
  })
}
