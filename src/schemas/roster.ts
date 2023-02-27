import { ObjectId } from "mongodb";
import { AggregatePaginateModel, Model, model, Schema } from "mongoose";
import * as mongoosePaginate from "mongoose-paginate-v2";
import { IFantasyRoster } from "./fantasy-roster";
import { ITenant } from "./league";
import { IPlayer } from "./player";
import { IRealFixture } from "./real-fixture";
import { ITeam } from "./team";
import mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");

interface IRosterDocument extends ITenant {
  player: IPlayer | ObjectId;
  team: ITeam | ObjectId;
  realFixture: IRealFixture | ObjectId;
  fantasyRoster?: IFantasyRoster | ObjectId;
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
export interface IRoster extends IRosterDocument {
  // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IRosterModel extends Model<IRoster> {
  // // metodi statici
}

const schema = new Schema<IRoster>(
  {
    player: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Player",
    },
    team: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Team",
    },
    realFixture: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "RealFixture",
    },
    fantasyRoster: {
      type: Schema.Types.ObjectId,
      ref: "FantasyRoster",
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

schema.plugin(mongoosePaginate);
schema.plugin(mongooseAggregatePaginate);

export const Roster = model<IRoster, AggregatePaginateModel<IRoster>>(
  "Roster",
  schema
);
