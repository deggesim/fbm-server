import * as Koa from 'koa';
import * as Router from 'koa-router';
import { ILeague, League } from '../schemas/league';

const leagueRouter: Router = new Router<ILeague>();

leagueRouter.get('/leagues', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        ctx.body = await League.find();
    } catch (error) {
        ctx.throw(500, error.message);
    }
});

leagueRouter.get('/leagues/:id', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league = await League.findById(ctx.params.id);
        if (league == null) {
            ctx.throw(400, 'Lega non trovata');
        }
        ctx.body = league;
    } catch (error) {
        ctx.throw(500, error.message);
    }
});

leagueRouter.post('/leagues', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const newLeague: ILeague = ctx.request.body;
        ctx.body = await League.create(newLeague);
    } catch (error) {
        ctx.throw(400, error.message);
    }
});

leagueRouter.post('/leagues/:id/populate', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league = await League.findById(ctx.params.id) as ILeague;
        if (league == null) {
            ctx.throw(404, 'Lega non trovata');
        }
        ctx.body = await league.populateLeague();
    } catch (error) {
        ctx.throw(400, error.message);
    }
});

leagueRouter.post('/leagues/:id/parameters', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league = await League.findById(ctx.params.id) as ILeague;
        if (league == null) {
            ctx.throw(404, 'Lega non trovata');
        }
        ctx.body = await league.setParameters(ctx.request.body);
    } catch (error) {
        ctx.throw(400, error.message);
    }
});

leagueRouter.patch('/leagues/:id', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const updatedLeague: ILeague = ctx.request.body;
        const leagueToUpdate = await League.findById(ctx.params.id) as ILeague;
        if (!leagueToUpdate) {
            ctx.throw(404, 'Lega non trovata');
        }
        leagueToUpdate.set(updatedLeague);
        ctx.body = await leagueToUpdate.save();
    } catch (error) {
        ctx.throw(400, error.message);
    }
});

leagueRouter.delete('/leagues/:id', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league = await League.findOneAndDelete({ _id: ctx.params.id}) as ILeague;
        if (league == null) {
            ctx.throw(404, 'Lega non trovata');
        }
        ctx.body = league;
    } catch (error) {
        ctx.throw(500, error.message);
    }
});

export default leagueRouter;
