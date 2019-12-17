import { Model, model, Schema } from 'mongoose';
import { IFormation } from './formation';
import { ITenant } from './league';
import { IUser } from './user';

interface IFantasyTeamDocument extends ITenant {
    name: string;
    initialBalance: number;
    outgo: number;
    totalContracts: number;
    playersInRoster: number;
    extraPlayers: number;
    pointsPenalty: number;
    balancePenalty: number;
    formations: Array<IFormation['_id']>;
    owners: Array<IUser['_id']>;
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
// tslint:disable-next-line: no-empty-interface
export interface IFantasyTeam extends IFantasyTeamDocument {
    // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IFantasyTeamModel extends Model<IFantasyTeam> {
    // metodi statici
}

const schema = new Schema<IFantasyTeam>({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    initialBalance: {
        type: Number,
        required: true,
        default: 200,
    },
    outgo: {
        type: Number,
        required: true,
        default: 0,
    },
    totalContracts: {
        type: Number,
        required: true,
        default: 0,
    },
    playersInRoster: {
        type: Number,
        required: true,
        default: 0,
    },
    extraPlayers: {
        type: Number,
        required: true,
        default: 0,
    },
    pointsPenalty: {
        type: Number,
        required: true,
        default: 0,
    },
    balancePenalty: {
        type: Number,
        required: true,
        default: 0,
    },
    formations: [{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Formation',
    }],
    owners: [{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    }],
    league: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'League',
    },
});

export const FantasyTeam = model<IFantasyTeam, IFantasyTeamModel>('FantasyTeam', schema);
