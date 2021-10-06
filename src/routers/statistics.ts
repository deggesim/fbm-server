import Router = require("koa-router");
import { auth, parseToken } from "../util/auth";
import { PlayerStatistic, statistics } from "../util/statistics";
import { tenant } from "../util/tenant";
import * as Koa from 'koa';

const statisticsRouter: Router = new Router<PlayerStatistic>();

statisticsRouter.get('/statistics', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
  try {
    ctx.body = await statistics(ctx.get('league'))
  } catch (error) {
    console.log(error);
    ctx.throw(500, error.message);
  }
});

export default statisticsRouter;