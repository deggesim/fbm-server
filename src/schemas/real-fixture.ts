import { Model, model, Schema } from 'mongoose';
import { IFixture } from './fixture';
import { ITenant } from './league';
import { IPerformance } from './performance';
import { IRoster } from './roster';

interface IRealFixtureDocument extends ITenant {
    name: string;
    prepared: boolean;
    performances: Array<IPerformance['_id']>;
    fixtures: Array<IFixture['_id']>;
    rosters: Array<IRoster['_id']>;
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
    performances: [{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Performance',
    }],
    fixtures: [{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Fixture',
    }],
    rosters: [{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Roster',
    }],
    league: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'League',
    },
}, {
    timestamps: true,
});

export const RealFixture = model<IRealFixture, IRealFixtureModel>('RealFixture', schema);
