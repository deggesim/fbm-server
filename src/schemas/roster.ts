import { Model, model, Schema } from 'mongoose';
import { ITenant } from './league';
import { IPlayer } from './player';
import { ITeam } from './team';

interface IRosterDocument extends ITenant {
    team: ITeam;
    player: IPlayer;
    fantasyRoster: {
        status: string;
        draft: boolean;
        contract: number;
        yearContract: number;
    };
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
export interface IFantasyRosterModel extends Model<IRoster> {
    // metodi statici
}

const schema = new Schema<IRoster>({
    team: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Team',
    },
    player: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Player',
    },
    fantasyRoster: {
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
    },
    league: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'League',
    },
});

export const FantasyRoster = model<IRoster, IFantasyRosterModel>('FantasyRoster', schema);
