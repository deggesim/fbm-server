import { IFantasyRoster } from '../schemas/fantasy-roster';
import { ILineup } from '../schemas/lineup';
import { IMatch } from '../schemas/match';
import { IPerformance } from '../schemas/performance';
import { IPlayer } from '../schemas/player';
import { IRoster } from '../schemas/roster';
import { halfDownRound } from './functions';
import { AppConfig, isEmpty } from './globals';

export const computeResult = (
  match: IMatch,
  homeLineup: ILineup[],
  awayLineup: ILineup[],
  drawAllowed: boolean,
  previousPerformances: IPerformance[],
  resultWithGrade: boolean,
  resultWithOer: boolean,
  resultWithPlusMinus: boolean,
  resultDivisor: number) => {

  const minutesNeeded: Map<number, number> = new Map<number, number>();

  // HOME
  homeLineup.sort((a: ILineup, b: ILineup) => a.spot - b.spot);
  startersMinutes(homeLineup, minutesNeeded);
  benchMinutes(homeLineup, minutesNeeded);
  let homeRanking = ranking(homeLineup);

  let homePartialResult = 0;
  let homeOer = 0;
  let homePlusMinus = 0;
  let homeGrade = 0;

  if (resultWithOer) {
    homeOer = oer(homeLineup);
  }
  if (resultWithPlusMinus) {
    homePlusMinus = plusMinus(homeLineup);
  }
  if (resultWithGrade) {
    homeGrade = grade(homeLineup, previousPerformances);
  }

  homePartialResult = homeRanking + match.homeFactor + homeOer + homePlusMinus + homeGrade;
  let homeFinalResult = getFinalResult(homePartialResult, resultDivisor);

  // AWAY
  awayLineup.sort((a: ILineup, b: ILineup) => a.spot - b.spot);
  startersMinutes(awayLineup, minutesNeeded);
  benchMinutes(awayLineup, minutesNeeded);

  let awayRanking = ranking(awayLineup);
  let awayPartialResult = 0;
  let awayOer = 0;
  let awayPlusMinus = 0;
  let awayGrade = 0;

  if (resultWithOer) {
    awayOer = oer(awayLineup);
  }
  if (resultWithPlusMinus) {
    awayPlusMinus = plusMinus(awayLineup);
  }
  if (resultWithGrade) {
    awayGrade = grade(awayLineup, previousPerformances);
  }

  awayPartialResult = awayRanking + awayOer + awayPlusMinus + awayGrade;
  let awayFinalResult = getFinalResult(awayPartialResult, resultDivisor);

  // OT
  let overtime = 0;
  if ((!drawAllowed && (homeFinalResult === awayFinalResult))) {
    // overtime needed. Store both match reports to show partial performances
    match.homeRanking40Min = homeRanking;
    match.awayRanking40Min = awayRanking;

    for (const player of homeLineup) {
      player.matchReport.realRanking40Min = player.matchReport.realRanking;
    }

    for (const player of awayLineup) {
      player.matchReport.realRanking40Min = player.matchReport.realRanking;
    }

  }
  while (!drawAllowed && (homeFinalResult === awayFinalResult)) {
    overtime++;
    // il pareggio non è consentito, calcolo i supplementari

    // memorizzazione dell'esito dell'iterazione precedente per evitare loop infiniti ed uscire comunque con un pareggio
    const prevHomeFinalResult = homeFinalResult;
    const prevAwayFinalResult = awayFinalResult;

    otStartersMinutes(homeLineup, minutesNeeded);
    otBenchMinutes(homeLineup, minutesNeeded);
    homeRanking = ranking(homeLineup);
    if (resultWithGrade) {
      homePartialResult = homeRanking + match.homeFactor + homeGrade;
    } else {
      homePartialResult = homeRanking + match.homeFactor;
    }
    homeFinalResult = getFinalResult(homePartialResult, resultDivisor);

    otStartersMinutes(awayLineup, minutesNeeded);
    otBenchMinutes(awayLineup, minutesNeeded);
    awayRanking = ranking(awayLineup);
    if (resultWithGrade) {
      awayPartialResult = awayRanking + awayGrade;
    } else {
      awayPartialResult = awayRanking;
    }
    awayFinalResult = getFinalResult(awayPartialResult, resultDivisor);

    if (prevHomeFinalResult === homeFinalResult && prevAwayFinalResult === awayFinalResult) {
      // usiamo il tie-breaker
      const homeWinner = otTieBreak(homeLineup, awayLineup);
      if (homeWinner) {
        homeFinalResult += 1;
      } else {
        awayFinalResult += 1;
      }
      break;
    }
  }

  match.homeRanking = homeRanking;
  match.homeGrade = homeGrade;
  match.homeScore = homeFinalResult;
  match.awayRanking = awayRanking;
  match.awayGrade = awayGrade;
  match.awayScore = awayFinalResult;
  if (overtime > 0) {
    match.overtime = overtime;
  }

  // Persistenza
  for (const player of homeLineup) {
    player.save();
  }
  for (const player of awayLineup) {
    player.save();
  }
  match.completed = true;
  match.save();
};

// FUNZIONI DI SUPPORTO
// **************************************************************************************************************************************************

const startersMinutes = (lineup: ILineup[], minutesNeeded: Map<number, number>) => {
  const starters = lineup.slice(0, AppConfig.Starters);

  // itero solo i titolari
  for (const starter of starters) {
    const performance = starter.performance as IPerformance;
    const minutes = performance?.minutes != null ? performance.minutes : 0;
    const spot = starter.spot;
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

const benchMinutes = (lineup: ILineup[], minutesNeeded: Map<number, number>) => {
  const matchReportSize = lineup.length;
  const benchPlayers = lineup.slice(AppConfig.Starters, matchReportSize);
  if (!completedWithStarters(minutesNeeded)) {
    // i titolari non mi danno il risultato finale
    // calcoliamo quanti minuti ciascun panchinaro deve contribuire al totale squadra
    for (const benchPlayer of benchPlayers) {
      const performance = benchPlayer.performance as IPerformance;
      const minutes = performance?.minutes != null ? performance.minutes : 0;
      const spot = benchPlayer.spot;
      const starterSpot = spot - AppConfig.Starters;
      let minutesUsed = 0;
      benchPlayer.matchReport.minutesUsed = 0;
      if (spot <= AppConfig.LastBenchPlayerWithStarter) {
        // è un panchinaro nei 10
        let minutesNeededValue = minutesNeeded.get(starterSpot) as number;
        if (minutes < minutesNeededValue) {
          // usiamo tutti i minuti del giocatore
          minutesUsed = minutes;
          // aggiorniamo i minuti necessari per quel ruolo
          minutesNeededValue -= minutes;
        } else {
          // usiamo parte dei minuti del panchinaro in questione
          minutesUsed = minutesNeededValue;
          // non abbiamo bisogno di altri minuti da altri giocatori
          minutesNeededValue = 0;
        }
        benchPlayer.matchReport.minutesUsed = minutesUsed;
        minutesNeeded.set(starterSpot, minutesNeededValue);
      }
    }
  }

  // controllo che il tabellino sia completo
  if (!completedWithBench(benchPlayers, minutesNeeded)) {
    // abbiamo bisogno di altri minuti dei panchinari
    // ordino la collection secondo l'ordine dei panchinari
    benchPlayers.sort(benchOrderComparator);

    for (const benchPlayer of benchPlayers) {
      const performance = benchPlayer.performance as IPerformance;
      let minutes = performance?.minutes != null ? performance.minutes : 0;
      // tronchiamo i minuti a 40 perché il panchinaro non può contribuire per un minutaggio maggiore
      if (minutes > 40) {
        minutes = 40;
      }

      let minutesUsed = benchPlayer.matchReport.minutesUsed;
      // minuti rimanenti del panchinaro
      let minutesRemaining = minutes - minutesUsed;
      // usiamo i minuti del panchinaro per coprire i minuti rimanenti
      if (minutesRemaining > 0) {
        // il panchinaro ha ancora minuti
        for (let j = 1; j <= AppConfig.PlayersInBench; j++) {
          let minutesNeededValue = minutesNeeded.get(j) as number;
          if (minutesNeededValue > 0) {
            // il ruolo ha bisogno di altri minuti
            if (minutesRemaining < minutesNeededValue) {
              // usiamo tutti i minuti del giocatore
              minutesUsed += minutesRemaining;
              // aggiorniamo i minuti necessari per quel ruolo
              minutesNeededValue -= minutesRemaining;
            } else {
              // il ruolo viene coperto intermanete
              // usiamo parte dei minuti rimanenti del panchinaro in questione
              minutesUsed += minutesNeededValue;
              // non abbiamo bisogno di altri minuti da altri giocatori
              minutesNeededValue = 0;
            }
            benchPlayer.matchReport.minutesUsed = minutesUsed;
            minutesNeeded.set(j, minutesNeededValue);
            minutesRemaining = minutes - minutesUsed;
          }
        }
      }
    }
  }
};

const otStartersMinutes = (lineup: ILineup[], minutesNeeded: Map<number, number>) => {
  minutesNeeded.clear();
  const starters = lineup.slice(0, AppConfig.Starters);
  // itero solo i titolari
  for (const starter of starters) {
    const performance = starter.performance as IPerformance;
    const minutes = performance?.minutes != null ? performance.minutes : 0;
    const spot = starter.spot;
    let minutesUsed = starter.matchReport.minutesUsed;
    let minutesNeededValue = 0;
    if (minutesUsed < minutes) {
      // il titolare ha ancora minuti a disposizione
      if (minutes - minutesUsed <= 5) {
        // minuti a disposizione <= 5
        // ho ancora minuti da coprire
        minutesNeededValue = 5 - (minutes - minutesUsed);
        // uso tutti i minuti
        minutesUsed = minutes;
      } else {
        // minuti a disposizione > 5
        minutesNeededValue = 0;
        // aggiungo 5 minuti a quelli usati
        minutesUsed += 5;
      }
      starter.matchReport.minutesUsed = minutesUsed;
      minutesNeeded.set(spot, minutesNeededValue);
    } else {
      // mi servono 5 minuti perché il titolare non contribuisce
      minutesNeeded.set(spot, 5);
    }
  }
};

const otBenchMinutes = (lineup: ILineup[], minutesNeeded: Map<number, number>) => {

  // mappa per memorizzare i "minuti OT" di ciascun panchianro
  const otMinutesUsed: Map<number, number> = new Map<number, number>();
  if (!completedWithStarters(minutesNeeded)) {
    // i titolari non mi danno il risultato finale
    const matchReportSize = lineup.length;
    const benchPlayers = lineup.slice(AppConfig.Starters, matchReportSize);
    // calcoliamo quanti minuti ciascun panchinaro deve contribuire al totale squadra

    for (const benchPlayer of benchPlayers) {
      const performance = benchPlayer.performance as IPerformance;
      const minutes = performance?.minutes != null ? performance.minutes : 0;
      const spot = benchPlayer.spot;
      const starterSpot = spot - AppConfig.Starters;
      let minutesUsed = benchPlayer.matchReport.minutesUsed;
      // inizializzazione "minuti OT"
      otMinutesUsed.set(spot, 0);
      if (spot <= AppConfig.LastBenchPlayerWithStarter) {
        // è un panchinaro nei 10
        let minutesNeededValue = minutesNeeded.get(starterSpot) as number;
        const minutesRemaining = minutes - minutesUsed;
        if (minutesRemaining < minutesNeededValue) {
          // usiamo tutti i minuti del giocatore per coprire parzialmente i minuti necessari
          minutesUsed += minutesRemaining;
          // aggiorniamo i minuti necessari per quel ruolo
          minutesNeededValue -= minutesRemaining;
          // il giocatore ha usato tutti i suoi minuti, non occorro popolare la mappa per i "minuti OT"
        } else {
          // usiamo parte dei minuti del panchinaro in questione
          minutesUsed += minutesNeededValue;
          // abbiamo usato un po' di minuti del panchinaro per il suo ruolo, ne teniamo traccia per la seconda ciclata
          otMinutesUsed.set(spot, minutesNeededValue);
          // non abbiamo bisogno di altri minuti da altri giocatori
          minutesNeededValue = 0;
        }
        benchPlayer.matchReport.minutesUsed = minutesUsed;
        minutesNeeded.set(starterSpot, minutesNeededValue);
      }
    }

    // controllo che il tabellino sia completo
    if (!completedWithBench(benchPlayers, minutesNeeded)) {
      // abbiamo bisogno di altri minuti dei panchinari
      // ordino la collection secondo l'ordine dei panchinari
      benchPlayers.sort(benchOrderComparator);

      for (const benchPlayer of benchPlayers) {
        const performance = benchPlayer.performance as IPerformance;
        const minutes = performance?.minutes != null ? performance.minutes : 0;
        const spot = benchPlayer.spot;
        let minutesUsed = benchPlayer.matchReport.minutesUsed;
        // minuti rimanenti del panchinaro
        let minutesRemaining = minutes - minutesUsed;
        // usiamo i minuti del panchinaro per coprire i minuti rimanenti
        if (minutesRemaining > 0) {
          // minuti già usati nell'OT
          let benchPlayerOtMinutesUsed = otMinutesUsed.get(spot) as number;
          if (benchPlayerOtMinutesUsed < 5) {
            // il panchinaro ha ancora minuti (sia normali che "OT")
            for (let j = 1; j <= AppConfig.PlayersInBench; j++) {
              let minutesNeededValue = minutesNeeded.get(j) as number;
              if (minutesNeededValue > 0) {
                // il ruolo ha bisogno di altri minuti
                // "minuti OT" rimanenti
                const benchPlayerOtMinutesRemaining = 5 - benchPlayerOtMinutesUsed;
                if (benchPlayerOtMinutesRemaining > 0) {
                  // il giocatore pu� ancora contribuire all'OT
                  if (minutesRemaining <= benchPlayerOtMinutesRemaining) {
                    // i minuti rimanenti del giocatore sono minori o ugale dei "minuti OT" rimanenti
                    if (minutesRemaining < minutesNeededValue) {
                      // usiamo tutti i minuti del giocatore per coprire parzialmente i minuti necessari
                      minutesUsed += minutesRemaining;
                      // aggiorniamo i minuti necessari per quel ruolo
                      minutesNeededValue -= minutesRemaining;
                      // non dobbiamo aggiornare i "minuti OT" perch� il giocatore non pu� contribuire ulteriormente
                    } else {
                      // il ruolo viene coperto intermanete
                      // usiamo parte dei minuti rimanenti del panchinaro in questione
                      minutesUsed += minutesNeededValue;
                      // aggiorniamo i "minuti OT" usati
                      benchPlayerOtMinutesUsed += minutesNeededValue;
                      // non abbiamo bisogno di altri minuti da altri giocatori
                      minutesNeededValue = 0;
                    }
                  } else {
                    // i minuti rimanenti del giocatore sono maggiori dei "minuti OT" rimanenti
                    if (benchPlayerOtMinutesRemaining < minutesNeededValue) {
                      // usiamo tutti i "minuti OT" del giocatore per coprire parzialmente i minuti necessari
                      minutesUsed += benchPlayerOtMinutesRemaining;
                      // aggiorniamo i minuti necessari per quel ruolo
                      minutesNeededValue -= benchPlayerOtMinutesRemaining;
                      // aggiorniamo i "minuti OT" usati
                      benchPlayerOtMinutesUsed = 5;
                    } else {
                      // il ruolo viene coperto intermanete
                      // usiamo parte dei minuti OT rimanenti del panchinaro in questione
                      minutesUsed += minutesNeededValue;
                      // aggiorniamo i minuti OT usati
                      benchPlayerOtMinutesUsed += minutesNeededValue;
                      // non abbiamo bisogno di altri minuti da altri giocatori
                      minutesNeededValue = 0;
                    }
                  }
                  benchPlayer.matchReport.minutesUsed = minutesUsed;
                  minutesNeeded.set(j, minutesNeededValue);
                  minutesRemaining = minutes - minutesUsed;
                  otMinutesUsed.set(spot, benchPlayerOtMinutesUsed);
                }
              }
            }
          }
        }
      }
    }
  }
};

const ranking = (lineup: ILineup[]): number => {
  let ret = 0;
  // calcolo delle valutazioni
  for (const player of lineup) {
    const performance = player.performance as IPerformance;
    // pondero la valutazione sui 40 minuti
    const playerRanking = (performance?.ranking != null ? performance.ranking : 0);
    const playerMinutes = (performance?.minutes != null ? performance.minutes : 0);
    const playerMinutesUsed = player.matchReport.minutesUsed;
    if (playerMinutesUsed > 0) {
      let roundedRanking = 0;
      if (playerMinutes === playerMinutesUsed) {
        roundedRanking = playerRanking;
      } else {
        roundedRanking = computeRoundedRanking(playerMinutesUsed, playerRanking, playerMinutes);
      }
      player.matchReport.realRanking = roundedRanking;
      ret += roundedRanking;
    } else {
      player.matchReport.realRanking = 0;
    }
  }
  return ret;
};

const oer = (lineup: ILineup[]): number => {
  let ret = 0;
  for (const player of lineup) {
    const performance = player.performance as IPerformance;
    const playerOer = (performance?.oer != null ? performance.oer : 0);
    ret += playerOer;
  }
  return ret;
};

const plusMinus = (lineup: ILineup[]): number => {
  let ret = 0;
  for (const player of lineup) {
    const performance = player.performance as IPerformance;
    const playerPlusMinus = (performance?.plusMinus != null ? performance.plusMinus : 0);
    ret += playerPlusMinus;
  }
  return ret;
};

const grade = (lineup: ILineup[], previousPerformances: IPerformance[]): number => {
  let ret = 0;
  let lowestGrade = 10;
  const upperBound = AppConfig.NecessaryGrades > lineup.length ? lineup.length : AppConfig.NecessaryGrades;

  // memorizzo le performance oltre la decima per eventuali giocatori non a referto che devono prendere comunque il voto
  const extraPlayers: ILineup[] = [];
  if (AppConfig.NecessaryGrades < lineup.length) {
    for (let i = AppConfig.NecessaryGrades; i < lineup.length; i++) {
      extraPlayers.push(lineup[i]);
    }
  }

  // prima ciclata per determinare il voto più basso
  for (let i = 0; i < upperBound; i++) {
    const player = lineup[i];
    const performance = player != null ? player.performance as IPerformance : null;
    if (performance != null && performance.grade != null) {
      if (lowestGrade > performance.grade) {
        lowestGrade = performance.grade;
      }
    }
  }

  for (let i = 0; i < upperBound; i++) {
    const player = lineup[i];
    if (player != null) {
      const playerId = (((player.fantasyRoster as IFantasyRoster).roster as IRoster).player as IPlayer)._id;
      const performance = player.performance as IPerformance;
      if (performance.grade != null) {
        // il giocatore ha preso un voto
        ret += performance.grade;
      } else {
        // il giocatore non ha un voto
        if (performance.minutes != null) {
          if (performance.minutes > 0) {
            // il giocatore ha giocato almeno un minuto
            ret += AppConfig.DefaultGrade;
          } else {
            // il giocatore non ha giocato neanche un minuto
            if (lowestGrade > 1) {
              lowestGrade -= 1;
            } else {
              lowestGrade = 0;
            }
            ret += lowestGrade;
          }
        } else {
          // il giocatore non è andato a referto: controlliamo la performance precedente
          if (previousPerformances != null && !isEmpty(previousPerformances)) {
            // esiste una giornata precedente => cerchiamo la performance del giocatore nella giornata precedente
            const prevPerf = previousPerformances.find((perf: IPerformance) => (perf.player as IPlayer).equals(playerId)) as IPerformance;
            if (prevPerf.minutes != null) {
              // il giocatore è andato a referto la giornata precedente => voto extra
              if (!isEmpty(extraPlayers)) {
                // prendo il voto extra e rimuovo l'elemento
                const extraPlayer = extraPlayers.shift() as ILineup;
                const extraPerf = extraPlayer.performance as IPerformance;

                if (extraPerf.grade != null) {
                  // il giocatore extra ha preso un voto
                  ret += extraPerf.grade;
                } else if (extraPerf.minutes != null) {
                  if (extraPerf.minutes > 0) {
                    // il giocatore extra ha giocato almeno un minuto
                    ret += AppConfig.DefaultGrade;
                  } else {
                    // il giocatore extra non ha giocato neanche un minuto
                    if (lowestGrade > 1) {
                      lowestGrade -= 1;
                    } else {
                      lowestGrade = 0;
                    }
                    ret += lowestGrade;
                  }
                }
              }
            } // il giocatore NON è andato a referto la giornata precedente => 0
          } else {
            // non esiste una giornata precedente => prendiamo il voto extra
            if (!isEmpty(extraPlayers)) {
              // prendo il voto extra e rimuovo l'elemento
              const extraPlayer = extraPlayers.shift() as ILineup;
              const extraPerf = extraPlayer.performance as IPerformance;

              if (extraPerf.grade != null) {
                // il giocatore extra ha preso un voto
                ret += extraPerf.grade;
              } else if (extraPerf.minutes != null) {
                if (extraPerf.minutes > 0) {
                  // il giocatore extra ha giocato almeno un minuto
                  ret += AppConfig.DefaultGrade;
                } else {
                  // il giocatore extra non ha giocato neanche un minuto
                  if (lowestGrade > 1) {
                    lowestGrade -= 1;
                  } else {
                    lowestGrade = 0;
                  }
                  ret += lowestGrade;
                }
              }
            }
          }
        }
      }
    }
  }
  return ret;
};

const getFinalResult = (partialResult: number, resultDivisor: number): number => {
  // arrotondamento n,5 = n + 1
  return Math.round(partialResult / resultDivisor);
};

const otTieBreak = (homeMatchReport: ILineup[], awayMatchReport: ILineup[]): boolean => {
  const ret = false;

  // tie-breaker per gli OT senza risultato: ritorna true per la vittoria casalinga, false per quella in trasferta
  // In caso di pareggio per avere un vincitore si prende in questo ordine:
  //
  // 1 - La somma delle valutazioni dei cinque titolari
  // 2 - La somma delle valutazioni di tutti i dodici titolari
  // 3 - La somma delle valutazioni dei primi dieci in formazione

  // Caso 1
  let homeStarterRanking = 0;
  // somma delle valutazioni dei titolari della squadra di casa
  const homeStarters = homeMatchReport.slice(0, AppConfig.Starters);
  for (const player of homeStarters) {
    const performance = player.performance as IPerformance;
    homeStarterRanking += performance.ranking != null ? performance.ranking : 0;
  }

  let awayStarterRanking = 0;
  // somma delle valutazioni dei titolari della squadra in trasferta
  const awayStarters = awayMatchReport.slice(0, AppConfig.Starters);
  for (const player of awayStarters) {
    const performance = player.performance as IPerformance;
    awayStarterRanking += performance.ranking != null ? performance.ranking : 0;
  }

  if (homeStarterRanking > awayStarterRanking) {
    return true;
  } else if (homeStarterRanking < awayStarterRanking) {
    return false;
  }

  // Caso 2
  let homeTotalRanking = 0;
  // somma delle valutazioni di tutta la squadra di casa
  for (const player of homeMatchReport) {
    const performance = player.performance as IPerformance;
    homeTotalRanking += performance.ranking != null ? performance.ranking : 0;
  }

  let awayTotalRanking = 0;
  // somma delle valutazioni di tutta la squadra in trasferta
  for (const player of homeMatchReport) {
    const performance = player.performance as IPerformance;
    awayTotalRanking += performance.ranking != null ? performance.ranking : 0;
  }

  if (homeTotalRanking > awayTotalRanking) {
    return true;
  } else if (homeTotalRanking < awayTotalRanking) {
    return false;
  }

  // Caso 3
  let homeMinPlayersInFormationRanking = 0;
  // somma delle valutazioni dei primi dieci giocatori della squadra di casa
  const homeMinPlayersInLineup = homeMatchReport.slice(0, AppConfig.MinPlayersInLineup);
  for (const player of homeMinPlayersInLineup) {
    const performance = player.performance as IPerformance;
    homeMinPlayersInFormationRanking += performance.ranking != null ? performance.ranking : 0;
  }

  let awayMinPlayersInFormationRanking = 0;
  // somma delle valutazioni dei primi dieci giocatori della squadra in trasferta
  const awayMinPlayersInLineup = awayMatchReport.slice(0, AppConfig.MinPlayersInLineup);
  for (const player of awayMinPlayersInLineup) {
    const performance = player.performance as IPerformance;
    awayMinPlayersInFormationRanking += performance.ranking != null ? performance.ranking : 0;
  }

  if (homeMinPlayersInFormationRanking > awayMinPlayersInFormationRanking) {
    return true;
  } else if (homeMinPlayersInFormationRanking < awayMinPlayersInFormationRanking) {
    return false;
  } else {
    // il vincitore viene stabilito dal caso
    return Boolean(+Date.now() % 2);
  }
};

const completedWithStarters = (minutesNeeded: Map<number, number>): boolean => {
  let reportCompleted = true;
  for (let i = 1; i <= AppConfig.Starters; i++) {
    if (minutesNeeded.get(i) as number > 0) {
      reportCompleted = false;
      break;
    }
  }
  return reportCompleted;
};

const completedWithBench = (benchPlayers: ILineup[], minutesNeeded: Map<number, number>): boolean => {
  let reportCompleted = true;
  for (let i = 1; i <= AppConfig.PlayersInBench; i++) {
    if (minutesNeeded.get(i) as number > 0) {
      reportCompleted = false;
      break;
    }
  }

  let availableMinutes = false;
  for (const benchPlayer of benchPlayers) {
    const performance = benchPlayer.performance as IPerformance;
    const minutes = performance?.minutes != null ? performance.minutes : 0;
    if (benchPlayer.matchReport.minutesUsed < minutes) {
      availableMinutes = true;
      break;
    }
  }
  if (reportCompleted || (!reportCompleted && !availableMinutes)) {
    return true;
  } else {
    return false;
  }
};

const computeRoundedRanking = (totalMinutes: number, rank: number, minutes: number): number => {
  const multiply = totalMinutes * rank;
  // arrotondamento n,5 = n
  return halfDownRound(multiply, minutes);
};

const benchOrderComparator = (a: ILineup, b: ILineup): number => {
  const o1BenchOrder = a.benchOrder != null ? a.benchOrder : Number.MAX_SAFE_INTEGER;
  const o2BenchOrder = b.benchOrder != null ? b.benchOrder : Number.MAX_SAFE_INTEGER;
  if (o1BenchOrder === o2BenchOrder) {
    return a.spot - b.spot;
  } else {
    return o1BenchOrder - o2BenchOrder;
  }
};
