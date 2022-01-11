import * as webpush from "web-push";
import { FantasyTeam } from "../schemas/fantasy-team";
import { Fixture, IFixture } from "../schemas/fixture";
import { ILeague } from "../schemas/league";
import {
  IPushSubscription,
  PushSubscription
} from "../schemas/push-subscription";
import { IRound } from "../schemas/round";
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
  const fixture: IFixture = (await Fixture.findById(fixtureId)) as IFixture;
  await fixture?.populate("round").execPopulate();
  const round: IRound = fixture?.get("round");
  await round.populate("competition").execPopulate();
  const competition = round.get("competition");
  console.log(round.name);
  console.log(competition.name);
  const subscriptions = await getAllSubscriptions(league);
  const filteredSubscriptions = subscriptions.filter(
    (sub: IPushSubscription) => sub.email !== email
  );

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
