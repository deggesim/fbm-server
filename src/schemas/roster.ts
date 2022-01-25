import { ObjectId } from "mongodb";
import {
  Aggregate,
  Model,
  model,
  PaginateOptions,
  PaginateResult,
  Schema,
} from "mongoose";
import * as mongoosePaginate from "mongoose-paginate";
import { IFantasyRoster } from "./fantasy-roster";
import { ITenant } from "./league";
import { IPlayer } from "./player";
import { IRealFixture } from "./real-fixture";
import { ITeam } from "./team";
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");

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
  // metodi statici
  paginate(
    query?: Object,
    options?: PaginateOptions,
    callback?: (err: any, result: PaginateResult<IRoster>) => void
  ): Promise<PaginateResult<IRoster>>;
  aggregatePaginate(
    aggregate: Aggregate<IRoster[]>,
    options: any,
    callback?: (
      err: any,
      res: IRoster[],
      pages: number,
      total: number
    ) => Promise<any>
  ): Promise<any>;
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

export const Roster = model<IRoster, IRosterModel>("Roster", schema);
