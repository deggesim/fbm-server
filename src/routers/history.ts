import * as Koa from "koa";
import * as Router from "koa-router";
import { History, IHistory } from "../schemas/history";
import { auth, parseToken } from "../util/auth";
import { tenant } from "../util/tenant";

const historyRouter: Router = new Router<IHistory>();

historyRouter.get(
  "/history/fantasy-team/:id",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const historyList: IHistory[] = await History.find({
      league: ctx.get("league"),
      fantasyTeam: ctx.params.id,
    }).exec();
    for (const history of historyList) {
      await history.populate("fantasyTeam");
      await history.populate("realFixture");
      await history.populate("league");
    }
    ctx.body = historyList;
  }
);

export default historyRouter;
