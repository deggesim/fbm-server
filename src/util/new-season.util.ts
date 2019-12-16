import Competition from '../schemas/competition';
import ICompetitionDocument from '../schemas/documents/competition.document';
import Fixture from '../schemas/fixture';
import { RoundFormat } from '../schemas/formats/round-format';
import { ILeague } from '../schemas/league';
import RealFixture, { IRealFixture } from '../schemas/real-fixture';
import Round from '../schemas/round';

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
    const realFixtures = [];
    for (let i = 1; i <= games; i++) {
        const realFixture = {
            name: `Giornata #${i}`,
            prepared: false,
            league: league.id,
        };
        realFixtures.push(realFixture);
    }
    return await RealFixture.insertMany(realFixtures);
};

export const createRegularSeason = async (league: ILeague, realFixtures: IRealFixture[]) => {
    const regularSeasonFormat = league.regularSeasonFormat;
    const championship: ICompetitionDocument = await Competition.findOne({ league: league.id, name: 'Campionato' }) as ICompetitionDocument;
    const regularSeason = {
        name: 'Stagione Regolare',
        roundFormat: RoundFormat.ROUND_ROBIN,
        homeFactor: 8,
    };
    Round.create(regularSeason);
    championship.rounds.push(regularSeason);
    championship.save();

    const realFixturesSubList = realFixtures.slice(
        league.roundRobinFirstRealFixture - 1,
        league.roundRobinFirstRealFixture - 1 + ((league.fantasyTeams.length - 1) * league.regularSeasonFormat.value.rounds),
    );

    const fixtures = [];
    for (let i = 0; i < realFixturesSubList.length; i++) {
        const fixture = {
            name: `Giornata #${i}`,
            league: league.id,
        };
        fixtures.push(fixture);
    }
    await Fixture.insertMany(fixtures);
};

export const createPlayoff = async (league: ILeague) => {
};

export const createPlayout = async (league: ILeague) => {
};

export const createCup = async (league: ILeague) => {
};
