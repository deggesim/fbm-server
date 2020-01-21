import { Model, model, Schema } from 'mongoose';
import { IFixture } from './fixture';
import { ITenant } from './league';

interface IRealFixtureDocument extends ITenant {
    name: string;
    prepared: boolean;
    fixtures: Array<IFixture['_id']>;
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
// tslint:disable-next-line: no-empty-interface
export interface IRealFixture extends IRealFixtureDocument {
    // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IRealFixtureModel extends Model<IRealFixture> {
    // metodi statici
}

const schema = new Schema<IRealFixture>({
    name: {
        type: String,
        required: true,
    },
    prepared: {
        type: Boolean,
        deafault: false,
    },
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
}, {
    timestamps: true,
});

schema.virtual('rosters', {
    ref: 'Roster',
    localField: '_id',
    foreignField: 'realFixture',
});

schema.virtual('performances', {
    ref: 'Performance',
    localField: '_id',
    foreignField: 'realFixture',
});

export const RealFixture = model<IRealFixture, IRealFixtureModel>('RealFixture', schema);
