import Router = require("koa-router");
import * as Koa from "koa";
import { auth, parseToken } from "../util/auth";
import { erroreImprevisto } from "../util/globals";
import { PlayerStatistic, statistics } from "../util/statistics";
import { tenant } from "../util/tenant";

const statisticsRouter: Router = new Router<PlayerStatistic>();

statisticsRouter.get(
  "/statistics",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const { page, limit, team, fantasyTeam, role, freePlayers } = ctx.query;
      const playerStatisticList = await statistics(
        ctx.get("league"),
        page,
        limit,
        team,
        fantasyTeam,
        role,
        freePlayers
      );
      ctx.set("X-Total-Count", String(playerStatisticList.total));
      ctx.body = playerStatisticList.playerStatistics;
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        ctx.throw(500, error.message);
      } else {
        ctx.throw(500, erroreImprevisto);
      }
    }
  }
);

export default statisticsRouter;
