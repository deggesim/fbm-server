import { ObjectId } from 'mongodb';
import { Model, model, Schema } from 'mongoose';
import { IFantasyTeam } from './fantasy-team';
import { ITenant } from './league';
import { IRealFixture } from './real-fixture';

interface IFantasyTeamHistoryDocument extends ITenant {
  fantasyTeam: IFantasyTeam | ObjectId;
  balance: number;
  operation: string;
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
  balance: {
    type: Number,
    required: true,
    default: 200,
  },
  operation: {
    type: String,
    required: true,
    enum: [
      "UPDATE_BALANCE",
    ],
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
