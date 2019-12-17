import * as Koa from 'koa';
import * as Router from 'koa-router';
import { FantasyTeam, IFantasyTeam } from '../schemas/fantasy-team';
import { ILeague, League } from '../schemas/league';
import { IUser, User } from '../schemas/user';

const fantasyTeamRouter: Router = new Router<IFantasyTeam>();

fantasyTeamRouter.post('/fantasy-teams', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await League.findById(ctx.query.league) as ILeague;
    const fantasyTeams: IFantasyTeam[] = ctx.request.body;
    FantasyTeam.insertFantasyTeams(fantasyTeams, league);
    ctx.body = league;
});

fantasyTeamRouter.get('/fantasy-teams', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await League.findById(ctx.query.league) as ILeague;
    const fantasyTeams = await FantasyTeam.find({ league: league._id });
    ctx.body = fantasyTeams;
});

fantasyTeamRouter.patch('/fantasy-teams/:id', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const updatedFantasyTeam: IFantasyTeam = ctx.request.body;
    const fantasyTeamToUpdate = await FantasyTeam.findById(ctx.params.id) as IFantasyTeam;
    if (!fantasyTeamToUpdate) {
        ctx.throw(404, 'Fantasquadra non trovata');
    }
    fantasyTeamToUpdate.set(updatedFantasyTeam);
    fantasyTeamToUpdate.save();
    ctx.body = fantasyTeamToUpdate;
});

export default fantasyTeamRouter;
async function insertFantasyTeams(fantasyTeams: IFantasyTeam[], league: ILeague) {
    for await (const item of fantasyTeams) {
        item.league = league.id;
        const fantasyTeam = await FantasyTeam.create(item);
        for await (const owner of fantasyTeam.owners) {
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
}

