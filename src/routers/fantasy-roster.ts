import * as Koa from "koa";
import * as Router from "koa-router";
import { FantasyRoster, IFantasyRoster } from "../schemas/fantasy-roster";
import {
  FantasyRosterHistory,
  IFantasyRosterHistory,
} from "../schemas/fantasy-roster-history";
import { IFantasyTeam } from "../schemas/fantasy-team";
import { ILeague, League } from "../schemas/league";
import { IPlayer } from "../schemas/player";
import { IRealFixture } from "../schemas/real-fixture";
import { IRoster, Roster } from "../schemas/roster";
import { auth, parseToken } from "../util/auth";
import { halfDownRound } from "../util/functions";
import { notifyTransaction } from "../util/push-notification";
import { tenant } from "../util/tenant";

const fantasyRosterRouter: Router = new Router<IFantasyRoster>();

fantasyRosterRouter.get(
  "/fantasy-rosters/fantasy-team/:id/real-fixture/:realFixtureId",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const fantasyRosters: IFantasyRoster[] = await FantasyRoster.find({
        league: ctx.get("league"),
        fantasyTeam: ctx.params.id,
        realFixture: ctx.params.realFixtureId,
      });
      for (const fantasyRoster of fantasyRosters) {
        await fantasyRoster.populate("roster").execPopulate();
        await fantasyRoster.populate("roster.player").execPopulate();
        await fantasyRoster.populate("roster.team").execPopulate();
        await fantasyRoster.populate("fantasyTeam").execPopulate();
        await fantasyRoster.populate("realFixture").execPopulate();
      }
      ctx.body = fantasyRosters;
    } catch (error) {
      console.log(error);
      ctx.throw(500, error.message);
    }
  }
);

fantasyRosterRouter.get(
  "/fantasy-rosters/:id",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const fantasyRoster: IFantasyRoster = (await FantasyRoster.findOne({
        _id: ctx.params.id,
        league: ctx.get("league"),
      })) as IFantasyRoster;
      if (fantasyRoster == null) {
        ctx.throw(404, "Giocatore non trovato");
      }
      await fantasyRoster.populate("roster").execPopulate();
      await fantasyRoster.populate("fantasyTeam").execPopulate();
      await fantasyRoster.populate("realFixture").execPopulate();
      ctx.body = fantasyRoster;
    } catch (error) {
      console.log(error);
      ctx.throw(500, error.message);
    }
  }
);

fantasyRosterRouter.post(
  "/fantasy-rosters",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = (await League.findById(
        ctx.get("league")
      )) as ILeague;
      const newFantasyRoster: IFantasyRoster = ctx.request.body;
      newFantasyRoster.league = league._id;
      const nextRealFixture: IRealFixture = await league.nextRealFixture();
      newFantasyRoster.realFixture = nextRealFixture._id;

      if (newFantasyRoster.draft) {
        newFantasyRoster.yearContract = 1;
      }
      const fantasyRoster = await FantasyRoster.create(newFantasyRoster);

      // gestione fantasyTeam
      await buy(fantasyRoster);

      await fantasyRoster.populate("roster").execPopulate();
      await (fantasyRoster.roster as IRoster).populate("player").execPopulate();
      await fantasyRoster.populate("realFixture").execPopulate();

      // history
      const frh = {
        name: ((fantasyRoster.roster as IRoster).player as IPlayer).name,
        fantasyTeam: fantasyRoster.fantasyTeam,
        status: fantasyRoster.status,
        draft: fantasyRoster.draft,
        contract: fantasyRoster.contract,
        yearContract: fantasyRoster.yearContract,
        role: ((fantasyRoster.roster as IRoster).player as IPlayer).role,
        operation: "BUY",
        balance: -fantasyRoster.contract,
        realFixture: nextRealFixture,
        league,
      };
      await FantasyRosterHistory.create(frh);

      ctx.body = fantasyRoster;
      ctx.status = 201;
      const switchOffNotifications =
        process.env.SWITCH_OFF_NOTIFICATIONS === "true";
      if (!switchOffNotifications) {
        notifyTransaction(league, ctx.state.user, fantasyRoster, "buy");
      }
    } catch (error) {
      console.log(error);
      ctx.throw(500, error.message);
    }
  }
);

fantasyRosterRouter.patch(
  "/fantasy-rosters/:id",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = (await League.findById(
        ctx.get("league")
      )) as ILeague;
      const fantasyRosterToUpdate = (await FantasyRoster.findOne({
        _id: ctx.params.id,
        league,
      })) as IFantasyRoster;
      await fantasyRosterToUpdate.populate("roster").execPopulate();
      await (fantasyRosterToUpdate.roster as IRoster)
        .populate("player")
        .execPopulate();
      await fantasyRosterToUpdate.populate("fantasyTeam").execPopulate();

      // gestione fantasyTeam
      await remove(fantasyRosterToUpdate);

      // history (remove)
      const nextRealFixture: IRealFixture = await league.nextRealFixture();
      const frh1 = {
        name: ((fantasyRosterToUpdate.roster as IRoster).player as IPlayer)
          .name,
        fantasyTeam: fantasyRosterToUpdate.fantasyTeam,
        status: fantasyRosterToUpdate.status,
        draft: fantasyRosterToUpdate.draft,
        contract: fantasyRosterToUpdate.contract,
        yearContract: fantasyRosterToUpdate.yearContract,
        role: ((fantasyRosterToUpdate.roster as IRoster).player as IPlayer)
          .role,
        operation: "REMOVE",
        balance: fantasyRosterToUpdate.contract,
        realFixture: nextRealFixture,
        league,
      };
      await FantasyRosterHistory.create(frh1);

      const values = ctx.request.body;
      const { fantasyTeam, status, draft, contract, yearContract } = values;
      const updatedFantasyRoster = {
        fantasyTeam,
        status,
        draft,
        contract,
        yearContract,
      };
      if (fantasyRosterToUpdate == null) {
        ctx.throw(404, "Giocatore non trovato");
      }
      fantasyRosterToUpdate.set(updatedFantasyRoster);

      if (fantasyRosterToUpdate.draft) {
        fantasyRosterToUpdate.yearContract = 1;
      }
      const fantasyRoster = await fantasyRosterToUpdate.save();

      // gestione fantasyTeam
      await buy(fantasyRoster);

      await fantasyRoster.populate("roster").execPopulate();
      await (fantasyRoster.roster as IRoster).populate("player").execPopulate();
      await fantasyRoster.populate("fantasyTeam").execPopulate();
      await fantasyRoster.populate("realFixture").execPopulate();

      // history (remove)
      const frh2 = {
        name: ((fantasyRoster.roster as IRoster).player as IPlayer).name,
        fantasyTeam: fantasyRoster.fantasyTeam,
        status: fantasyRoster.status,
        draft: fantasyRoster.draft,
        contract: fantasyRoster.contract,
        yearContract: fantasyRoster.yearContract,
        role: ((fantasyRoster.roster as IRoster).player as IPlayer).role,
        operation: "BUY",
        balance: -fantasyRosterToUpdate.contract,
        realFixture: nextRealFixture,
        league,
      };
      await FantasyRosterHistory.create(frh2);

      ctx.body = fantasyRoster;
      const switchOffNotifications =
        process.env.SWITCH_OFF_NOTIFICATIONS === "true";
      if (!switchOffNotifications) {
        notifyTransaction(league, ctx.state.user, fantasyRoster, "update");
      }
    } catch (error) {
      console.log(error);
      ctx.throw(400, error.message);
    }
  }
);

fantasyRosterRouter.patch(
  "/fantasy-rosters/:id/switch",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = (await League.findById(
        ctx.get("league")
      )) as ILeague;
      const fantasyRosterToUpdate = (await FantasyRoster.findOne({
        _id: ctx.params.id,
        league,
      })) as IFantasyRoster;
      if (fantasyRosterToUpdate == null) {
        ctx.throw(404, "Giocatore non trovato");
      }
      await fantasyRosterToUpdate.populate("roster").execPopulate();
      await (fantasyRosterToUpdate.roster as IRoster)
        .populate("player")
        .execPopulate();
      await fantasyRosterToUpdate.populate("fantasyTeam").execPopulate();

      // history (trade out)
      const nextRealFixture: IRealFixture = await league.nextRealFixture();
      const frh1 = {
        name: ((fantasyRosterToUpdate.roster as IRoster).player as IPlayer)
          .name,
        fantasyTeam: fantasyRosterToUpdate.fantasyTeam,
        status: fantasyRosterToUpdate.status,
        draft: fantasyRosterToUpdate.draft,
        contract: fantasyRosterToUpdate.contract,
        yearContract: fantasyRosterToUpdate.yearContract,
        role: ((fantasyRosterToUpdate.roster as IRoster).player as IPlayer)
          .role,
        operation: "TRADE_OUT",
        balance: 0,
        realFixture: nextRealFixture,
        league,
      };
      await FantasyRosterHistory.create(frh1);

      const values = ctx.request.body;
      const { fantasyTeam } = values;
      const updatedFantasyRoster = {
        fantasyTeam,
        yearContract: 1,
      };
      fantasyRosterToUpdate.set(updatedFantasyRoster);
      const fantasyRoster = await fantasyRosterToUpdate.save();
      await fantasyRoster.populate("roster").execPopulate();
      await (fantasyRoster.roster as IRoster).populate("player").execPopulate();
      await fantasyRoster.populate("fantasyTeam").execPopulate();
      await fantasyRoster.populate("realFixture").execPopulate();

      // history (trade in)
      const frh2 = {
        name: ((fantasyRoster.roster as IRoster).player as IPlayer).name,
        fantasyTeam: fantasyRoster.fantasyTeam,
        status: fantasyRoster.status,
        draft: fantasyRoster.draft,
        contract: fantasyRoster.contract,
        yearContract: fantasyRoster.yearContract,
        role: ((fantasyRoster.roster as IRoster).player as IPlayer).role,
        operation: "TRADE_IN",
        balance: 0,
        realFixture: nextRealFixture,
        league,
      };
      await FantasyRosterHistory.create(frh2);

      ctx.body = fantasyRoster;
    } catch (error) {
      console.log(error);
      ctx.throw(400, error.message);
    }
  }
);

fantasyRosterRouter.delete(
  "/fantasy-rosters/:id/release",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = (await League.findById(
        ctx.get("league")
      )) as ILeague;
      const fantasyRoster = (await FantasyRoster.findOneAndDelete({
        _id: ctx.params.id,
        league,
      })) as IFantasyRoster;
      if (fantasyRoster == null) {
        ctx.status = 404;
      }

      // gestione fantasyTeam
      await release(fantasyRoster);

      await fantasyRoster.populate("roster").execPopulate();
      await (fantasyRoster.roster as IRoster).populate("player").execPopulate();
      await fantasyRoster.populate("fantasyTeam").execPopulate();
      await fantasyRoster.populate("realFixture").execPopulate();

      // history
      const nextRealFixture: IRealFixture = await league.nextRealFixture();
      const frh = {
        name: ((fantasyRoster.roster as IRoster).player as IPlayer).name,
        fantasyTeam: fantasyRoster.fantasyTeam,
        status: fantasyRoster.status,
        draft: fantasyRoster.draft,
        contract: fantasyRoster.contract,
        yearContract: fantasyRoster.yearContract,
        role: ((fantasyRoster.roster as IRoster).player as IPlayer).role,
        operation: "RELEASE",
        balance: fantasyRoster.contract ? halfDownRound(fantasyRoster.contract, 2) : 0,
        realFixture: nextRealFixture,
        league,
      };
      await FantasyRosterHistory.create(frh);

      ctx.body = fantasyRoster;
      const switchOffNotifications =
        process.env.SWITCH_OFF_NOTIFICATIONS === "true";
      if (!switchOffNotifications) {
        notifyTransaction(league, ctx.state.user, fantasyRoster, "release");
      }
    } catch (error) {
      console.log(error);
      ctx.throw(500, error.message);
    }
  }
);

fantasyRosterRouter.delete(
  "/fantasy-rosters/:id/remove",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
      const league: ILeague = (await League.findById(
        ctx.get("league")
      )) as ILeague;
      const fantasyRoster = (await FantasyRoster.findOneAndDelete({
        _id: ctx.params.id,
        league,
      })) as IFantasyRoster;
      if (fantasyRoster == null) {
        ctx.status = 404;
      }

      // gestione fantasyTeam
      await remove(fantasyRoster);

      await fantasyRoster.populate("roster").execPopulate();
      await (fantasyRoster.roster as IRoster).populate("player").execPopulate();
      await fantasyRoster.populate("fantasyTeam").execPopulate();
      await fantasyRoster.populate("realFixture").execPopulate();

      // history
      const nextRealFixture: IRealFixture = await league.nextRealFixture();
      const frh = {
        name: ((fantasyRoster.roster as IRoster).player as IPlayer).name,
        fantasyTeam: fantasyRoster.fantasyTeam,
        status: fantasyRoster.status,
        draft: fantasyRoster.draft,
        contract: fantasyRoster.contract,
        yearContract: fantasyRoster.yearContract,
        role: ((fantasyRoster.roster as IRoster).player as IPlayer).role,
        operation: "REMOVE",
        balance: fantasyRoster.contract ? fantasyRoster.contract : 0,
        realFixture: nextRealFixture,
        league,
      };
      await FantasyRosterHistory.create(frh);

      ctx.body = fantasyRoster;
      const switchOffNotifications =
        process.env.SWITCH_OFF_NOTIFICATIONS === "true";
      if (!switchOffNotifications) {
        notifyTransaction(league, ctx.state.user, fantasyRoster, "remove");
      }
    } catch (error) {
      console.log(error);
      ctx.throw(500, error.message);
    }
  }
);

const buy = async (fantasyRoster: IFantasyRoster) => {
  // legame bidirezionale tra roster e fantasyRoster
  await Roster.findByIdAndUpdate(fantasyRoster.roster, {
    fantasyRoster: fantasyRoster._id,
  });
  // agiornamento dati fantasyTeam
  await fantasyRoster.populate("fantasyTeam").execPopulate();
  const fantasyTeam: IFantasyTeam = fantasyRoster.fantasyTeam as IFantasyTeam;
  if (!fantasyRoster.draft) {
    fantasyTeam.outgo += fantasyRoster.contract;
  }
  if (fantasyRoster.status === "EXT") {
    fantasyTeam.extraPlayers++;
  }
  fantasyTeam.playersInRoster++;
  fantasyTeam.totalContracts++;
  await fantasyTeam.save();
};

const release = async (fantasyRoster: IFantasyRoster) => {
  // legame bidirezionale tra roster e fantasyRoster
  await Roster.findByIdAndUpdate(fantasyRoster.roster, {
    $unset: { fantasyRoster: "" },
  });
  // agiornamento dati fantasyTeam
  await fantasyRoster.populate("fantasyTeam").execPopulate();
  const fantasyTeam: IFantasyTeam = fantasyRoster.fantasyTeam as IFantasyTeam;
  if (!fantasyRoster.draft) {
    fantasyTeam.outgo -= halfDownRound(fantasyRoster.contract, 2);
  }
  fantasyTeam.playersInRoster--;
  await fantasyTeam.save();
};

const remove = async (fantasyRoster: IFantasyRoster) => {
  // legame bidirezionale tra roster e fantasyRoster
  await Roster.findByIdAndUpdate(fantasyRoster.roster, {
    $unset: { fantasyRoster: "" },
  });
  // agiornamento dati fantasyTeam
  await fantasyRoster.populate("fantasyTeam").execPopulate();
  const fantasyTeam: IFantasyTeam = fantasyRoster.fantasyTeam as IFantasyTeam;
  if (!fantasyRoster.draft) {
    fantasyTeam.outgo -= fantasyRoster.contract;
  }
  if (fantasyRoster.status === "EXT") {
    fantasyTeam.extraPlayers--;
  }
  fantasyTeam.playersInRoster--;
  fantasyTeam.totalContracts--;
  await fantasyTeam.save();
};

export default fantasyRosterRouter;
