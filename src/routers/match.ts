import * as Koa from 'koa';
import * as Router from 'koa-router';
import { Fixture, IFixture } from '../schemas/fixture';
import { ILeague, League } from '../schemas/league';
import { ILineup, Lineup } from '../schemas/lineup';
import { IMatch, Match } from '../schemas/match';
import { IPerformance } from '../schemas/performance';
import { IRealFixture, RealFixture } from '../schemas/real-fixture';
import { IRound, Round } from '../schemas/round';
import { auth, parseToken } from '../util/auth';
import { computeResult } from '../util/result-calculator';
import { tenant } from '../util/tenant';
import { IFantasyTeam } from '../schemas/fantasy-team';
import { ObjectId } from 'mongodb';

const matchRouter: Router = new Router<IMatch>();

matchRouter.get('/matches', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
  try {
    ctx.body = await Match.find({ league: ctx.get('league') });
  } catch (error) {
    console.log(error);
    ctx.throw(500, error.message);
  }
});

matchRouter.post('/matches', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
  try {
    const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
    const newMatch: IMatch = ctx.request.body;
    newMatch.league = league._id;
    ctx.body = await Match.create(newMatch);
    ctx.status = 201;
    console.log(ctx.body);
  } catch (error) {
    console.log(error);
    ctx.throw(400, error.message);
  }
});

matchRouter.post('/matches/:id/round/:roundId/fixture/:fixtureId/compute', auth(), parseToken(), tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
      const match: IMatch = await Match.findOne({ _id: ctx.params.id, league: ctx.get('league') }) as IMatch;
      if (match == null) {
        ctx.throw(400, 'Match non trovato');
      }

      const homeLinup: ILineup[] = await Lineup.getLineupByFantasyTeamAndFixture(league._id, match.homeTeam as ObjectId, ctx.params.fixtureId);
      for (const player of homeLinup) {
        await player.populate('fantasyRoster').execPopulate();
        await player.populate('fantasyRoster.roster').execPopulate();
        await player.populate('fantasyRoster.roster.player').execPopulate();
        await player.populate('fantasyRoster.roster.team').execPopulate();
        await player.populate('fixture').execPopulate();
      }
      const awayLinup: ILineup[] = await Lineup.getLineupByFantasyTeamAndFixture(league._id, match.awayTeam as ObjectId, ctx.params.fixtureId);
      for (const player of awayLinup) {
        await player.populate('fantasyRoster').execPopulate();
        await player.populate('fantasyRoster.roster').execPopulate();
        await player.populate('fantasyRoster.roster.player').execPopulate();
        await player.populate('fantasyRoster.roster.team').execPopulate();
        await player.populate('fixture').execPopulate();
      }
      const round: IRound = await Round.findOne({ _id: ctx.params.roundId, league: ctx.get('league') }) as IRound;
      // tie is allowed if round is not of type round robin and has an even number of matches
      const tieAllowed = !round.roundRobin && round.fixtures.length % 2 === 0;
      let previousPerformances: IPerformance[] = [];
      const realFixture: IRealFixture = await RealFixture.findOne({ fixtures: ctx.params.fixtureId, league: ctx.get('league') }) as IRealFixture;
      const allRealFixtures: IRealFixture[] = await RealFixture.find({ league: ctx.get('league') }).sort({ id: 1 });
      const index = allRealFixtures.findIndex((rf) => rf._id.equals(realFixture._id));
      const currentRealFixture = allRealFixtures[index];
      await currentRealFixture.populate('performances').execPopulate();
      const currentPerformances = currentRealFixture.get('performances');
      if (index > 0) {
        const previousRealFixture = allRealFixtures[index - 1];
        await previousRealFixture.populate('performances').execPopulate();
        previousPerformances = previousRealFixture.get('performances');
      }
      const resultWithGrade = league.parameters.find((param) => param.parameter === 'RESULT_WITH_GRADE')?.value === 1;
      const resultWithOer = league.parameters.find((param) => param.parameter === 'RESULT_WITH_OER')?.value === 1;
      const resultWithPlusMinus = league.parameters.find((param) => param.parameter === 'RESULT_WITH_PLUS_MINUS')?.value === 1;
      const resultDivisor = league.parameters.find((param) => param.parameter === 'RESULT_DIVISOR')?.value as number;
      match.homeFactor = round.homeFactor != null ? round.homeFactor : 0;
      computeResult(
        match,
        homeLinup,
        awayLinup,
        tieAllowed,
        currentPerformances,
        previousPerformances,
        resultWithGrade,
        resultWithOer,
        resultWithPlusMinus,
        resultDivisor,
      );
      const fixture: IFixture = await Fixture.findById(ctx.params.fixtureId) as IFixture;
      fixture.populate('matches').execPopulate();
      const completedMatches = (fixture.matches as IMatch[]).filter((m: IMatch) => m.completed).length;
      if (completedMatches === fixture.matches.length) {
        // fixture completed
        fixture.completed = true;
        await fixture.save();
        // progress league
        await league.progress();
      }
      await match.populate('homeTeam').populate('awayTeam').execPopulate();
      ctx.body = match;
    } catch (error) {
      console.log(error);
      ctx.throw(400, error.message);
    }
  });

matchRouter.patch('/matches/fixture/:id', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
  try {
    const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
    const fixture: IFixture = await Fixture.findOne({ _id: ctx.params.id, league: league._id }) as IFixture;
    if (fixture == null) {
      ctx.throw(404, 'Giornata non trovata');
    }
    const matches: IMatch[] = ctx.request.body;
    const returnedMatches: IMatch[] = [];
    let completedMatches = 0;
    for (const updatedMatch of matches) {
      const matchToUpdate = await Match.findOne({ _id: updatedMatch._id, league: league._id });
      if (matchToUpdate == null) {
        ctx.throw(404, 'Match non trovato');
      }
      matchToUpdate.set(updatedMatch);
      if (matchToUpdate.completed) {
        completedMatches++;
      }
      const match = await matchToUpdate.save();
      await match.populate('homeTeam').execPopulate();
      await match.populate('awayTeam').execPopulate();
      returnedMatches.push(match);
    }

    if (completedMatches === matches.length) {
      // fixture completed
      fixture.completed = true;
      await fixture.save();
      // progress league
      await league.progress();
    }

    ctx.body = returnedMatches;
  } catch (error) {
    console.log(error);
    ctx.throw(400, error.message);
  }
});

matchRouter.patch('/matches/:id', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
  try {
    const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
    const updatedMatch: IMatch = ctx.request.body;
    const matchToUpdate: IMatch = await Match.findOne({ _id: ctx.params.id, league: league._id }) as IMatch;
    if (matchToUpdate == null) {
      ctx.throw(400, 'Match non trovato');
    }
    matchToUpdate.set(updatedMatch);
    ctx.body = await matchToUpdate.save();
  } catch (error) {
    console.log(error);
    ctx.throw(400, error.message);
  }
});

matchRouter.delete('/matches/:id', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
  try {
    const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
    const match = await Match.findOneAndDelete({ _id: ctx.params.id, league: league._id }) as IMatch;
    if (match == null) {
      ctx.status = 404;
    }
    ctx.body = match;
  } catch (error) {
    console.log(error);
    ctx.throw(500, error.message);
  }

});

export default matchRouter;
