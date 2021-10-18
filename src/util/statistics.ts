import { IFantasyRoster } from "../schemas/fantasy-roster";
import { IFantasyTeam } from "../schemas/fantasy-team";
import { ILeague, League } from "../schemas/league";
import { IPerformance, Performance } from "../schemas/performance";
import { IPlayer } from "../schemas/player";
import { IRealFixture } from "../schemas/real-fixture";
import { IRoster, Roster } from "../schemas/roster";
import { ITeam } from "../schemas/team";
import { buildParameters } from "./roster";

export interface PlayerStatistic {
  player: IPlayer;
  performances: IPerformance[];
  team: string;
  fantasyTeam: string;
  status: string;
  avgRanking: number;
  avgMinutes: number;
  avgGrade: number;
  rankingMinutesRatio: number;
}

export interface PlayerStatisticList {
  total: number;
  playerStatistics: PlayerStatistic[];
}

export const statistics = async (
  idLeague: string,
  page: number,
  limit: number,
  free: boolean,
  filter?: string
): Promise<PlayerStatisticList> => {
  const playerStatistics: PlayerStatistic[] = [];

  const league: ILeague = (await League.findById(idLeague)) as ILeague;
  const nextRealFixture: IRealFixture = await league.nextRealFixture();

  const aggregate = Performance.aggregate();
  aggregate
    .match({ league: league._id, minutes: { $gt: 0 } })
    .group({
      _id: "$player",
      avgRanking: { $avg: "$ranking" },
      avgMinutes: { $avg: "$minutes" },
      avgGrade: { $avg: "$grade" },
    })
    .project({
      player: "$_id",
      avgRanking: "$avgRanking",
      avgMinutes: "$avgMinutes",
      avgGrade: "$avgGrade",
      rankingMinutesRatio: { $divide: ["$avgRanking", "$avgMinutes"] },
    })
    .sort({ rankingMinutesRatio: -1 });

  let result = await Performance.aggregatePaginate(aggregate, {
    page: Number(page),
    limit: Number(limit),
  });

  for (const stat of result.docs) {
    const { avgRanking, avgMinutes, avgGrade, rankingMinutesRatio, player } =
      stat;
    const parameters = await buildParameters(
      league,
      nextRealFixture,
      free,
      filter,
      player
    );
    const roster = (await Roster.findOne(parameters)) as IRoster;

    await roster.populate({ path: "player" }).execPopulate();
    await roster.populate({ path: "team" }).execPopulate();
    await roster.populate({ path: "fantasyRoster" }).execPopulate();
    const fantasyRoster = roster.fantasyRoster as IFantasyRoster;
    let fantasyTeam = "",
      status = "";
    if (fantasyRoster) {
      await fantasyRoster.populate({ path: "fantasyTeam" }).execPopulate();
      fantasyTeam = fantasyRoster.fantasyTeam
        ? (fantasyRoster.fantasyTeam as IFantasyTeam).name
        : "";
      status = fantasyRoster.status;
    }
    const playerObj = roster.player as IPlayer;
    await playerObj.populate({ path: "performances" }).execPopulate();
    for (const performance of (playerObj as any).performances) {
      await performance.populate({ path: "realFixture" }).execPopulate();
    }
    const performances: IPerformance[] = (playerObj as any).performances;

    const playerStatistic: PlayerStatistic = {
      player: playerObj,
      performances,
      team: (roster.team as ITeam).fullName,
      fantasyTeam,
      status,
      avgRanking,
      avgMinutes,
      avgGrade,
      rankingMinutesRatio,
    };
    playerStatistics.push(playerStatistic);
  }

  return Promise.resolve({
    total: result.total,
    playerStatistics,
  });
};
