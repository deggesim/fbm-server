import { Model, model, Schema } from 'mongoose';
import { ITenant } from './league';
import { IPlayer } from './player';
import { IRealFixture } from './real-fixture';

interface IFantasyRosterDocument extends ITenant {
    player: IPlayer['id'];
    status: string;
    draft: boolean;
    contract: number;
    yearContract: number;
    realFixture: IRealFixture['_id'];
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
// tslint:disable-next-line: no-empty-interface
export interface IFantasyRoster extends IFantasyRosterDocument {
    // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IFantasyRosterModel extends Model<IFantasyRoster> {
    // metodi statici
}

const schema = new Schema<IFantasyRoster>({
    player: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Player',
    },
    fantasyTeam: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'FantasyTeam',
    },
    status: {
        type: String,
        required: true,
        enum: ['EXT', 'COM', 'NAT'],
    },
    draft: {
        type: Boolean,
        required: true,
        default: false,
    },
    contract: {
        type: Number,
        required: true,
    },
    yearContract: {
        type: Number,
        required: true,
    },
    realFixture: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'RealFixture',
    },
    league: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'League',
    },
}, {
    timestamps: true,
});

export const FantasyRoster = model<IFantasyRoster, IFantasyRosterModel>('FantasyRoster', schema);
