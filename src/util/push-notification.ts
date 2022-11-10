import * as webpush from "web-push";
import { IFantasyRoster } from "../schemas/fantasy-roster";
import { FantasyTeam, IFantasyTeam } from "../schemas/fantasy-team";
import { Fixture, IFixture } from "../schemas/fixture";
import { ILeague } from "../schemas/league";
import { IPlayer } from "../schemas/player";
import {
  IPushSubscription,
  PushSubscription,
} from "../schemas/push-subscription";
import { IRoster } from "../schemas/roster";
import { IRound } from "../schemas/round";
import { IUser } from "../schemas/user";
import { entityNotFound, halfDownRound } from "../util/functions";

const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY ? process.env.VAPID_PUBLIC_KEY : "",
  privateKey: process.env.VAPID_PRIVATE_KEY
    ? process.env.VAPID_PRIVATE_KEY
    : "",
};

interface Payload {
  notification: {
    title: string;
    body: string;
    icon: string;
    badge: string;
    lang: string;
    tag: string;
    renotify: boolean;
    data: {
      onActionClick: {
        default: {
          operation: string;
          url: string;
        };
      };
    };
  };
}

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_MAILTO}`,
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const getAllSubscriptions = async (
  league: ILeague
): Promise<IPushSubscription[]> => {
  return PushSubscription.find({ league });
};

export const notifyLineup = async (
  league: ILeague,
  user: IUser,
  fantasyTeamId: string,
  fixtureId: string
) => {
  const email = user.email;
  const fantasyTeam = await FantasyTeam.findById(fantasyTeamId).exec();
  if (fantasyTeam == null) {
    throw new Error(entityNotFound("Fantasquadra", league._id, fantasyTeamId));
  }
  const fixture = await Fixture.findById(fixtureId).exec();
  if (fixture == null) {
    throw new Error(entityNotFound("Giornata", fixtureId));
  }
  await fixture.populate("round").execPopulate();
  const round: IRound = fixture.get("round");
  await round.populate("competition").execPopulate();
  const competition = round.get("competition");
  const subscriptions = await getAllSubscriptions(league);
  const filteredSubscriptions = subscriptions.filter(
    (sub: IPushSubscription) => sub.email !== email
  );

  const url = `/competitions/lineups?round=${round.id}&fixture=${fixture.id}&fantasyTeam=${fantasyTeam.id}`;
  const payload = {
    notification: {
      title: league.name,
      body: `La squadra ${fantasyTeam?.name} ha inserito la formazione per la competizione ${competition?.name}, ${round.name}, ${fixture.name}`,
      icon: "assets/icons/icon-96x96.png",
      badge: "assets/icons/badge.png",
      lang: "it-IT",
      tag: "nuova-formazione",
      renotify: true,
      data: {
        onActionClick: {
          default: { operation: "navigateLastFocusedOrOpen", url },
        },
      },
    },
  };

  sendToSubscribers(filteredSubscriptions, payload);
};

export const notifyTransaction = async (
  league: ILeague,
  user: IUser,
  fantasyRoster: IFantasyRoster,
  operation: "buy" | "update" | "release" | "remove"
) => {
  const email = user.email;
  const subscriptions = await getAllSubscriptions(league);
  const filteredSubscriptions = subscriptions.filter(
    (sub: IPushSubscription) => sub.email !== email
  );

  const fantasyTeam = fantasyRoster.fantasyTeam as IFantasyTeam;
  const player = (fantasyRoster?.roster as IRoster)?.player as IPlayer;
  const url = `/teams/fantasy-rosters?fantasyTeam=${fantasyTeam.id}`;

  let body = "";
  switch (operation) {
    case "buy":
      body = `La squadra ${fantasyTeam?.name} ha ingaggiato il giocatore ${player?.name} per un costo di ${fantasyRoster?.contract}`;
      break;
    case "update":
      body = `L'ingaggio del giocatore ${player?.name} da parte della squadra ${fantasyTeam?.name} è stato modificato`;
      break;
    case "release":
      body = `La squadra ${fantasyTeam?.name} ha rilasciato il giocatore ${
        player?.name
      } recuperando ${halfDownRound(fantasyRoster.contract, 2)} crediti`;
      break;
    case "remove":
      body = `La squadra ${fantasyTeam?.name} ha rimosso il giocatore ${player?.name} recuperando ${fantasyRoster?.contract} crediti`;
      break;
    default:
      break;
  }

  const payload = {
    notification: {
      title: league.name,
      body,
      icon: "assets/icons/icon-96x96.png",
      badge: "assets/icons/badge.png",
      lang: "it-IT",
      tag: "mercato-libero",
      renotify: true,
      data: {
        onActionClick: {
          default: { operation: "navigateLastFocusedOrOpen", url },
        },
      },
    },
  };

  sendToSubscribers(filteredSubscriptions, payload);
};

export const notifyFixtureCompleted = async (
  league: ILeague,
  fixture: IFixture
) => {
  await fixture.populate("round").execPopulate();
  const round: IRound = fixture.get("round");
  await round.populate("competition").execPopulate();
  const competition = round.get("competition");
  const subscriptions = await getAllSubscriptions(league);

  const url = `/competitions/calendar?round=${round.id}`;
  const payload = {
    notification: {
      title: league.name,
      body: `Il turno ${fixture.name} per la competizione ${competition?.name}, ${round.name} è stato completato`,
      icon: "assets/icons/icon-96x96.png",
      badge: "assets/icons/badge.png",
      lang: "it-IT",
      tag: "giornata-completata",
      renotify: true,
      data: {
        onActionClick: {
          default: { operation: "navigateLastFocusedOrOpen", url },
        },
      },
    },
  };

  sendToSubscribers(subscriptions, payload);
};

const sendToSubscribers = (
  subscriptions: IPushSubscription[],
  payload: Payload
) => {
  subscriptions.forEach((sub: IPushSubscription) => {
    webpush
      .sendNotification(sub, JSON.stringify(payload))
      .catch(function (err: any) {
        console.log(err);
        throw err;
      });
  });
};
