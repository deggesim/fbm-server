import * as Koa from 'koa';
import * as Router from 'koa-router';
import { FantasyTeam } from '../schemas/fantasy-team';
import { ILeague, League } from '../schemas/league';
import { createPlayoff, createPlayout, createRegularSeason, populateCompetition, populateRealFixture, createCup } from '../util/new-season.util';

const leagueRouter: Router = new Router<ILeague>();

leagueRouter.get('/leagues', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const leagues = await League.find();
    ctx.body = leagues;
});

leagueRouter.get('/leagues/:id', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league = await League.findById(ctx.params.id);
    ctx.body = league;
});

leagueRouter.post('/leagues', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const newLeague: ILeague = ctx.request.body;
    const league: ILeague = await League.create(newLeague);
    ctx.body = league;
});

leagueRouter.post('/leagues/:id/populate', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league = await League.findById(ctx.params.id) as ILeague;
    if (!league) {
        ctx.throw(404, 'Lega non trovata');
    }
    await league.populateLeague();
    ctx.body = league;
});

leagueRouter.patch('/leagues/:id', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const updatedLeague: ILeague = ctx.request.body;
    const leagueToUpdate = await League.findById(ctx.params.id) as ILeague;
    if (!leagueToUpdate) {
        ctx.throw(404, 'Lega non trovata');
    }
    leagueToUpdate.set(updatedLeague);
    leagueToUpdate.save();
    ctx.body = leagueToUpdate;
});

export default leagueRouter;
