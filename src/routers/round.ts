import * as Koa from 'koa';
import * as Router from 'koa-router';
import { IMatch, Match } from '../schemas/match';
import { IRound, Round } from '../schemas/round';
import { tenant } from '../util/tenant';

const roundRouter: Router = new Router<IRound>();

roundRouter.get('/rounds', tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    ctx.body = await Round.find({ league: ctx.get('league') });
});

roundRouter.post('/rounds/:id/matches', tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const updatedRound: IRound = ctx.request.body;
        const roundToUpdate = await Round.findOne({ _id: ctx.params.id, league: ctx.get('league') }) as IRound;
        if (!roundToUpdate) {
            ctx.throw(404, 'Round non trovato');
        }
        roundToUpdate.set(updatedRound);
        const round = await roundToUpdate.save();
        // popolamnto match
        let matches: IMatch[];
        if (round.roundRobin) {
            matches = await Match.buildRoundRobinMatchList(round);
        } else {
            matches = await Match.buildPlayoffMatchList(round);
        }
        ctx.body = { round, matches };
    } catch (error) {
        ctx.throw(400, error.message);
    }
});

export default roundRouter;
