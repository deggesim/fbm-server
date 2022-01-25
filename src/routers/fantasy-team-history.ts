import * as Koa from "koa";
import * as Router from "koa-router";
import {
  FantasyTeamHistory,
  IFantasyTeamHistory,
} from "../schemas/fantasy-team-history";
import { auth, parseToken } from "../util/auth";
import { tenant } from "../util/tenant";

const fantasyTeamHistoryRouter: Router = new Router<IFantasyTeamHistory>();

fantasyTeamHistoryRouter.get(
  "/fantasy-teams-history/fantasy-team/:id",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const fantasyTeamHistory: IFantasyTeamHistory[] =
        await FantasyTeamHistory.find({
          league: ctx.get("league"),
          fantasyTeam: ctx.params.id,
        });
      for (const frh of fantasyTeamHistory) {
        await frh.populate("fantasyTeam").execPopulate();
        await frh.populate("realFixture").execPopulate();
      }
      ctx.body = fantasyTeamHistory;
    } catch (error) {
      console.log(error);
      ctx.throw(500, error.message);
    }
  }
);

export default fantasyTeamHistoryRouter;
