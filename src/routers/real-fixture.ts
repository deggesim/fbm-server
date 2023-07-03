import * as Koa from "koa";
import * as Router from "koa-router";
import { ILeague, League } from "../schemas/league";
import { IRealFixture, RealFixture } from "../schemas/real-fixture";
import { admin, auth, parseToken } from "../util/auth";
import { entityNotFound, getLeague } from "../util/functions";
import { tenant } from "../util/tenant";

const realFixtureRouter: Router = new Router<IRealFixture>();

realFixtureRouter.get(
  "/real-fixtures",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const prepared = ctx.request.query.prepared === "true";
    const conditions: any = { league: ctx.get("league") };
    if (prepared) {
      conditions.prepared = true;
    }
    const realFixtures = await RealFixture.find(conditions)
      .sort({
        order: 1,
      })
      .exec();
    await RealFixture.populate(realFixtures, [
      {
        path: "fixtures",
        populate: {
          path: "matches",
          populate: [{ path: "homeTeam" }, { path: "awayTeam" }],
        },
      },
      { path: "teamsWithNoGame" },
    ]);
    ctx.body = realFixtures;
  }
);

realFixtureRouter.get(
  "/real-fixtures/fixture/:fixtureId",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const realFixture = await RealFixture.findByFixture(
      ctx.get("league"),
      ctx.params.fixtureId
    );
    if (realFixture == null) {
      ctx.throw(
        entityNotFound("RealFixture", ctx.get("league"), ctx.params.fixtureId),
        404
      );
    }
    ctx.body = realFixture;
  }
);

realFixtureRouter.post(
  "/real-fixtures",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const newRealFixture: IRealFixture = ctx.request.body as IRealFixture;
    const league: ILeague = await getLeague(ctx.get("league"));
    newRealFixture.league = league._id;
    ctx.body = await RealFixture.create(newRealFixture);
    ctx.status = 201;
  }
);

// fix
realFixtureRouter.patch(
  "/real-fixtures/fix-documents",
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const ret = [];
    const leagues = await League.find().exec();
    for (const league of leagues) {
      const allRealFixtures: IRealFixture[] = await RealFixture.find({
        league,
      })
        .sort({ _id: 1 })
        .exec();
      let index = 1;
      for (const rf of allRealFixtures) {
        rf.order = index++;
        const newRf = await rf.save();
        console.log(newRf.toObject());
      }
      ret.push(allRealFixtures);
    }
    ctx.body = ret;
  }
);

realFixtureRouter.patch(
  "/real-fixtures/:id",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const updatedRealFixture: IRealFixture = ctx.request.body as IRealFixture;
    const realFixtureToUpdate = await RealFixture.findOne({
      _id: ctx.params.id,
      league: ctx.get("league"),
    }).exec();
    if (realFixtureToUpdate == null) {
      ctx.throw(
        entityNotFound("RealFixture", ctx.params.id, ctx.get("league")),
        404
      );
    }
    realFixtureToUpdate.set(updatedRealFixture);
    ctx.body = await realFixtureToUpdate.save();
  }
);

realFixtureRouter.delete(
  "/real-fixtures/:id",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const realFixture = await RealFixture.findOneAndDelete({
      _id: ctx.params.id,
      league: ctx.get("league"),
    }).exec();
    if (realFixture == null) {
      ctx.throw(
        entityNotFound("RealFixture", ctx.params.id, ctx.get("league")),
        404
      );
    }
    ctx.body = realFixture;
  }
);

export default realFixtureRouter;
