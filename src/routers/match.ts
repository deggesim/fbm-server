import * as Koa from "koa";
import * as Router from "koa-router";
import { ObjectId } from "mongodb";
import { Fixture, IFixture } from "../schemas/fixture";
import { ILeague } from "../schemas/league";
import { ILineup, Lineup } from "../schemas/lineup";
import { IMatch, Match } from "../schemas/match";
import { IPerformance, Performance } from "../schemas/performance";
import { IRealFixture, RealFixture } from "../schemas/real-fixture";
import { IRound, Round } from "../schemas/round";
import { IUser } from "../schemas/user";
import { admin, auth, parseToken } from "../util/auth";
import { entityNotFound, getLeague } from "../util/functions";
import { notifyFixtureCompleted } from "../util/push-notification";
import { computeResult } from "../util/result-calculator";
import { tenant } from "../util/tenant";

const matchRouter: Router = new Router<IMatch>();

matchRouter.get(
  "/matches",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    ctx.body = await Match.find({ league: ctx.get("league") }).exec();
  }
);

matchRouter.get(
  "/matches/fixture/:fixtureId",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const fixture = (await Fixture.findOne({
      _id: ctx.params.fixtureId,
      league: ctx.get("league"),
    }).exec()) as IFixture;
    for (let i = 0; i < fixture.matches.length; i++) {
      await fixture.populate({
        path: `matches.${i}`,
        populate: {
          path: "homeTeam awayTeam",
        },
      });
    }
    ctx.body = fixture.matches;
  }
);

matchRouter.post(
  "/matches",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.get("league"));
    const newMatch: IMatch = ctx.request.body as IMatch;
    newMatch.league = league._id;
    ctx.body = await Match.create(newMatch);
    ctx.status = 201;
    console.log(ctx.body);
  }
);

matchRouter.post(
  "/matches/:id/round/:roundId/fixture/:fixtureId/compute",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.get("league"));
    const match: IMatch = (await Match.findOne({
      _id: ctx.params.id,
      league: ctx.get("league"),
    }).exec()) as IMatch;
    if (match == null) {
      ctx.throw(entityNotFound("Match", ctx.params.id, ctx.get("league")), 404);
    }

    const homeLineup: ILineup[] = await Lineup.getLineupByFantasyTeamAndFixture(
      league._id,
      match.homeTeam as ObjectId,
      ctx.params.fixtureId
    );
    await populateLineup(homeLineup);
    const awayLineup: ILineup[] = await Lineup.getLineupByFantasyTeamAndFixture(
      league._id,
      match.awayTeam as ObjectId,
      ctx.params.fixtureId
    );
    await populateLineup(awayLineup);
    const round: IRound = (await Round.findOne({
      _id: ctx.params.roundId,
      league: ctx.get("league"),
    }).exec()) as IRound;
    // tie is allowed if round is not of type round robin and has an even number of matches
    const drawAllowed = !round.roundRobin && round.fixtures.length % 2 === 0;
    let previousPerformances: IPerformance[] = [];
    const realFixture: IRealFixture = await RealFixture.findByFixture(
      ctx.get("league"),
      ctx.params.fixtureId
    );
    const allRealFixtures: IRealFixture[] = await RealFixture.find({
      league: ctx.get("league"),
    })
      .sort({ order: 1 })
      .exec();
    const index = allRealFixtures.findIndex((rf) =>
      rf._id.equals(realFixture._id)
    );
    if (index > 0) {
      const previousRealFixture = allRealFixtures[index - 1];
      previousPerformances = await Performance.find({
        realFixture: previousRealFixture,
        league: ctx.get("league"),
      }).exec();
    }
    const resultWithGrade =
      league.parameters.find((param) => param.parameter === "RESULT_WITH_GRADE")
        ?.value === 1;
    const resultWithOer =
      league.parameters.find((param) => param.parameter === "RESULT_WITH_OER")
        ?.value === 1;
    const resultWithPlusMinus =
      league.parameters.find(
        (param) => param.parameter === "RESULT_WITH_PLUS_MINUS"
      )?.value === 1;
    const resultDivisor = league.parameters.find(
      (param) => param.parameter === "RESULT_DIVISOR"
    )?.value as number;

    match.homeFactor = +ctx.query.homeFactor;
    if (match.homeFactor == null) {
      match.homeFactor = round.homeFactor != null ? round.homeFactor : 0;
    }
    await computeResult({
      match,
      homeLineup,
      awayLineup,
      drawAllowed,
      previousPerformances,
      resultWithGrade,
      resultWithOer,
      resultWithPlusMinus,
      resultDivisor,
    });
    const fixture: IFixture = (await Fixture.findById(
      ctx.params.fixtureId
    ).exec()) as IFixture;
    await fixture.populate("matches");
    const completedMatches = (fixture.matches as IMatch[]).filter(
      (m: IMatch) => m.completed
    ).length;
    if (completedMatches === fixture.matches.length) {
      // fixture completed
      fixture.completed = true;
      await fixture.save();
      // update realFixture with fixture completed
      await realFixture.populate("fixtures");
      // progress league
      const user: IUser = ctx.state.user;
      console.info("[PROGRESS] user", user.name);
      await league.progress(realFixture);
      // push notification
      const switchOffNotifications =
        process.env.SWITCH_OFF_NOTIFICATIONS === "true";
      if (!switchOffNotifications) {
        notifyFixtureCompleted(league, fixture);
      }
    }
    await match.populate("homeTeam awayTeam");
    ctx.body = match;
  }
);

matchRouter.patch(
  "/matches/fixture/:id",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.get("league"));
    const fixture: IFixture = (await Fixture.findOne({
      _id: ctx.params.id,
      league: league._id,
    }).exec()) as IFixture;
    if (fixture == null) {
      ctx.throw(entityNotFound("Fixture", ctx.params.id, league._id), 404);
    }
    const matches: IMatch[] = ctx.request.body as IMatch[];
    const returnedMatches: IMatch[] = [];
    let completedMatches = 0;
    for (const updatedMatch of matches) {
      const matchToUpdate = await Match.findOne({
        _id: updatedMatch._id,
        league: league._id,
      }).exec();
      if (matchToUpdate == null) {
        ctx.throw(entityNotFound("Match", ctx.params.id, league._id), 404);
      }
      matchToUpdate.set(updatedMatch);
      if (matchToUpdate.completed) {
        completedMatches++;
      }
      const match = await matchToUpdate.save();
      await match.populate("homeTeam awayTeam");
      returnedMatches.push(match);
    }

    if (completedMatches === matches.length) {
      // fixture completed
      fixture.completed = true;
      await fixture.save();
      // progress league
      const realFixture: IRealFixture = await RealFixture.findByFixture(
        ctx.get("league"),
        fixture._id
      );
      const user: IUser = ctx.state.user;
      console.info("[PROGRESS] user", user.name);
      await league.progress(realFixture);
      // push notification
      const switchOffNotifications =
        process.env.SWITCH_OFF_NOTIFICATIONS === "true";
      if (!switchOffNotifications) {
        notifyFixtureCompleted(league, fixture);
      }
    }

    ctx.body = returnedMatches;
  }
);

matchRouter.patch(
  "/matches/:id",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.get("league"));
    const updatedMatch: IMatch = ctx.request.body as IMatch;
    const matchToUpdate: IMatch = (await Match.findOne({
      _id: ctx.params.id,
      league: league._id,
    }).exec()) as IMatch;
    if (matchToUpdate == null) {
      ctx.throw(entityNotFound("Match", ctx.params.id, league._id), 404);
    }
    matchToUpdate.set(updatedMatch);
    ctx.body = await matchToUpdate.save();
  }
);

matchRouter.delete(
  "/matches/:id",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.get("league"));
    const match = (await Match.findOneAndDelete({
      _id: ctx.params.id,
      league: league._id,
    }).exec()) as IMatch;
    if (match == null) {
      ctx.throw(entityNotFound("Match", ctx.params.id, league._id), 404);
    }
    ctx.body = match;
  }
);

const populateLineup = async (lineup: ILineup[]) => {
  await Lineup.populate(lineup, [
    {
      path: "fantasyRoster",
      populate: {
        path: "roster",
        populate: {
          path: "player team",
        },
      },
    },
    {
      path: "fixture",
    },
    {
      path: "performance",
      populate: {
        path: "realFixture",
      },
    },
  ]);
};

export default matchRouter;
