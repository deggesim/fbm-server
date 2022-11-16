import * as Koa from "koa";
import * as Router from "koa-router";
import { Competition, ICompetition } from "../schemas/competition";
import { auth, parseToken } from "../util/auth";
import { tenant } from "../util/tenant";

const competitionRouter: Router = new Router<ICompetition>();

competitionRouter.get(
  "/competitions",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    ctx.body = await Competition.find({ league: ctx.get("league") }).exec();
  }
);

export default competitionRouter;
