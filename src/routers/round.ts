import * as Koa from "koa";
import * as Router from "koa-router";
import { FantasyTeam } from "../schemas/fantasy-team";
import { IFixture } from "../schemas/fixture";
import { IRound, Round } from "../schemas/round";
import { admin, auth, parseToken } from "../util/auth";
import { tenant } from "../util/tenant";

const roundRouter: Router = new Router<IRound>();

roundRouter.get(
  "/rounds",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const rounds: IRound[] = await Round.find({ league: ctx.get("league") });
      for (const round of rounds) {
        await populateAll(round);
      }
      ctx.body = [...rounds].sort((r1, r2) => {
        if (!r1 || !r2) {
          return 0;
        } else {
          if (r1.competition && r2.competition) {
            if (r1.competition.id !== r2.competition.id) {
              return r1.competition.id.localeCompare(r2.competition.id);
            } else {
              return r1.id.localeCompare(r2.id)
            }
          } else {
            return 0;
          }
        }
      });
    } catch (error) {
      console.log(error);
      ctx.throw(500, error.message);
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
      const roundToUpdate = (await Round.findOne({
        _id: ctx.params.id,
        league: ctx.get("league"),
      })) as IRound;
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
      await populateAll(round);
      ctx.body = round;
    } catch (error) {
      console.log(error);
      ctx.throw(400, error.message);
    }
  }
);

async function populateAll(round: IRound) {
  await round.populate("competition");
  await round.populate("fantasyTeams").populate("fixtures").execPopulate();
  await FantasyTeam.populate(round.fantasyTeams, { path: "owners" });
  for (const fixture of round.fixtures as IFixture[]) {
    for (let i = 0; i < fixture.matches.length; i++) {
      await fixture.populate(`matches.${i}`).execPopulate();
      await fixture
        .populate(`matches.${i}.homeTeam`)
        .populate(`matches.${i}.awayTeam`)
        .execPopulate();
    }
  }
}

export default roundRouter;
