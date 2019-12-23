
import * as Koa from 'koa';
import * as Router from 'koa-router';
import { ILeague, League } from '../schemas/league';
import { ITeam, Team } from '../schemas/team';
import { parseCsv } from '../util/parse';

const teamRouter: Router = new Router<ITeam>();

teamRouter.get('/teams', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        ctx.body = await Team.find({ league: ctx.request.header.league });
    } catch (error) {
        ctx.throw(500, error.message);
    }
});

teamRouter.get('/teams/:id', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        ctx.body = await Team.findOne({ _id: ctx.params.id, league: ctx.request.header.league });
    } catch (error) {
        ctx.throw(500, error.message);
    }
});

teamRouter.post('/teams', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const newTeam: ITeam = ctx.request.body;
        const league: ILeague = await League.findById(ctx.request.header.league) as ILeague;
        newTeam.league = league;
        ctx.body = await Team.create(newTeam);
        ctx.status = 201;
    } catch (error) {
        ctx.throw(400, error.message);
    }
});

// tslint:disable-next-line: no-var-requires
const multer = require('@koa/multer');
const upload = multer({
    storage: multer.memoryStorage(),
});
teamRouter.post('/teams/upload', upload.single('teams'), async (ctx: any) => {
    try {
        console.log(ctx.file.buffer);
        console.log(ctx.request.file.buffer);
        const league: ILeague = await League.findById(ctx.request.header.league) as ILeague;
        await parseCsv(ctx.file.buffer, ['fullName', 'sponsor', 'name', 'city', 'abbreviation'], async (teams: any[]) => {
            ctx.body = await Team.insertTeams(teams, league);
        });
        ctx.status = 201;
    } catch (error) {
        console.log(error);

        ctx.throw(400, error.message);
    }
});

teamRouter.patch('/teams/:id', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league: ILeague = await League.findById(ctx.request.header.league) as ILeague;
        const updatedTeam: ITeam = ctx.request.body;
        const teamToUpdate: any = await Team.findOne({ _id: ctx.params.id, league: league._id });
        if (teamToUpdate == null) {
            ctx.throw(400, 'Squadra non trovata');
        }
        teamToUpdate.set(updatedTeam);
        teamToUpdate.league = league;
        ctx.body = await teamToUpdate.save();
    } catch (error) {
        ctx.throw(400, error.message);
    }
});

teamRouter.delete('/teams/:id', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const team = await Team.findOneAndDelete({ _id: ctx.params.id, league: ctx.request.header.league }) as ITeam;
        if (team == null) {
            ctx.status = 404;
        }
        ctx.body = team;
    } catch (error) {
        ctx.throw(500, error.message);
    }
});

export default teamRouter;
