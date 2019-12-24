import * as Koa from 'koa';
import * as Router from 'koa-router';
import { FantasyTeam, IFantasyTeam } from '../schemas/fantasy-team';
import { ILeague, League } from '../schemas/league';
import { tenant } from '../util/tenant';

const fantasyTeamRouter: Router = new Router<IFantasyTeam>();

fantasyTeamRouter.post('/fantasy-teams', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
        const fantasyTeams: IFantasyTeam[] = ctx.request.body;
        ctx.body = FantasyTeam.insertFantasyTeams(fantasyTeams, league);
        ctx.status = 201;
    } catch (error) {
        ctx.throw(500, error.message);
    }
});

fantasyTeamRouter.get('/fantasy-teams', tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        ctx.body = await FantasyTeam.find({ league: ctx.get('league') });
    } catch (error) {
        ctx.throw(500, error.message);
    }
});

fantasyTeamRouter.get('/fantasy-teams/:id', tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        ctx.body = await FantasyTeam.findOne({ _id: ctx.params.id, league: ctx.get('league') });
    } catch (error) {
        ctx.throw(500, error.message);
    }
});

fantasyTeamRouter.patch('/fantasy-teams/:id', tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const updatedFantasyTeam: IFantasyTeam = ctx.request.body;
        const fantasyTeamToUpdate = await FantasyTeam.findOne({ _id: ctx.params.id, league: ctx.get('league') }) as IFantasyTeam;
        if (!fantasyTeamToUpdate) {
            ctx.throw(404, 'Fantasquadra non trovata');
        }
        fantasyTeamToUpdate.set(updatedFantasyTeam);
        ctx.body = await fantasyTeamToUpdate.save();
    } catch (error) {
        ctx.throw(400, error.message);
    }
});

fantasyTeamRouter.delete('/fantasy-teams/:id', tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const fantasyTeam = await FantasyTeam.findOneAndDelete({ _id: ctx.params.id, league: ctx.get('league') }) as IFantasyTeam;
        if (fantasyTeam == null) {
            ctx.status = 404;
        }
        ctx.body = fantasyTeam;
    } catch (error) {
        ctx.throw(500, error.message);
    }
});
export default fantasyTeamRouter;
