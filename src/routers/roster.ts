import * as Koa from "koa";
import * as Router from "koa-router";
import { ILeague } from "../schemas/league";
import { Performance } from "../schemas/performance";
import { IPlayer, Player } from "../schemas/player";
import { IRealFixture, RealFixture } from "../schemas/real-fixture";
import { IRoster, Roster } from "../schemas/roster";
import { admin, auth, parseToken } from "../util/auth";
import { entityNotFound, getLeague } from "../util/functions";
import { tenant } from "../util/tenant";

const rosterRouter: Router = new Router<IRoster>();

rosterRouter.get(
  "/rosters",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.get("league"));
    const nextRealFixture: IRealFixture = await league.nextRealFixture();
    const { page, limit, filter } = ctx.query;

    const aggregate = Roster.aggregate();
    aggregate.match({ league: league._id });
    aggregate.match({ realFixture: nextRealFixture._id });
    aggregate
      .lookup({
        from: "players",
        localField: "player",
        foreignField: "_id",
        as: "player",
      })
      .unwind("$player");
    aggregate
      .lookup({
        from: "realfixtures",
        localField: "realFixture",
        foreignField: "_id",
        as: "realFixture",
      })
      .unwind("$realFixture");
    aggregate
      .lookup({
        from: "teams",
        localField: "team",
        foreignField: "_id",
        as: "team",
      })
      .unwind("$team");
    aggregate
      .lookup({
        from: "fantasyrosters",
        localField: "fantasyRoster",
        foreignField: "_id",
        as: "fantasyRoster",
      })
      .unwind({
        path: "$fantasyRoster",
        preserveNullAndEmptyArrays: true,
      });
    aggregate
      .lookup({
        from: "fantasyteams",
        localField: "fantasyRoster.fantasyTeam",
        foreignField: "_id",
        as: "fantasyRoster.fantasyTeam",
      })
      .unwind({
        path: "$fantasyRoster.fantasyTeam",
        preserveNullAndEmptyArrays: true,
      });
    aggregate.match({ "player.name": { $regex: new RegExp(filter, "i") } });
    aggregate.sort({ "player.name": 1 });

    let result = await Roster.aggregatePaginate(aggregate, {
      page: Number(page),
      limit: Number(limit),
    });

    ctx.set("X-Total-Count", String(result.total));
    ctx.body = result.docs;
  }
);

rosterRouter.get(
  "/rosters/free",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.get("league"));
    const nextRealFixture: IRealFixture = await league.nextRealFixture();
    const { page, limit, filter } = ctx.query;

    const aggregate = Roster.aggregate();
    aggregate.match({ league: league._id });
    aggregate.match({ realFixture: nextRealFixture._id });
    aggregate
      .lookup({
        from: "players",
        localField: "player",
        foreignField: "_id",
        as: "player",
      })
      .unwind("$player");
    aggregate
      .lookup({
        from: "realfixtures",
        localField: "realFixture",
        foreignField: "_id",
        as: "realFixture",
      })
      .unwind("$realFixture");
    aggregate
      .lookup({
        from: "teams",
        localField: "team",
        foreignField: "_id",
        as: "team",
      })
      .unwind("$team");
    aggregate
      .lookup({
        from: "fantasyrosters",
        localField: "fantasyRoster",
        foreignField: "_id",
        as: "fantasyRoster",
      })
      .unwind({
        path: "$fantasyRoster",
        preserveNullAndEmptyArrays: true,
      });
    aggregate
      .lookup({
        from: "fantasyteams",
        localField: "fantasyRoster.fantasyTeam",
        foreignField: "_id",
        as: "fantasyRoster.fantasyTeam",
      })
      .unwind({
        path: "$fantasyRoster.fantasyTeam",
        preserveNullAndEmptyArrays: true,
      });
    aggregate.match({ "fantasyRoster._id": { $exists: false } });
    aggregate.match({ "player.name": { $regex: new RegExp(filter, "i") } });
    aggregate.sort({ "player.name": 1 });

    let result = await Roster.aggregatePaginate(aggregate, {
      page: Number(page),
      limit: Number(limit),
    });

    ctx.set("X-Total-Count", String(result.total));
    ctx.body = result.docs;
  }
);

rosterRouter.post(
  "/rosters",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.get("league"));
    const newRoster: IRoster = ctx.request.body;
    newRoster.league = league._id;
    const rosterRealFixture = newRoster.realFixture as IRealFixture;
    const realFixtures = await RealFixture.find({ league: league._id })
      .sort({
        order: 1,
      })
      .exec();
    const indexOfRosterRealFixture = realFixtures.findIndex((rf) =>
      rf._id.equals(rosterRealFixture._id)
    );

    const rosters: IRoster[] = [];
    const preSeason = await league.isPreseason();
    if (preSeason) {
      // add roster only to first realFixture
      const roster: IRoster = await Roster.create(newRoster);
      rosters.push(roster);
    } else {
      // add roster to all prepared real fixtures
      const preparedRealFixtures = realFixtures
        .slice(indexOfRosterRealFixture)
        .filter((rf) => rf.prepared);
      for (const realFixture of preparedRealFixtures) {
        newRoster.realFixture = realFixture;
        const roster: IRoster = await Roster.create(newRoster);
        await roster.populate("player").execPopulate();
        await roster.populate("team").execPopulate();
        await roster.populate("realFixture").execPopulate();
        await roster.populate("fantasyRoster").execPopulate();
        rosters.push(roster);
      }
    }
    // add performances
    const performanceRealFixtures = realFixtures.slice(
      indexOfRosterRealFixture
    );
    for (const realFixture of performanceRealFixtures) {
      await Performance.create({
        player: (newRoster.player as IPlayer)._id,
        realFixture: realFixture._id,
        league: league._id,
      });
    }
    ctx.body = rosters;
    ctx.status = 201;
  }
);

rosterRouter.patch(
  "/rosters/:id",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.get("league"));
    const updatedRoster: IRoster = ctx.request.body;
    const rosterToUpdate = await Roster.findOne({
      _id: ctx.params.id,
      league: league._id,
    }).exec();
    if (rosterToUpdate == null) {
      ctx.throw(entityNotFound("Roster", ctx.params.id, league._id), 404);
    }
    rosterToUpdate.set(updatedRoster);
    const roster: IRoster = await rosterToUpdate.save();
    await roster.populate("player").execPopulate();
    await roster.populate("team").execPopulate();
    await roster.populate("realFixture").execPopulate();
    await roster.populate("fantasyRoster").execPopulate();
    ctx.body = roster;
  }
);

rosterRouter.delete(
  "/rosters/:id",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.get("league"));
    const roster = await Roster.findOne({
      _id: ctx.params.id,
      league: league._id,
    }).exec();

    if (roster == null) {
      ctx.throw(entityNotFound("Roster", ctx.params.id, league._id), 404);
    }
    let canDelete = true;
    const rostersRelated = await Roster.find({
      player: roster.player,
    }).exec();
    for (const rosterRelated of rostersRelated) {
      if (rosterRelated.fantasyRoster) {
        canDelete = false;
        break;
      }
    }

    if (canDelete) {
      // delete rosters and player
      const rostersId: string[] = rostersRelated.map(
        (rosterRelated: IRoster) => rosterRelated._id
      );
      await Roster.deleteMany({ _id: { $in: rostersId } }).exec();
      await Performance.deleteMany({ player: roster.player }).exec();
      await Player.deleteOne({ _id: roster.player }).exec();
      ctx.body = roster;
    } else {
      ctx.status = 400;
      ctx.message = "Giocatore tesserato: impossibile eliminare";
    }
  }
);

export default rosterRouter;
