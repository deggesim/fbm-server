import { model, Model, Schema } from 'mongoose';
import { fantasyTeam } from './documents/fantasy-team.document';
import { ILeagueDocument } from './documents/league.document';
import { team } from './documents/team.document';
import { cupFormat } from './formats/cup-format';
import { playoffFormat } from './formats/playoff-format';
import { playoutFormat } from './formats/playout-format';
import { regularSeasonFormat } from './formats/regular-season-format';

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
    fantasyTeams: [fantasyTeam],
    teams: [team],
});

const League = model<ILeague, ILeagueModel>('League', leagueSchema);

export default League;
