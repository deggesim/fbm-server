
import * as Koa from 'koa';
import * as Router from 'koa-router';
import { ILeague, League } from '../schemas/league';
import { IRealFixture, RealFixture } from '../schemas/real-fixture';
import { admin, auth, parseToken } from '../util/auth';
import { tenant } from '../util/tenant';

const realFixtureRouter: Router = new Router<IRealFixture>();

realFixtureRouter.get('/real-fixtures', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const prepared = ctx.request.query.prepared === 'true';
        const conditions: any = { league: ctx.get('league') };
        if (prepared) {
            conditions.prepared = true;
        }
        const realFixtures = await RealFixture.find(conditions).sort({ _id: 1 });
        await RealFixture.populate(realFixtures, [{ path: 'fixtures' }, { path: 'teamsWithNoGame' }]);
        ctx.body = realFixtures;
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

realFixtureRouter.get('/real-fixtures/fixture/:fixtureId', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const realFixture = await RealFixture.findByFixture(ctx.get('league'), ctx.params.fixtureId);
        if (realFixture == null) {
            ctx.throw(404, 'Giornata non trovata');
        }
        ctx.body = realFixture;
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

realFixtureRouter.post('/real-fixtures', auth(), parseToken(), tenant(), admin(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const newRealFixture: IRealFixture = ctx.request.body;
        const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
        newRealFixture.league = league._id;
        ctx.body = await RealFixture.create(newRealFixture);
        ctx.status = 201;
    } catch (error) {
        console.log(error);
        ctx.throw(400, error.message);
    }
});

realFixtureRouter.patch('/real-fixtures/:id', auth(), parseToken(), tenant(), admin(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const updatedRealFixture: IRealFixture = ctx.request.body;
        const realFixtureToUpdate: IRealFixture = await RealFixture.findOne({ _id: ctx.params.id, league: ctx.get('league') }) as IRealFixture;
        if (realFixtureToUpdate == null) {
            ctx.throw(404, 'Giornata non trovata');
        }
        realFixtureToUpdate.set(updatedRealFixture);
        ctx.body = await realFixtureToUpdate.save();
    } catch (error) {
        console.log(error);
        ctx.throw(400, error.message);
    }
});

realFixtureRouter.delete('/real-fixtures/:id', auth(), parseToken(), tenant(), admin(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const realFixture = await RealFixture.findOneAndDelete({ _id: ctx.params.id, league: ctx.get('league') }) as IRealFixture;
        console.log(realFixture);
        if (realFixture == null) {
            ctx.status = 404;
        }
        ctx.body = realFixture;
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

export default realFixtureRouter;
