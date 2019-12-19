import * as Koa from 'koa';
import * as Router from 'koa-router';
import { ILeague, League } from '../schemas/league';
import { IPlayer, Player } from '../schemas/player';

const playerRouter: Router = new Router<IPlayer>();

playerRouter.get('/players', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league: ILeague = await League.findById(ctx.request.header.league) as ILeague;
        ctx.body = await Player.find({ league: league._id }).populate('role');
    } catch (error) {
        ctx.throw(500, error.message);
    }
});

playerRouter.post('/players', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league: ILeague = await League.findById(ctx.request.header.league) as ILeague;
        const newPlayer: IPlayer = ctx.request.body;
        newPlayer.league = league;
        ctx.body = await Player.create(newPlayer);
        ctx.status = 201;
    } catch (error) {
        ctx.throw(400, error.message);
    }
});

playerRouter.patch('/players/:id', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league: ILeague = await League.findById(ctx.request.header.league) as ILeague;
        const fields = Object.keys(ctx.request.body);
        const playerToUpdate: any = await Player.findOne({ _id: ctx.params.id, league: league._id });
        if (playerToUpdate == null) {
            ctx.throw(400, 'Giocatore non trovato');
        }
        fields.forEach((field) => playerToUpdate[field] = ctx.request.body[field]);
        playerToUpdate.league = league;
        ctx.body = await playerToUpdate.save();
    } catch (error) {
        ctx.throw(400, error.message);
    }
});

playerRouter.delete('/players/:id', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league: ILeague = await League.findById(ctx.request.header.league) as ILeague;
        const player = await Player.findOneAndDelete({ _id: ctx.params.id, league: league._id }) as IPlayer;
        if (player == null) {
            ctx.status = 404;
        }
        ctx.body = player;
    } catch (error) {
        ctx.throw(500, error.message);
    }

});

export default playerRouter;
