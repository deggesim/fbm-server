import * as Koa from 'koa';
import * as Router from 'koa-router';
import { Competition, ICompetition } from '../schemas/competition';
import { auth, parseToken } from '../util/auth';
import { tenant } from '../util/tenant';

const competitionRouter: Router = new Router<ICompetition>();

competitionRouter.get('/competitions', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
  try {
    ctx.body = await Competition.find({ league: ctx.get('league') }).exec();
  } catch (error) {
    console.log(error);
    if (error instanceof Error) {
      ctx.throw(500, error.message);
    } else {
      ctx.throw(500, 'Si è verificato un errore imprevisto');
    }
  }
});

export default competitionRouter;
