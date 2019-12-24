import * as Koa from 'koa';
import * as Router from 'koa-router';
import { IUser, User } from '../schemas/user';

export const parseToken = () => {
    return async (ctx: Router.IRouterContext, next: Koa.Next) => {
        const id = ctx.state.user._id;
        const user: IUser = await User.findById(id) as IUser;
        ctx.state.user = user;
        const token: string = ctx.request.header.authorization.replace('Bearer ', '');
        ctx.state.token = token;
        await next();
    };
};
