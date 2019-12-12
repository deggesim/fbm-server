import { Model, model, Schema } from 'mongoose';
import IPerformanceDocument from './documents/performance.document';

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
// tslint:disable-next-line: no-empty-interface
export interface IPerformance extends IPerformanceDocument {
    // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IPerformanceModel extends Model<IPerformance> {
    // metodi statici
}

const schema = new Schema<IPerformanceDocument>({
    player: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Player',
    },
    ranking: {
        type: Number,
    },
    minutes: {
        type: Number,
    },
    oer: {
        type: Number,
    },
    plusMinus: {
        type: Number,
    },
    grade: {
        type: Number,
    },
    league: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'League',
    },
});

const Performance = model<IPerformance, IPerformanceModel>('Performance', schema);

export default Performance;
