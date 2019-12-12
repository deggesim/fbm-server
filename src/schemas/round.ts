import { Model, model, Schema } from 'mongoose';
import { IRoundDocument } from './documents/round.document';
import { roundFormat } from './formats/round-format';

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
// tslint:disable-next-line: no-empty-interface
export interface IRound extends IRoundDocument {
    // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IRoundModel extends Model<IRound> {
    // metodi statici
}

const schema = new Schema<IRoundDocument>({
    name: {
        type: String,
        required: true,
    },
    roundFormat,
    completed: {
        type: Boolean,
        required: true,
        default: false,
    },
    homeFactor: {
        type: Number,
        required: true,
    },
    fantasyTeams: [{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'FantasyTeam',
    }],
    fixtures: [{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Fixture',
    }],
    league: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'League',
    },
});

const Round = model<IRound, IRoundModel>('Round', schema);

export default Round;
