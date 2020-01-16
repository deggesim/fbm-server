import * as Router from 'koa-router';
import { IUser, User } from '../schemas/user';
import { parseCsv } from '../util/parse';

const userRouter: Router = new Router<IUser>();

userRouter.get('/users', async (ctx: Router.IRouterContext) => {
    try {
        ctx.body = await User.find();
    } catch (error) {
        ctx.throw(500, error.message);
    }
});

userRouter.get('/users/me', async (ctx: Router.IRouterContext) => {
    try {
        const id = ctx.state.user._id;
        const user: IUser = await User.findById(id) as IUser;
        if (user == null) {
            ctx.throw(400, 'Utente non trovato');
        }
        await user.populate('leagues').execPopulate();
        await user.populate('fantasyTeams').execPopulate();
        const token = await user.generateAuthToken();
        user.tokens = user.tokens.concat(token);
        ctx.body = { user, token };
    } catch (error) {
        ctx.throw(500, error.message);
    }
});

userRouter.post('/users/logout', async (ctx: Router.IRouterContext) => {
    try {
        const id = ctx.state.user._id;
        const token = ctx.state.token;
        const user: IUser = await User.findById(id) as IUser;
        if (user == null) {
            ctx.throw(400, 'Utente non trovato');
        }
        user.tokens = user.tokens.filter((userToken: string) => userToken !== token);
        await user.save();
        ctx.body = null;
    } catch (error) {
        ctx.throw(500, error.message);
    }

});

// tslint:disable-next-line: no-var-requires
const multer = require('@koa/multer');
const upload = multer({
    storage: multer.memoryStorage(),
});
userRouter.post('/users/upload', upload.single('users'), async (ctx: Router.IRouterContext) => {
    try {
        const users = parseCsv(ctx.request.body.users.toString(), ['name', 'email', 'password', 'role']);
        const ret: IUser[] = [];
        for (const user of users) {
            const userSaved: IUser = await User.create(user);
            ret.push(userSaved);
        }
        ctx.body = ret;
    } catch (error) {
        console.log(error);
        ctx.throw(400, error.message);
    }
});

userRouter.patch('/users/me', async (ctx: Router.IRouterContext) => {
    try {
        const updatedUser = ctx.request.body;
        console.log('updatedUser', updatedUser);
        const userToUpdate = await User.findById(updatedUser._id) as IUser;
        if (!userToUpdate) {
            ctx.throw(404, 'Utente non trovato');
        }
        userToUpdate.set(updatedUser);
        await userToUpdate.save();
        await userToUpdate.populate('leagues').execPopulate();
        await userToUpdate.populate('fantasyTeams').execPopulate();
        ctx.body = userToUpdate;
    } catch (error) {
        console.log(error);
        ctx.throw(400, error.message);
    }
});

userRouter.patch('/users/:id', async (ctx: Router.IRouterContext) => {
    try {
        const updatedUser = ctx.request.body;
        console.log('updatedUser', updatedUser);
        const userToUpdate = await User.findById(ctx.params.id) as IUser;
        if (!userToUpdate) {
            ctx.throw(404, 'Utente non trovato');
        }
        if (updatedUser.password == null) {
            delete updatedUser.password;
        }
        userToUpdate.set(updatedUser);
        console.log('userToUpdate', userToUpdate);
        await userToUpdate.save();
        await userToUpdate.populate('leagues').execPopulate();
        await userToUpdate.populate('fantasyTeams').execPopulate();
        ctx.body = userToUpdate;
    } catch (error) {
        console.log(error);
        ctx.throw(400, error.message);
    }
});

userRouter.delete('/users/:id', async (ctx: Router.IRouterContext) => {
    try {
        const user = await User.findOneAndDelete({ _id: ctx.params.id }) as IUser;
        console.log(user);
        if (user == null) {
            ctx.status = 404;
        }
        ctx.body = user;
    } catch (error) {
        ctx.throw(500, error.message);
    }
});

export default userRouter;
