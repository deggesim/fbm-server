import { Model, model, Schema } from 'mongoose';
import { ITenant } from './league';
import { IPlayer } from './player';
import { IRealFixture } from './real-fixture';
import { ITeam } from './team';

interface IRosterDocument extends ITenant {
    player: IPlayer;
    team: ITeam;
    realFixture: IRealFixture['_id'];
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
// tslint:disable-next-line: no-empty-interface
export interface IRoster extends IRosterDocument {
    // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IRosterModel extends Model<IRoster> {
    // metodi statici
}

const schema = new Schema<IRoster>({
    player: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Player',
    },
    team: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Team',
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

schema.virtual('fantasyRoster', {
    ref: 'FantasyRoster',
    localField: '_id',
    foreignField: 'roster',
    justOne: true,
});

export const Roster = model<IRoster, IRosterModel>('Roster', schema);
