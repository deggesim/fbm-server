import * as Koa from 'koa';
import * as Router from 'koa-router';
import { FantasyRoster, IFantasyRoster } from '../schemas/fantasy-roster';
import { IFantasyTeam } from '../schemas/fantasy-team';
import { ILeague, League } from '../schemas/league';
import { ILineup, Lineup } from '../schemas/lineup';
import { IPerformance, Performance } from '../schemas/performance';
import { IPlayer, Player } from '../schemas/player';
import { IRealFixture, RealFixture } from '../schemas/real-fixture';
import { IRoster } from '../schemas/roster';
import { IUser } from '../schemas/user';
import { auth, parseToken } from '../util/auth';
import { entityNotFound } from '../util/functions';
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
        await player.populate('fantasyRoster').populate('fixture').populate('performance').execPopulate();
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
    const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
    const user: IUser = ctx.state.user;
    const teamManagedByLoggedUser
      = (user.fantasyTeams as IFantasyTeam[]).find((ft: IFantasyTeam) => (ft._id).equals(ctx.params.fantasyTeamId)) != null;
    if (user.isUser() && !teamManagedByLoggedUser) {
      ctx.throw(403, 'Utente non autorizzato all\'operazione richiesta');
    }
    // delete old items
    const oldLineup: ILineup[] =
      await Lineup.getLineupByFantasyTeamAndFixture(league._id, ctx.params.fantasyTeamId, ctx.params.fixtureId);
    for (const lineup of oldLineup) {
      lineup.remove();
    }
    const realFixture: IRealFixture =
      await RealFixture.findByFixture(league._id, ctx.params.fixtureId);
    const newLineup: ILineup[] = ctx.request.body;
    for (const lineup of newLineup) {
      const playerId = (((lineup.fantasyRoster as IFantasyRoster).roster as IRoster).player as IPlayer)._id;
      const player = await Player.findOne({ league: league._id, _id: playerId }) as IPlayer;
      const performance = await Performance.findOne({ player, realFixture }) as IPerformance;
      if (performance == null) {
        ctx.throw(404, entityNotFound('IPerformance', playerId, realFixture._id));
      }
      lineup.performance = performance;
      lineup.league = league._id;
    }
    ctx.body = await Lineup.insertMany(newLineup);
    ctx.status = 201;
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
      const user: IUser = ctx.state.user;
      const teamManagedByLoggedUser
        = (user.fantasyTeams as IFantasyTeam[]).find((ft: IFantasyTeam) => (ft._id).equals(ctx.params.fantasyTeamId)) != null;
      if (user.isUser() && !teamManagedByLoggedUser) {
        ctx.throw(403, 'Utente non autorizzato all\'operazione richiesta');
      }
      const realFixture: IRealFixture =
        await RealFixture.findByFixture(leagueId, ctx.params.fixtureId);
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
