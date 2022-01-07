import * as Koa from "koa";
import * as bodyParser from "koa-bodyparser";
import * as logger from "koa-logger";
import * as Router from "koa-router";
import "./db/mongoose";
import "./util/push-notification";
import competitionRouter from "./routers/competition";
import fantasyRosterRouter from "./routers/fantasy-roster";
import fantasyTeamRouter from "./routers/fantasy-team";
import fixtureRouter from "./routers/fixture";
import leagueRouter from "./routers/league";
import lineupRouter from "./routers/lineup";
import matchRouter from "./routers/match";
import performanceRouter from "./routers/performance";
import playerRouter from "./routers/player";
import realFixtureRouter from "./routers/real-fixture";
import rosterRouter from "./routers/roster";
import roundRouter from "./routers/round";
import statisticsRouter from "./routers/statistics";
import teamRouter from "./routers/team";
import userRouter from "./routers/user";

const app: Koa = new Koa();
const router: Router = new Router();

const cors = require("@koa/cors");
app.use(cors({ exposeHeaders: "X-Total-Count" }));

app.use(logger());
app.use(bodyParser());

app.use(competitionRouter.routes());
app.use(fantasyRosterRouter.routes());
app.use(fantasyTeamRouter.routes());
app.use(fixtureRouter.routes());
app.use(leagueRouter.routes());
app.use(lineupRouter.routes());
app.use(matchRouter.routes());
app.use(performanceRouter.routes());
app.use(playerRouter.routes());
app.use(realFixtureRouter.routes());
app.use(rosterRouter.routes());
app.use(roundRouter.routes());
app.use(teamRouter.routes());
app.use(userRouter.routes());
app.use(statisticsRouter.routes());

app.use(router.allowedMethods());
const port = process.env.PORT || 5000;
console.log(`Started listening on port ${port}...`);
app.listen(port);
