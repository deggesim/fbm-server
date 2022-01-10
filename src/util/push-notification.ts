import * as webpush from "web-push";
import { FantasyTeam } from "../schemas/fantasy-team";
import { Fixture } from "../schemas/fixture";
import { ILeague } from "../schemas/league";
import {
  IPushSubscription,
  PushSubscription,
} from "../schemas/push-subscription";
import { IUser } from "../schemas/user";

const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY ? process.env.VAPID_PUBLIC_KEY : "",
  privateKey: process.env.VAPID_PRIVATE_KEY
    ? process.env.VAPID_PRIVATE_KEY
    : "",
};

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
  const fantasyTeam = await FantasyTeam.findById(fantasyTeamId);
  const fixture = await Fixture.findById(fixtureId);
  const subscriptions = await getAllSubscriptions(league);
  const filteredSubscriptions = subscriptions.filter(
    (sub: IPushSubscription) => sub.email !== email
  );

  const payload = {
    notification: {
      title: `Formazione inserita - ${league.name}`,
      body: `La squadra ${fantasyTeam?.name} ha inserito la formazione per la giornata ${fixture?.name}`,
      icon: "assets/icons/icon-96x96.png",
      badge: "assets/icons/icon-96x96.png",
      lang: "it-IT",
      tag: "nuova-formazione",
      renotify: true,
      data: {
        onActionClick: {
          default: { operation: "navigateLastFocusedOrOpen", url: "/" },
        },
      },
    },
  };

  filteredSubscriptions.forEach((sub: IPushSubscription) => {
    webpush
      .sendNotification(sub, JSON.stringify(payload))
      .catch(function (err: any) {
        console.log(err);
        throw err;
      });
  });
};
