import * as jsdom from "jsdom";
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

export const boxscore = async (performances: IPerformance[], url: string) => {
  const response = await fetch.default(url);
  let content = await response.text();
  const dom = new jsdom.JSDOM(content);
  const ht_match_scores: HTMLCollection = dom.window.document
    .getElementById("ht_match_scores")
    ?.querySelector("tbody")?.children as HTMLCollection;
  const vt_match_scores: HTMLCollection = dom.window.document
    .getElementById("vt_match_scores")
    ?.querySelector("tbody")?.children as HTMLCollection;

  const tabellinoCasa = calcolaBoxScore(ht_match_scores);
  const tabellinoTrasferta = calcolaBoxScore(vt_match_scores);

  for (const performance of performances) {
    await performance.populate("player").execPopulate();
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

function calcolaBoxScore(ht_match_scores: HTMLCollection): BoxScore[] {
  const length = ht_match_scores.length;
  console.log(length);
  const tabellinoCasa: BoxScore[] = [];
  for (let i = 0; i < length; i++) {
    const tableDatas = ht_match_scores[i]?.children;
    const tdLength = tableDatas.length;
    const boxScore: BoxScore = {};
    for (let j = 0; j < tdLength; j++) {
      const td: HTMLTableCellElement = tableDatas[j] as HTMLTableCellElement;
      if (i < length - 2) {
        // solo i giocatori: Squadra e totali li ignoriamo
        if (j == 0) {
          // colonna Numero COGNOME Nome
          const nsn = td.textContent
            ?.replace(/\r?\n|\r/g, "")
            .trim()
            .split(" ")
            .filter((char) => char) as string[];
          boxScore.name = `${nsn[2].toUpperCase()} ${nsn[1].toUpperCase()}`;
        } else if (j === 2) {
          boxScore.minutes = Number(td?.textContent);
        } else if (j == 24) {
          boxScore.ranking = Number(td?.textContent);
        } else if (j == 25) {
          boxScore.oer = Number(td?.textContent?.replace(",", "."));
        } else if (j == 26) {
          boxScore.plusMinus = Number(td?.textContent);
        }
      }
    }
    tabellinoCasa.push(boxScore);
  }
  return tabellinoCasa;
}
