import { Document, model, Model, Schema } from 'mongoose';
import { createCup, createPlayoff, createPlayout, createRegularSeason, populateCompetition, populateRealFixture } from '../util/new-season.util';
import { FantasyTeam } from './fantasy-team';
import { Fixture, IFixture } from './fixture';
import { cupFormat, CupFormat } from './formats/cup-format';
import { playoffFormat, PlayoffFormat } from './formats/playoff-format';
import { playoutFormat, PlayoutFormat } from './formats/playout-format';
import { regularSeasonFormat, RegularSeasonFormat } from './formats/regular-season-format';
import { IRealFixture, RealFixture } from './real-fixture';

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
    league: ILeague['_id'];
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
    nextFixture: () => Promise<IFixture>;
    nextRealFixture: () => Promise<IRealFixture>;
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
    for (const param of parameters) {
        league.parameters.push(param);
    }
    return league.save();
};

schema.methods.setRoles = async function (roles: Array<{ role: string, spots: number[] }>) {
    const league = this;
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

schema.methods.nextFixture = async function () {
    const league = this;
    const realFixture: IRealFixture = await RealFixture.findOne({ league: league._id }).populate({
        path: 'fixtures',
        match: { completed: false },
        options: { sort: { _id: 1 } },
    }).sort({ id: 1 }) as IRealFixture;
    return realFixture.fixtures[0];
};

schema.methods.nextRealFixture = async function () {
    const league = this;
    const realFixture: IRealFixture = await RealFixture.findOne({ league: league._id }).populate({
        path: 'fixtures',
        match: { completed: false },
        options: { sort: { _id: 1 } },
    }).sort({ id: 1 }) as IRealFixture;
    return realFixture;
};

export const League = model<ILeague, ILeagueModel>('League', schema);
