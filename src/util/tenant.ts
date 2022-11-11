import * as Koa from "koa";
import * as Router from "koa-router";
import { League } from "../schemas/league";
import { IUser } from "../schemas/user";
import { getLeague } from "./functions";
import { Role } from "./globals";

export const tenant = () => {
  return async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league = await getLeague(ctx.request.header.league);
    // verifica che la lega sia tra quelle abilitate
    const user: IUser = ctx.state.user;
    const userLeague = user.leagues.find((leagueId) =>
      league._id.equals(leagueId)
    );
    if (userLeague != null || user.role === Role.SuperAdmin) {
      ctx.set("league", league.id);
      await next();
    } else {
      ctx.throw(
        403,
        `Utente non autorizzato ad operare sulla lega ${league.name}`
      );
    }
  };
};
