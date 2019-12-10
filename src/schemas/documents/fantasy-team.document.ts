import { Document, Schema } from 'mongoose';
import { IUserDocument } from './user.document';

export interface IFantasyTeamDocument extends Document {
    name: string;
    owners: Array<IUserDocument['id']>;
    initialBalance: number;
    outgo: number;
    totalContracts: number;
    playersInRoster: number;
    extraPlayers: number;
    pointsPenalty: number;
    balancePenalty: number;
}

export const fantasyTeam = {
    name: {
        type: String,
        required: true,
        trim: true,
    },
    owners: [{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    }],
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
};
