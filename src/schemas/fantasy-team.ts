import { Model, model, Schema } from 'mongoose';
import { IFantasyTeamDocument } from './documents/fantasy-team.document';

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

const FantasyTeam = model<IFantasyTeam, IFantasyTeamModel>('FantasyTeam', schema);

export default FantasyTeam;
