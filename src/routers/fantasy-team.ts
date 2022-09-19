import * as Koa from "koa";
import * as Router from "koa-router";
import { isNil } from "lodash";
import { ObjectId } from "mongodb";
import { FantasyTeam, IFantasyTeam } from "../schemas/fantasy-team";
import { ILeague, League } from "../schemas/league";
import { IRealFixture } from "../schemas/real-fixture";
import { IUser, User } from "../schemas/user";
import { admin, auth, parseToken } from "../util/auth";
import { writeHistory } from "../util/history";
import { tenant } from "../util/tenant";

const fantasyTeamRouter: Router = new Router<IFantasyTeam>();

fantasyTeamRouter.post(
  "/fantasy-teams/league/:id",
  auth(),
  parseToken(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = (await League.findById(ctx.params.id)) as ILeague;
      const fantasyTeams: IFantasyTeam[] = ctx.request.body;
      ctx.body = FantasyTeam.insertFantasyTeams(fantasyTeams, league);
      ctx.status = 201;
    } catch (error) {
      console.log(error);
      ctx.throw(500, error.message);
    }
  }
);

fantasyTeamRouter.get(
  "/fantasy-teams",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = (await League.findById(
        ctx.get("league")
      )) as ILeague;
      const nextRealFixture: IRealFixture = await league.nextRealFixture();
      const conditions: any = { league: league._id };
      const fantasyTeams: IFantasyTeam[] = await FantasyTeam.find(conditions);
      for (const fantasyTeam of fantasyTeams) {
        await fantasyTeam.populate("owners").execPopulate();
        await fantasyTeam
          .populate({
            path: "fantasyRosters",
            match: {
              realFixture: nextRealFixture._id,
            },
          })
          .execPopulate();
      }
      ctx.body = fantasyTeams;
    } catch (error) {
      console.log(error);
      ctx.throw(500, error.message);
    }
  }
);

fantasyTeamRouter.get(
  "/fantasy-teams/draft-board",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = (await League.findById(
        ctx.get("league")
      )) as ILeague;
      const nextRealFixture: IRealFixture = await league.nextRealFixture();
      const conditions: any = { league: league._id };
      const fantasyTeams: IFantasyTeam[] = await FantasyTeam.find(conditions);

      await FantasyTeam.populate(fantasyTeams, [
        { path: "owners" },
        {
          path: "fantasyRosters",
          match: {
            realFixture: nextRealFixture._id,
          },
          populate: {
            path: "roster",
            populate: { path: "player" },
          },
        },
      ]);

      ctx.body = fantasyTeams;
    } catch (error) {
      console.log(error);
      ctx.throw(500, error.message);
    }
  }
);

fantasyTeamRouter.get(
  "/fantasy-teams/:id",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = (await League.findById(
        ctx.get("league")
      )) as ILeague;
      const nextRealFixture: IRealFixture = await league.nextRealFixture();
      const fantasyTeam: IFantasyTeam = (await FantasyTeam.findOne({
        _id: ctx.params.id,
        league: league._id,
      })) as IFantasyTeam;
      if (fantasyTeam == null) {
        ctx.throw(404, "Fantasquadra non trovata");
      }
      await fantasyTeam.populate("owners").execPopulate();
      await fantasyTeam
        .populate({
          path: "fantasyRosters",
          match: {
            realFixture: nextRealFixture._id,
          },
        })
        .execPopulate();
      ctx.body = fantasyTeam;
    } catch (error) {
      console.log(error);
      ctx.throw(500, error.message);
    }
  }
);

fantasyTeamRouter.patch(
  "/fantasy-teams/:id",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = (await League.findById(
        ctx.get("league")
      )) as ILeague;
      const nextRealFixture: IRealFixture = await league.nextRealFixture();
      const updatedFantasyTeam: IFantasyTeam = ctx.request.body;
      const fantasyTeamToUpdate = (await FantasyTeam.findOne({
        _id: ctx.params.id,
        league: league._id,
      })) as IFantasyTeam;
      if (fantasyTeamToUpdate == null) {
        ctx.throw(404, "Fantasquadra non trovata");
      }
      const { outgo, initialBalance, balancePenalty } = fantasyTeamToUpdate;
      fantasyTeamToUpdate.set(updatedFantasyTeam);
      const fantasyTeam = await fantasyTeamToUpdate.save();
      const allUsers = await User.find();
      await User.populate(allUsers, [
        {
          path: "fantasyTeams",
          populate: { path: "league" },
        },
        { path: "leagues" },
      ]);

      // remove fantasyTeam and league from users
      for (const user of allUsers) {
        const indexOfFantasyTeam = (user.fantasyTeams as IFantasyTeam[])
          .map((ft) => ft._id)
          .indexOf(fantasyTeamToUpdate._id);
        if (!isNil(indexOfFantasyTeam) && indexOfFantasyTeam >= 0) {
          user.fantasyTeams.splice(indexOfFantasyTeam, 1);
          const foundOtherFantasyTeamSameLeague = (
            user.fantasyTeams as IFantasyTeam[]
          ).find((ft) => (ft.league as ILeague)._id.equals(league._id));
          if (!foundOtherFantasyTeamSameLeague) {
            const indexOfLeague = (user.leagues as ILeague[])
              .map((l) => l._id)
              .indexOf(league._id);
            if (!isNil(indexOfLeague) && indexOfLeague >= 0) {
              user.leagues.splice(indexOfLeague, 1);
            }
          }
          await user.save();
        }
      }

      await FantasyTeam.populate(fantasyTeam, {
        path: "owners",
        populate: { path: "leagues" },
      });
      const owners = fantasyTeam.owners as IUser[];

      // add fantasyTeam and league to owners
      for (const user of owners) {
        user.fantasyTeams.push(fantasyTeam);
        const foundSameLeague = (user.leagues as ILeague[]).find((l) =>
          l._id.equals(league._id)
        );
        if (!foundSameLeague) {
          user.leagues.push(league);
        }
        await user.save();
      }

      await fantasyTeam
        .populate({
          path: "fantasyRosters",
          match: {
            realFixture: nextRealFixture._id,
          },
        })
        .execPopulate();

      // history
      const balance =
        fantasyTeam.initialBalance -
        initialBalance +
        (outgo - fantasyTeam.outgo) +
        (balancePenalty - fantasyTeam.balancePenalty);
      await writeHistory(
        "UPDATE_BALANCE",
        nextRealFixture,
        balance,
        league,
        fantasyTeam
      );

      ctx.body = { _id: fantasyTeam._id };
    } catch (error) {
      console.log(error);
      ctx.throw(400, error.message);
    }
  }
);

fantasyTeamRouter.delete(
  "/fantasy-teams/:id",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const fantasyTeam = (await FantasyTeam.findOneAndDelete({
        _id: ctx.params.id,
        league: ctx.get("league"),
      })) as IFantasyTeam;
      if (fantasyTeam == null) {
        ctx.status = 404;
      }
      ctx.body = fantasyTeam;
    } catch (error) {
      console.log(error);
      ctx.throw(500, error.message);
    }
  }
);
export default fantasyTeamRouter;
