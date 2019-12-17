import * as Koa from 'koa';
import * as Router from 'koa-router';
import { Competition, ICompetition } from '../schemas/competition';
import { ILeague, League } from '../schemas/league';

const competitionRouter: Router = new Router<ICompetition>();

competitionRouter.get('/competitions', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await League.findById(ctx.query.league) as ILeague;
    const competitions = await Competition.find({ league: league._id });
    ctx.body = competitions;
});

export default competitionRouter;
