import { Model, model, Schema } from 'mongoose';
import ICompetitionDocument from './documents/competition.document';
import { roundFormat } from './formats/round-format';

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
});

const Competition = model<ICompetition, ICompetitionModel>('Competition', schema);

export default Competition;
