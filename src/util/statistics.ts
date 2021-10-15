import { mean } from "lodash";
import { ObjectId } from "mongodb";
import { Aggregate, PaginateResult } from "mongoose";
import { IFantasyRoster } from "../schemas/fantasy-roster";
import { IFantasyTeam } from "../schemas/fantasy-team";
import { ILeague, League } from "../schemas/league";
import { IPerformance, Performance } from "../schemas/performance";
import { IPlayer, Player } from "../schemas/player";
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

  // const parameters = await buildParameters(
  //   league,
  //   nextRealFixture,
  //   free,
  //   filter
  // );
  // const result: PaginateResult<IRoster> = await Roster.paginate(parameters, {
  //   page: Number(page),
  //   limit: Number(limit),
  // });

  // for (const roster of result.docs) {
    // await roster.populate({ path: "player" }).execPopulate();
    // await roster.populate({ path: "team" }).execPopulate();
    // await roster.populate({ path: "fantasyRoster" }).execPopulate();
    // const fantasyRoster = roster.fantasyRoster as IFantasyRoster;
    // let fantasyTeam = "",
    //   status = "";
    // if (fantasyRoster) {
    //   await fantasyRoster.populate({ path: "fantasyTeam" }).execPopulate();
    //   fantasyTeam = fantasyRoster.fantasyTeam
    //     ? (fantasyRoster.fantasyTeam as IFantasyTeam).name
    //     : "";
    //   status = fantasyRoster.status;
    // }
    // const player = roster.player as IPlayer;
    // await player.populate({ path: "performances" }).execPopulate();
    // const performances: IPerformance[] = (player as any).performances;
    // const filteredPerformances = performances.filter((perf) => perf.minutes);
    // const rankings = filteredPerformances.map((performance: IPerformance) => performance.ranking);
    // const avgRanking = mean(rankings);
    // const minutes = filteredPerformances.map((performance: IPerformance) => performance.minutes);
    // const avgMinutes = mean(minutes);
    // const grades = filteredPerformances.map((performance: IPerformance) => performance.grade);
    // const avgGrade = mean(grades);
    // const playerStatistic: PlayerStatistic = {
    //   player,
    //   performances: filteredPerformances,
    //   team: (roster.team as ITeam).fullName,
    //   fantasyTeam,
    //   status,
    //   avgRanking,
    //   avgMinutes,
    //   avgGrade,
    //   rankingMinutesRatio: avgRanking / avgMinutes,
    // };
    // playerStatistics.push(playerStatistic);
  // }

  const aggregate = Performance.aggregate();
  aggregate.unwind('$player');
  aggregate.match({ league: league._id, minutes: { $gt: 0 } })
  .group({
    _id: "$player",
    avgRanking: { $avg: "$ranking" },
    avgMinutes: { $avg: "$minutes" },
    avgGrade: { $avg: "$grade" },
  }).project({
    player: "$_id",
    avgRanking: "$avgRanking",
    avgMinutes: "$avgMinutes",
    avgGrade: "$avgGrade",
    rankingMinutesRatio: { $divide: ["$avgRanking", "$avgMinutes"] },
  },
).sort({ rankingMinutesRatio: -1 });
  // [
  //   { $match: { league: league._id, minutes: { $gt: 0 } } },
  //   {
  //     $group: {
  //       _id: "$player",
  //       avgRanking: { $avg: "$ranking" },
  //       avgMinutes: { $avg: "$minutes" },
  //       avgGrade: { $avg: "$grade" },
  //     },
  //   },
  //   {
  //     $project: {
  //       player: "$_id",
  //       avgRanking: "$avgRanking",
  //       avgMinutes: "$avgMinutes",
  //       avgGrade: "$avgGrade",
  //       rankingMinutesRatio: { $divide: ["$avgRanking", "$avgMinutes"] },
  //     },
  //   },
  //   { $sort: { rankingMinutesRatio: -1 } },
  // ]);

  let result = await Performance.aggregatePaginate(aggregate, {
    page: Number(page),
    limit: Number(limit),
  })
  // result = await Player.populate(result, { path: "player"});

  console.log(result);

  return Promise.resolve({ total: result.total, playerStatistics: result.docs });
};
