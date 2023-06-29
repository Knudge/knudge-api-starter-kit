import Joi from 'joi';
import { Context } from 'koa';

interface Routes {
  [key: string]: RouteMethods
}

interface RouteMethods {
  [key: string]: Route
}

interface Route {
  handle: (ctx: Context) => Promise<void>,
  bodySchema?: Joi.Schema
}