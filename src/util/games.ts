import { ObjectId } from 'mongodb';
import { IFantasyTeam } from '../schemas/fantasy-team';
import { IFixture } from '../schemas/fixture';
import { IMatch, Match } from '../schemas/match';

export const games = new Map();
games.set(4, [
  [0, 1, 2, 3],
  [3, 0, 1, 2],
  [3, 1, 2, 0],
]);
games.set(6, [
  [1, 4, 2, 5, 3, 0],
  [0, 2, 4, 3, 5, 1],
  [1, 0, 2, 3, 5, 4],
  [0, 5, 2, 4, 3, 1],
  [1, 2, 4, 0, 5, 3],
]);
games.set(8, [
  [0, 1, 2, 7, 3, 6, 5, 4],
  [1, 5, 4, 3, 6, 2, 7, 0],
  [2, 4, 3, 1, 5, 0, 6, 7],
  [0, 3, 1, 2, 4, 6, 7, 5],
  [2, 0, 3, 5, 4, 7, 6, 1],
  [0, 6, 1, 4, 3, 7, 5, 2],
  [2, 3, 4, 0, 6, 5, 7, 1],
]);
games.set(10, [
  [0, 7, 1, 2, 3, 6, 4, 5, 9, 8],
  [2, 0, 5, 9, 6, 4, 7, 3, 8, 1],
  [0, 8, 1, 5, 3, 2, 7, 6, 9, 4],
  [2, 7, 4, 1, 5, 0, 6, 9, 8, 3],
  [0, 4, 1, 9, 2, 6, 3, 5, 7, 8],
  [4, 3, 5, 7, 6, 1, 8, 2, 9, 0],
  [0, 1, 2, 5, 3, 9, 7, 4, 8, 6],
  [0, 6, 1, 3, 4, 2, 5, 8, 9, 7],
  [2, 9, 3, 0, 6, 5, 7, 1, 8, 4],
]);
games.set(12, [
  [1, 7, 10, 4, 2, 9, 5, 0, 6, 3, 8, 11],
  [0, 1, 11, 2, 3, 8, 4, 6, 7, 10, 9, 5],
  [10, 1, 2, 3, 5, 11, 6, 7, 8, 4, 9, 0],
  [0, 10, 1, 6, 11, 9, 3, 5, 4, 2, 7, 8],
  [11, 0, 2, 7, 5, 4, 6, 10, 8, 1, 9, 3],
  [0, 6, 1, 2, 10, 8, 3, 11, 4, 9, 7, 5],
  [11, 4, 2, 10, 3, 0, 5, 1, 8, 6, 9, 7],
  [0, 8, 1, 9, 10, 5, 4, 3, 6, 2, 7, 11],
  [11, 1, 2, 8, 3, 7, 4, 0, 5, 6, 9, 10],
  [1, 3, 10, 11, 2, 0, 6, 9, 7, 4, 8, 5],
  [0, 7, 11, 6, 3, 10, 4, 1, 5, 2, 9, 8],
]);
games.set(14, [
  [10, 3, 12, 2, 13, 6, 4, 11, 7, 1, 8, 5, 9, 0],
  [0, 8, 1, 4, 11, 13, 2, 10, 3, 9, 5, 7, 6, 12],
  [12, 11, 13, 1, 4, 5, 6, 2, 7, 0, 8, 3, 9, 10],
  [0, 4, 1, 12, 10, 8, 11, 6, 2, 9, 3, 7, 5, 13],
  [11, 2, 12, 5, 13, 0, 4, 3, 6, 1, 7, 10, 8, 9],
  [0, 12, 1, 11, 10, 4, 2, 8, 3, 13, 5, 6, 9, 7],
  [1, 2, 11, 5, 12, 3, 13, 10, 4, 9, 6, 0, 7, 8],
  [0, 11, 10, 12, 2, 7, 3, 6, 5, 1, 8, 4, 9, 13],
  [1, 0, 11, 3, 12, 9, 13, 8, 4, 7, 5, 2, 6, 10],
  [0, 5, 10, 11, 2, 4, 3, 1, 7, 13, 8, 12, 9, 6],
  [0, 2, 1, 10, 11, 9, 12, 7, 13, 4, 5, 3, 6, 8],
  [10, 5, 13, 2, 3, 0, 4, 12, 7, 6, 8, 11, 9, 1],
  [0, 10, 1, 8, 11, 7, 12, 13, 2, 3, 5, 9, 6, 4],
]);
games.set(16, [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  [11, 6, 13, 2, 15, 8, 7, 10, 1, 14, 3, 4, 9, 12, 5, 0],
  [0, 9, 7, 11, 2, 1, 4, 15, 6, 5, 8, 13, 10, 3, 14, 12],
  [13, 4, 15, 6, 0, 10, 1, 7, 3, 5, 9, 11, 12, 8, 14, 2],
  [11, 14, 15, 1, 2, 4, 8, 3, 9, 13, 5, 7, 10, 6, 12, 0],
  [13, 0, 7, 8, 1, 12, 3, 15, 4, 10, 6, 2, 5, 11, 14, 9],
  [11, 3, 15, 13, 0, 14, 2, 7, 1, 6, 8, 4, 9, 10, 12, 5],
  [11, 2, 13, 14, 7, 3, 4, 1, 6, 12, 8, 0, 5, 9, 10, 15],
  [15, 11, 0, 4, 2, 5, 1, 13, 3, 6, 9, 7, 12, 10, 14, 8],
  [11, 13, 7, 15, 2, 12, 3, 9, 4, 14, 6, 0, 5, 1, 10, 8],
  [13, 10, 15, 5, 0, 3, 1, 11, 8, 2, 9, 6, 12, 4, 14, 7],
  [11, 0, 7, 12, 2, 15, 3, 1, 4, 9, 6, 8, 5, 13, 10, 14],
  [13, 3, 0, 7, 1, 10, 4, 6, 8, 11, 9, 2, 12, 15, 14, 5],
  [11, 4, 15, 9, 7, 13, 2, 0, 1, 8, 3, 12, 6, 14, 5, 10],
  [13, 6, 0, 15, 4, 7, 8, 5, 9, 1, 10, 2, 12, 11, 14, 3],
]);
games.set(18, [
  [1, 6, 10, 0, 11, 5, 13, 8, 14, 2, 15, 9, 17, 12, 3, 7, 4, 16],
  [0, 13, 12, 15, 16, 3, 2, 17, 5, 4, 6, 10, 7, 14, 8, 11, 9, 1],
  [0, 8, 1, 12, 10, 9, 13, 6, 14, 16, 15, 2, 17, 7, 3, 5, 4, 11],
  [11, 3, 12, 10, 16, 17, 2, 1, 5, 14, 6, 0, 7, 15, 8, 4, 9, 13],
  [0, 9, 1, 7, 10, 2, 13, 12, 14, 11, 15, 16, 17, 5, 3, 4, 6, 8],
  [11, 17, 12, 0, 16, 1, 2, 13, 4, 14, 5, 15, 7, 10, 8, 3, 9, 6],
  [0, 2, 1, 5, 10, 16, 13, 7, 14, 3, 15, 11, 17, 4, 6, 12, 9, 8],
  [11, 1, 12, 9, 16, 13, 2, 6, 3, 17, 4, 15, 5, 10, 7, 0, 8, 14],
  [0, 16, 1, 4, 10, 11, 12, 8, 13, 5, 15, 3, 17, 14, 6, 7, 9, 2],
  [11, 13, 14, 15, 16, 6, 2, 12, 3, 1, 4, 10, 5, 0, 7, 9, 8, 17],
  [0, 11, 1, 14, 10, 3, 12, 7, 13, 4, 15, 17, 2, 8, 6, 5, 9, 16],
  [11, 6, 14, 10, 16, 12, 17, 1, 3, 13, 4, 0, 5, 9, 7, 2, 8, 15],
  [0, 3, 1, 15, 10, 17, 12, 5, 13, 14, 2, 16, 6, 4, 7, 8, 9, 11],
  [11, 12, 14, 0, 15, 10, 16, 7, 17, 13, 3, 6, 4, 9, 5, 2, 8, 1],
  [0, 17, 10, 1, 12, 4, 13, 15, 16, 8, 2, 11, 6, 14, 7, 5, 9, 3],
  [1, 13, 10, 8, 11, 7, 14, 9, 15, 0, 17, 6, 3, 12, 4, 2, 5, 16],
  [0, 1, 12, 14, 13, 10, 16, 11, 2, 3, 6, 15, 7, 4, 8, 5, 9, 17],
]);
games.set(20, [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
  [5, 16, 3, 12, 13, 0, 19, 2, 15, 4, 11, 8, 7, 14, 1, 10, 9, 18, 17, 6],
  [16, 11, 2, 5, 18, 7, 14, 1, 12, 9, 10, 3, 8, 19, 6, 15, 4, 13, 0, 17],
  [15, 16, 3, 4, 5, 8, 11, 2, 7, 10, 9, 0, 17, 18, 13, 14, 1, 6, 19, 12],
  [10, 17, 6, 5, 16, 8, 13, 3, 0, 11, 12, 7, 14, 19, 2, 9, 18, 15, 4, 1],
  [3, 7, 5, 14, 15, 19, 11, 18, 8, 2, 1, 13, 9, 6, 4, 10, 17, 12, 0, 16],
  [2, 4, 18, 0, 19, 11, 14, 9, 7, 17, 12, 5, 10, 8, 1, 3, 6, 16, 13, 15],
  [2, 18, 16, 10, 5, 13, 15, 7, 8, 12, 9, 1, 6, 3, 4, 11, 17, 19, 0, 14],
  [7, 5, 3, 17, 12, 16, 10, 15, 13, 6, 19, 0, 1, 2, 18, 4, 14, 8, 11, 9],
  [2, 10, 16, 18, 5, 11, 15, 3, 7, 13, 8, 4, 9, 19, 6, 14, 17, 1, 0, 12],
  [3, 5, 19, 7, 14, 2, 11, 13, 12, 18, 10, 6, 8, 0, 1, 15, 4, 16, 17, 9],
  [3, 14, 18, 8, 16, 2, 5, 10, 15, 9, 7, 1, 12, 11, 6, 19, 0, 4, 13, 17],
  [2, 0, 19, 1, 16, 13, 5, 18, 11, 3, 10, 12, 8, 15, 9, 7, 4, 6, 17, 14],
  [3, 19, 18, 10, 14, 11, 15, 17, 7, 16, 12, 4, 1, 8, 6, 2, 0, 5, 13, 9],
  [2, 12, 9, 3, 8, 7, 10, 0, 11, 6, 5, 15, 16, 14, 19, 13, 18, 1, 4, 17],
  [3, 0, 19, 5, 14, 10, 15, 12, 7, 11, 1, 16, 9, 4, 6, 8, 17, 2, 13, 18],
  [2, 13, 18, 14, 16, 9, 5, 17, 11, 15, 12, 1, 10, 19, 8, 3, 4, 7, 0, 6],
  [3, 16, 19, 4, 14, 12, 15, 2, 7, 0, 1, 11, 9, 5, 6, 18, 17, 8, 13, 10],
  [0, 15, 18, 3, 16, 19, 5, 1, 11, 17, 12, 6, 10, 9, 8, 13, 4, 14, 2, 7],
]);

export const roundRobinMatchList = async (idLeague: ObjectId, rounds: number, fixtures: IFixture[], fantasyTeams: IFantasyTeam[]): Promise<IMatch[]> => {
  const ret: IMatch[] = [];
  try {
    const numTeams = fantasyTeams.length;
    // get static calendar
    const teamsSlots = games.get(numTeams);
    for (let g = 0; g < teamsSlots.length; g++) {
      // andata
      const fixture = fixtures[g];
      fixture.matches = [];
      for (let i = 0; i < teamsSlots[g].length; i += 2) {
        const match = {
          homeTeam: fantasyTeams[teamsSlots[g][i]],
          awayTeam: fantasyTeams[teamsSlots[g][i + 1]],
          league: idLeague,
          completed: false,
        };
        const newMatch: IMatch = await Match.create(match);
        fixture.matches.push(newMatch);
        ret.push(newMatch);
      }
      await fixture.save();
    }

    if (rounds > 1) {
      // ritorno
      for (let g = 0, gg = teamsSlots.length; g < teamsSlots.length; g++, gg++) {
        const fixture = fixtures[gg];
        fixture.matches = [];
        for (let i = 0; i < teamsSlots[g].length; i += 2) {
          const match = {
            homeTeam: fantasyTeams[teamsSlots[g][i + 1]],
            awayTeam: fantasyTeams[teamsSlots[g][i]],
            league: idLeague,
            completed: false,
          };
          const newMatch: IMatch = await Match.create(match);
          fixture.matches.push(newMatch);
          ret.push(newMatch);
        }
        await fixture.save();
      }
    }
  } catch (error) {
    console.log(error);
  }

  return ret;
};

export const playoffMatchList = async (idLeague: ObjectId, fixtures: IFixture[], fantasyTeams: IFantasyTeam[]): Promise<IMatch[]> => {
  const ret: IMatch[] = [];
  const size = fantasyTeams.length;
  const upperSublist = fantasyTeams.slice(0, size / 2);
  const lowerSublist = fantasyTeams.slice(size / 2, size);
  for (let i = 0; i < fixtures.length; i++) {
    const fixture = fixtures[i];
    fixture.matches = [];
    for (let j = 0; j < size / 2; j++) {
      if (i % 2 === 0) {
        // i pari
        const match = {
          homeTeam: upperSublist[j],
          awayTeam: lowerSublist[size / 2 - (j + 1)],
          league: idLeague,
          completed: false,
        };
        const newMatch: IMatch = await Match.create(match);
        fixture.matches.push(newMatch);
        ret.push(newMatch);
      } else {
        // i dispari: inverto squadra di casa con la squadra in trasferta
        const match = {
          homeTeam: lowerSublist[size / 2 - (j + 1)],
          awayTeam: upperSublist[j],
          league: idLeague,
          completed: false,
        };
        const newMatch: IMatch = await Match.create(match);
        fixture.matches.push(newMatch);
        ret.push(newMatch);
      }
    }
    await fixture.save();
  }

  return ret;
};
