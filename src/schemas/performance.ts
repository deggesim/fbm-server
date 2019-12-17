import { Model, model, Schema } from 'mongoose';
import { ITenant } from './league';
import { IPlayer } from './player';

interface IPerformanceDocument extends ITenant {
    player: IPlayer;
    ranking: number;
    minutes: number;
    oer: number;
    plusMinus: number;
    grade: number;
}

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

const schema = new Schema<IPerformance>({
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

export const Performance = model<IPerformance, IPerformanceModel>('Performance', schema);
