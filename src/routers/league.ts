import * as Koa from 'koa';
import * as Router from 'koa-router';
import { ILeagueDocument } from '../schemas/documents/league.document';
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

    for await (const fantasyTeam of league.fantasyTeams) {
        for await (const owner of fantasyTeam.owners) {
            const user: IUser = await User.findById(owner) as IUser;

            const leagueFound = user.leagues.find((managedLeague) => {
                return String(managedLeague) === String(league._id);
            });
            if (!leagueFound) {
                user.leagues.push(league._id);
                await user.save();
            }
        }
    }

    ctx.body = league;
});

export default leagueRouter;
