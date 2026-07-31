import joi from 'joi';

import routes from './routes/routes.mjs'
import oauthClientMeta from './routes/oauth-client-meta.mjs';
import passthrough from './routes/passthrough.mjs'
import webhook from './routes/webhook.mjs'

export default async function handleAPIRequest(ctx) {
  const routeMethods = routes[ctx.request.path];

  if (!routeMethods) {
    return (
      (await passthrough(ctx)) ||
      (await webhook(ctx)) ||
      (await oauthClientMeta(ctx)) ||
      ctx.throw(404, 'Unknown route')
    );
  }

  const route = routeMethods[ctx.request.method];

  if (!route) {
    return ctx.throw(405);
  }

  if (!route.public && !ctx.state.oauthSession) {
    return ctx.throw(401, 'Login required');
  }

  if (route.bodySchema) {
    ctx.request.body = joi.attempt(
      ctx.request.body,
      route.bodySchema,
      { stripUnknown: true }
    );
  }

  if (route.searchParamsSchema) {
    // Prefer parsed query over the raw search string.
    joi.attempt(ctx.query, route.searchParamsSchema, { stripUnknown: true });
  }

  ctx.set('content-type', 'application/json');

  await route.handle(ctx);
}
