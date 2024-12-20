import { ObjectId } from "mongodb";
import { Model, model, Schema } from "mongoose";
import { playoffMatchList, roundRobinMatchList } from "../util/games";
import { ICompetition } from "./competition";
import { IFantasyTeam } from "./fantasy-team";
import { IFixture } from "./fixture";
import { ITenant } from "./league";

interface IRoundDocument extends ITenant {
  name: string;
  completed: boolean;
  homeFactor: number;
  teams: number;
  roundRobin: boolean;
  rounds?: number;
  fantasyTeams: Array<IFantasyTeam | ObjectId>;
  fixtures: Array<IFixture | ObjectId>;
  // virtual
  competition?: ICompetition;
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
export interface IRound extends IRoundDocument {
  // metodi d'istanza
  buildRoundRobinMatchList: () => Promise<void>;
  buildPlayoffMatchList: () => Promise<void>;
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IRoundModel extends Model<IRound> {
  // metodi statici
}

const schema = new Schema<IRound>(
  {
    name: {
      type: String,
      required: true,
    },
    completed: {
      type: Boolean,
      required: true,
      default: false,
    },
    homeFactor: {
      type: Number,
      required: true,
      default: 0,
    },
    teams: {
      type: Number,
      required: true,
    },
    roundRobin: {
      type: Boolean,
      required: true,
    },
    rounds: {
      type: Number,
    },
    fantasyTeams: [
      {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "FantasyTeam",
      },
    ],
    fixtures: [
      {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Fixture",
      },
    ],
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

schema.virtual("competition", {
  ref: "Competition",
  localField: "_id",
  foreignField: "rounds",
  justOne: true,
});

schema.methods.buildRoundRobinMatchList = async function (): Promise<void> {
  const round: IRound = this as IRound;
  const leagueId = round.league as ObjectId;
  await round.populate("fixtures");
  await roundRobinMatchList(
    leagueId,
    round.rounds as number,
    round.fixtures as IFixture[],
    round.fantasyTeams as IFantasyTeam[]
  );
};

schema.methods.buildPlayoffMatchList = async function (): Promise<void> {
  const round: IRound = this as IRound;
  const leagueId = round.league as ObjectId;
  await round.populate("fixtures");
  await playoffMatchList(
    leagueId,
    round.fixtures as IFixture[],
    round.fantasyTeams as IFantasyTeam[]
  );
};

export const Round = model<IRound, IRoundModel>("Round", schema);
