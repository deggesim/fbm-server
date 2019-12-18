import * as Router from 'koa-router';
import { IUser, User } from '../schemas/user';

const userRouter: Router = new Router<IUser>();

userRouter.get('/users', async (ctx: Router.IRouterContext) => {
    const users = await User.find();
    ctx.body = users;
});

userRouter.get('/users/me', async (ctx: Router.IRouterContext) => {
    const id = ctx.state.user._id;
    const user: IUser = await User.findById(id) as IUser;
    await user.populate('leagues').execPopulate();
    await user.populate('fantasyTeams').execPopulate();
    const token = await user.generateAuthToken();
    user.tokens = user.tokens.concat(token);
    ctx.body = { user, token };
});

userRouter.post('/users/logout', async (ctx: Router.IRouterContext) => {
    const id = ctx.state.user._id;
    const token = ctx.state.token;
    const user: IUser = await User.findById(id) as IUser;
    user.tokens = user.tokens.filter((userToken: string) => userToken !== token);
    await user.save();
    ctx.body = null;
});

userRouter.patch('/users/me', async (ctx: Router.IRouterContext) => {
    try {
        const updates = Object.keys(ctx.request.body);
        const userToUpdate = ctx.state.user;
        updates.forEach((update) => userToUpdate[update] = ctx.request.body[update]);
        await userToUpdate.save();
        await userToUpdate.populate('leagues').execPopulate();
        await userToUpdate.populate('fantasyTeams').execPopulate();
        ctx.body = userToUpdate;
    } catch (error) {
        ctx.throw(400, error.message);
    }
});

export default userRouter;
