import * as Koa from "koa";
import * as Router from "koa-router";
import { PaginateResult } from "mongoose";
import { ILeague, League } from "../schemas/league";
import { Performance } from "../schemas/performance";
import { IPlayer, Player } from "../schemas/player";
import { IRealFixture, RealFixture } from "../schemas/real-fixture";
import { IRoster, Roster } from "../schemas/roster";
import { admin, auth, parseToken } from "../util/auth";
import { buildParameters } from "../util/roster";
import { tenant } from "../util/tenant";

const rosterRouter: Router = new Router<IRoster>();

rosterRouter.get(
  "/rosters",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = (await League.findById(
        ctx.get("league")
      )) as ILeague;
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
    } catch (error) {
      console.log(error);
      ctx.throw(500, error.message);
    }
  }
);

rosterRouter.get(
  "/rosters/free",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = (await League.findById(
        ctx.get("league")
      )) as ILeague;
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
    } catch (error) {
      console.log(error);
      ctx.throw(500, error.message);
    }
  }
);

rosterRouter.post(
  "/rosters",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = (await League.findById(
        ctx.get("league")
      )) as ILeague;
      const newRoster: IRoster = ctx.request.body;
      newRoster.league = league._id;
      const rosterRealFixture = newRoster.realFixture as IRealFixture;
      const realFixtures = await RealFixture.find({ league: league._id }).sort({
        _id: 1,
      });
      const indexOfRosterRealFixture = realFixtures.findIndex((rf) =>
        rf._id.equals(rosterRealFixture._id)
      );
      // add roster to all prepared real fixtures
      const preparedRealFixtures = realFixtures
        .slice(indexOfRosterRealFixture)
        .filter((rf) => rf.prepared);
      const rosters: IRoster[] = [];
      for (const realFixture of preparedRealFixtures) {
        newRoster.realFixture = realFixture;
        const roster: IRoster = await Roster.create(newRoster);
        await roster.populate("player").execPopulate();
        await roster.populate("team").execPopulate();
        await roster.populate("realFixture").execPopulate();
        await roster.populate("fantasyRoster").execPopulate();
        rosters.push(roster);
      }
      // add performances
      const performanceRealFixtures = realFixtures.slice(
        indexOfRosterRealFixture
      );
      for (const realFixture of performanceRealFixtures) {
        await Performance.create({
          player: (newRoster.player as IPlayer)._id,
          realFixture: (realFixture as IRealFixture)._id,
          league: league._id,
        });
      }
      ctx.body = rosters;
      ctx.status = 201;
    } catch (error) {
      console.log(error);
      ctx.throw(400, error.message);
    }
  }
);

rosterRouter.patch(
  "/rosters/:id",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = (await League.findById(
        ctx.get("league")
      )) as ILeague;
      const updatedRoster: IRoster = ctx.request.body;
      const rosterToUpdate: IRoster = (await Roster.findOne({
        _id: ctx.params.id,
        league: league._id,
      })) as IRoster;
      if (rosterToUpdate == null) {
        ctx.throw(400, "Giocatore non trovato");
      }
      rosterToUpdate.set(updatedRoster);
      const roster: IRoster = await rosterToUpdate.save();
      await roster.populate("player").execPopulate();
      await roster.populate("team").execPopulate();
      await roster.populate("realFixture").execPopulate();
      await roster.populate("fantasyRoster").execPopulate();
      ctx.body = roster;
    } catch (error) {
      console.log(error);
      ctx.throw(400, error.message);
    }
  }
);

rosterRouter.delete(
  "/rosters/:id",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = (await League.findById(
        ctx.get("league")
      )) as ILeague;

      const roster = (await Roster.findOne({
        _id: ctx.params.id,
        league: league._id,
      })) as IRoster;

      if (roster == null) {
        ctx.status = 404;
      } else {
        let canDelete = true;
        const rostersRelated = await Roster.find({ player: roster.player });
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
          await Roster.deleteMany({ _id: { $in: rostersId } });
          await Performance.deleteMany({ player: roster.player });
          await Player.deleteOne({ _id: roster.player });
          ctx.body = roster;
        } else {
          ctx.status = 400;
          ctx.message = "Giocatore tesserato: impossibile eliminare";
        }
      }
    } catch (error) {
      console.log(error);
      ctx.throw(500, error.message);
    }
  }
);

export default rosterRouter;
