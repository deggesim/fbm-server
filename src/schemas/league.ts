import { Document, model, Model, Schema } from 'mongoose';
import { createCup, createPlayoff, createPlayout, createRegularSeason, populateCompetition, populateRealFixture } from '../util/new-season.util';
import { FantasyTeam } from './fantasy-team';
import { cupFormat, CupFormat } from './formats/cup-format';
import { playoffFormat, PlayoffFormat } from './formats/playoff-format';
import { playoutFormat, PlayoutFormat } from './formats/playout-format';
import { regularSeasonFormat, RegularSeasonFormat } from './formats/regular-season-format';

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

export const League = model<ILeague, ILeagueModel>('League', schema);
