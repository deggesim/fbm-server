import { ILeague, League } from "../schemas/league";
import { IPerformance } from "../schemas/performance";
import { IPlayer } from "../schemas/player";
import { Roster } from "../schemas/roster";

export interface PlayerStatistic {
  player: IPlayer;
  performances?: IPerformance[];
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

  const aggregate = Roster.aggregate();
  aggregate
    .match({ league: league._id })
    .lookup({
      from: "players",
      localField: "player",
      foreignField: "_id",
      as: "player",
    })
    .unwind("$player")
    .lookup({
      from: "teams",
      localField: "team",
      foreignField: "_id",
      as: "team",
    })
    .unwind("$team")
    .lookup({
      from: "fantasyrosters",
      localField: "fantasyRoster",
      foreignField: "_id",
      as: "fantasyRoster",
    })
    .unwind("$fantasyRoster")
    .lookup({
      from: "fantasyteams",
      localField: "fantasyRoster.fantasyTeam",
      foreignField: "_id",
      as: "fantasyRoster.fantasyTeam",
    })
    .unwind("$fantasyRoster.fantasyTeam")
    .lookup({
      from: "performances",
      as: "performance",
      localField: "player._id",
      foreignField: "player",
    })
    .unwind("$performance")
    .match({ "performance.minutes": { $gt: 0 } })
    .group({
      _id: "$player",
      team: { $first: "$team" },
      fantasyRoster: { $first: "$fantasyRoster" },
      avgRanking: { $avg: "$performance.ranking" },
      avgMinutes: { $avg: "$performance.minutes" },
      avgGrade: { $avg: "$performance.grade" },
    })
    .project({
      player: "$_id",
      team: "$team",
      fantasyRoster: "$fantasyRoster",
      avgRanking: "$avgRanking",
      avgMinutes: "$avgMinutes",
      avgGrade: "$avgGrade",
      rankingMinutesRatio: { $divide: ["$avgRanking", "$avgMinutes"] },
    })
    .sort({ rankingMinutesRatio: -1 });

  let result = await Roster.aggregatePaginate(aggregate, {
    page: Number(page),
    limit: Number(limit),
  });

  for (const stat of result.docs) {
    const {
      avgRanking,
      avgMinutes,
      avgGrade,
      rankingMinutesRatio,
      player,
      team,
      fantasyRoster,
    } = stat;
    const playerStatistic: PlayerStatistic = {
      player,
      team: team ? team.fullName : null,
      fantasyTeam: fantasyRoster.fantasyTeam
        ? fantasyRoster.fantasyTeam.name
        : null,
      status: fantasyRoster.status,
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
