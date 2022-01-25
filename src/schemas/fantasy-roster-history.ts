import { ObjectId } from 'mongodb';
import { Model, model, Schema } from 'mongoose';
import { IFantasyTeam } from './fantasy-team';
import { ITenant } from './league';
import { IRealFixture } from './real-fixture';

interface IFantasyRosterHistoryDocument extends ITenant {
  name: string;
  fantasyTeam: IFantasyTeam | ObjectId;
  status: string;
  draft: boolean;
  contract?: number;
  yearContract: number;
  role: string;
  operation: string;
  balance: number;
  realFixture: IRealFixture | ObjectId;
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
export interface IFantasyRosterHistory extends IFantasyRosterHistoryDocument {
  // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IFantasyRosterHistoryModel extends Model<IFantasyRosterHistory> {
  // metodi statici
}

const schema = new Schema<IFantasyRosterHistory>({
  name: {
    type: String,
    required: true,
  },
  fantasyTeam: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'FantasyTeam',
  },
  status: {
    type: String,
    required: true,
    enum: ['EXT', 'COM', 'STR', 'ITA'],
  },
  draft: {
    type: Boolean,
    required: true,
    default: false,
  },
  contract: {
    type: Number,
  },
  yearContract: {
    type: Number,
    required: true,
  },
  role: {
    type: String,
    required: true,
    trim: true,
    enum: [
      "Playmaker",
      "Play/Guardia",
      "Guardia",
      "Guardia/Ala",
      "Ala",
      "Ala/Centro",
      "Centro",
    ],
  },
  operation: {
    type: String,
    required: true,
    enum: ['DRAFT', 'BUY', 'UPDATE', 'REMOVE', 'RELEASE', 'TRADE_OUT', 'TRADE_IN', 'UPDATE_BALANCE'],
  },
  balance: {
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
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
});

export const FantasyRosterHistory = model<IFantasyRosterHistory, IFantasyRosterHistoryModel>('FantasyRosterHistory', schema);
