import * as Koa from "koa";
import * as Router from "koa-router";
import { ILeague } from "../schemas/league";
import { ITeam, Team } from "../schemas/team";
import { admin, auth, parseToken } from "../util/auth";
import { getLeague } from "../util/functions";
import { erroreImprevisto } from "../util/globals";
import { parseCsv } from "../util/parse";
import { tenant } from "../util/tenant";

const teamRouter: Router = new Router<ITeam>();

teamRouter.get(
  "/teams",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      ctx.body = await Team.find({ league: ctx.get("league") })
        .sort({
          name: 1,
        })
        .exec();
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

teamRouter.get(
  "/teams/:id",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const team = await Team.findOne({
        _id: ctx.params.id,
        league: ctx.get("league"),
      }).exec();
      if (team == null) {
        ctx.status = 404;
      } else {
        ctx.body = team;
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

teamRouter.post(
  "/teams",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const newTeam: ITeam = ctx.request.body;
      const league: ILeague = await getLeague(ctx);
      newTeam.league = league._id;
      ctx.body = await Team.create(newTeam);
      ctx.status = 201;
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

const multer = require("@koa/multer");
const upload = multer({
  storage: multer.memoryStorage(),
});
teamRouter.post(
  "/teams/upload",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  upload.single("teams"),
  async (ctx: Router.IRouterContext) => {
    try {
      const teams = parseCsv(ctx.request.body.teams.toString(), [
        "fullName",
        "sponsor",
        "name",
        "city",
        "abbreviation",
      ]);
      await Team.deleteMany({ league: ctx.get("league") }).exec();
      const league: ILeague = await getLeague(ctx);
      ctx.body = await Team.insertTeams(teams, league);
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

teamRouter.patch(
  "/teams/:id",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const updatedTeam: ITeam = ctx.request.body;
      const teamToUpdate = await Team.findOne({
        _id: ctx.params.id,
        league: ctx.get("league"),
      }).exec();
      if (teamToUpdate == null) {
        ctx.throw(404, "Squadra non trovata");
      }
      teamToUpdate.set(updatedTeam);
      ctx.body = await teamToUpdate.save();
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

teamRouter.delete(
  "/teams/:id",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const team = await Team.findOneAndDelete({
        _id: ctx.params.id,
        league: ctx.get("league"),
      }).exec();
      if (team == null) {
        ctx.throw(404, "Squadra non trovata");
      }
      ctx.body = team;
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

export default teamRouter;
