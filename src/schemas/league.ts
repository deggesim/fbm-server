import { model, Model, Schema } from 'mongoose';
import { ILeagueDocument } from './documents/league-document';

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
// tslint:disable-next-line: no-empty-interface
export interface ILeague extends ILeagueDocument {
    // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface ILeagueModel extends Model<ILeague> {
    // metodi statici
}

const leagueSchema = new Schema<ILeagueDocument>({
    _id: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    regularSeasonFormat: {
        label: {
            type: String,
            required: true,
        },
        rounds: {
            type: Number,
            required: true,
        },
    },
    playoffFormat: {
        label: {
            type: String,
            required: true,
        },
        games: {
            type: Number,
            required: true,
        },
        qfGames: {
            type: Number,
        },
        sfGames: {
            type: Number,
            required: true,
        },
        fGames: {
            type: Number,
            required: true,
        },
    },
    playoutFormat: {
        label: {
            type: String,
            required: true,
        },
        games: {
            type: Number,
            required: true,
        },
        rounds: {
            type: Number,
        },
        roundRobinTeams: {
            type: Number,
        },
        sfGames: {
            type: Number,
        },
        fGames: {
            type: Number,
            required: true,
        },
    },
    cupFormat: {
        label: {
            type: String,
            required: true,
        },
        games: {
            type: Number,
            required: true,
        },
        qfRoundTrip: {
            type: Boolean,
            required: true,
        },
        sfRoundTrip: {
            type: Boolean,
            required: true,
        },
        fRoundTrip: {
            type: Boolean,
            required: true,
        },
    },
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
            enum: ['DRAFT',
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
}, { _id: false });

const League = model<ILeague, ILeagueModel>('League', leagueSchema);

export default League;
