import * as Koa from 'koa';
import * as Router from 'koa-router';
import { ILeagueDocument } from '../schemas/documents/league.document';
import FantasyTeam, { IFantasyTeam } from '../schemas/fantasy-team';
import League, { ILeague } from '../schemas/league';
import User, { IUser } from '../schemas/user';

const leagueRouter: Router = new Router<ILeagueDocument>();

leagueRouter.get('/leagues', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const leagues = await League.find();
    ctx.body = leagues;
});

leagueRouter.post('/leagues', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const newLeague: ILeagueDocument = ctx.request.body;
    const league: ILeague = await League.create(newLeague);
    ctx.body = league;
});

leagueRouter.post('/leagues/:id/fantasy-teams', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await League.findById(ctx.params.id) as ILeague;
    const fantasyTeams: IFantasyTeam[] = ctx.request.body;
    for await (const item of fantasyTeams) {
        item.league = league.id;
        const fantasyTeam = await FantasyTeam.create(item);

        console.log(fantasyTeam._id);
        for await (const owner of fantasyTeam.owners) {
            console.log(owner._id);
            const user: IUser = await User.findById(owner) as IUser;

            // aggiunta lega all'utente
            const leagueFound = user.leagues.find((managedLeague) => {
                return String(managedLeague) === String(league._id);
            });
            if (!leagueFound) {
                user.leagues.push(league._id);
            }

            // aggiunta squadra all'utente
            user.fantasyTeams.push(fantasyTeam._id);

            // salvataggio
            await user.save();
        }
    }

    ctx.body = league;
});

export default leagueRouter;
