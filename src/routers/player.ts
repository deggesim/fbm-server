import * as Koa from 'koa';
import * as Router from 'koa-router';
import { ILeague, League } from '../schemas/league';
import { IPlayer, Player } from '../schemas/player';
import { parseCsv } from '../util/parse';
import { tenant } from '../util/tenant';

const playerRouter: Router = new Router<IPlayer>();

playerRouter.get('/players', tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        ctx.body = await Player.find({ league: ctx.get('league') });
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

playerRouter.post('/players', tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
        const newPlayer: IPlayer = ctx.request.body;
        newPlayer.league = league._id;
        ctx.body = await Player.create(newPlayer);
        ctx.status = 201;
        console.log(ctx.body);
    } catch (error) {
        console.log(error);
        ctx.throw(400, error.message);
    }
});

// tslint:disable-next-line: no-var-requires
const multer = require('@koa/multer');
const upload = multer({
    storage: multer.memoryStorage(),
});
playerRouter.post('/players/upload', tenant(), upload.single('players'), async (ctx: Router.IRouterContext) => {
    try {
        const players = parseCsv(ctx.request.body.players.toString(), ['name', 'role', 'nationality', 'team', 'number', 'yearBirth', 'height', 'weight']);
        const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
        ctx.body = await Player.insertPlayers(players, league);
    } catch (error) {
        console.log(error);
        ctx.throw(400, error.message);
    }
});

playerRouter.patch('/players/:id', tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
        const fields = Object.keys(ctx.request.body);
        const playerToUpdate: any = await Player.findOne({ _id: ctx.params.id, league: league._id });
        if (playerToUpdate == null) {
            ctx.throw(400, 'Giocatore non trovato');
        }
        fields.forEach((field) => playerToUpdate[field] = ctx.request.body[field]);
        playerToUpdate.league = league;
        ctx.body = await playerToUpdate.save();
    } catch (error) {
        console.log(error);
        ctx.throw(400, error.message);
    }
});

playerRouter.delete('/players/:id', tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
        const player = await Player.findOneAndDelete({ _id: ctx.params.id, league: league._id }) as IPlayer;
        if (player == null) {
            ctx.status = 404;
        }
        ctx.body = player;
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }

});

export default playerRouter;
