import { Model, model, Schema } from 'mongoose';
import { IFantasyTeam } from './fantasy-team';
import { IFixture } from './fixture';
import { roundFormat, RoundFormat } from './formats/round-format';
import { ITenant } from './league';

interface IRoundDocument extends ITenant {
    name: string;
    completed: boolean;
    homeFactor: number;
    fantasyTeam: Array<IFantasyTeam['_id']>;
    fixtures: Array<IFixture['id']>;
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
// tslint:disable-next-line: no-empty-interface
export interface IRound extends IRoundDocument {
    // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IRoundModel extends Model<IRound> {
    // metodi statici
}

const schema = new Schema<IRound>({
    name: {
        type: String,
        required: true,
    },
    completed: {
        type: Boolean,
        required: true,
        default: false,
    },
    homeFactor: {
        type: Number,
        required: true,
        default: 0,
    },
    fantasyTeams: [{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'FantasyTeam',
    }],
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

export const Round = model<IRound, IRoundModel>('Round', schema);
