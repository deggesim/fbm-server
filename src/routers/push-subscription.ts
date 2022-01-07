import * as Koa from 'koa';
import * as Router from 'koa-router';
import { PushSubscription, IPushSubscription } from '../schemas/push-subscription';
import { auth, parseToken } from '../util/auth';
import { tenant } from '../util/tenant';

const pushSbscription: Router = new Router<IPushSubscription>();

pushSbscription.post('/push-subscriptiopn', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
  try {
    const newPushSubscription: IPushSubscription = ctx.request.body;
    ctx.body = await PushSubscription.create(newPushSubscription);
  } catch (error) {
    console.log(error);
    ctx.throw(500, error.message);
  }
});

export default pushSbscription;
