import * as Koa from 'koa';
import * as Router from 'koa-router';
import Competition, { ICompetition } from '../schemas/competition';
import { ICompetitionDocument } from '../schemas/documents/competition.document';
import League, { ILeague } from '../schemas/league';
import User, { IUser } from '../schemas/user';

const competitionRouter: Router = new Router<ICompetitionDocument>();

competitionRouter.get('/competitions', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await League.findById(ctx.query.id) as ILeague;
    const competitions = await Competition.find({ league: league._id });
    ctx.body = competitions;
});

export default competitionRouter;
