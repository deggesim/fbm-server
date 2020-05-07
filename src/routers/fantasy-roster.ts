import * as Koa from 'koa';
import * as Router from 'koa-router';
import { FantasyRoster, IFantasyRoster } from '../schemas/fantasy-roster';
import { IFantasyTeam } from '../schemas/fantasy-team';
import { ILeague, League } from '../schemas/league';
import { IRealFixture } from '../schemas/real-fixture';
import { Roster } from '../schemas/roster';
import { auth, parseToken } from '../util/auth';
import { halfDownRound } from '../util/functions';
import { tenant } from '../util/tenant';

const fantasyRosterRouter: Router = new Router<IFantasyRoster>();

fantasyRosterRouter.post('/fantasy-rosters', auth(), parseToken(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
        const newFantasyRoster: IFantasyRoster = ctx.request.body;
        newFantasyRoster.league = league._id;
        const nextRealFixture: IRealFixture = await league.nextRealFixture();
        newFantasyRoster.realFixture = nextRealFixture._id;
        const fantasyRoster = await FantasyRoster.create(newFantasyRoster);

        // gestione fantasyTeam
        await buy(fantasyRoster);

        await fantasyRoster.populate('roster').execPopulate();
        await fantasyRoster.populate('realFixture').execPopulate();
        ctx.body = fantasyRoster;
        ctx.status = 201;
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

fantasyRosterRouter.get('/fantasy-rosters/fantasy-team/:id/real-fixture/:realFixtureId', auth(), parseToken(), tenant(),
    async (ctx: Router.IRouterContext, next: Koa.Next) => {
        try {
            const fantasyRosters: IFantasyRoster[] =
                await FantasyRoster.find({ league: ctx.get('league'), fantasyTeam: ctx.params.id, realFixture: ctx.params.realFixtureId });
            for (const fantasyRoster of fantasyRosters) {
                await fantasyRoster.populate('roster').execPopulate();
                await fantasyRoster.populate('roster.player').execPopulate();
                await fantasyRoster.populate('roster.team').execPopulate();
                await fantasyRoster.populate('fantasyTeam').execPopulate();
                await fantasyRoster.populate('realFixture').execPopulate();
            }
            ctx.body = fantasyRosters;
        } catch (error) {
            console.log(error);
            ctx.throw(500, error.message);
        }
    });

fantasyRosterRouter.get('/fantasy-rosters/:id', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
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

fantasyRosterRouter.patch('/fantasy-rosters/:id', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const fantasyRosterToUpdate = await FantasyRoster.findOne({ _id: ctx.params.id, league: ctx.get('league') }) as IFantasyRoster;
        // gestione fantasyTeam
        await remove(fantasyRosterToUpdate);

        const values = ctx.request.body;
        const { fantasyTeam, status, draft, contract, yearContract } = values;
        const updatedFantasyRoster = { fantasyTeam, status, draft, contract, yearContract };
        if (fantasyRosterToUpdate == null) {
            ctx.throw(404, 'Giocatore non trovato');
        }
        fantasyRosterToUpdate.set(updatedFantasyRoster);
        const fantasyRoster = await fantasyRosterToUpdate.save();

        // gestione fantasyTeam
        await buy(fantasyRoster);

        await fantasyRoster.populate('roster').execPopulate();
        await fantasyRoster.populate('fantasyTeam').execPopulate();
        await fantasyRoster.populate('realFixture').execPopulate();
        ctx.body = fantasyRoster;
    } catch (error) {
        console.log(error);
        ctx.throw(400, error.message);
    }
});

fantasyRosterRouter.delete('/fantasy-rosters/:id', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
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

fantasyRosterRouter.delete('/fantasy-rosters/:id/release', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const fantasyRoster = await FantasyRoster.findOneAndDelete({ _id: ctx.params.id, league: ctx.get('league') }) as IFantasyRoster;
        if (fantasyRoster == null) {
            ctx.status = 404;
        }

        // gestione fantasyTeam
        await release(fantasyRoster);

        ctx.body = fantasyRoster;
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

fantasyRosterRouter.delete('/fantasy-rosters/:id/remove', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const fantasyRoster = await FantasyRoster.findOneAndDelete({ _id: ctx.params.id, league: ctx.get('league') }) as IFantasyRoster;
        if (fantasyRoster == null) {
            ctx.status = 404;
        }

        // gestione fantasyTeam
        await remove(fantasyRoster);

        ctx.body = fantasyRoster;
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

async function buy(fantasyRoster: IFantasyRoster) {
    // legame bidirezionale tra roster e fantasyRoster
    await Roster.findByIdAndUpdate(fantasyRoster.roster, { fantasyRoster: fantasyRoster._id });
    // agiornamento dati fantasyTeam
    await fantasyRoster.populate('fantasyTeam').execPopulate();
    const fantasyTeam: IFantasyTeam = fantasyRoster.fantasyTeam as IFantasyTeam;
    if (!fantasyRoster.draft) {
        fantasyTeam.outgo += fantasyRoster.contract;
    }
    if (fantasyRoster.status === 'EXT') {
        fantasyTeam.extraPlayers++;
    }
    fantasyTeam.playersInRoster++;
    fantasyTeam.totalContracts++;
    await fantasyTeam.save();
}

async function release(fantasyRoster: IFantasyRoster) {
    // legame bidirezionale tra roster e fantasyRoster
    await Roster.findByIdAndUpdate(fantasyRoster.roster, { $unset: { fantasyRoster: '' } });
    // agiornamento dati fantasyTeam
    await fantasyRoster.populate('fantasyTeam').execPopulate();
    const fantasyTeam: IFantasyTeam = fantasyRoster.fantasyTeam as IFantasyTeam;
    if (!fantasyRoster.draft) {
        fantasyTeam.outgo -= halfDownRound(fantasyRoster.contract, 2);
    }
    fantasyTeam.playersInRoster--;
    await fantasyTeam.save();
}

async function remove(fantasyRoster: IFantasyRoster) {
    // legame bidirezionale tra roster e fantasyRoster
    await Roster.findByIdAndUpdate(fantasyRoster.roster, { $unset: { fantasyRoster: '' } });
    // agiornamento dati fantasyTeam
    await fantasyRoster.populate('fantasyTeam').execPopulate();
    const fantasyTeam: IFantasyTeam = fantasyRoster.fantasyTeam as IFantasyTeam;
    if (!fantasyRoster.draft) {
        fantasyTeam.outgo -= fantasyRoster.contract;
    }
    if (fantasyRoster.status === 'EXT') {
        fantasyTeam.extraPlayers--;
    }
    fantasyTeam.playersInRoster--;
    fantasyTeam.totalContracts--;
    await fantasyTeam.save();
}

export default fantasyRosterRouter;
