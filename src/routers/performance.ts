import * as Koa from "koa";
import * as Router from "koa-router";
import { FantasyRoster, IFantasyRoster } from "../schemas/fantasy-roster";
import { IPerformance, Performance } from "../schemas/performance";
import { IRoster, Roster } from "../schemas/roster";
import { auth, parseToken } from "../util/auth";
import { boxscore } from "../util/boxscore";
import { entityNotFound } from "../util/functions";
import { tenant } from "../util/tenant";

const performanceRouter: Router = new Router<IPerformance>();

performanceRouter.get(
  "/performances",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    ctx.body = await Performance.find({ league: ctx.get("league") }).exec();
  }
);

performanceRouter.get(
  "/performances/:id",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const performance = await Performance.findOne({
      _id: ctx.params.id,
      league: ctx.get("league"),
    }).exec();
    if (performance == null) {
      ctx.throw(
        entityNotFound("Performance", ctx.params.id, ctx.get("league")),
        404
      );
    }
    ctx.body = performance;
  }
);

performanceRouter.get(
  "/performances/team/:teamId/real-fixture/:realFixtureId",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const queryString = ctx.query;
    const filter = parseInt(
      queryString && (queryString["filter"] as string),
      0
    );
    let rosters: IRoster[] = [];
    if (filter != null) {
      switch (filter) {
        case 1:
          // signed players
          rosters = await Roster.find({
            league: ctx.get("league"),
            team: ctx.params.teamId,
            realFixture: ctx.params.realFixtureId,
            fantasyRoster: { $exists: true },
          }).exec();
          break;
        case 2:
          // players in lineup
          rosters = await Roster.find({
            league: ctx.get("league"),
            team: ctx.params.teamId,
            realFixture: ctx.params.realFixtureId,
            fantasyRoster: { $exists: true },
          }).exec();
          await Roster.populate(rosters, { path: "fantasyRoster" });
          const fantasyRosters = rosters.map(
            (roster: IRoster) => roster.fantasyRoster as IFantasyRoster
          );
          await FantasyRoster.populate(fantasyRosters, { path: "lineup" });
          rosters = rosters.filter(
            (roster: IRoster) =>
              (roster?.fantasyRoster as IFantasyRoster).get("lineup") != null
          );
          break;
        default:
          // all players
          rosters = await Roster.find({
            league: ctx.get("league"),
            team: ctx.params.teamId,
            realFixture: ctx.params.realFixtureId,
          }).exec();
          break;
      }
    }
    const playersId = rosters.map((roster: IRoster) => roster.player);
    const performances = await Performance.find({
      league: ctx.get("league"),
      realFixture: ctx.params.realFixtureId,
      player: { $in: playersId },
    }).exec();
    for (const performance of performances) {
      await performance.populate("player");
    }
    ctx.body = performances;
  }
);

performanceRouter.get(
  "/performances/player/:playerId",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const performances = await Performance.find({
      league: ctx.get("league"),
      player: ctx.params.playerId,
    }).exec();
    for (const performance of performances) {
      await performance.populate("realFixture");
    }
    ctx.body = performances;
  }
);

performanceRouter.post(
  "/performances",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const performances: IPerformance[] = ctx.request.body as IPerformance[];
    for (const updatedPerformance of performances) {
      const performanceToUpdate = await Performance.findOne({
        _id: updatedPerformance._id,
        league: ctx.get("league"),
      }).exec();
      if (performanceToUpdate == null) {
        ctx.throw(
          entityNotFound(
            "Performance",
            updatedPerformance._id,
            ctx.get("league")
          ),
          404
        );
      }
      performanceToUpdate.set(updatedPerformance);
      performanceToUpdate.save();
    }
    ctx.body = performances;
  }
);

performanceRouter.post(
  "/performances/team/:teamId/real-fixture/:realFixtureId",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const url: string = (ctx.request.body as { url: string }).url;
    const rosters = await Roster.find({
      league: ctx.get("league"),
      team: ctx.params.teamId,
      realFixture: ctx.params.realFixtureId,
    }).exec();
    const playersId = rosters.map((roster: IRoster) => roster.player);
    const performances = await Performance.find({
      league: ctx.get("league"),
      realFixture: ctx.params.realFixtureId,
      player: { $in: playersId },
    }).exec();
    await boxscore(performances, url);
    ctx.body = performances;
  }
);

performanceRouter.patch(
  "/performances/:id",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const updatedPerformance: IPerformance = ctx.request.body as IPerformance;
    const performanceToUpdate = await Performance.findOne({
      _id: ctx.params.id,
      league: ctx.get("league"),
    }).exec();
    if (performanceToUpdate == null) {
      ctx.throw(
        entityNotFound("Performance", ctx.params.id, ctx.get("league")),
        404
      );
    }
    performanceToUpdate.set(updatedPerformance);
    ctx.body = await performanceToUpdate.save();
  }
);

performanceRouter.delete(
  "/performances/:id",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const performance = await Performance.findOneAndDelete({
      _id: ctx.params.id,
      league: ctx.get("league"),
    }).exec();
    if (performance == null) {
      ctx.throw(
        entityNotFound("Performance", ctx.params.id, ctx.get("league")),
        404
      );
    }
    ctx.body = performance;
  }
);

export default performanceRouter;
