import { Model, model, Schema } from 'mongoose';
import { ITenant } from './league';
import { IMatch } from './match';

interface IFixtureDocument extends ITenant {
    name: string;
    unnecessary: boolean;
    completed: boolean;
    matches: Array<IMatch['_id']>;
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
// tslint:disable-next-line: no-empty-interface
export interface IFixture extends IFixtureDocument {
    // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IFixtureModel extends Model<IFixtureDocument> {
    // metodi statici
}

const schema = new Schema<IFixture>({
    name: {
        type: String,
        required: true,
    },
    unnecessary: {
        type: Boolean,
        required: true,
        default: false,
    },
    completed: {
        type: Boolean,
        required: true,
        default: false,
    },
    matches: [{
        homeTeam: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'FantasyTeam',
        },
        awayTeam: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'FantasyTeam',
        },
        homeRanking: {
            type: Number,
        },
        homeRanking40Min: {
            type: Number,
        },
        awayRanking: {
            type: Number,
        },
        awayRanking40Min: {
            type: Number,
        },
        homeFactor: {
            type: Number,
        },
        homeOer: {
            type: Number,
        },
        awayOer: {
            type: Number,
        },
        homePlusMinus: {
            type: Number,
        },
        awayPlusMinus: {
            type: Number,
        },
        homeGrade: {
            type: Number,
        },
        awayGrade: {
            type: Number,
        },
        overtime: {
            type: Number,
        },
        completed: {
            type: Boolean,
            required: true,
            default: false,
        },
    }],
    league: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'League',
    },
}, {
    timestamps: true,
});

export const Fixture = model<IFixture, IFixtureModel>('Fixture', schema);
