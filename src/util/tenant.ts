import * as Koa from 'koa';
import * as Router from 'koa-router';
import { ILeague, League } from '../schemas/league';
import { IUser } from '../schemas/user';

export const tenant = () => {
    return async (ctx: Router.IRouterContext, next: Koa.Next) => {
        const league: ILeague = await League.findById(ctx.request.header.league) as ILeague;
        if (league == null) {
            ctx.throw(400, 'Lega non trovata');
        }
        // verifica che la lega sia tra quelle abilitate
        const user: IUser = ctx.state.user;
        const userLeague = user.leagues.find((leagueId) => league._id.equals(leagueId));
        if (userLeague != null) {
            ctx.set('league', league.id);
            await next();
        } else {
            ctx.throw(403, `Utente non autorizzato ad operare sulla lega ${league.name}`);
        }
    };
};
