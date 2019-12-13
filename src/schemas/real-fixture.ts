import { Model, model, Schema } from 'mongoose';
import { IRealFixtureDocument } from './documents/real-fixture.document';

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
        ref: 'FantasyRoster',
    }],
    league: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'League',
    },
});

const RealFixture = model<IRealFixture, IRealFixtureModel>('RealFixture', schema);

export default RealFixture;
