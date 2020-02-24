import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as logger from 'koa-logger';
import * as Router from 'koa-router';
import './db/mongoose';
import competitionRouter from './routers/competition';
import fantasyRosterRouter from './routers/fantasy-roster';
import fantasyTeamRouter from './routers/fantasy-team';
import leagueRouter from './routers/league';
import matchRouter from './routers/match';
import playerRouter from './routers/player';
import rosterRouter from './routers/roster';
import roundRouter from './routers/round';
import teamRouter from './routers/team';
import userRouter from './routers/user';

const app: Koa = new Koa();
const router: Router = new Router();

// tslint:disable-next-line: no-var-requires
const cors = require('@koa/cors');
app.use(cors());

app.use(logger());
app.use(bodyParser());

app.use(competitionRouter.routes());
app.use(fantasyRosterRouter.routes());
app.use(fantasyTeamRouter.routes());
app.use(leagueRouter.routes());
app.use(playerRouter.routes());
app.use(matchRouter.routes());
app.use(rosterRouter.routes());
app.use(roundRouter.routes());
app.use(teamRouter.routes());
app.use(userRouter.routes());

app.use(router.allowedMethods());
console.log(`Started listening on port ${process.env.PORT}...`);
app.listen(process.env.PORT || 5000);
