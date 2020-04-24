
import * as Koa from 'koa';
import * as Router from 'koa-router';
import { Fixture, IFixture } from '../schemas/fixture';
import { ILeague, League } from '../schemas/league';
import { admin, auth, parseToken } from '../util/auth';
import { tenant } from '../util/tenant';

const fixtureRouter: Router = new Router<IFixture>();

fixtureRouter.get('/fixtures', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        ctx.body = await Fixture.find({ league: ctx.get('league') });
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

fixtureRouter.get('/fixtures/:id', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const fixture = await Fixture.findOne({ _id: ctx.params.id, league: ctx.get('league') });
        if (fixture == null) {
            ctx.throw(404, 'Giornata non trovata');
        }
        ctx.body = fixture;
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

fixtureRouter.post('/fixtures', auth(), parseToken(), tenant(), admin(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const newFixture: IFixture = ctx.request.body;
        const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
        newFixture.league = league._id;
        ctx.body = await Fixture.create(newFixture);
        ctx.status = 201;
    } catch (error) {
        console.log(error);
        ctx.throw(400, error.message);
    }
});

fixtureRouter.patch('/fixtures/:id', auth(), parseToken(), tenant(), admin(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const updatedFixture: IFixture = ctx.request.body;
        const fixtureToUpdate: IFixture = await Fixture.findOne({ _id: ctx.params.id, league: ctx.get('league') }) as IFixture;
        if (fixtureToUpdate == null) {
            ctx.throw(404, 'Giornata non trovata');
        }
        fixtureToUpdate.set(updatedFixture);
        ctx.body = await fixtureToUpdate.save();
    } catch (error) {
        console.log(error);
        ctx.throw(400, error.message);
    }
});

fixtureRouter.delete('/fixtures/:id', auth(), parseToken(), tenant(), admin(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const fixture = await Fixture.findOneAndDelete({ _id: ctx.params.id, league: ctx.get('league') }) as IFixture;
        console.log(fixture);
        if (fixture == null) {
            ctx.status = 404;
        }
        ctx.body = fixture;
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

export default fixtureRouter;
