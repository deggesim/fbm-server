import { ObjectId } from 'mongodb';
import { Model, model, Schema } from 'mongoose';
import { IFantasyTeam } from './fantasy-team';
import { ITenant } from './league';
import { IRealFixture } from './real-fixture';

interface IFantasyTeamHistoryDocument extends ITenant {
  fantasyTeam: IFantasyTeam | ObjectId;
  initialBalance: number;
  outgo: number;
  totalContracts: number;
  playersInRoster: number;
  extraPlayers: number;
  pointsPenalty: number;
  balancePenalty: number;
  realFixture: IRealFixture | ObjectId;
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
export interface IFantasyTeamHistory extends IFantasyTeamHistoryDocument {
  // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IFantasyTeamHistoryModel extends Model<IFantasyTeamHistory> {
  // metodi statici
}

const schema = new Schema<IFantasyTeamHistory>({
  fantasyTeam: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'FantasyTeam',
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
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
});

export const FantasyTeamHistory = model<IFantasyTeamHistory, IFantasyTeamHistoryModel>('FantasyTeamHistory', schema);
