import * as Koa from 'koa';
import * as jwt from 'koa-jwt';
import * as Router from 'koa-router';
import { IUser, User } from '../schemas/user';

export const auth = () => {
    return jwt({ secret: String(process.env.PUBLIC_KEY) });
};

export const parseToken = () => {
    return async (ctx: Router.IRouterContext, next: Koa.Next) => {
        const user: IUser = ctx.state.user;
        if (user == null) {
            ctx.throw(401, 'Utente non autenticato');
        }
        const id = user._id;
        const userDb: IUser = await User.findById(id) as IUser;
        ctx.state.user = userDb;
        const token: string = ctx.request.header.authorization.replace('Bearer ', '');
        ctx.state.token = token;
        await next();
    };
};

export const admin = () => {
    return async (ctx: Router.IRouterContext, next: Koa.Next) => {
        const user: IUser = ctx.state.user;
        if (user == null || user.isUser()) {
            ctx.throw(403, 'Utente non autorizzato all\'operazione richiesta');
        }
        await next();
    };
};

export const superAdmin = () => {
    return async (ctx: Router.IRouterContext, next: Koa.Next) => {
        const user: IUser = ctx.state.user;
        if (user == null || !user.isSuperAdmin()) {
            ctx.throw(403, 'Utente non autorizzato all\'operazione richiesta');
        }
        await next();
    };
};
