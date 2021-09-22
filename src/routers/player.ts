import * as Koa from "koa";
import * as Router from "koa-router";
import { ILeague, League } from "../schemas/league";
import { IPlayer, Player } from "../schemas/player";
import { admin, auth, parseToken } from "../util/auth";
import { parseCsv } from "../util/parse";
import { tenant } from "../util/tenant";
import { playersUploadLineError } from "../util/player-upload-validation";

const playerRouter: Router = new Router<IPlayer>();

playerRouter.get(
  "/players",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      ctx.body = await Player.find({ league: ctx.get("league") });
    } catch (error) {
      console.log(error);
      ctx.throw(500, error.message);
    }
  }
);

playerRouter.post(
  "/players",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = (await League.findById(
        ctx.get("league")
      )) as ILeague;
      const newPlayer: IPlayer = ctx.request.body;
      newPlayer.league = league._id;
      ctx.body = await Player.create(newPlayer);
      ctx.status = 201;
      console.log(ctx.body);
    } catch (error) {
      console.log(error);
      ctx.throw(400, error.message);
    }
  }
);

// tslint:disable-next-line: no-var-requires
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
    try {
      const players = parseCsv(ctx.request.body.players.toString(), [
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
      const league: ILeague = (await League.findById(
        ctx.get("league")
      )) as ILeague;
      Player.insertPlayers(players, league);
      ctx.body = playersLength;
      ctx.status = 201;
    } catch (error) {
      console.log(error);
      ctx.throw(400, error.message);
    }
  }
);

playerRouter.get(
  "/players/upload-percentage",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = (await League.findById(
        ctx.get("league")
      )) as ILeague;
      ctx.body = Player.uploadPercentage(league.id);
    } catch (error) {
      console.log(error);
      ctx.throw(500, error.message);
    }
  }
);

playerRouter.patch(
  "/players/:id",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = (await League.findById(
        ctx.get("league")
      )) as ILeague;
      const updatedPlayer: IPlayer = ctx.request.body;
      const playerToUpdate: IPlayer = (await Player.findOne({
        _id: ctx.params.id,
        league: league._id,
      })) as IPlayer;
      if (playerToUpdate == null) {
        ctx.throw(400, "Giocatore non trovato");
      }
      playerToUpdate.set(updatedPlayer);
      ctx.body = await playerToUpdate.save();
    } catch (error) {
      console.log(error);
      ctx.throw(400, error.message);
    }
  }
);

playerRouter.delete(
  "/players/:id",
  auth(),
  parseToken(),
  tenant(),
  admin(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = (await League.findById(
        ctx.get("league")
      )) as ILeague;
      const player = (await Player.findOneAndDelete({
        _id: ctx.params.id,
        league: league._id,
      })) as IPlayer;
      if (player == null) {
        ctx.status = 404;
      }
      ctx.body = player;
    } catch (error) {
      console.log(error);
      ctx.throw(500, error.message);
    }
  }
);

export default playerRouter;
