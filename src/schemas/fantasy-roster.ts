import { ObjectId } from "mongodb";
import { Model, model, Schema } from "mongoose";
import { IFantasyTeam } from "./fantasy-team";
import { ITenant } from "./league";
import { IRealFixture } from "./real-fixture";
import { IRoster } from "./roster";

interface IFantasyRosterDocument extends ITenant {
  roster: IRoster | ObjectId;
  fantasyTeam: IFantasyTeam | ObjectId;
  status: string;
  draft: boolean;
  contract: number;
  yearContract: number;
  realFixture: IRealFixture | ObjectId;
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
export interface IFantasyRoster extends IFantasyRosterDocument {
  // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IFantasyRosterModel extends Model<IFantasyRoster> {
  // metodi statici
}

const schema = new Schema<IFantasyRoster>(
  {
    roster: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Roster",
    },
    fantasyTeam: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "FantasyTeam",
    },
    status: {
      type: String,
      required: true,
      enum: ["EXT", "COM", "STR", "ITA"],
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
    realFixture: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "RealFixture",
    },
    league: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "League",
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

schema.virtual("lineup", {
  ref: "Lineup",
  localField: "_id",
  foreignField: "fantasyRoster",
  justOne: true,
});

export const FantasyRoster = model<IFantasyRoster, IFantasyRosterModel>(
  "FantasyRoster",
  schema
);
