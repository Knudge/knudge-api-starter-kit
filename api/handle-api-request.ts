import { Context } from 'koa'
import routes from './routes/routes.js'
import joi from 'joi';

export default async function handleAPIRequest(ctx: Context) {
  let routeMethods = routes[ctx.request.path];

  if (!routeMethods) {
    return ctx.throw(404, 'Unknown route');
  }
  
  let route = routeMethods[ctx.request.method];

  if (!route) {
    return ctx.throw(405)
  }

  if (route.bodySchema) {
    joi.attempt(ctx.body, route.bodySchema, { stripUnknown: true });
  }

  return await route.handle(ctx);
}