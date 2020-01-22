import * as Koa from 'koa';
import * as Router from 'koa-router';
import { FantasyRoster, IFantasyRoster } from '../schemas/fantasy-roster';
import { ILeague, League } from '../schemas/league';
import { IRealFixture } from '../schemas/real-fixture';
import { tenant } from '../util/tenant';

const fantasyRosterRouter: Router = new Router<IFantasyRoster>();

fantasyRosterRouter.post('/fantasy-rosters', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
        const newFantasyRoster: IFantasyRoster = ctx.request.body;
        newFantasyRoster.league = league._id;
        const nextRealFixture: IRealFixture = await league.nextRealFixture();
        newFantasyRoster.realFixture = nextRealFixture._id;
        const fantasyRoster = await FantasyRoster.create(newFantasyRoster);
        await fantasyRoster.populate('roster').execPopulate();
        await fantasyRoster.populate('fantasyTeam').execPopulate();
        await fantasyRoster.populate('realFixture').execPopulate();
        ctx.body = fantasyRoster;
        ctx.status = 201;
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

fantasyRosterRouter.get('/fantasy-rosters/fantasy-team/:id', tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const fantasyRosters: IFantasyRoster[] = await FantasyRoster.find({ fantasyTeam: ctx.params.id, league: ctx.get('league') });
        for (const fantasyRoster of fantasyRosters) {
            await fantasyRoster.populate('roster').execPopulate();
            await fantasyRoster.populate('roster.player').execPopulate();
            await fantasyRoster.populate('fantasyTeam').execPopulate();
            await fantasyRoster.populate('realFixture').execPopulate();
        }
        ctx.body = fantasyRosters;
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

fantasyRosterRouter.get('/fantasy-rosters/:id', tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const fantasyRoster: IFantasyRoster = await FantasyRoster.findOne({ _id: ctx.params.id, league: ctx.get('league') }) as IFantasyRoster;
        if (fantasyRoster == null) {
            ctx.throw(404, 'Giocatore non trovato');
        }
        await fantasyRoster.populate('roster').execPopulate();
        await fantasyRoster.populate('fantasyTeam').execPopulate();
        await fantasyRoster.populate('realFixture').execPopulate();
        ctx.body = fantasyRoster;
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

fantasyRosterRouter.patch('/fantasy-rosters/:id', tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const updatedFantasyRoster: IFantasyRoster = ctx.request.body;
        const fantasyRosterToUpdate = await FantasyRoster.findOne({ _id: ctx.params.id, league: ctx.get('league') }) as IFantasyRoster;
        if (fantasyRosterToUpdate == null) {
            ctx.throw(404, 'Giocatore non trovato');
        }
        fantasyRosterToUpdate.set(updatedFantasyRoster);
        const fantasyRoster = await fantasyRosterToUpdate.save();
        await fantasyRoster.populate('roster').execPopulate();
        await fantasyRoster.populate('fantasyTeam').execPopulate();
        await fantasyRoster.populate('realFixture').execPopulate();
        ctx.body = fantasyRoster;
    } catch (error) {
        console.log(error);
        ctx.throw(400, error.message);
    }
});

fantasyRosterRouter.delete('/fantasy-rosters/:id', tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const fantasyRoster = await FantasyRoster.findOneAndDelete({ _id: ctx.params.id, league: ctx.get('league') }) as IFantasyRoster;
        if (fantasyRoster == null) {
            ctx.status = 404;
        }
        ctx.body = fantasyRoster;
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

fantasyRosterRouter.delete('/fantasy-rosters/:id/release', tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const fantasyRoster = await FantasyRoster.findOneAndDelete({ _id: ctx.params.id, league: ctx.get('league') }) as IFantasyRoster;
        if (fantasyRoster == null) {
            ctx.status = 404;
        }
        // TODO release
        ctx.body = fantasyRoster;
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

fantasyRosterRouter.delete('/fantasy-rosters/:id/remove', tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const fantasyRoster = await FantasyRoster.findOneAndDelete({ _id: ctx.params.id, league: ctx.get('league') }) as IFantasyRoster;
        if (fantasyRoster == null) {
            ctx.status = 404;
        }
        // TODO remove
        ctx.body = fantasyRoster;
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

export default fantasyRosterRouter;
