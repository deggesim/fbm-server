import * as Koa from "koa";
import * as Router from "koa-router";
import {
  FantasyRosterHistory,
  IFantasyRosterHistory,
} from "../schemas/fantasy-roster-history";
import { auth, parseToken } from "../util/auth";
import { tenant } from "../util/tenant";

const fantasyRosterHistoryRouter: Router = new Router<IFantasyRosterHistory>();

fantasyRosterHistoryRouter.get(
  "/fantasy-rosters-history/fantasy-team/:id",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const fantasyRosterHistory: IFantasyRosterHistory[] =
        await FantasyRosterHistory.find({
          league: ctx.get("league"),
          fantasyTeam: ctx.params.id,
        });
      for (const frh of fantasyRosterHistory) {
        await frh.populate("fantasyTeam").execPopulate();
        await frh.populate("realFixture").execPopulate();
      }
      ctx.body = fantasyRosterHistory;
    } catch (error) {
      console.log(error);
      ctx.throw(500, error.message);
    }
  }
);

export default fantasyRosterHistoryRouter;
