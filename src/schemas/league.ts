import { ObjectId } from 'mongodb';
import { Document, model, Model, Schema } from 'mongoose';
import { cleanLeague, createCup, createPlayoff, createPlayout, createRegularSeason, populateCompetition, populateRealFixture } from '../util/new-season.util';
import { Competition } from './competition';
import { FantasyRoster, IFantasyRoster } from './fantasy-roster';
import { FantasyTeam } from './fantasy-team';
import { Fixture, IFixture } from './fixture';
import { cupFormat, CupFormat } from './formats/cup-format';
import { playoffFormat, PlayoffFormat } from './formats/playoff-format';
import { playoutFormat, PlayoutFormat } from './formats/playout-format';
import { regularSeasonFormat, RegularSeasonFormat } from './formats/regular-season-format';
import { IRealFixture, RealFixture } from './real-fixture';
import { IRoster, Roster } from './roster';
import { IRound, Round } from './round';

interface ILeagueDocument extends Document {
    name: string;
    regularSeasonFormat: RegularSeasonFormat;
    playoffFormat: PlayoffFormat;
    playoutFormat: PlayoutFormat;
    cupFormat: CupFormat;
    realGames: number;
    roundRobinFirstRealFixture: number;
    playoffFirstRealFixture: number;
    playoutFirstRealFixture: number;
    cupFirstRealFixture: number;
    parameters: [{
        parameter: string;
        value: number;
    }];
    roles: [{
        role: string;
        spots: number[];
    }];
}

export interface ITenant extends Document {
    league: ILeague | ObjectId;
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
// tslint:disable-next-line: no-empty-interface
export interface ILeague extends ILeagueDocument {
    // metodi d'istanza
    populateLeague: () => Promise<ILeague>;
    setParameters: (parameters: Array<{ parameter: string, value: number }>) => Promise<ILeague>;
    setRoles: (roles: Array<{ role: string, spots: number[] }>) => Promise<ILeague>;
    completePreseason: () => Promise<ILeague>;
    isPreseason: () => Promise<boolean>;
    isOffseason: () => Promise<boolean>;
    isPostseason: () => Promise<boolean>;
    nextFixture: () => Promise<IFixture>;
    nextRealFixture: () => Promise<IRealFixture>;
    progress: (realFixture: IRealFixture) => Promise<void>;
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface ILeagueModel extends Model<ILeague> {
    // metodi statici
}

const schema = new Schema<ILeague>({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    regularSeasonFormat,
    playoffFormat,
    playoutFormat,
    cupFormat,
    realGames: {
        type: Number,
        required: true,
    },
    roundRobinFirstRealFixture: {
        type: Number,
        required: true,
    },
    playoffFirstRealFixture: {
        type: Number,
        required: true,
    },
    playoutFirstRealFixture: {
        type: Number,
        required: true,
    },
    cupFirstRealFixture: {
        type: Number,
        required: true,
    },
    parameters: [{
        parameter: {
            type: String,
            enum: [
                'DRAFT',
                'MAX_CONTRACTS',
                'MAX_EXT_OPT_345',
                'MAX_PLAYERS_IN_ROSTER',
                'MAX_STRANGERS_OPT_55',
                'MIN_NAT_PLAYERS',
                'RESULT_DIVISOR',
                'RESULT_WITH_GRADE',
                'RESULT_WITH_OER',
                'RESULT_WITH_PLUS_MINUS',
                'TREND',
            ],
            required: true,
        },
        value: {
            type: Number,
            required: true,
        },
    }],
    roles: [{
        role: {
            type: String,
            required: true,
            enum: [
                'Playmaker',
                'Play/Guardia',
                'Guardia',
                'Guardia/Ala',
                'Ala',
                'Ala/Centro',
                'Centro',
            ],
        },
        spots: [{
            type: Number,
            min: 1,
            max: 12,
        }],
    }],
}, {
    timestamps: true,
});

schema.methods.populateLeague = async function () {
    const league = this;
    await cleanLeague(league);
    await populateCompetition(league);
    const realFixtures = await populateRealFixture(league);
    const fantasyTeams = await FantasyTeam.find({ league: league._id });
    await createRegularSeason(league, realFixtures, fantasyTeams);
    await createPlayoff(league, realFixtures);
    await createPlayout(league, realFixtures);
    await createCup(league, realFixtures);
    return Promise.resolve(league);
};

schema.methods.setParameters = async function (parameters: Array<{ parameter: string, value: number }>) {
    const league = this;
    await League.findByIdAndUpdate(league._id, { parameters: [] });
    for (const param of parameters) {
        league.parameters.push(param);
    }
    return league.save();
};

schema.methods.setRoles = async function (roles: Array<{ role: string, spots: number[] }>) {
    const league = this;
    await League.findByIdAndUpdate(league._id, { roles: [] });
    for (const role of roles) {
        league.roles.push(role);
    }
    return league.save();
};

schema.methods.completePreseason = async function () {
    const league = this;
    const realFixture: IRealFixture = await RealFixture.findOne({ league: league._id }).sort({ id: 1 }) as IRealFixture;
    realFixture.prepared = true;
    await realFixture.save();
    return Promise.resolve(league);
};

schema.methods.isPreseason = async function () {
    const league = this;
    return !await RealFixture.exists({ league: league._id, prepared: true });
};

schema.methods.isOffseason = async function () {
    const league = this;
    return !await Fixture.exists({ league: league._id, completed: false });
};

schema.methods.isPostseason = async function () {
    const league = this;
    const round: IRound = await Round.findOne({ league: league._id, name: 'Stagione Regolare' }) as IRound;
    return round.completed;
};

schema.methods.nextFixture = async function () {
    const league = this;
    const realFixture: IRealFixture = await RealFixture.findOne({ league: league._id, prepared: true }).sort({ _id: -1 }) as IRealFixture;
    await realFixture.populate('fixtures').execPopulate();
    const fixtures = realFixture.fixtures as IFixture[];
    const allCompleted = fixtures.every((fixture) => fixture.completed);
    if (allCompleted) {
        return fixtures.sort((a, b) => b._id - a._id)[0];
    } else {
        return fixtures.filter((fixture) => !fixture.completed).sort((a, b) => a._id - b._id)[0];
    }
};

schema.methods.nextRealFixture = async function () {
    const league = this;
    const realFixture: IRealFixture = await RealFixture.findOne({ league: league._id, prepared: true }).sort({ _id: -1 }) as IRealFixture;
    await realFixture.populate('fixtures').execPopulate();
    return realFixture;
};

schema.methods.progress = async function (realFixture: IRealFixture) {
    const league = this;
    const rounds = await Round.find({ league: league._id });
    // check all rounds
    for (const round of rounds) {
        await round.populate('fixtures').execPopulate();
        let compltedRoundFixtures = 0;
        for (const fixture of round.fixtures as IFixture[]) {
            if (fixture.completed) {
                compltedRoundFixtures++;
            }
        }
        if (compltedRoundFixtures === round.fixtures.length) {
            // round completed
            round.completed = true;
            await round.save();
        }
    }

    const competitions = await Competition.find({ league: league._id });
    // check all competitions
    for (const competition of competitions) {
        await competition.populate('rounds').execPopulate();
        let completedRounds = 0;
        for (const round of competition.rounds as IRound[]) {
            if (round.completed) {
                completedRounds++;
            }
        }
        if (completedRounds === competition.rounds.length) {
            // competition completed
            competition.completed = true;
            await competition.save();
        }
    }

    // prepare next realFixture
    const fixtures = realFixture.fixtures as IFixture[];
    const allFixturesComplete = fixtures.every((fixture) => fixture.completed);
    if (allFixturesComplete) {
        const firstUnpreparedRealFixture = await RealFixture.findOne({ league: league._id, prepared: false }, [], { sort: { _id: 1 } });
        if (firstUnpreparedRealFixture != null) {
            const rosters: IRoster[] = await Roster.find({ league: league._id, realFixture: realFixture._id });
            for (const roster of rosters) {
                const { player, team } = roster;
                const newRoster = {
                    player,
                    team,
                    realFixture: firstUnpreparedRealFixture,
                    league,
                };
                const rosterCreated = await Roster.create(newRoster);
                if (roster.fantasyRoster != null) {
                    const { fantasyTeam, status, draft, contract, yearContract } = roster.fantasyRoster as IFantasyRoster;
                    const newFantasyRoster = {
                        roster,
                        fantasyTeam,
                        status,
                        draft,
                        contract,
                        yearContract,
                        realFixture: firstUnpreparedRealFixture,
                    };
                    const fantasyRosterCreated = await FantasyRoster.create(newFantasyRoster);
                    rosterCreated.fantasyRoster = fantasyRosterCreated;
                    await rosterCreated.save();
                }
            }
            firstUnpreparedRealFixture.prepared = true;
            firstUnpreparedRealFixture.save();
        }
    }
};

export const League = model<ILeague, ILeagueModel>('League', schema);
