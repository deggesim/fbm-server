import * as Koa from "koa";
import * as Router from "koa-router";
import { ILeague } from "../schemas/league";
import { ITeam, Team } from "../schemas/team";
import { admin, auth, parseToken } from "../util/auth";
import { entityNotFound, getLeague } from "../util/functions";
import { parseCsv } from "../util/parse";
import { tenant } from "../util/tenant";

const teamRouter: Router = new Router<ITeam>();

teamRouter.get(
  "/teams",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    ctx.body = await Team.find({ league: ctx.get("league") })
      .sort({
        name: 1,
      })
      .exec();
  }
);

teamRouter.get(
  "/teams/:id",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const team = await Team.findOne({
      _id: ctx.params.id,
      league: ctx.get("league"),
    }).exec();
    if (team == null) {
      ctx.throw(entityNotFound("Team", ctx.params.id, ctx.get("league")), 404);
    }
    ctx.body = team;
  }
);

teamRouter.post(
  "/teams",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const newTeam: ITeam = ctx.request.body;
    const league: ILeague = await getLeague(ctx.get("league"));
    newTeam.league = league._id;
    ctx.body = await Team.create(newTeam);
    ctx.status = 201;
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
    const teams = parseCsv(ctx.request.body.teams.toString(), [
      "fullName",
      "sponsor",
      "name",
      "city",
      "abbreviation",
    ]);
    await Team.deleteMany({ league: ctx.get("league") }).exec();
    const league: ILeague = await getLeague(ctx.get("league"));
    ctx.body = await Team.insertTeams(teams, league);
  }
);

teamRouter.patch(
  "/teams/:id",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const updatedTeam: ITeam = ctx.request.body;
    const teamToUpdate = await Team.findOne({
      _id: ctx.params.id,
      league: ctx.get("league"),
    }).exec();
    if (teamToUpdate == null) {
      ctx.throw(entityNotFound("Team", ctx.params.id, ctx.get("league")), 404);
    }
    teamToUpdate.set(updatedTeam);
    ctx.body = await teamToUpdate.save();
  }
);

teamRouter.delete(
  "/teams/:id",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const team = await Team.findOneAndDelete({
      _id: ctx.params.id,
      league: ctx.get("league"),
    }).exec();
    if (team == null) {
      ctx.throw(entityNotFound("Team", ctx.params.id, ctx.get("league")), 404);
    }
    ctx.body = team;
  }
);

export default teamRouter;
