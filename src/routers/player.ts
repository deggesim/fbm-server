import * as Koa from 'koa';
import * as Router from 'koa-router';
import { IPlayerDocument } from '../schemas/documents/player-document';
import Player from '../schemas/player';

const playerRouter: Router = new Router<IPlayerDocument>();

playerRouter.get('/players', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const players: IPlayerDocument[] = await Player.find().populate('role');

    ctx.body = players;
});

playerRouter.post('/players', async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const newPlayer: IPlayerDocument = ctx.request.body;
    const player = await Player.create(newPlayer);
    ctx.body = player;
});

export default playerRouter;
