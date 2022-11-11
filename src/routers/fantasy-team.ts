import * as Koa from "koa";
import * as Router from "koa-router";
import { isNil } from "lodash";
import { FantasyTeam, IFantasyTeam } from "../schemas/fantasy-team";
import { ILeague } from "../schemas/league";
import { IRealFixture } from "../schemas/real-fixture";
import { IUser, User } from "../schemas/user";
import { admin, auth, parseToken } from "../util/auth";
import { getLeague } from "../util/functions";
import { erroreImprevisto } from "../util/globals";
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
      const league: ILeague = await getLeague(ctx.params.id);
      const fantasyTeams: IFantasyTeam[] = ctx.request.body;
      ctx.body = FantasyTeam.insertFantasyTeams(fantasyTeams, league);
      ctx.status = 201;
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

fantasyTeamRouter.get(
  "/fantasy-teams",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = await getLeague(ctx.get("league"));
      const nextRealFixture: IRealFixture = await league.nextRealFixture();
      const conditions: any = { league: league._id };
      const fantasyTeams: IFantasyTeam[] = await FantasyTeam.find(conditions)
        .sort({ name: 1 })
        .exec();
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
      if (error instanceof Error) {
        ctx.throw(500, error.message);
      } else {
        ctx.throw(500, erroreImprevisto);
      }
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
      const league: ILeague = await getLeague(ctx.get("league"));
      const nextRealFixture: IRealFixture = await league.nextRealFixture();
      const conditions: any = { league: league._id };
      const fantasyTeams: IFantasyTeam[] = await FantasyTeam.find(conditions)
        .sort({ name: 1 })
        .exec();

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
      if (error instanceof Error) {
        ctx.throw(500, error.message);
      } else {
        ctx.throw(500, erroreImprevisto);
      }
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
      const league: ILeague = await getLeague(ctx.get("league"));
      const nextRealFixture: IRealFixture = await league.nextRealFixture();
      const fantasyTeam = await FantasyTeam.findOne({
        _id: ctx.params.id,
        league: league._id,
      }).exec();
      if (fantasyTeam == null) {
        ctx.throw(404, "Fantasquadra non trovata");
      } else {
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

fantasyTeamRouter.patch(
  "/fantasy-teams/:id",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = await getLeague(ctx.get("league"));
      const nextRealFixture: IRealFixture = await league.nextRealFixture();
      const updatedFantasyTeam: IFantasyTeam = ctx.request.body;
      const fantasyTeamToUpdate = await FantasyTeam.findOne({
        _id: ctx.params.id,
        league: league._id,
      }).exec();
      if (fantasyTeamToUpdate == null) {
        ctx.throw(404, "Fantasquadra non trovata");
      } else {
        const { outgo, initialBalance, balancePenalty } = fantasyTeamToUpdate;
        fantasyTeamToUpdate.set(updatedFantasyTeam);
        const fantasyTeam = await fantasyTeamToUpdate.save();
        const allUsers = await User.find().exec();
        await User.populate(allUsers, [
          {
            path: "fantasyTeams",
            populate: { path: "league" },
          },
          { path: "leagues" },
        ]);

        // remove fantasyTeam and league from users
        await removeFromUsers(allUsers, fantasyTeamToUpdate, league);

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
      }
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

fantasyTeamRouter.delete(
  "/fantasy-teams/:id",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const fantasyTeam = await FantasyTeam.findOneAndDelete({
        _id: ctx.params.id,
        league: ctx.get("league"),
      }).exec();
      if (fantasyTeam == null) {
        ctx.status = 404;
      } else {
        ctx.body = fantasyTeam;
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

const removeFromUsers = async (
  allUsers: IUser[],
  fantasyTeamToUpdate: IFantasyTeam,
  league: ILeague
) => {
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
};

export default fantasyTeamRouter;
