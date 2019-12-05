import * as Koa from 'koa';
import * as Router from 'koa-router';
import { ILeagueDocument } from '../schemas/documents/league-document';
import League from '../schemas/league';

const leagueRouter: Router = new Router<ILeagueDocument>();

leagueRouter.get('/leagues', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const leagues = League.find();
    ctx.body = leagues;
});

leagueRouter.post('/leagues', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const newLeague: ILeagueDocument = ctx.request.body;
    console.log('newLeague', newLeague);
    const league = await League.create(newLeague);
    console.log('league', league);
    ctx.body = league;
});

export default leagueRouter;
