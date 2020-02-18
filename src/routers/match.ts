import * as Koa from 'koa';
import * as Router from 'koa-router';
import { ILeague, League } from '../schemas/league';
import { IMatch, Match } from '../schemas/match';
import { tenant } from '../util/tenant';

const matchRouter: Router = new Router<IMatch>();

matchRouter.get('/matches', tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        ctx.body = await Match.find({ league: ctx.get('league') });
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

matchRouter.post('/matches', tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
        const newMatch: IMatch = ctx.request.body;
        newMatch.league = league._id;
        ctx.body = await Match.create(newMatch);
        ctx.status = 201;
        console.log(ctx.body);
    } catch (error) {
        console.log(error);
        ctx.throw(400, error.message);
    }
});

matchRouter.patch('/matches/:id', tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
        const fields = Object.keys(ctx.request.body);
        const matchToUpdate: any = await Match.findOne({ _id: ctx.params.id, league: league._id });
        if (matchToUpdate == null) {
            ctx.throw(400, 'Match non trovato');
        }
        fields.forEach((field) => matchToUpdate[field] = ctx.request.body[field]);
        matchToUpdate.league = league;
        ctx.body = await matchToUpdate.save();
    } catch (error) {
        console.log(error);
        ctx.throw(400, error.message);
    }
});

matchRouter.put('/matches/', tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
        const matches: IMatch[] = ctx.request.body;
        await Match.updateMany({ league: league._id }, matches);
        ctx.body = matches;
    } catch (error) {
        console.log(error);
        ctx.throw(400, error.message);
    }
});

matchRouter.delete('/matches/:id', tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
        const match = await Match.findOneAndDelete({ _id: ctx.params.id, league: league._id }) as IMatch;
        if (match == null) {
            ctx.status = 404;
        }
        ctx.body = match;
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }

});

export default matchRouter;
