import { Competition, ICompetition } from '../schemas/competition';
import { IFantasyTeam } from '../schemas/fantasy-team';
import { Fixture, IFixture } from '../schemas/fixture';
import { RoundFormat } from '../schemas/formats/round-format';
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

export const populateRealFixture = async (league: ILeague) => {
    const games: number = league.realGames;
    const realFixtures: IRealFixture[] = [];
    for (let i = 1; i <= games; i++) {
        const realFixture = {
            name: `Giornata #${i}`,
            prepared: false,
            league: league.id,
        };
        const createdRealFixture: IRealFixture = await RealFixture.create(realFixture);
        realFixtures.push(createdRealFixture);
    }
};

export const createRegularSeason = async (league: ILeague, realFixtures: IRealFixture[], fantasyTeams: IFantasyTeam[]) => {
    const regularSeasonFormat = league.regularSeasonFormat;

    // creazione round 'Stagione regolare'
    const championship: ICompetition = await Competition.findOne({ league: league.id, name: 'Campionato' }) as ICompetition;
    const regularSeason = {
        name: 'Stagione Regolare',
        roundFormat: RoundFormat.ROUND_ROBIN,
        homeFactor: 8,
    };
    Round.create(regularSeason);
    championship.rounds.push(regularSeason);
    championship.save();

    // estrapolo la lista delle partite reali
    const numTeams = fantasyTeams.length;
    const realFixturesSubList = realFixtures.slice(
        league.roundRobinFirstRealFixture - 1,
        league.roundRobinFirstRealFixture - 1 + ((numTeams - 1) * league.regularSeasonFormat.value.rounds),
    );

    // creazione giornate
    const fixtures = [];
    for (let i = 0; i < realFixturesSubList.length; i++) {
        const fixture = {
            name: `Giornata #${i}`,
            league: league.id,
        };
        const createdFixture: IFixture = await Fixture.create(fixture) as IFixture;
        fixtures.push(createdFixture);
        realFixturesSubList[i].fixtures.push(createdFixture);
        await realFixturesSubList[i].save();
    }
};

export const createPlayoff = async (league: ILeague) => {
};

export const createPlayout = async (league: ILeague) => {
};

export const createCup = async (league: ILeague) => {
};
