import joi from 'joi';

import routes from './routes/routes.mjs'

export default async function handleAPIRequest(ctx) {
  const routeMethods = routes[ctx.request.path];

  if (!routeMethods) {
    return ctx.throw(404, 'Unknown route');
  }

  const route = routeMethods[ctx.request.method];

  if (!route) {
    return ctx.throw(405)
  }

  if (!route.public && !ctx.state.oauth) {
    return ctx.throw(401, 'Login required');
  }

  if (route.bodySchema) {
    joi.attempt(ctx.body, route.bodySchema, { stripUnknown: true });
  }

  ctx.set('content-type', 'application/json');

  await route.handle(ctx);
}