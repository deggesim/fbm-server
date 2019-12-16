import { Model, model, Schema } from 'mongoose';
import IRosterDocument from './documents/roster.document';

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
// tslint:disable-next-line: no-empty-interface
export interface IRoster extends IRosterDocument {
    // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IFantasyRosterModel extends Model<IRoster> {
    // metodi statici
}

const schema = new Schema<IRoster>({
    team: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Team',
    },
    player: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Player',
    },
    fantasyRoster: {
        status: {
            type: String,
            required: true,
            enum: ['EXT', 'COM', 'NAT'],
        },
        draft: {
            type: Boolean,
            required: true,
            default: false,
        },
        contract: {
            type: Number,
            required: true,
        },
        yearContract: {
            type: Number,
            required: true,
        },
    },
    league: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'League',
    },
});

const FantasyRoster = model<IRoster, IFantasyRosterModel>('FantasyRoster', schema);

export default FantasyRoster;
