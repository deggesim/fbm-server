import Router = require("koa-router");
import * as Koa from "koa";
import { auth, parseToken } from "../util/auth";
import { PlayerStatistic, statistics } from "../util/statistics";
import { tenant } from "../util/tenant";

const statisticsRouter: Router = new Router<PlayerStatistic>();

statisticsRouter.get(
  "/statistics",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const { page, limit, team, fantasyTeam, role, freePlayers } = ctx.query;
    const playerStatisticList = await statistics(
      ctx.get("league"),
      +(page as string),
      +(limit as string),
      team as string,
      fantasyTeam as string,
      role as string,
      !!(freePlayers as string)
    );
    ctx.set("X-Total-Count", String(playerStatisticList.total));
    ctx.body = playerStatisticList.playerStatistics;
  }
);

export default statisticsRouter;
