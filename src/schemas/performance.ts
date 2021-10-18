import { ObjectId } from "mongodb";
import { Aggregate, Model, model, Schema } from "mongoose";
import { ITenant } from "./league";
import { IPlayer } from "./player";
import { IRealFixture } from "./real-fixture";
let mongooseAggregatePaginate = require("mongoose-aggregate-paginate");

interface IPerformanceDocument extends ITenant {
  player: IPlayer | ObjectId;
  realFixture: IRealFixture | ObjectId;
  ranking?: number;
  minutes?: number;
  oer?: number;
  plusMinus?: number;
  grade?: number;
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
// tslint:disable-next-line: no-empty-interface
export interface IPerformance extends IPerformanceDocument {
  // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IPerformanceModel extends Model<IPerformance> {
  // metodi statici
  aggregatePaginate(aggregate: Aggregate<IPerformance[]>, options: any, callback?: (err: any, res: IPerformance[], pages: number, total: number) => Promise<any>): Promise<any>;
}

const schema = new Schema<IPerformance>(
  {
    player: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Player",
    },
    realFixture: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "RealFixture",
    },
    ranking: {
      type: Number,
    },
    minutes: {
      type: Number,
    },
    oer: {
      type: Number,
    },
    plusMinus: {
      type: Number,
    },
    grade: {
      type: Number,
    },
    league: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "League",
    },
  },
  {
    timestamps: true,
  }
);

schema.plugin(mongooseAggregatePaginate);

export const Performance = model<IPerformance, IPerformanceModel>(
  "Performance",
  schema
);
