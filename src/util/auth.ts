import * as Koa from "koa";
import * as jwt from "koa-jwt";
import * as Router from "koa-router";
import { IUser, User } from "../schemas/user";

export const auth = () => {
  return jwt({ secret: String(process.env.PUBLIC_KEY) });
};

export const parseToken = () => {
  return async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const user: IUser = ctx.state.user;
    if (user == null) {
      ctx.throw("Utente non autenticato", 401);
    }
    const id = user._id;
    const userDb = await User.findById(id).exec();
    ctx.state.user = userDb;
    const token: string = ctx.request.header.authorization.replace(
      "Bearer ",
      ""
    );
    ctx.state.token = token;
    await next();
  };
};

export const admin = () => {
  return async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const user: IUser = ctx.state.user;
    if (user == null || user.isUser()) {
      ctx.throw("Utente non autorizzato all'operazione richiesta", 403);
    }
    await next();
  };
};

export const superAdmin = () => {
  return async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const user: IUser = ctx.state.user;
    if (user == null || !user.isSuperAdmin()) {
      ctx.throw("Utente non autorizzato all'operazione richiesta", 403);
    }
    await next();
  };
};
