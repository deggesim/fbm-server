import { ObjectId } from "mongodb";
import { Model, model, Schema } from "mongoose";
import { IFantasyTeam } from "./fantasy-team";
import { ITenant } from "./league";
import { IRealFixture } from "./real-fixture";

interface IHistoryDocument extends ITenant {
  operation: string;
  realFixture: IRealFixture | ObjectId;
  fantasyTeam: IFantasyTeam | ObjectId;
  balance: number;
  initialBalance: number;
  outgo: number;
  totalContracts: number;
  playersInRoster: number;
  extraPlayers: number;
  pointsPenalty: number;
  balancePenalty: number;
  name?: string;
  status?: string;
  draft?: boolean;
  contract?: number;
  yearContract?: number;
  role?: string;
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
export interface IHistory extends IHistoryDocument {
  // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IHistoryModel extends Model<IHistory> {
  // metodi statici
}

const schema = new Schema<IHistory>(
  {
    operation: {
      type: String,
      required: true,
      enum: [
        "DRAFT",
        "AUCTION_BUY",
        "AUCTION_REMOVE",
        "BUY",
        "UPDATE",
        "REMOVE",
        "RELEASE",
        "TRADE_OUT",
        "TRADE_IN",
        "UPDATE_BALANCE"
      ],
    },
    realFixture: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "RealFixture",
    },
    fantasyTeam: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "FantasyTeam",
    },
    balance: {
      type: Number,
      required: true,
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
    name: {
      type: String,
    },
    status: {
      type: String,
      enum: ["EXT", "COM", "STR", "ITA"],
    },
    draft: {
      type: Boolean,
    },
    contract: {
      type: Number,
    },
    yearContract: {
      type: Number,
    },
    role: {
      type: String,
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
    league: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "League",
    },
  },
  {
    collection: 'history',
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

export const History = model<IHistory, IHistoryModel>("History", schema);
