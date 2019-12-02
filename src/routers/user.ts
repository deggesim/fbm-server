import * as Router from 'koa-router';
import User, { IUser } from '../schemas/user';

const userRouter: Router = new Router<IUser>();

userRouter.post('/users', async (ctx: Router.IRouterContext) => {
    const newUser: IUser = ctx.request.body;
    console.log('newUser', newUser);
    const user = await User.create(newUser);
    console.log('user', user);
    ctx.body = user;
});

userRouter.post('/users/login', async (ctx: Router.IRouterContext) => {
    const user = await User.findByCredentials(ctx.request.body.email, ctx.request.body.password);
    const token = await user.generateAuthToken();
    user.tokens = user.tokens.concat(token);
    ctx.body = user;
});

userRouter.get('/users', async (ctx: Router.IRouterContext) => {
    const users = User.find();
    ctx.body = users;
});

export default userRouter;
