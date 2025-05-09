import { Model, model, Schema } from "mongoose";
import { ILeague, ITenant } from "./league";

interface ITeamDocument extends ITenant {
  fullName: string;
  sponsor: string;
  name: string;
  city: string;
  abbreviation: string;
  real: boolean;
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
export interface ITeam extends ITeamDocument {
  // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface ITeamModel extends Model<ITeam> {
  // metodi statici
  insertTeams: (teams: ITeam[], league: ILeague) => Promise<ITeam[]>;
}

const schema = new Schema<ITeam>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    sponsor: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    abbreviation: {
      type: String,
      trim: true,
    },
    real: {
      type: Boolean,
      required: true,
      default: true,
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

schema.virtual("rosters", {
  ref: "Roster",
  localField: "_id",
  foreignField: "team",
});

schema.statics.insertTeams = (teams: ITeam[], league: ILeague) => {
  const teamsToInsert: ITeam[] = teams.map((team: ITeam) => {
    team.league = league._id;
    team.real = true;
    return team;
  });
  return Team.insertMany(teamsToInsert);
};

export const Team = model<ITeam, ITeamModel>("Team", schema);
