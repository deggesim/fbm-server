
import * as Koa from 'koa';
import * as Router from 'koa-router';
import { ILeague, League } from '../schemas/league';
import { IPerformance, Performance } from '../schemas/performance';
import { IRoster, Roster } from '../schemas/roster';
import { auth, parseToken } from '../util/auth';
import { tenant } from '../util/tenant';
import { boxscore } from '../util/boxscore';

const performanceRouter: Router = new Router<IPerformance>();

performanceRouter.get('/performances', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        ctx.body = await Performance.find({ league: ctx.get('league') });
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

performanceRouter.get('/performances/:id', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const performance = await Performance.findOne({ _id: ctx.params.id, league: ctx.get('league') });
        if (performance == null) {
            ctx.throw(404, 'Valutazione non trovata');
        }
        ctx.body = performance;
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

performanceRouter.get('/performances/team/:teamId/real-fixture/:realFixtureId', auth(), parseToken(), tenant(),
    async (ctx: Router.IRouterContext, next: Koa.Next) => {
        try {
            const rosters = await Roster.find({ league: ctx.get('league'), team: ctx.params.teamId });
            const playersId = rosters.map((roster: IRoster) => roster.player);
            const performances =
                await Performance.find({ league: ctx.get('league'), realFixture: ctx.params.realFixtureId, player: { $in: playersId } });
            for (const performance of performances) {
                await performance.populate('player').execPopulate();
            }
            ctx.body = performances;
        } catch (error) {
            console.log(error);
            ctx.throw(500, error.message);
        }
    });

performanceRouter.post('/performances', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const newPerformance: IPerformance = ctx.request.body;
        const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
        newPerformance.league = league._id;
        ctx.body = await Performance.create(newPerformance);
        ctx.status = 201;
    } catch (error) {
        console.log(error);
        ctx.throw(400, error.message);
    }
});

performanceRouter.post('/performances/team/:teamId/real-fixture/:realFixtureId', auth(), parseToken(), tenant(),
    async (ctx: Router.IRouterContext, next: Koa.Next) => {
        try {
            const url: string = ctx.request.body.url;
            const rosters = await Roster.find({ league: ctx.get('league'), team: ctx.params.teamId });
            const playersId = rosters.map((roster: IRoster) => roster.player);
            const performances =
            await Performance.find({ league: ctx.get('league'), realFixture: ctx.params.realFixtureId, player: { $in: playersId } });
            boxscore(performances, url);
            for (const performance of performances) {
                await performance.populate('player').execPopulate();
            }
            ctx.body = performances;
        } catch (error) {
            console.log(error);
            ctx.throw(400, error.message);
        }
    });

performanceRouter.patch('/performances/:id', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const updatedPerformance: IPerformance = ctx.request.body;
        const performanceToUpdate: IPerformance = await Performance.findOne({ _id: ctx.params.id, league: ctx.get('league') }) as IPerformance;
        if (performanceToUpdate == null) {
            ctx.throw(404, 'Valutazione non trovata');
        }
        performanceToUpdate.set(updatedPerformance);
        ctx.body = await performanceToUpdate.save();
    } catch (error) {
        console.log(error);
        ctx.throw(400, error.message);
    }
});

performanceRouter.delete('/performances/:id', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const performance = await Performance.findOneAndDelete({ _id: ctx.params.id, league: ctx.get('league') }) as IPerformance;
        console.log(performance);
        if (performance == null) {
            ctx.status = 404;
        }
        ctx.body = performance;
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

export default performanceRouter;
