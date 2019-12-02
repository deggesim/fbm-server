import * as Koa from 'koa';
import * as Router from 'koa-router';
import Role from '../schemas/role';
import { IRoleDocument } from '../schemas/role-document';

const roleRouter: Router = new Router<IRoleDocument>();

roleRouter.get('/roles', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const roles = Role.find();
    ctx.body = roles;
});

roleRouter.post('/roles', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const newRole: IRoleDocument = ctx.request.body;
    console.log('newRole', newRole);
    const role = await Role.create(newRole);
    console.log('role', role);
    ctx.body = role;
});

export default roleRouter;
