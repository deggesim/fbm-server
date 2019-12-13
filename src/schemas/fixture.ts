import { Model, model, Schema } from 'mongoose';
import IFixtureDocument from './documents/fixture.document';

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
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Match',
    }]
    league: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'League',
    },
});

const Fixture = model<IFixture, IFixtureModel>('Fixture', schema);

export default Fixture;
