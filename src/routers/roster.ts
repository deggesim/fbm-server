import * as Koa from 'koa';
import * as Router from 'koa-router';
import { ILeague, League } from '../schemas/league';
import { IRealFixture } from '../schemas/real-fixture';
import { IRoster, Roster } from '../schemas/roster';
import { auth, parseToken } from '../util/auth';
import { tenant } from '../util/tenant';

const rosterRouter: Router = new Router<IRoster>();

rosterRouter.get('/rosters', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
        const nextRealFixture: IRealFixture = await league.nextRealFixture();
        const rosters: IRoster[] = await Roster.find({ league: ctx.get('league'), realFixture: nextRealFixture._id });
        for (const roster of rosters) {
            await roster.populate('player').execPopulate();
            await roster.populate('team').execPopulate();
            await roster.populate('realFixture').execPopulate();
            await roster.populate('fantasyRoster').execPopulate();
        }
        ctx.body = rosters;
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

rosterRouter.get('/rosters/free', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
        const nextRealFixture: IRealFixture = await league.nextRealFixture();
        const rosters: IRoster[] =
            await Roster.find({ league: ctx.get('league'), realFixture: nextRealFixture._id, fantasyRoster: { $exists: false } });
        for (const roster of rosters) {
            await roster.populate('player').execPopulate();
            await roster.populate('team').execPopulate();
            await roster.populate('realFixture').execPopulate();
        }
        ctx.body = rosters;
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

rosterRouter.post('/rosters', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
        const nextRealFixture: IRealFixture = await league.nextRealFixture();
        const newRoster: IRoster = ctx.request.body;
        newRoster.realFixture = nextRealFixture._id;
        newRoster.league = league._id;
        const roster: IRoster = await Roster.create(newRoster);
        await roster.populate('player').execPopulate();
        await roster.populate('team').execPopulate();
        await roster.populate('realFixture').execPopulate();
        await roster.populate('fantasyRoster').execPopulate();
        ctx.body = roster;
        ctx.status = 201;
    } catch (error) {
        console.log(error);
        ctx.throw(400, error.message);
    }
});

rosterRouter.patch('/rosters/:id', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
        const updatedRoster: IRoster = ctx.request.body;
        const rosterToUpdate: IRoster = await Roster.findOne({ _id: ctx.params.id, league: league._id }) as IRoster;
        if (rosterToUpdate == null) {
            ctx.throw(400, 'Giocatore non trovato');
        }
        rosterToUpdate.set(updatedRoster);
        const roster: IRoster = await rosterToUpdate.save();
        await roster.populate('player').execPopulate();
        await roster.populate('team').execPopulate();
        await roster.populate('realFixture').execPopulate();
        await roster.populate('fantasyRoster').execPopulate();
        ctx.body = roster;
    } catch (error) {
        console.log(error);
        ctx.throw(400, error.message);
    }
});

rosterRouter.delete('/rosters/:id', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
        const roster = await Roster.findOneAndDelete({ _id: ctx.params.id, league: league._id }) as IRoster;
        if (roster == null) {
            ctx.status = 404;
        }
        ctx.body = roster;
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }

});

export default rosterRouter;
