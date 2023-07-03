import { ObjectId } from "mongodb";
import { Model, model, Schema } from "mongoose";
import { playoffMatchList, roundRobinMatchList } from "../util/games";
import { IFantasyTeam } from "./fantasy-team";
import { IFixture } from "./fixture";
import { ITenant } from "./league";
import { IRound } from "./round";

interface IMatchDocument extends ITenant {
  homeTeam: IFantasyTeam | ObjectId;
  awayTeam: IFantasyTeam | ObjectId;
  homeRanking?: number;
  homeRanking40Min?: number;
  awayRanking?: number;
  awayRanking40Min?: number;
  homeFactor?: number;
  homeOer?: number;
  awayOer?: number;
  homePlusMinus?: number;
  awayPlusMinus?: number;
  homeGrade?: number;
  awayGrade?: number;
  homeScore?: number;
  awayScore?: number;
  overtime?: number;
  completed: boolean;
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
export interface IMatch extends IMatchDocument {
  // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IMatchModel extends Model<IMatch> {
  // metodi statici
  buildRoundRobinMatchList: (round: IRound) => Promise<IMatch[]>;
  buildPlayoffMatchList: (round: IRound) => Promise<IMatch[]>;
}

const schema = new Schema<IMatch>(
  {
    homeTeam: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "FantasyTeam",
    },
    awayTeam: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "FantasyTeam",
    },
    homeRanking: {
      type: Number,
    },
    homeRanking40Min: {
      type: Number,
    },
    awayRanking: {
      type: Number,
    },
    awayRanking40Min: {
      type: Number,
    },
    homeFactor: {
      type: Number,
    },
    homeOer: {
      type: Number,
    },
    awayOer: {
      type: Number,
    },
    homePlusMinus: {
      type: Number,
    },
    awayPlusMinus: {
      type: Number,
    },
    homeGrade: {
      type: Number,
    },
    awayGrade: {
      type: Number,
    },
    homeScore: {
      type: Number,
    },
    awayScore: {
      type: Number,
    },
    overtime: {
      type: Number,
    },
    completed: {
      type: Boolean,
      required: true,
      default: false,
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

schema.statics.buildRoundRobinMatchList = async (
  round: IRound
): Promise<IMatch[]> => {
  const leagueId = round.league as ObjectId;
  await round.populate("fixtures");
  return roundRobinMatchList(
    leagueId,
    round.rounds as number,
    round.fixtures as IFixture[],
    round.fantasyTeams as IFantasyTeam[]
  );
};

schema.statics.buildPlayoffMatchList = async (
  round: IRound,
  fantasyTeams: IFantasyTeam[]
): Promise<IMatch[]> => {
  const leagueId = round.league;
  await round.populate("fixtures");
  return playoffMatchList(
    leagueId as ObjectId,
    round.fixtures as IFixture[],
    round.fantasyTeams as IFantasyTeam[]
  );
};

export const Match = model<IMatch, IMatchModel>("Match", schema);
