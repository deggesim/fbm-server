import * as Koa from "koa";
import * as Router from "koa-router";
import { Fixture, IFixture } from "../schemas/fixture";
import { ILeague, League } from "../schemas/league";
import { IRealFixture } from "../schemas/real-fixture";
import { Round } from "../schemas/round";
import { auth, parseToken } from "../util/auth";
import { entityNotFound, getLeague } from "../util/functions";

const leagueRouter: Router = new Router<ILeague>();

leagueRouter.get(
  "/leagues",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    ctx.body = await League.find().sort({ createdAt: -1 }).exec();
  }
);

leagueRouter.get(
  "/leagues/:id",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.params.id);
    ctx.body = league;
  }
);

leagueRouter.get(
  "/leagues/:id/is-preseason",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.params.id);
    ctx.body = await league.isPreseason();
  }
);

leagueRouter.get(
  "/leagues/:id/is-offseason",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.params.id);
    ctx.body = await league.isOffseason();
  }
);

leagueRouter.get(
  "/leagues/:id/is-postseason",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.params.id);
    ctx.body = await league.isPostseason();
  }
);

leagueRouter.get(
  "/leagues/:id/next-fixture",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.params.id);
    ctx.body = await league.nextFixture();
  }
);

leagueRouter.get(
  "/leagues/:id/next-realfixture",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.params.id);
    const realFixture: IRealFixture = await league.nextRealFixture();
    await Fixture.populate(realFixture.fixtures, { path: "round" });
    const fixtures = realFixture.fixtures as IFixture[];
    for (const fixture of fixtures) {
      await Round.populate(fixture.get("round"), { path: "competition" });
    }
    ctx.body = realFixture;
  }
);

leagueRouter.post(
  "/leagues",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const newLeague: ILeague = ctx.request.body as ILeague;
    ctx.body = await League.create(newLeague);
  }
);

leagueRouter.post(
  "/leagues/:id/populate",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.params.id);
    ctx.body = await league.populateLeague();
  }
);

leagueRouter.post(
  "/leagues/:id/parameters",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.params.id);
    ctx.body = await league.setParameters(
      ctx.request.body as { parameter: string; value: number }[]
    );
  }
);

leagueRouter.post(
  "/leagues/:id/roles",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.params.id);
    ctx.body = await league.setRoles(
      ctx.request.body as { role: string; spots: number[] }[]
    );
  }
);

leagueRouter.post(
  "/leagues/:id/complete-preseason",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.params.id);
    ctx.body = await league.completePreseason();
  }
);

leagueRouter.patch(
  "/leagues/:id",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const updatedLeague: ILeague = ctx.request.body as ILeague;
    const leagueToUpdate: ILeague = await getLeague(ctx.params.id);
    leagueToUpdate.set(updatedLeague);
    await leagueToUpdate.save();
    ctx.body = await leagueToUpdate.populateLeague();
  }
);

leagueRouter.delete(
  "/leagues/:id",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league = await League.findOneAndDelete({
      _id: ctx.params.id,
    }).exec();
    if (league == null) {
      ctx.throw(entityNotFound("League", ctx.params.id), 404);
    } else {
      ctx.body = league;
    }
  }
);

export default leagueRouter;
