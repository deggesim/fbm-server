import { ILineup } from '../schemas/lineup';
import { IMatch } from '../schemas/match';
import { IPerformance } from '../schemas/performance';
import { AppConfig } from './globals';

export const computeResult = (
  selectedMatch: IMatch,
  homeMatchReport: ILineup[],
  awayMatchReport: ILineup[],
  homeFactor: number,
  drawAllowed: boolean,
  currentPerformances: IPerformance[],
  previousPerformances: IPerformance[],
  resultWithGrade: boolean,
  resultWithOer: boolean,
  resultWithPlusMinus: boolean,
  resultDivisor: number): IMatch => {

  const minutesNeeded: Map<number, number> = new Map<number, number>();

  // HOME
  homeMatchReport.sort((a: ILineup, b: ILineup) => a.spot - b.spot);
  startersMinutes(homeMatchReport, currentPerformances, minutesNeeded);
  benchMinutes(homeMatchReport);
  let homeRanking = ranking(homeMatchReport);

  let homePartialResult = 0;
  let homeOer = 0;
  let homePlusMinus = 0;
  let homeGrade = 0;

  if (resultWithOer) {
    homeOer = oer(homeMatchReport);
  }
  if (resultWithPlusMinus) {
    homePlusMinus = plusMinus(homeMatchReport);
  }
  if (resultWithGrade) {
    homeGrade = grade(homeMatchReport, previousPerformances);
  }

  homePartialResult = homeRanking + homeFactor + homeOer + homePlusMinus + homeGrade;
  let homeFinalResult = getFinalResult(homePartialResult, resultDivisor);

  // AWAY
  awayMatchReport.sort((a: ILineup, b: ILineup) => a.spot - b.spot);
  startersMinutes(awayMatchReport, currentPerformances, minutesNeeded);
  benchMinutes(awayMatchReport);

  let awayRanking = ranking(awayMatchReport);
  let awayPartialResult = 0;
  let awayOer = 0;
  let awayPlusMinus = 0;
  let awayGrade = 0;

  if (resultWithOer) {
    awayOer = oer(awayMatchReport);
  }
  if (resultWithPlusMinus) {
    awayPlusMinus = plusMinus(awayMatchReport);
  }
  if (resultWithGrade) {
    awayGrade = grade(awayMatchReport, previousPerformances);
  }

  awayPartialResult = awayRanking + awayOer + awayPlusMinus + awayGrade;
  let awayFinalResult = getFinalResult(awayPartialResult, resultDivisor);

  // OT
  let overtime = 0;
  if ((!drawAllowed && (homeFinalResult === awayFinalResult))) {
    // overtime needed. Store both match reports to show partial performances
    selectedMatch.homeRanking40Min = homeRanking;
    selectedMatch.awayRanking40Min = awayRanking;

    for (const matchReportDTO of homeMatchReport) {
      matchReportDTO.matchReport.realRanking40Min = matchReportDTO.matchReport.realRanking;
    }

    for (const matchReportDTO of awayMatchReport) {
      matchReportDTO.matchReport.realRanking40Min = matchReportDTO.matchReport.realRanking;
    }

  }
  while (!drawAllowed && (homeFinalResult === awayFinalResult)) {
    overtime++;
    // il pareggio non è consentito, calcolo i supplementari

    // memorizzazione dell'esito dell'iterazione precedente per evitare loop infiniti ed uscire comunque con un pareggio
    const prevHomeFinalResult = homeFinalResult;
    const prevAwayFinalResult = awayFinalResult;

    otStartersMinutes(homeMatchReport);
    otBenchMinutes(homeMatchReport);
    homeRanking = ranking(homeMatchReport);
    if (resultWithGrade) {
      homePartialResult = homeRanking + homeFactor + homeGrade;
    } else {
      homePartialResult = homeRanking + homeFactor;
    }
    homeFinalResult = getFinalResult(homePartialResult, resultDivisor);

    otStartersMinutes(awayMatchReport);
    otBenchMinutes(awayMatchReport);
    awayRanking = ranking(awayMatchReport);
    if (resultWithGrade) {
      awayPartialResult = awayRanking + awayGrade;
    } else {
      awayPartialResult = awayRanking;
    }
    awayFinalResult = getFinalResult(awayPartialResult, resultDivisor);

    if (prevHomeFinalResult === homeFinalResult && prevAwayFinalResult === awayFinalResult) {
      // usiamo il tie-breaker
      const homeWinner = otTieBreak(homeMatchReport, awayMatchReport);
      if (homeWinner) {
        homeFinalResult += 1;
      } else {
        awayFinalResult += 1;
      }
      break;
    }
  }

  selectedMatch.homeRanking = homeRanking;
  selectedMatch.homeGrade = homeGrade;
  selectedMatch.homeScore = homeFinalResult;
  selectedMatch.awayRanking = awayRanking;
  selectedMatch.awayGrade = awayGrade;
  selectedMatch.awayScore = awayFinalResult;
  if (overtime > 0) {
    selectedMatch.overtime = overtime;
  }

  return selectedMatch;
};

// FUNZIONI DI SUPPORTO
// **************************************************************************************************************************************************

const startersMinutes = (lineup: ILineup[], performances: IPerformance[], minutesNeeded: Map<number, number>) => {
  const starters = lineup.slice(0, AppConfig.Starters);

  // itero solo i titolari
  for (const starter of starters) {
    const performance = performances.find((perf: IPerformance) => perf.player._id === starter.fantasyRoster.roster.player._id);
    const spot = starter.spot;
    const minutes = performance?.minutes != null ? performance.minutes : 0;
    let minutesNeededValue = 0;
    let minutesUsed = 0;
    if (minutes < 40) {
      // se i minuti giocati sono 40 o meno prendo tutti i minuti
      minutesNeededValue = 40 - minutes;
      minutesUsed = minutes;
    } else {
      // altrimenti prendo tutti i 40 minuti
      minutesNeededValue = 0;
      minutesUsed = 40;
    }
    starter.matchReport.minutesUsed = minutesUsed;
    minutesNeeded.set(spot, minutesNeededValue);
  }
};

const benchMinutes = (benchPlayers: ILineup[]) => {
  // TODO
};

const otStartersMinutes = (starters: ILineup[]) => {
  // TODO
};

const otBenchMinutes = (benchPlayers: ILineup[]) => {
  // TODO
};

const ranking = (starters: ILineup[]): number => {
  const ret = 0;
  return ret;
};

const oer = (matchReport: ILineup[]): number => {
  const ret = 0;
  return ret;
};

const plusMinus = (matchReport: ILineup[]): number => {
  const ret = 0;
  return ret;
};

const grade = (matchReport: ILineup[], previousPerformances: IPerformance[]): number => {
  const ret = 0;
  return ret;
};

const getFinalResult = (partialResult: number, resultDivisor: number): number => {
  const ret = 0;
  return ret;
};

const otTieBreak = (homeMatchReport: ILineup[], awayMatchReport: ILineup[]): boolean => {
  const ret = false;
  return ret;
};
