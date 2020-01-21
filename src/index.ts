import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as logger from 'koa-logger';
import * as Router from 'koa-router';
import './db/mongoose';
import competitionRouter from './routers/competition';
import fantasyTeamRouter from './routers/fantasy-team';
import freeRouter from './routers/free';
import leagueRouter from './routers/league';
import playerRouter from './routers/player';
import rosterRouter from './routers/roster';
import roundRouter from './routers/round';
import teamRouter from './routers/team';
import userRouter from './routers/user';
import { IUser, User } from './schemas/user';
import { auth } from './util/auth';

const app: Koa = new Koa();
const router: Router = new Router();

// tslint:disable-next-line: no-var-requires
const cors = require('@koa/cors');
app.use(cors());

app.use(logger());
app.use(bodyParser());

app.use(freeRouter.routes());

// Middleware below this line is only reached if JWT token is valid
app.use(auth());

// memorizzo i dati del token nella request
app.use(parseToken());

app.use(competitionRouter.routes());
app.use(fantasyTeamRouter.routes());
app.use(leagueRouter.routes());
app.use(playerRouter.routes());
app.use(rosterRouter.routes());
app.use(teamRouter.routes());
app.use(userRouter.routes());
app.use(roundRouter.routes());
app.use(router.allowedMethods());
console.log(`Started listening on port ${process.env.PORT}...`);
app.listen(process.env.PORT || 5000);

function parseToken() {
    return async (ctx: Router.IRouterContext, next: Koa.Next) => {
        const id = ctx.state.user._id;
        const user: IUser = await User.findById(id) as IUser;
        ctx.state.user = user;
        const token: string = ctx.request.header.authorization.replace('Bearer ', '');
        ctx.state.token = token;
        await next();
    };
}

