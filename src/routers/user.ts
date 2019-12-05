import * as Router from 'koa-router';
import User, { IUser } from '../schemas/user';

const userRouter: Router = new Router<IUser>();

userRouter.get('/users', async (ctx: Router.IRouterContext) => {
    const users = User.find();
    ctx.body = users;
});

export default userRouter;
