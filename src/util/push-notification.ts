import * as webpush from "web-push";
import { FantasyTeam, IFantasyTeam } from "../schemas/fantasy-team";
import { Fixture, IFixture } from "../schemas/fixture";
import { ILeague } from "../schemas/league";
import {
  IPushSubscription,
  PushSubscription,
} from "../schemas/push-subscription";
import { IRound } from "../schemas/round";
import { IUser } from "../schemas/user";

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
  const fantasyTeam: IFantasyTeam = (await FantasyTeam.findById(
    fantasyTeamId
  )) as IFantasyTeam;
  const fixture: IFixture = (await Fixture.findById(fixtureId)) as IFixture;
  await fixture?.populate("round").execPopulate();
  const round: IRound = fixture?.get("round");
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

export const notifyFixtureCompleted = async (
  league: ILeague,
  fixture: IFixture
) => {
  await fixture.populate("round").execPopulate();
  const round: IRound = fixture.get("round");
  await round.populate("competition").execPopulate();
  const competition = round.get("competition");
  const subscriptions = await getAllSubscriptions(league);

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
          default: { operation: "navigateLastFocusedOrOpen", url: "/" },
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
