import { ObjectId } from "mongodb";
import { IPerformance, Performance } from "../schemas/performance";
import { IPlayer } from "../schemas/player";

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

export const statistics = async (
  idLeague: string
): Promise<PlayerStatistic[]> => {
  const playerStatistics: PlayerStatistic[] = [];

  const allPerformances = await Performance.find({ league: idLeague })
    .populate({ path: "player" })
    .populate({ path: "realFixture" });

    for (const performance of allPerformances) {
      console.log(performance);
    }

  return Promise.resolve(playerStatistics);
};
