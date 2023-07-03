import * as Koa from "koa";
import * as Router from "koa-router";
import { ILeague } from "../schemas/league";
import { IPlayer, Player } from "../schemas/player";
import { admin, auth, parseToken } from "../util/auth";
import { entityNotFound, getLeague } from "../util/functions";
import { parseCsv } from "../util/parse";
import { playersUploadLineError } from "../util/player-upload-validation";
import { tenant } from "../util/tenant";

const playerRouter: Router = new Router<IPlayer>();

playerRouter.get(
  "/players",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    ctx.body = await Player.find({ league: ctx.get("league") }).exec();
  }
);

playerRouter.post(
  "/players",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.get("league"));
    const newPlayer: IPlayer = ctx.request.body as IPlayer;
    newPlayer.league = league._id;
    ctx.body = await Player.create(newPlayer);
    ctx.status = 201;
    console.log(ctx.body);
  }
);

const multer = require("@koa/multer");
const upload = multer({
  storage: multer.memoryStorage(),
});
playerRouter.post(
  "/players/upload",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  upload.single("players"),
  async (ctx: Router.IRouterContext) => {
    const playersArray = (ctx.request.body as { players: string[] }).players;
    const players = parseCsv(playersArray.toString(), [
      "name",
      "role",
      "nationality",
      "team",
      "number",
      "yearBirth",
      "height",
      "weight",
    ]);
    const firstLineWithError = playersUploadLineError(players);
    if (firstLineWithError !== -1) {
      throw new Error(
        `Errore nel file di upload alla linea ${firstLineWithError}`
      );
    }
    const playersLength = players.length;
    const league: ILeague = await getLeague(ctx.get("league"));
    Player.insertPlayers(players, league);
    ctx.body = playersLength;
    ctx.status = 201;
  }
);

playerRouter.get(
  "/players/upload-percentage",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.get("league"));
    ctx.body = Player.uploadPercentage(league.id);
  }
);

playerRouter.patch(
  "/players/:id",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.get("league"));
    const updatedPlayer: IPlayer = ctx.request.body as IPlayer;
    const playerToUpdate = await Player.findOne({
      _id: ctx.params.id,
      league: league._id,
    }).exec();
    if (playerToUpdate == null) {
      ctx.throw(entityNotFound("Player", ctx.params.id, league._id), 404);
    }
    playerToUpdate.set(updatedPlayer);
    ctx.body = await playerToUpdate.save();
  }
);

playerRouter.delete(
  "/players/:id",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.get("league"));
    const player = await Player.findOneAndDelete({
      _id: ctx.params.id,
      league: league._id,
    }).exec();
    if (player == null) {
      ctx.status = 404;
    } else {
      ctx.body = player;
    }
  }
);

export default playerRouter;
