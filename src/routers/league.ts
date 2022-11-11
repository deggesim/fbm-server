import * as Koa from "koa";
import * as Router from "koa-router";
import { Fixture, IFixture } from "../schemas/fixture";
import { ILeague, League } from "../schemas/league";
import { IRealFixture } from "../schemas/real-fixture";
import { Round } from "../schemas/round";
import { auth, parseToken } from "../util/auth";
import { getLeague } from "../util/functions";
import { erroreImprevisto } from "../util/globals";

const leagueRouter: Router = new Router<ILeague>();

leagueRouter.get(
  "/leagues",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      ctx.body = await League.find().sort({ name: 1 }).exec();
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

leagueRouter.get(
  "/leagues/:id",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = await getLeague(ctx.params.id);
      ctx.body = league;
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

leagueRouter.get(
  "/leagues/:id/is-preseason",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = await getLeague(ctx.params.id);
      ctx.body = await league.isPreseason();
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

leagueRouter.get(
  "/leagues/:id/is-offseason",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = await getLeague(ctx.params.id);
      ctx.body = await league.isOffseason();
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

leagueRouter.get(
  "/leagues/:id/is-postseason",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = await getLeague(ctx.params.id);
      ctx.body = await league.isPostseason();
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

leagueRouter.get(
  "/leagues/:id/next-fixture",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = await getLeague(ctx.params.id);
      ctx.body = await league.nextFixture();
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

leagueRouter.get(
  "/leagues/:id/next-realfixture",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = await getLeague(ctx.params.id);
      const realFixture: IRealFixture = await league.nextRealFixture();
      await Fixture.populate(realFixture.fixtures, { path: "round" });
      const fixtures = realFixture.fixtures as IFixture[];
      for (const fixture of fixtures) {
        await Round.populate(fixture.get("round"), { path: "competition" });
      }
      ctx.body = realFixture;
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

leagueRouter.post(
  "/leagues",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const newLeague: ILeague = ctx.request.body;
      ctx.body = await League.create(newLeague);
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

leagueRouter.post(
  "/leagues/:id/populate",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = await getLeague(ctx.params.id);
      ctx.body = await league.populateLeague();
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

leagueRouter.post(
  "/leagues/:id/parameters",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = await getLeague(ctx.params.id);
      ctx.body = await league.setParameters(ctx.request.body);
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

leagueRouter.post(
  "/leagues/:id/roles",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = await getLeague(ctx.params.id);
      ctx.body = await league.setRoles(ctx.request.body);
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

leagueRouter.post(
  "/leagues/:id/complete-preseason",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = await getLeague(ctx.params.id);
      ctx.body = await league.completePreseason();
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

leagueRouter.patch(
  "/leagues/:id",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const updatedLeague: ILeague = ctx.request.body;
      const leagueToUpdate: ILeague = await getLeague(ctx.params.id);
      leagueToUpdate.set(updatedLeague);
      await leagueToUpdate.save();
      ctx.body = await leagueToUpdate.populateLeague();
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

leagueRouter.delete(
  "/leagues/:id",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league = await League.findOneAndDelete({
        _id: ctx.params.id,
      }).exec();
      if (league == null) {
        ctx.throw(404, "Lega non trovata");
      } else {
        ctx.body = league;
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

export default leagueRouter;
