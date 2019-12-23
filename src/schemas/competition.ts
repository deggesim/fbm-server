import { Model, model, Schema } from 'mongoose';
import { ITenant } from './league';
import { IRound } from './round';

interface ICompetitionDocument extends ITenant {
    name: string;
    completed: boolean;
    rounds: Array<IRound['_id']>;
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
// tslint:disable-next-line: no-empty-interface
export interface ICompetition extends ICompetitionDocument {
    // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface ICompetitionModel extends Model<ICompetitionDocument> {
    // metodi statici
}

const schema = new Schema<ICompetition>({
    name: {
        type: String,
        required: true,
    },
    completed: {
        type: Boolean,
        required: true,
        default: false,
    },
    rounds: [{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Round',
    }],
    league: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'League',
    },
}, {
    timestamps: true,
});

export const Competition = model<ICompetition, ICompetitionModel>('Competition', schema);
