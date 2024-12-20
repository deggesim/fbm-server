import * as Koa from "koa";
import * as Router from "koa-router";
import {
  IPushSubscription,
  PushSubscription,
} from "../schemas/push-subscription";
import { IUser } from "../schemas/user";
import { auth, parseToken } from "../util/auth";

const pushSbscription: Router = new Router<IPushSubscription>();

pushSbscription.post(
  "/push-subscription",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const newPushSubscription: IPushSubscription = ctx.request
      .body as IPushSubscription;
    const user: IUser = ctx.state.user;
    const leagues = user.leagues;
    for (const league of leagues) {
      newPushSubscription.email = user.email;
      newPushSubscription.league = league;
      ctx.body = await PushSubscription.create(newPushSubscription);
    }
  }
);

export default pushSbscription;
