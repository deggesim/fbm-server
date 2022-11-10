import { Competition } from "../schemas/competition";
import { IFantasyTeam } from "../schemas/fantasy-team";
import { Fixture, IFixture } from "../schemas/fixture";
import { PlayoffFormat } from "../schemas/formats/playoff-format";
import { ILeague } from "../schemas/league";
import { Match } from "../schemas/match";
import { Performance } from "../schemas/performance";
import { Player } from "../schemas/player";
import { IRealFixture, RealFixture } from "../schemas/real-fixture";
import { Roster } from "../schemas/roster";
import { IRound, Round } from "../schemas/round";
import { Team } from "../schemas/team";
import { entityNotFound } from "./functions";

export const cleanLeague = async (league: ILeague) => {
  await Competition.deleteMany({ league: league._id }).exec();
  await Fixture.deleteMany({ league: league._id }).exec();
  await Match.deleteMany({ league: league._id }).exec();
  await Performance.deleteMany({ league: league._id }).exec();
  await Player.deleteMany({ league: league._id }).exec();
  await RealFixture.deleteMany({ league: league._id }).exec();
  await Roster.deleteMany({ league: league._id }).exec();
  await Round.deleteMany({ league: league._id }).exec();
  await Team.deleteMany({ league: league._id }).exec();
};

export const populateCompetition = async (league: ILeague) => {
  const championship = {
    name: "Campionato",
    completed: false,
    rounds: [],
    league: league._id,
  };
  await Competition.create(championship);
  const cup = {
    name: "Coppa",
    completed: false,
    rounds: [],
    league: league._id,
  };
  await Competition.create(cup);
};

export const populateRealFixture = async (
  league: ILeague
): Promise<IRealFixture[]> => {
  const games: number = league.realGames;
  const realFixtures: IRealFixture[] = [];
  for (let i = 1; i <= games; i++) {
    const realFixture = {
      name: `Giornata #${i}`,
      prepared: false,
      order: i,
      fixtures: [],
      league: league._id,
    };
    const newRealFixture: IRealFixture = await RealFixture.create(realFixture);
    realFixtures.push(newRealFixture);
  }
  return realFixtures;
};

export const createRegularSeason = async (
  league: ILeague,
  realFixtures: IRealFixture[],
  fantasyTeams: IFantasyTeam[]
) => {
  const competition = await Competition.findOne({
    league: league._id,
    name: "Campionato",
  }).exec();
  if (competition == null) {
    throw new Error(entityNotFound("Competizione", league._id));
  }
  // creazione round 'Stagione regolare'
  const round = {
    name: "Stagione Regolare",
    completed: false,
    homeFactor: 8,
    teams: fantasyTeams.length,
    roundRobin: true,
    rounds: league.regularSeasonFormat.value.rounds,
    fantasyTeams: [],
    fixtures: [],
    league: league._id,
  };
  const newRound = await Round.create(round);
  competition.rounds.push(newRound);
  await competition.save();

  // creazione giornate
  const numTeams = fantasyTeams.length;
  const realFixturesSubList = realFixtures.slice(
    league.roundRobinFirstRealFixture - 1,
    league.roundRobinFirstRealFixture -
      1 +
      (numTeams - 1) * league.regularSeasonFormat.value.rounds
  );
  await createFixtures(realFixturesSubList, league, newRound, 'Giornata');
};

export const createPlayoff = async (
  league: ILeague,
  realFixtures: IRealFixture[]
) => {
  const competition = await Competition.findOne({
    league: league._id,
    name: "Campionato",
  }).exec();
  if (competition == null) {
    throw new Error(entityNotFound("Competizione", league._id));
  }
  let firstRealFixture = league.playoffFirstRealFixture;

  if (league.playoffFormat.value.qfGames) {
    // quarti di finale

    // creazione round 'Playoff - Quarti di finale'
    const round = {
      name: "Playoff - Quarti di finale",
      completed: false,
      homeFactor: 10,
      teams: 8,
      roundRobin: false,
      fantasyTeams: [],
      fixtures: [],
      league: league._id,
    };
    if (
      league.playoffFormat["key"] === PlayoffFormat.QF2_SQ4_SF5_F5.toString()
    ) {
      // i quarti di finali sono giocati da 4 squadre
      round.teams = 4;
    }
    const newRound = await Round.create(round);
    competition.rounds.push(newRound);

    // creazione giornate
    const realFixturesSubList = realFixtures.slice(
      firstRealFixture - 1,
      firstRealFixture - 1 + league.playoffFormat.value.qfGames
    );
    await createFixtures(realFixturesSubList, league, newRound, 'Gara');
    firstRealFixture += league.playoffFormat.value.qfGames;
  }

  if (league.playoffFormat.value.sfGames) {
    // semifinali

    // creazione round 'Playoff - Semifinale'
    const round = {
      name: "Playoff - Semifinale",
      completed: false,
      homeFactor: 10,
      teams: 4,
      roundRobin: false,
      fantasyTeams: [],
      fixtures: [],
      league: league._id,
    };
    const newRound = await Round.create(round);
    competition.rounds.push(newRound);

    // creazione giornate
    const realFixturesSubList = realFixtures.slice(
      firstRealFixture - 1,
      firstRealFixture - 1 + league.playoffFormat.value.sfGames
    );
    await createFixtures(realFixturesSubList, league, newRound, 'Gara');
    firstRealFixture += league.playoffFormat.value.sfGames;
  }

  if (league.playoffFormat.value.fGames) {
    // semifinali

    // creazione round 'Playoff - Finale'
    const round = {
      name: "Playoff - Finale",
      completed: false,
      homeFactor: 10,
      teams: 2,
      roundRobin: false,
      fantasyTeams: [],
      fixtures: [],
      league: league._id,
    };
    const newRound = await Round.create(round);
    competition.rounds.push(newRound);

    // creazione giornate
    const realFixturesSubList = realFixtures.slice(
      firstRealFixture - 1,
      firstRealFixture - 1 + league.playoffFormat.value.fGames
    );
    await createFixtures(realFixturesSubList, league, newRound, 'Gara');
  }

  await competition.save();
};

export const createPlayout = async (
  league: ILeague,
  realFixtures: IRealFixture[]
) => {
  const competition = await Competition.findOne({
    league: league._id,
    name: "Campionato",
  }).exec();
  if (competition == null) {
    throw new Error(entityNotFound("Competizione", league._id));
  }
  let firstRealFixture = league.playoutFirstRealFixture;

  if (league.playoutFormat.value.rounds) {
    // creiamo il girone

    // creazione round 'Playout'
    const round = {
      name: "Playout",
      completed: false,
      homeFactor: 10,
      teams: 4,
      roundRobin: true,
      rounds: league.playoutFormat.value.rounds,
      fantasyTeams: [],
      fixtures: [],
      league: league._id,
    };
    const newRound = await Round.create(round);
    competition.rounds.push(newRound);

    // creazione giornate
    const numTeams = league.playoutFormat.value.roundRobinTeams as number;
    const realFixturesSubList = realFixtures.slice(
      firstRealFixture - 1,
      firstRealFixture -
        1 +
        (numTeams - 1) * league.regularSeasonFormat.value.rounds
    );
    await createFixtures(realFixturesSubList, league, newRound, 'Giornata');
    firstRealFixture += (numTeams - 1) * league.playoutFormat.value.rounds;
  }

  if (league.playoutFormat.value.sfGames) {
    // creiamo le semifinali

    // creazione round 'Playout - Semifinale'
    const round = {
      name: "Playout - Semifinale",
      completed: false,
      homeFactor: 10,
      teams: 4,
      roundRobin: false,
      fantasyTeams: [],
      fixtures: [],
      league: league._id,
    };
    const newRound = await Round.create(round);
    competition.rounds.push(newRound);

    // creazione giornate
    const realFixturesSubList = realFixtures.slice(
      firstRealFixture - 1,
      firstRealFixture - 1 + league.playoffFormat.value.sfGames
    );
    await createFixtures(realFixturesSubList, league, newRound, 'Gara');
    firstRealFixture += league.playoffFormat.value.sfGames;
  }

  if (league.playoutFormat.value.fGames) {
    // spareggio retrocessione

    // creazione round 'Spareggio Retrocessione'
    const round = {
      name: "Spareggio Retrocessione",
      completed: false,
      homeFactor: 10,
      teams: 2,
      roundRobin: false,
      fantasyTeams: [],
      fixtures: [],
      league: league._id,
    };
    const newRound = await Round.create(round);
    competition.rounds.push(newRound);

    // creazione giornate
    const realFixturesSubList = realFixtures.slice(
      firstRealFixture - 1,
      firstRealFixture - 1 + league.playoffFormat.value.fGames
    );
    await createFixtures(realFixturesSubList, league, newRound, 'Gara');
  }

  await competition.save();
};

export const createCup = async (
  league: ILeague,
  realFixtures: IRealFixture[]
) => {
  const competition = await Competition.findOne({
    league: league._id,
    name: "Coppa",
  }).exec();
  if (competition == null) {
    throw new Error(entityNotFound("Competizione", league._id));
  }
  let firstRealFixture = league.cupFirstRealFixture;
  let lastRealFixture = league.cupFormat.value.qfRoundTrip
    ? firstRealFixture + 1
    : firstRealFixture;

  // creazione round 'Quarti di Finale'
  let round = {
    name: "Quarti di Finale",
    completed: false,
    homeFactor: league.cupFormat.value.qfRoundTrip ? 10 : 0,
    teams: 8,
    roundRobin: false,
    fantasyTeams: [],
    fixtures: [],
    league: league._id,
  };
  let newRound = await Round.create(round);
  competition.rounds.push(newRound);

  // creazione giornate
  await createCupFixtures(
    realFixtures,
    firstRealFixture,
    lastRealFixture,
    league,
    newRound
  );
  await newRound.save();
  firstRealFixture = lastRealFixture + 1;
  lastRealFixture = league.cupFormat.value.sfRoundTrip
    ? firstRealFixture + 1
    : firstRealFixture;

  // creazione round 'Semifinale'
  round = {
    name: "Semifinale",
    completed: false,
    homeFactor: league.cupFormat.value.sfRoundTrip ? 10 : 0,
    teams: 4,
    roundRobin: false,
    fantasyTeams: [],
    fixtures: [],
    league: league._id,
  };
  newRound = await Round.create(round);
  competition.rounds.push(newRound);

  // creazione giornate
  await createCupFixtures(
    realFixtures,
    firstRealFixture,
    lastRealFixture,
    league,
    newRound
  );
  await newRound.save();
  firstRealFixture = lastRealFixture + 1;
  lastRealFixture = league.cupFormat.value.fRoundTrip
    ? firstRealFixture + 1
    : firstRealFixture;

  // creazione round 'Finale'
  round = {
    name: "Finale",
    completed: false,
    homeFactor: league.cupFormat.value.fRoundTrip ? 10 : 0,
    teams: 2,
    roundRobin: false,
    fantasyTeams: [],
    fixtures: [],
    league: league._id,
  };
  newRound = await Round.create(round);
  competition.rounds.push(newRound);

  // creazione giornate
  await createCupFixtures(
    realFixtures,
    firstRealFixture,
    lastRealFixture,
    league,
    newRound
  );
  await newRound.save();
  await competition.save();
};

const createCupFixtures = async (
  realFixtures: IRealFixture[],
  firstRealFixture: number,
  lastRealFixture: number,
  league: ILeague,
  newRound: IRound
) => {
  let realFixturesSubList = realFixtures.slice(
    firstRealFixture - 1,
    lastRealFixture
  );
  if (realFixturesSubList.length === 1) {
    const fixture = {
      name: `Gara unica`,
      unnecessary: false,
      completed: false,
      matches: [],
      league: league._id,
    };
    const newFixture = await Fixture.create(fixture);
    realFixturesSubList[0].fixtures.push(newFixture);
    await realFixturesSubList[0].save();
    newRound.fixtures.push(newFixture);
  } else {
    for (let i = 0; i < realFixturesSubList.length; i++) {
      const fixture = {
        name: `Gara #${i + 1}`,
        unnecessary: false,
        completed: false,
        matches: [],
        league: league._id,
      };
      const newFixture = await Fixture.create(fixture);
      realFixturesSubList[i].fixtures.push(newFixture);
      await realFixturesSubList[i].save();
      newRound.fixtures.push(newFixture);
    }
  }
  return realFixturesSubList;
};

const createFixtures = async (
  realFixturesSubList: IRealFixture[],
  league: ILeague,
  newRound: IRound,
  namePattern: string
) => {
  for (let i = 0; i < realFixturesSubList.length; i++) {
    const fixture = {
      name: `${namePattern} #${i + 1}`,
      unnecessary: false,
      completed: false,
      matches: [],
      league: league._id,
    };
    const newFixture = await Fixture.create(fixture);
    realFixturesSubList[i].fixtures.push(newFixture);
    await realFixturesSubList[i].save();
    newRound.fixtures.push(newFixture);
  }
  await newRound.save();
};
