import * as Koa from 'koa';
import * as Router from 'koa-router';
import { IFantasyTeamDocument } from '../schemas/documents/fantasy-team.document';
import FantasyTeam, { IFantasyTeam } from '../schemas/fantasy-team';
import League, { ILeague } from '../schemas/league';
import User, { IUser } from '../schemas/user';

const fantasyTeamRouter: Router = new Router<IFantasyTeamDocument>();

fantasyTeamRouter.post('/fantasy-teams', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await League.findById(ctx.query.id) as ILeague;
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

fantasyTeamRouter.get('/fantasy-teams', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await League.findById(ctx.query.id) as ILeague;
    const fantasyTeams = await FantasyTeam.find({ league: league._id });
    ctx.body = fantasyTeams;
});

fantasyTeamRouter.patch('/fantasy-teams/:id', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const updatedFantasyTeam: IFantasyTeamDocument = ctx.request.body;
    const fantasyTeamToUpdate = await FantasyTeam.findById(ctx.params.id) as IFantasyTeam;
    if (!fantasyTeamToUpdate) {
        ctx.throw(404, 'Fantasquadra non trovata');
    }
    fantasyTeamToUpdate.set(updatedFantasyTeam);
    fantasyTeamToUpdate.save();
    ctx.body = fantasyTeamToUpdate;
});

export default fantasyTeamRouter;
