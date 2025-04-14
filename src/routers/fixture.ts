import * as Koa from "koa";
import * as Router from "koa-router";
import { Fixture, IFixture } from "../schemas/fixture";
import { ILeague } from "../schemas/league";
import { admin, auth, parseToken } from "../util/auth";
import { entityNotFound, getLeague } from "../util/functions";
import { tenant } from "../util/tenant";

const fixtureRouter: Router = new Router<IFixture>();

fixtureRouter.get(
  "/fixtures",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const fixtures = await Fixture.find({ league: ctx.get("league") })
      .sort({ _id: 1 })
      .exec();
    await Fixture.populate(fixtures, {
      path: "round",
      populate: { path: "competition" },
    });
    ctx.body = fixtures;
  }
);

fixtureRouter.get(
  "/fixtures/:id",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const fixture = await Fixture.findOne({
      _id: ctx.params.id,
      league: ctx.get("league"),
    }).exec();
    if (fixture == null) {
      ctx.throw(
        entityNotFound("Fixture", ctx.params.id, ctx.get("league")),
        404
      );
    }
    ctx.body = fixture;
  }
);

fixtureRouter.post(
  "/fixtures",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const newFixture: IFixture = ctx.request.body as IFixture;
    const league: ILeague = await getLeague(ctx.get("league"));
    newFixture.league = league._id;
    ctx.body = await Fixture.create(newFixture);
    ctx.status = 201;
  }
);

fixtureRouter.patch(
  "/fixtures/:id",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const updatedFixture: IFixture = ctx.request.body as IFixture;
    const fixtureToUpdate = await Fixture.findOne({
      _id: ctx.params.id,
      league: ctx.get("league"),
    }).exec();
    if (fixtureToUpdate == null) {
      ctx.throw(
        entityNotFound("Fixture", ctx.params.id, ctx.get("league")),
        404
      );
    } else {
      fixtureToUpdate.set(updatedFixture);
      ctx.body = await fixtureToUpdate.save();
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
    const fixture = await Fixture.findOneAndDelete({
      _id: ctx.params.id,
      league: ctx.get("league"),
    }).exec();
    console.log(fixture);
    if (fixture == null) {
      ctx.throw(
        entityNotFound("Fixture", ctx.params.id, ctx.get("league")),
        404
      );
    }
    ctx.body = fixture;
  }
);

export default fixtureRouter;
