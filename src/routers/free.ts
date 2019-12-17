import * as Router from 'koa-router';
import { IUser, User } from '../schemas/user';

const freeRouter: Router = new Router<IUser>();
freeRouter.post('/users', async (ctx: Router.IRouterContext) => {
    try {
        const newUser: IUser = ctx.request.body;
        const user = await User.create(newUser);
        ctx.body = user;
        ctx.status = 201;
    } catch (error) {
        console.log(error);
        ctx.throw(400, 'Impossibile creare un nuovo utente');
    }
});

freeRouter.post('/users/login', async (ctx: Router.IRouterContext) => {
    try {
        const user: IUser = await User.findByCredentials(ctx.request.body.email, ctx.request.body.password);
        await user.populate('leagues').execPopulate();
        const token = await user.generateAuthToken();
        user.tokens = user.tokens.concat(token);
        ctx.body = { user, token };
    } catch (error) {
        ctx.throw(401, error.message);
    }
});

export default freeRouter;
