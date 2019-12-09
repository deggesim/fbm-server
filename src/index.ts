import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as jwt from 'koa-jwt';
import * as logger from 'koa-logger';
import * as Router from 'koa-router';
import './db/mongoose';
import leagueRouter from './routers/league';
import playerRouter from './routers/player';
import userRouter from './routers/user';
import User, { IUser } from './schemas/user';

const app: Koa = new Koa();
const router: Router = new Router();

// tslint:disable-next-line: no-var-requires
const cors = require('@koa/cors');
app.use(cors());

app.use(logger());
app.use(bodyParser());

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
        const user = await User.findByCredentials(ctx.request.body.email, ctx.request.body.password);
        const token = await user.generateAuthToken();
        user.tokens = user.tokens.concat(token);
        ctx.body = { user, token };
    } catch (error) {
        ctx.throw(401, error.message);
    }
});
app.use(freeRouter.routes());

// Middleware below this line is only reached if JWT token is valid
app.use(jwt({ secret: String(process.env.PUBLIC_KEY) }));

// memorizzo i dati del token nella request
app.use(async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const token = ctx.request.header.authorization.replace('Bearer ', '');
    const id = ctx.state.user.id;
    const user = await User.findById(id);
    ctx.state.user = user;
    ctx.state.token = token;
    await next();
});

app.use(userRouter.routes());
app.use(leagueRouter.routes());
app.use(playerRouter.routes());
app.use(router.allowedMethods());
console.log(`Started listening on port ${process.env.PORT}...`);
app.listen(process.env.PORT || 5000);
