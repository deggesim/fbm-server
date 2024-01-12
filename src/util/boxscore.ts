import * as fetch from "node-fetch";
import { IPerformance } from "../schemas/performance";
import { IPlayer } from "../schemas/player";

interface BoxScore {
  name?: string;
  minutes?: number;
  ranking?: number;
  oer?: number;
  plusMinus?: number;
}

interface LegabasketBoxscore {
  scores: Scores;
}

interface Scores {
  ht: LegabasketPerformances;
  vt: LegabasketPerformances;
}

export interface LegabasketPerformances {
  rows: LegabasketPerformance[];
}

export interface LegabasketPerformance {
  player_id?: number;
  player_num?: number;
  player_surname?: string;
  player_name?: string;
  player_p_key?: null | string;
  pun: number;
  min: number;
  sf?: string;
  falli_c: number;
  falli_sf: number;
  t2_r: number;
  t2_t: number;
  t2_perc: number;
  sc: number;
  t3_r: number;
  t3_t: number;
  t3_perc: number;
  tl_r: number;
  tl_t: number;
  tl_perc: number;
  rimbalzi_o: number;
  rimbalzi_d: number;
  rimbalzi_t: number;
  stoppate_dat: number;
  stoppate_sub: number;
  palle_p: number;
  palle_r: number;
  ass: number;
  val_lega: number;
  val_oer: number;
  plus_minus?: number;
}

export const boxscore = async (performances: IPerformance[], url: string) => {
  const tokenResponse = await fetch.default(
    "https://www.legabasket.it/api/oauth"
  );
  const tokenValue = await tokenResponse.text();
  const tokenObj = JSON.parse(tokenValue);
  const token = tokenObj.data.token;
  const gameId = url.split("/")[4];
  const headers = new fetch.Headers();
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch.default(
    `https://api-lba.procne.cloud/api/v1/championships_matches/${gameId}/scores`,
    { headers }
  );
  const boxscoreJSON = await response.text();
  const boxscore: LegabasketBoxscore = JSON.parse(boxscoreJSON);
  const ht = boxscore.scores.ht.rows as LegabasketPerformance[];
  const vt = boxscore.scores.vt.rows as LegabasketPerformance[];
  const tabellinoCasa = calcolaBoxScore(ht);
  const tabellinoTrasferta = calcolaBoxScore(vt);

  for (const performance of performances) {
    await performance.populate("player");
    const playerName = (performance.player as IPlayer).name.toUpperCase();
    const boxScoreC = tabellinoCasa.find(
      (bs: BoxScore) => bs.name === playerName
    );
    if (boxScoreC) {
      performance.minutes = boxScoreC.minutes;
      performance.ranking = boxScoreC.ranking;
      performance.oer = boxScoreC.oer;
      performance.plusMinus = boxScoreC.plusMinus;
      await performance.save();
    } else {
      const boxScoreT = tabellinoTrasferta.find(
        (bs: BoxScore) => bs.name === playerName
      );
      if (boxScoreT) {
        performance.minutes = boxScoreT.minutes;
        performance.ranking = boxScoreT.ranking;
        performance.oer = boxScoreT.oer;
        performance.plusMinus = boxScoreT.plusMinus;
        await performance.save();
      }
    }
  }
};

function calcolaBoxScore(performances: LegabasketPerformance[]): BoxScore[] {
  const tabellino: BoxScore[] = [];

  performances.forEach((player) => {
    const boxScore: BoxScore = {};
    boxScore.name = `${player.player_name!.toUpperCase()} ${player.player_surname!.toUpperCase()}`;
    boxScore.minutes = player.min;
    boxScore.ranking = player.val_lega;
    boxScore.oer = player.val_oer;
    boxScore.plusMinus = player.plus_minus;
    tabellino.push(boxScore);
  });
  return tabellino;
}

function isNumeric(str: any) {
  if (typeof str != "string") return false; // we only process strings!
  return (
    !isNaN(str as any) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  ); // ...and ensure strings of whitespace fail
}
