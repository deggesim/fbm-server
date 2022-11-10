import * as Koa from "koa";
import * as Router from "koa-router";
import { IRound, Round } from "../schemas/round";
import { admin, auth, parseToken } from "../util/auth";
import { erroreImprevisto } from "../util/globals";
import { tenant } from "../util/tenant";

const roundRouter: Router = new Router<IRound>();

roundRouter.get(
  "/rounds",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const rounds: IRound[] = await Round.find({
        league: ctx.get("league"),
      }).exec();
      await populateAll(rounds);
      ctx.body = sortRounds(rounds);
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        ctx.throw(500, error.message);
      } else {
        ctx.throw(500, erroreImprevisto);
      }
    }
  }
);

roundRouter.get(
  "/rounds/:id",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const round = await Round.findOne({
        _id: ctx.params.id,
        league: ctx.get("league"),
      }).exec();
      if (round == null) {
        ctx.status = 404;
      } else {
        await Round.populate(round, [
          { path: "competition" },
          { path: "fantasyTeams", populate: { path: "owners" } },
          {
            path: "fixtures",
            populate: [
              {
                path: "matches",
                populate: [{ path: "homeTeam" }, { path: "awayTeam" }],
              },
              { path: "realFixture" },
            ],
          },
        ]);
        ctx.body = round;
      }
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        ctx.throw(500, error.message);
      } else {
        ctx.throw(500, erroreImprevisto);
      }
    }
  }
);

roundRouter.post(
  "/rounds/:id/matches",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const updatedRound: IRound = ctx.request.body;
      const roundToUpdate = await Round.findOne({
        _id: ctx.params.id,
        league: ctx.get("league"),
      }).exec();
      if (!roundToUpdate) {
        ctx.throw(404, "Round non trovato");
      }
      roundToUpdate.set(updatedRound);
      const round = await roundToUpdate.save();
      // popolamnto match
      if (round.roundRobin) {
        await round.buildRoundRobinMatchList();
      } else {
        await round.buildPlayoffMatchList();
      }
      await populateAll([round]);
      ctx.body = round;
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        ctx.throw(400, error.message);
      } else {
        ctx.throw(500, erroreImprevisto);
      }
    }
  }
);

const sortRounds = (rounds: IRound[]) => {
  return [...rounds].sort((r1, r2) => {
    if (!r1 || !r2) {
      return 0;
    } else {
      if (r1.competition && r2.competition) {
        if (r1.competition.id !== r2.competition.id) {
          return r1.competition.id.localeCompare(r2.competition.id);
        } else {
          return r1.id.localeCompare(r2.id);
        }
      } else {
        return 0;
      }
    }
  });
};

const populateAll = async (rounds: IRound[]) => {
  await Round.populate(rounds, [
    { path: "competition" },
    { path: "fantasyTeams", populate: { path: "owners" } },
    {
      path: "fixtures",
      populate: {
        path: "matches",
        populate: [{ path: "homeTeam" }, { path: "awayTeam" }],
      },
    },
  ]);
};

export default roundRouter;
