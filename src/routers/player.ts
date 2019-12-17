import * as Koa from 'koa';
import * as Router from 'koa-router';
import { IPlayer, Player } from '../schemas/player';

const playerRouter: Router = new Router<IPlayer>();

playerRouter.get('/players', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const players: IPlayer[] = await Player.find().populate('role');
    ctx.body = players;
});

playerRouter.post('/players', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const newPlayer: IPlayer = ctx.request.body;
    const player = await Player.create(newPlayer);
    ctx.body = player;
});

export default playerRouter;
