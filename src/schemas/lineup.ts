import { DeleteResult, ObjectId } from "mongodb";
import { Model, Schema, model } from "mongoose";
import { FantasyRoster, IFantasyRoster } from "./fantasy-roster";
import { IFixture } from "./fixture";
import { ITenant } from "./league";
import { IPerformance } from "./performance";
import { IRealFixture, RealFixture } from "./real-fixture";

interface ILineupDocument extends ITenant {
  fantasyRoster: IFantasyRoster | ObjectId;
  spot: number;
  benchOrder: number;
  fixture: IFixture | ObjectId;
  performance: IPerformance | ObjectId;
  matchReport: {
    realRanking: number;
    realRanking40Min: number;
    minutesUsed: number;
  };
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
export interface ILineup extends ILineupDocument {
  // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface ILineupModel extends Model<ILineupDocument> {
  // metodi statici
  getLineupByFantasyTeamAndFixture: (
    leagueId: string | ObjectId,
    fantasyTeamId: string | ObjectId,
    fixtureId: string | ObjectId
  ) => Promise<ILineup[]>;

  deleteLineupByFantasyTeamAndFixture: (
    leagueId: string | ObjectId,
    fantasyTeamId: string | ObjectId,
    fixtureId: string | ObjectId
  ) => Promise<DeleteResult>;
}

const schema = new Schema<ILineup>(
  {
    fantasyRoster: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "FantasyRoster",
    },
    spot: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    benchOrder: {
      type: Number,
      min: 1,
      max: 5,
    },
    fixture: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Fixture",
    },
    performance: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Performance",
    },
    matchReport: {
      realRanking: {
        type: Number,
      },
      realRanking40Min: {
        type: Number,
      },
      minutesUsed: {
        type: Number,
      },
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

schema.statics.getLineupByFantasyTeamAndFixture = async (
  leagueId: string | ObjectId,
  fantasyTeamId: string | ObjectId,
  fixtureId: string | ObjectId
) => {
  const realFixture: IRealFixture = await RealFixture.findByFixture(
    leagueId,
    fixtureId
  );
  const fantasyRosters: IFantasyRoster[] = await FantasyRoster.find({
    league: leagueId,
    fantasyTeam: fantasyTeamId,
    realFixture: realFixture._id,
  }).exec();
  const fantasyRostersId: string[] = fantasyRosters.map((fr) => fr._id);
  const lineup: ILineup[] = await Lineup.find({
    league: leagueId,
    fixture: fixtureId,
    fantasyRoster: { $in: fantasyRostersId },
  })
    .sort({ spot: 1 })
    .exec();
  return lineup;
};

schema.statics.deleteLineupByFantasyTeamAndFixture = async (
  leagueId: string | ObjectId,
  fantasyTeamId: string | ObjectId,
  fixtureId: string | ObjectId
) => {
  const realFixture: IRealFixture = await RealFixture.findByFixture(
    leagueId,
    fixtureId
  );
  const fantasyRosters: IFantasyRoster[] = await FantasyRoster.find({
    league: leagueId,
    fantasyTeam: fantasyTeamId,
    realFixture: realFixture._id,
  }).exec();
  const fantasyRostersId: string[] = fantasyRosters.map((fr) => fr._id);
  const result: DeleteResult = await Lineup.deleteMany({
    league: leagueId,
    fixture: fixtureId,
    fantasyRoster: { $in: fantasyRostersId },
  }).exec();
  return result;
};

export const Lineup = model<ILineup, ILineupModel>("Lineup", schema);
