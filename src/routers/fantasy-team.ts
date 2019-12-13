import * as Koa from 'koa';
import * as Router from 'koa-router';
import { IFantasyTeamDocument } from '../schemas/documents/fantasy-team.document';
import FantasyTeam, { IFantasyTeam } from '../schemas/fantasy-team';

const fantasyTeamRouter: Router = new Router<IFantasyTeamDocument>();

fantasyTeamRouter.get('/fantasy-teams', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const fantasyTeams = await FantasyTeam.find();
    ctx.body = fantasyTeams;
});

export default fantasyTeamRouter;
