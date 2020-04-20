import * as Koa from 'koa';
import * as Router from 'koa-router';
import { FantasyRoster, IFantasyRoster } from '../schemas/fantasy-roster';
import { ILeague, League } from '../schemas/league';
import { ILineup, Lineup } from '../schemas/lineup';
import { IRealFixture, RealFixture } from '../schemas/real-fixture';
import { auth, parseToken } from '../util/auth';
import { tenant } from '../util/tenant';

const lineupRouter: Router = new Router<ILineup>();

lineupRouter.get('/lineups', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        ctx.body = await Lineup.find({ league: ctx.get('league') });
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

lineupRouter.get('/lineups/:id', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const lineup = await Lineup.findOne({ _id: ctx.params.id, league: ctx.get('league') });
        if (lineup == null) {
            ctx.throw(404, 'Giornata non trovata');
        }
        ctx.body = lineup;
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

lineupRouter.get('/lineups/fantasy-team/:fantasyTeamId/fixture/:fixtureId', auth(), parseToken(), tenant(),
    async (ctx: Router.IRouterContext, next: Koa.Next) => {
        try {
            const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
            const lineup: ILineup[] =
                await Lineup.getLineupByFantasyTeamAndFixture(league._id, ctx.params.fantasyTeamId, ctx.params.fixtureId);
            for (const player of lineup) {
                await player.populate('fantasyRoster').populate('fixture').execPopulate();
                await player.populate('fantasyRoster.roster').execPopulate();
                await player.populate('fantasyRoster.roster.player').populate('fantasyRoster.roster.team').execPopulate();
            }
            ctx.body = lineup;
        } catch (error) {
            console.log(error);
            ctx.throw(500, error.message);
        }
    });

lineupRouter.post('/lineups/fantasy-team/:fantasyTeamId/fixture/:fixtureId', auth(), parseToken(), tenant(),
    async (ctx: Router.IRouterContext, next: Koa.Next) => {
        try {
            const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
            // delete old items
            const oldLineup: ILineup[] =
                await Lineup.getLineupByFantasyTeamAndFixture(league._id, ctx.params.fantasyTeamId, ctx.params.fixtureId);
            for (const lineup of oldLineup) {
                lineup.remove();
            }
            const newLineup: ILineup[] = ctx.request.body;
            for (const lineup of newLineup) {
                lineup.league = league._id;
            }
            ctx.body = await Lineup.insertMany(newLineup);
            ctx.status = 201;
        } catch (error) {
            console.log(error);
            ctx.throw(400, error.message);
        }
    });

lineupRouter.patch('/lineups/:id', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const updatedLineup: ILineup = ctx.request.body;
        const lineupToUpdate: ILineup = await Lineup.findOne({ _id: ctx.params.id, league: ctx.get('league') }) as ILineup;
        if (lineupToUpdate == null) {
            ctx.throw(404, 'Giornata non trovata');
        }
        lineupToUpdate.set(updatedLineup);
        ctx.body = await lineupToUpdate.save();
    } catch (error) {
        console.log(error);
        ctx.throw(400, error.message);
    }
});

lineupRouter.delete('/lineups/:id', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const lineup = await Lineup.findOneAndDelete({ _id: ctx.params.id, league: ctx.get('league') }) as ILineup;
        console.log(lineup);
        if (lineup == null) {
            ctx.status = 404;
        }
        ctx.body = lineup;
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

lineupRouter.delete('/lineups/fantasy-team/:fantasyTeamId/fixture/:fixtureId', auth(), parseToken(), tenant(),
    async (ctx: Router.IRouterContext, next: Koa.Next) => {
        try {
            const leagueId = ctx.get('league');
            const realFixture: IRealFixture =
                await RealFixture.findOne({ league: leagueId, fixtures: ctx.params.fixtureId }) as IRealFixture;
            const fantasyRosters: IFantasyRoster[] =
                await FantasyRoster.find({ league: leagueId, fantasyTeam: ctx.params.fantasyTeamId, realFixture: realFixture._id });
            const fantasyRostersId: string[] = fantasyRosters.map((fr) => fr._id);
            await Lineup.deleteMany({ league: leagueId, fixture: ctx.params.fixtureId, fantasyRoster: { $in: fantasyRostersId } });
            ctx.status = 204;
        } catch (error) {
            console.log(error);
            ctx.throw(500, error.message);
        }
    });

export default lineupRouter;
