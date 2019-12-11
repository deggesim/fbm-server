import * as Router from 'koa-router';
import User, { IUser } from '../schemas/user';

const userRouter: Router = new Router<IUser>();

userRouter.get('/users', async (ctx: Router.IRouterContext) => {
    const users = await User.find();
    ctx.body = users;
});

userRouter.get('/users/me', async (ctx: Router.IRouterContext) => {
    const id = ctx.state.user._id;
    const user: IUser = await User.findById(id) as IUser;
    await user.populate('leagues').execPopulate();
    const token = await user.generateAuthToken();
    user.tokens = user.tokens.concat(token);
    ctx.body = { user, token };
});

userRouter.post('/users/logout', async (ctx: Router.IRouterContext) => {
    const id = ctx.state.user._id;
    const token = ctx.state.token;
    console.log('id', id);
    console.log('token', token);
    const user: IUser = await User.findById(id) as IUser;
    console.log('user.tokens BEFORE', user.tokens);
    user.tokens = user.tokens.filter((userToken: string) => userToken !== token);
    console.log('user.tokens AFTER', user.tokens);
    await user.save();
    ctx.body = null;
});

userRouter.patch('/users/me', async (ctx: Router.IRouterContext) => {
    try {
        const updates = Object.keys(ctx.request.body);
        updates.forEach((update) => ctx.state.user[update] = ctx.request.body[update]);
        await ctx.state.user.save();
        ctx.body = ctx.state.user;
    } catch (error) {
        console.log(error.message);
        ctx.throw(400, error.message);
    }
});

export default userRouter;
