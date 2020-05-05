import * as Koa from 'koa';
import * as Router from 'koa-router';
import { ILeague, League } from '../schemas/league';
import { Performance } from '../schemas/performance';
import { IRealFixture, RealFixture } from '../schemas/real-fixture';
import { IRoster, Roster } from '../schemas/roster';
import { admin, auth, parseToken } from '../util/auth';
import { tenant } from '../util/tenant';
import { IPlayer } from '../schemas/player';

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

rosterRouter.post('/rosters', auth(), parseToken(), tenant(), admin(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
        const newRoster: IRoster = ctx.request.body;
        newRoster.league = league._id;
        const rosterRealFixture = (newRoster.realFixture as IRealFixture);
        const realFixtures = await RealFixture.find({ league: league._id }).sort({ id: 1 });
        const indexOfRosterRealFixture = realFixtures.findIndex((rf) => rf._id.equals(rosterRealFixture._id));
        // add roster to all prepared real fixtures
        const preparedRealFixtures = realFixtures.slice(indexOfRosterRealFixture).filter((rf) => rf.prepared);
        const rosters: IRoster[] = [];
        for (const realFixture of preparedRealFixtures) {
            newRoster.realFixture = realFixture;
            const roster: IRoster = await Roster.create(newRoster);
            await roster.populate('player').execPopulate();
            await roster.populate('team').execPopulate();
            await roster.populate('realFixture').execPopulate();
            await roster.populate('fantasyRoster').execPopulate();
            rosters.push(roster);
        }
        // add performances
        const performanceRealFixtures = realFixtures.slice(indexOfRosterRealFixture);
        for (const realFixture of performanceRealFixtures) {
            await Performance.create({
                player: (newRoster.player as IPlayer)._id,
                realFixture: realFixture._id,
                league: league._id,
            });
        }
        ctx.body = rosters;
        ctx.status = 201;
    } catch (error) {
        console.log(error);
        ctx.throw(400, error.message);
    }
});

rosterRouter.patch('/rosters/:id', auth(), parseToken(), tenant(), admin(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
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

rosterRouter.delete('/rosters/:id', auth(), parseToken(), tenant(), admin(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
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
