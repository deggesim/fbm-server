import * as Koa from 'koa';
import * as Router from 'koa-router';
import { IRole } from '../models/role';
import Role from '../schemas/role';

const roleRouter: Router = new Router<IRole>();

roleRouter.get('/roles', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const roles = Role.find();
    ctx.body = roles;
});

roleRouter.post('/roles', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const newRole: IRole = ctx.request.body;
    console.log('newRole', newRole);
    const role = await Role.create(newRole);
    console.log('role', role);
    ctx.body = role;
});

export default roleRouter;
