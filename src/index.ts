import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as jwt from 'koa-jwt';
import * as logger from 'koa-logger';
import * as Router from 'koa-router';
import './db/mongoose';
import freeRouter from './routers/free';
import leagueRouter from './routers/league';
import playerRouter from './routers/player';
import userRouter from './routers/user';
import User from './schemas/user';

const app: Koa = new Koa();
const router: Router = new Router();

// tslint:disable-next-line: no-var-requires
const cors = require('@koa/cors');
app.use(cors());

app.use(logger());
app.use(bodyParser());

app.use(freeRouter.routes());

// Middleware below this line is only reached if JWT token is valid
app.use(jwt({ secret: String(process.env.PUBLIC_KEY) }));

// memorizzo i dati del token nella request
app.use(async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const token = ctx.request.header.authorization.replace('Bearer ', '');
    const id = ctx.state.user._id;
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
