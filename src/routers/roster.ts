import * as Koa from 'koa';
import * as Router from 'koa-router';
import { ILeague, League } from '../schemas/league';
import { IRealFixture } from '../schemas/real-fixture';
import { IRoster, Roster } from '../schemas/roster';
import { tenant } from '../util/tenant';

const rosterRouter: Router = new Router<IRoster>();

rosterRouter.get('/rosters', tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
        const nextRealFixture: IRealFixture = await league.nextRealFixture();
        const rosters: IRoster[] = await Roster.find({ league: ctx.get('league'), realFixture: nextRealFixture._id });
        rosters.forEach((roster: IRoster) => {
            roster.populate('player').execPopulate();
            roster.populate('team').execPopulate();
        });
        ctx.body = rosters;
    } catch (error) {
        ctx.throw(500, error.message);
    }
});

rosterRouter.post('/rosters', tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
        const newRoster: IRoster = ctx.request.body;
        newRoster.league = league._id;
        ctx.body = await Roster.create(newRoster);
        ctx.status = 201;
    } catch (error) {
        ctx.throw(400, error.message);
    }
});

rosterRouter.patch('/rosters/:id', tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
        const fields = Object.keys(ctx.request.body);
        const rosterToUpdate: any = await Roster.findOne({ _id: ctx.params.id, league: league._id });
        if (rosterToUpdate == null) {
            ctx.throw(400, 'Giocatore non trovato');
        }
        fields.forEach((field) => rosterToUpdate[field] = ctx.request.body[field]);
        rosterToUpdate.league = league;
        ctx.body = await rosterToUpdate.save();
    } catch (error) {
        ctx.throw(400, error.message);
    }
});

rosterRouter.delete('/rosters/:id', tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
        const roster = await Roster.findOneAndDelete({ _id: ctx.params.id, league: league._id }) as IRoster;
        if (roster == null) {
            ctx.status = 404;
        }
        ctx.body = roster;
    } catch (error) {
        ctx.throw(500, error.message);
    }

});

export default rosterRouter;
