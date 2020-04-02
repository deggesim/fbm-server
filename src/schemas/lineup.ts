import { Model, model, Schema } from 'mongoose';
import { IFantasyRoster } from './fantasy-roster';
import { IFixture } from './fixture';
import { ITenant } from './league';

interface ILineupDocument extends ITenant {
    fantasyRoster: IFantasyRoster['id'];
    spot: number;
    benchOrder: number;
    fixture: IFixture['id'];
    matchReport: {
        realRanking: number;
        realRanking40Min: number;
        minutesUsed: number;
    };
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
// tslint:disable-next-line: no-empty-interface
export interface ILineup extends ILineupDocument {
    // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface ILineupModel extends Model<ILineupDocument> {
    // metodi statici
}

const schema = new Schema<ILineup>({
    fantasyRoster: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'FantasyRoster',
    },
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
    fixture: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Fixture',
    },
    matchReport: {
        realRanking: {
            type: Number,
        },
        realRanking40Min: {
            type: Number,
        },
        minutesUsed: {
            type: Number,
        },
    },
    league: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'League',
    },
}, {
    timestamps: true,
});

export const Lineup = model<ILineup, ILineupModel>('Lineup', schema);
