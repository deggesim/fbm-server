import * as Koa from "koa";
import * as Router from "koa-router";
import { Fixture, IFixture } from "../schemas/fixture";
import { ILeague } from "../schemas/league";
import { admin, auth, parseToken } from "../util/auth";
import { getLeague } from "../util/functions";
import { erroreImprevisto } from "../util/globals";
import { tenant } from "../util/tenant";

const fixtureRouter: Router = new Router<IFixture>();

fixtureRouter.get(
  "/fixtures",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      ctx.body = await Fixture.find({ league: ctx.get("league") }).exec();
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

fixtureRouter.get(
  "/fixtures/:id",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const fixture = await Fixture.findOne({
        _id: ctx.params.id,
        league: ctx.get("league"),
      }).exec();
      if (fixture == null) {
        ctx.throw(404, "Giornata non trovata");
      }
      ctx.body = fixture;
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

fixtureRouter.post(
  "/fixtures",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const newFixture: IFixture = ctx.request.body;
      const league: ILeague = await getLeague(ctx.get("league"));
      newFixture.league = league._id;
      ctx.body = await Fixture.create(newFixture);
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

fixtureRouter.patch(
  "/fixtures/:id",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const updatedFixture: IFixture = ctx.request.body;
      const fixtureToUpdate = await Fixture.findOne({
        _id: ctx.params.id,
        league: ctx.get("league"),
      }).exec();
      if (fixtureToUpdate == null) {
        ctx.throw(404, "Giornata non trovata");
      } else {
        fixtureToUpdate.set(updatedFixture);
        ctx.body = await fixtureToUpdate.save();
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

fixtureRouter.delete(
  "/fixtures/:id",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const fixture = await Fixture.findOneAndDelete({
        _id: ctx.params.id,
        league: ctx.get("league"),
      }).exec();
      console.log(fixture);
      if (fixture == null) {
        ctx.status = 404;
      } else {
        ctx.body = fixture;
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

export default fixtureRouter;
