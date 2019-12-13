import { Model, model, Schema } from 'mongoose';
import { IFormationDocument } from './documents/formation.document';

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
// tslint:disable-next-line: no-empty-interface
export interface IFormation extends IFormationDocument {
    // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IFormationModel extends Model<IFormationDocument> {
    // metodi statici
}

const schema = new Schema<IFormation>({
    spot: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
    },
    benchOrder: {
        type: Number,
        min: 1,
        max: 5,
    },
    player: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Player',
    },
    fixture: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Fixture',
    },
    matchReport: {
        realRanking: {
            type: Number,
            required: true,
        },
        realRanking40Min: {
            type: Number,
            required: true,
        },
        minutesUsed: {
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

const Formation = model<IFormation, IFormationModel>('Formation', schema);

export default Formation;
