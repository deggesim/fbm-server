import { Competition, ICompetition } from '../schemas/competition';
import { IFantasyTeam } from '../schemas/fantasy-team';
import { Fixture, IFixture } from '../schemas/fixture';
import { PlayoffFormat } from '../schemas/formats/playoff-format';
import { ILeague } from '../schemas/league';
import { IRealFixture, RealFixture } from '../schemas/real-fixture';
import { Round } from '../schemas/round';

export const populateCompetition = async (league: ILeague) => {
    const championship = {
        name: 'Campionato',
        league: league._id,
    };
    await Competition.create(championship);

    const cup = {
        name: 'Coppa',
        league: league._id,
    };
    await Competition.create(cup);
};

export const populateRealFixture = async (league: ILeague): Promise<IRealFixture[]> => {
    const games: number = league.realGames;
    const realFixtures: IRealFixture[] = [];
    for (let i = 1; i <= games; i++) {
        const realFixture = {
            name: `Giornata #${i}`,
            prepared: false,
            league: league._id,
        };
        const newRealFixture: IRealFixture = await RealFixture.create(realFixture);
        realFixtures.push(newRealFixture);
    }
    return realFixtures;
};

export const createRegularSeason = async (league: ILeague, realFixtures: IRealFixture[], fantasyTeams: IFantasyTeam[]) => {
    const competition: ICompetition = await Competition.findOne({ league: league._id, name: 'Campionato' }) as ICompetition;
    // creazione round 'Stagione regolare'
    const round = {
        name: 'Stagione Regolare',
        homeFactor: 8,
        teams: fantasyTeams.length,
        roundRobin: true,
        rounds: league.regularSeasonFormat.value.rounds,
        league: league._id,
    };
    const newRound = await Round.create(round);
    competition.rounds.push(newRound);
    await competition.save();

    // creazione giornate
    const numTeams = fantasyTeams.length;
    const realFixturesSubList = realFixtures.slice(
        league.roundRobinFirstRealFixture - 1,
        league.roundRobinFirstRealFixture - 1 + ((numTeams - 1) * league.regularSeasonFormat.value.rounds),
    );
    for (let i = 0; i < realFixturesSubList.length; i++) {
        const fixture = {
            name: `Giornata #${i + 1}`,
            league: league._id,
        };
        const newFixture: IFixture = await Fixture.create(fixture) as IFixture;
        realFixturesSubList[i].fixtures.push(newFixture);
        await realFixturesSubList[i].save();
        newRound.fixtures.push(newFixture);
    }
    await newRound.save();
};

export const createPlayoff = async (league: ILeague, realFixtures: IRealFixture[]) => {
    const competition: ICompetition = await Competition.findOne({ league: league._id, name: 'Campionato' }) as ICompetition;
    let firstRealFixture = league.playoffFirstRealFixture;

    if (league.playoffFormat.value.qfGames) {
        // quarti di finale

        // creazione round 'Playoff - Quarti di finale'
        const round = {
            name: 'Playoff - Quarti di finale',
            homeFactor: 10,
            teams: 8,
            roundRobin: false,
            league: league._id,
        };
        if (league.playoffFormat.toString() === PlayoffFormat.QF2_SQ4_SF5_F5.toString()) {
            // i quarti di finali sono giocati da 4 squadre
            round.teams = 4;
        }
        const newRound = await Round.create(round);
        competition.rounds.push(newRound);

        // creazione giornate
        const realFixturesSubList = realFixtures.slice(
            firstRealFixture - 1,
            firstRealFixture - 1 + league.playoffFormat.value.qfGames,
        );
        for (let i = 0; i < realFixturesSubList.length; i++) {
            const fixture = {
                name: `Gara #${i + 1}`,
                league: league._id,
            };
            const newFixture = await Fixture.create(fixture);
            realFixturesSubList[i].fixtures.push(newFixture);
            await realFixturesSubList[i].save();
            newRound.fixtures.push(newFixture);
        }
        await newRound.save();
        firstRealFixture += league.playoffFormat.value.qfGames;
    }

    if (league.playoffFormat.value.sfGames) {
        // semifinali

        // creazione round 'Playoff - Semifinale'
        const round = {
            name: 'Playoff - Semifinale',
            homeFactor: 10,
            teams: 4,
            roundRobin: false,
            league: league._id,
        };
        const newRound = await Round.create(round);
        competition.rounds.push(newRound);

        // creazione giornate
        const realFixturesSubList = realFixtures.slice(
            firstRealFixture - 1,
            firstRealFixture - 1 + league.playoffFormat.value.sfGames,
        );
        for (let i = 0; i < realFixturesSubList.length; i++) {
            const fixture = {
                name: `Gara #${i + 1}`,
                league: league._id,
            };
            const newFixture = await Fixture.create(fixture);
            realFixturesSubList[i].fixtures.push(newFixture);
            await realFixturesSubList[i].save();
            newRound.fixtures.push(newFixture);
        }
        await newRound.save();
        firstRealFixture += league.playoffFormat.value.sfGames;
    }

    if (league.playoffFormat.value.fGames) {
        // semifinali

        // creazione round 'Playoff - Finale'
        const round = {
            name: 'Playoff - Finale',
            homeFactor: 10,
            teams: 2,
            roundRobin: false,
            league: league._id,
        };
        const newRound = await Round.create(round);
        competition.rounds.push(newRound);

        // creazione giornate
        const realFixturesSubList = realFixtures.slice(
            firstRealFixture - 1,
            firstRealFixture - 1 + league.playoffFormat.value.fGames,
        );
        for (let i = 0; i < realFixturesSubList.length; i++) {
            const fixture = {
                name: `Gara #${i + 1}`,
                league: league._id,
            };
            const newFixture = await Fixture.create(fixture);
            realFixturesSubList[i].fixtures.push(newFixture);
            await realFixturesSubList[i].save();
            newRound.fixtures.push(newFixture);
        }
        await newRound.save();
    }

    await competition.save();
};

export const createPlayout = async (league: ILeague, realFixtures: IRealFixture[]) => {
    const competition: ICompetition = await Competition.findOne({ league: league._id, name: 'Campionato' }) as ICompetition;
    let firstRealFixture = league.playoutFirstRealFixture;

    if (league.playoutFormat.value.rounds) {
        // creiamo il girone

        // creazione round 'Playout'
        const round = {
            name: 'Playout',
            homeFactor: 10,
            teams: 4,
            roundRobin: true,
            rounds: league.playoutFormat.value.rounds,
            league: league._id,
        };
        const newRound = await Round.create(round);
        competition.rounds.push(newRound);

        // creazione giornate
        const numTeams = league.playoutFormat.value.roundRobinTeams as number;
        const realFixturesSubList = realFixtures.slice(
            firstRealFixture - 1,
            firstRealFixture - 1 + ((numTeams - 1) * league.regularSeasonFormat.value.rounds),
        );
        for (let i = 0; i < realFixturesSubList.length; i++) {
            const fixture = {
                name: `Giornata #${i + 1}`,
                league: league._id,
            };
            const newFixture: IFixture = await Fixture.create(fixture) as IFixture;
            realFixturesSubList[i].fixtures.push(newFixture);
            await realFixturesSubList[i].save();
            newRound.fixtures.push(newFixture);
        }
        await newRound.save();
        firstRealFixture += (numTeams - 1) * league.playoutFormat.value.rounds;
    }

    if (league.playoutFormat.value.sfGames) {
        // creiamo le semifinali

        // creazione round 'Playout - Semifinale'
        const round = {
            name: 'Playout - Semifinale',
            homeFactor: 10,
            teams: 4,
            roundRobin: false,
            league: league._id,
        };
        const newRound = await Round.create(round);
        competition.rounds.push(newRound);

        // creazione giornate
        const realFixturesSubList = realFixtures.slice(
            firstRealFixture - 1,
            firstRealFixture - 1 + league.playoffFormat.value.sfGames,
        );
        for (let i = 0; i < realFixturesSubList.length; i++) {
            const fixture = {
                name: `Gara #${i + 1}`,
                league: league._id,
            };
            const newFixture = await Fixture.create(fixture);
            realFixturesSubList[i].fixtures.push(newFixture);
            await realFixturesSubList[i].save();
            newRound.fixtures.push(newFixture);
        }
        await newRound.save();
        firstRealFixture += league.playoffFormat.value.sfGames;
    }

    if (league.playoutFormat.value.fGames) {
        // spareggio retrocessione

        // creazione round 'Spareggio Retrocessione'
        const round = {
            name: 'Spareggio Retrocessione',
            homeFactor: 10,
            teams: 2,
            roundRobin: false,
            league: league._id,
        };
        const newRound = await Round.create(round);
        competition.rounds.push(newRound);

        // creazione giornate
        const realFixturesSubList = realFixtures.slice(
            firstRealFixture - 1,
            firstRealFixture - 1 + league.playoffFormat.value.fGames,
        );
        for (let i = 0; i < realFixturesSubList.length; i++) {
            const fixture = {
                name: `Gara #${i + 1}`,
                league: league._id,
            };
            const newFixture = await Fixture.create(fixture);
            realFixturesSubList[i].fixtures.push(newFixture);
            await realFixturesSubList[i].save();
            newRound.fixtures.push(newFixture);
        }
        await newRound.save();
    }

    await competition.save();
};

export const createCup = async (league: ILeague, realFixtures: IRealFixture[]) => {
    const competition: ICompetition = await Competition.findOne({ league: league._id, name: 'Coppa' }) as ICompetition;
    let firstRealFixture = league.cupFirstRealFixture;
    let lastRealFixture = league.cupFormat.value.qfRoundTrip ? (firstRealFixture + 2) : (firstRealFixture + 1);

    // creazione round 'Quarti di Finale'
    let round = {
        name: 'Quarti di Finale',
        homeFactor: league.cupFormat.value.qfRoundTrip ? 10 : 0,
        teams: 8,
        roundRobin: false,
        league: league._id,
    };
    let newRound = await Round.create(round);
    competition.rounds.push(newRound);

    // creazione giornate
    let realFixturesSubList = realFixtures.slice(
        firstRealFixture - 1,
        lastRealFixture,
    );
    for (let i = 0; i < realFixturesSubList.length; i++) {
        const fixture = {
            name: `Quarti di Finale - Gara #${i + 1}`,
            league: league._id,
        };
        const newFixture = await Fixture.create(fixture);
        realFixturesSubList[i].fixtures.push(newFixture);
        await realFixturesSubList[i].save();
        newRound.fixtures.push(newFixture);
    }
    await newRound.save();
    firstRealFixture = lastRealFixture + 1;
    lastRealFixture = league.cupFormat.value.sfRoundTrip ? (firstRealFixture + 2) : (firstRealFixture + 1);

    // creazione round 'Semifinale'
    round = {
        name: 'Semifinale',
        homeFactor: league.cupFormat.value.sfRoundTrip ? 10 : 0,
        teams: 4,
        roundRobin: false,
        league: league._id,
    };
    newRound = await Round.create(round);
    competition.rounds.push(newRound);

    // creazione giornate
    realFixturesSubList = realFixtures.slice(
        firstRealFixture - 1,
        lastRealFixture,
    );
    for (let i = 0; i < realFixturesSubList.length; i++) {
        const fixture = {
            name: `Semifinale - Gara #${i + 1}`,
            league: league._id,
        };
        const newFixture = await Fixture.create(fixture);
        realFixturesSubList[i].fixtures.push(newFixture);
        await realFixturesSubList[i].save();
        newRound.fixtures.push(newFixture);
    }
    await newRound.save();
    firstRealFixture = lastRealFixture + 1;
    lastRealFixture = league.cupFormat.value.fRoundTrip ? (firstRealFixture + 2) : (firstRealFixture + 1);

    // creazione round 'Finale'
    round = {
        name: 'Finale',
        homeFactor: league.cupFormat.value.fRoundTrip ? 10 : 0,
        teams: 2,
        roundRobin: false,
        league: league._id,
    };
    newRound = await Round.create(round);
    competition.rounds.push(newRound);

    // creazione giornate
    realFixturesSubList = realFixtures.slice(
        firstRealFixture - 1,
        lastRealFixture,
    );
    for (let i = 0; i < realFixturesSubList.length; i++) {
        const fixture = {
            name: `Finale - Gara #${i + 1}`,
            league: league._id,
        };
        const newFixture = await Fixture.create(fixture);
        realFixturesSubList[i].fixtures.push(newFixture);
        await realFixturesSubList[i].save();
        newRound.fixtures.push(newFixture);
    }
    await newRound.save();
    await competition.save();
};
