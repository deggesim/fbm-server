import * as Koa from "koa";
import * as Router from "koa-router";
import { FantasyRoster, IFantasyRoster } from "../schemas/fantasy-roster";
import { IFantasyTeam } from "../schemas/fantasy-team";
import { ILeague } from "../schemas/league";
import { IRealFixture } from "../schemas/real-fixture";
import { IRoster, Roster } from "../schemas/roster";
import { auth, parseToken } from "../util/auth";
import { entityNotFound, getLeague, halfDownRound } from "../util/functions";
import { writeHistory } from "../util/history";
import { notifyTransaction } from "../util/push-notification";
import { tenant } from "../util/tenant";

const fantasyRosterRouter: Router = new Router<IFantasyRoster>();

fantasyRosterRouter.get(
  "/fantasy-rosters/fantasy-team/:id/real-fixture/:realFixtureId",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const fantasyRosters: IFantasyRoster[] = await FantasyRoster.find({
      league: ctx.get("league"),
      fantasyTeam: ctx.params.id,
      realFixture: ctx.params.realFixtureId,
    }).exec();
    for (const fantasyRoster of fantasyRosters) {
      await fantasyRoster.populate("roster");
      await fantasyRoster.populate("roster.player");
      await fantasyRoster.populate("roster.team");
      await fantasyRoster.populate("fantasyTeam");
      await fantasyRoster.populate("realFixture");
    }
    ctx.body = fantasyRosters;
  }
);

fantasyRosterRouter.get(
  "/fantasy-rosters/:id",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const fantasyRoster = await FantasyRoster.findOne({
      _id: ctx.params.id,
      league: ctx.get("league"),
    }).exec();
    if (fantasyRoster == null) {
      ctx.throw(
        entityNotFound("FantasyRoster", ctx.params.id, ctx.get("league")),
        404
      );
    }
    await fantasyRoster.populate("roster");
    await fantasyRoster.populate("fantasyTeam");
    await fantasyRoster.populate("realFixture");
    ctx.body = fantasyRoster;
  }
);

fantasyRosterRouter.post(
  "/fantasy-rosters",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.get("league"));
    const newFantasyRoster: IFantasyRoster = ctx.request.body as IFantasyRoster;
    newFantasyRoster.league = league._id;
    const nextRealFixture: IRealFixture = await league.nextRealFixture();
    newFantasyRoster.realFixture = nextRealFixture._id;

    if (newFantasyRoster.draft) {
      newFantasyRoster.yearContract = 1;
    }
    const fantasyRoster = await FantasyRoster.create(newFantasyRoster);

    // gestione fantasyTeam
    await buy(fantasyRoster);

    await fantasyRoster.populate("roster");
    await (fantasyRoster.roster as IRoster).populate("player");
    await fantasyRoster.populate("realFixture");

    // history
    let operation = "";
    const isPreseason = await league.isPreseason();
    if (isPreseason) {
      operation = fantasyRoster.draft ? "DRAFT" : "AUCTION_BUY";
    } else {
      operation = "BUY";
    }
    await writeHistory(
      operation,
      nextRealFixture,
      fantasyRoster.draft ? 0 : -fantasyRoster.contract,
      league,
      fantasyRoster.fantasyTeam as IFantasyTeam,
      fantasyRoster
    );

    ctx.body = fantasyRoster;
    ctx.status = 201;
    const switchOffNotifications =
      process.env.SWITCH_OFF_NOTIFICATIONS === "true";
    if (!switchOffNotifications) {
      notifyTransaction(league, ctx.state.user, fantasyRoster, "buy");
    }
  }
);

fantasyRosterRouter.patch(
  "/fantasy-rosters/:id",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.get("league"));
    const fantasyRosterToUpdate = await FantasyRoster.findOne({
      _id: ctx.params.id,
      league,
    }).exec();
    if (fantasyRosterToUpdate == null) {
      ctx.throw(
        entityNotFound("FantasyRoster", ctx.params.id, league._id),
        404
      );
    }
    await fantasyRosterToUpdate.populate("roster");
    await (fantasyRosterToUpdate.roster as IRoster).populate("player");
    await fantasyRosterToUpdate.populate("fantasyTeam");

    // gestione fantasyTeam
    await remove(fantasyRosterToUpdate);

    // history (remove)
    const {
      fantasyRoster,
      isPreseason,
      nextRealFixture,
    }: {
      fantasyRoster: IFantasyRoster;
      isPreseason: boolean;
      nextRealFixture: IRealFixture;
    } = await historyRemove(league, fantasyRosterToUpdate, ctx);

    // gestione fantasyTeam
    await buy(fantasyRoster);

    await fantasyRoster.populate("roster");
    await (fantasyRoster.roster as IRoster).populate("player");
    await fantasyRoster.populate("fantasyTeam");
    await fantasyRoster.populate("realFixture");

    // history (buy)
    await historyBuy(
      isPreseason,
      fantasyRoster,
      nextRealFixture,
      fantasyRosterToUpdate,
      league
    );

    ctx.body = fantasyRoster;
    const switchOffNotifications =
      process.env.SWITCH_OFF_NOTIFICATIONS === "true";
    if (!switchOffNotifications) {
      notifyTransaction(league, ctx.state.user, fantasyRoster, "update");
    }
  }
);

fantasyRosterRouter.patch(
  "/fantasy-rosters/:id/switch",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.get("league"));
    const fantasyRosterToUpdate = await FantasyRoster.findOne({
      _id: ctx.params.id,
      league,
    }).exec();
    if (fantasyRosterToUpdate == null) {
      ctx.throw(
        entityNotFound("FantasyRoster", ctx.params.id, league._id),
        404
      );
    }
    await fantasyRosterToUpdate.populate("roster");
    await (fantasyRosterToUpdate.roster as IRoster).populate("player");
    await fantasyRosterToUpdate.populate("fantasyTeam");

    // history (trade out)
    const nextRealFixture: IRealFixture = await league.nextRealFixture();
    await writeHistory(
      "TRADE_OUT",
      nextRealFixture,
      0,
      league,
      fantasyRosterToUpdate.fantasyTeam as IFantasyTeam,
      fantasyRosterToUpdate
    );

    const values = ctx.request.body as IFantasyRoster;
    const { fantasyTeam } = values;
    const updatedFantasyRoster = {
      fantasyTeam,
      yearContract: 1,
    };
    fantasyRosterToUpdate.set(updatedFantasyRoster);
    const fantasyRoster = await fantasyRosterToUpdate.save();
    await fantasyRoster.populate("roster");
    await (fantasyRoster.roster as IRoster).populate("player");
    await fantasyRoster.populate("fantasyTeam");
    await fantasyRoster.populate("realFixture");

    // history (trade in)
    await writeHistory(
      "TRADE_IN",
      nextRealFixture,
      0,
      league,
      fantasyRoster.fantasyTeam as IFantasyTeam,
      fantasyRoster
    );

    ctx.body = fantasyRoster;
  }
);

fantasyRosterRouter.delete(
  "/fantasy-rosters/:id/release",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.get("league"));
    const fantasyRoster = await FantasyRoster.findOneAndDelete({
      _id: ctx.params.id,
      league,
    }).exec();
    if (fantasyRoster == null) {
      ctx.throw(
        entityNotFound("FantasyRoster", ctx.params.id, league._id),
        404
      );
    }
    // gestione fantasyTeam
    await release(fantasyRoster);

    await fantasyRoster.populate("roster");
    await (fantasyRoster.roster as IRoster).populate("player");
    await fantasyRoster.populate("fantasyTeam");
    await fantasyRoster.populate("realFixture");

    // history (release)
    const nextRealFixture: IRealFixture = await league.nextRealFixture();
    await writeHistory(
      "RELEASE",
      nextRealFixture,
      fantasyRoster.contract ? halfDownRound(fantasyRoster.contract, 2) : 0,
      league,
      fantasyRoster.fantasyTeam as IFantasyTeam,
      fantasyRoster
    );
    ctx.body = fantasyRoster;
    const switchOffNotifications =
      process.env.SWITCH_OFF_NOTIFICATIONS === "true";
    if (!switchOffNotifications) {
      notifyTransaction(league, ctx.state.user, fantasyRoster, "release");
    }
  }
);

fantasyRosterRouter.delete(
  "/fantasy-rosters/:id/remove",
  auth(),
  parseToken(),
  tenant(),
  async (ctx: Router.IRouterContext, next: Koa.Next) => {
    const league: ILeague = await getLeague(ctx.get("league"));
    const fantasyRoster = await FantasyRoster.findOneAndDelete({
      _id: ctx.params.id,
      league,
    }).exec();
    if (fantasyRoster == null) {
      ctx.throw(
        entityNotFound("FantasyRoster", ctx.params.id, league._id),
        404
      );
    }
    // gestione fantasyTeam
    await remove(fantasyRoster);

    await fantasyRoster.populate("roster");
    await (fantasyRoster.roster as IRoster).populate("player");
    await fantasyRoster.populate("fantasyTeam");
    await fantasyRoster.populate("realFixture");

    // history (remove)
    const nextRealFixture: IRealFixture = await league.nextRealFixture();
    const operation = (await league.isPreseason())
      ? "AUCTION_REMOVE"
      : "REMOVE";
    await writeHistory(
      operation,
      nextRealFixture,
      fantasyRoster.draft ? 0 : fantasyRoster.contract,
      league,
      fantasyRoster.fantasyTeam as IFantasyTeam,
      fantasyRoster
    );
    ctx.body = fantasyRoster;
    const switchOffNotifications =
      process.env.SWITCH_OFF_NOTIFICATIONS === "true";
    if (!switchOffNotifications) {
      notifyTransaction(league, ctx.state.user, fantasyRoster, "remove");
    }
  }
);

const buy = async (fantasyRoster: IFantasyRoster) => {
  // legame bidirezionale tra roster e fantasyRoster
  await Roster.findByIdAndUpdate(fantasyRoster.roster, {
    fantasyRoster: fantasyRoster._id,
  }).exec();
  // agiornamento dati fantasyTeam
  await fantasyRoster.populate("fantasyTeam");
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
  }).exec();
  // agiornamento dati fantasyTeam
  await fantasyRoster.populate("fantasyTeam");
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
  }).exec();
  // agiornamento dati fantasyTeam
  await fantasyRoster.populate("fantasyTeam");
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

const historyBuy = async (
  isPreseason: boolean,
  fantasyRoster: IFantasyRoster,
  nextRealFixture: IRealFixture,
  fantasyRosterToUpdate: IFantasyRoster,
  league: ILeague
) => {
  let operation = "";
  if (isPreseason) {
    operation = fantasyRoster.draft ? "DRAFT" : "AUCTION_BUY";
  } else {
    operation = "BUY";
  }
  await writeHistory(
    operation,
    nextRealFixture,
    fantasyRoster.draft ? 0 : -fantasyRosterToUpdate.contract,
    league,
    fantasyRoster.fantasyTeam as IFantasyTeam,
    fantasyRoster
  );
};

const historyRemove = async (
  league: ILeague,
  fantasyRosterToUpdate: IFantasyRoster,
  ctx: Router.IRouterContext
) => {
  const isPreseason = await league.isPreseason();
  const nextRealFixture: IRealFixture = await league.nextRealFixture();
  await writeHistory(
    isPreseason ? "AUCTION_REMOVE" : "REMOVE",
    nextRealFixture,
    fantasyRosterToUpdate.draft ? 0 : fantasyRosterToUpdate.contract,
    league,
    fantasyRosterToUpdate.fantasyTeam as IFantasyTeam,
    fantasyRosterToUpdate
  );

  const values = ctx.request.body as IFantasyRoster;
  const { fantasyTeam, status, draft, contract, yearContract } = values;
  const updatedFantasyRoster = {
    fantasyTeam,
    status,
    draft,
    contract,
    yearContract,
  };
  if (fantasyRosterToUpdate == null) {
    ctx.throw(entityNotFound("FantasyRoster"), 404);
  }
  fantasyRosterToUpdate.set(updatedFantasyRoster);

  if (fantasyRosterToUpdate.draft) {
    fantasyRosterToUpdate.yearContract = 1;
  }
  const fantasyRoster = await fantasyRosterToUpdate.save();
  return { fantasyRoster, isPreseason, nextRealFixture };
};

export default fantasyRosterRouter;
