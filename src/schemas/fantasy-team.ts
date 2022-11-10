import { ObjectId } from "mongodb";
import { Model, model, Schema } from "mongoose";
import { erroreImprevisto } from "../util/globals";
import { ILeague, ITenant } from "./league";
import { IUser, User } from "./user";

interface IFantasyTeamDocument extends ITenant {
  name: string;
  initialBalance: number;
  outgo: number;
  totalContracts: number;
  playersInRoster: number;
  extraPlayers: number;
  pointsPenalty: number;
  balancePenalty: number;
  owners: Array<IUser | ObjectId>;
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
export interface IFantasyTeam extends IFantasyTeamDocument {
  // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IFantasyTeamModel extends Model<IFantasyTeam> {
  // metodi statici
  insertFantasyTeams: (fantasyTeams: IFantasyTeam[], league: ILeague) => null;
}

const schema = new Schema<IFantasyTeam>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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
    owners: [
      {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User",
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

schema.virtual("fantasyRosters", {
  ref: "FantasyRoster",
  localField: "_id",
  foreignField: "fantasyTeam",
});

schema.statics.insertFantasyTeams = async (
  fantasyTeams: IFantasyTeam[],
  league: ILeague
) => {
  try {
    const ret: IFantasyTeam[] = [];
    for (const newFantasyTeam of fantasyTeams) {
      newFantasyTeam.league = league._id;
      const fantasyTeam = await FantasyTeam.create(newFantasyTeam);
      for (const owner of fantasyTeam.owners) {
        const user = await User.findById(owner).exec();
        if (user == null) {
          throw new Error("Utente non trovato");
        }
        // aggiunta lega all'utente (se non già presente)
        const leagueFound = user.leagues.find((managedLeague) =>
          managedLeague.equals(league._id)
        );
        if (!leagueFound) {
          user.leagues.push(league._id);
        }
        // aggiunta squadra all'utente
        user.fantasyTeams.push(fantasyTeam._id);
        // salvataggio
        await user.save();
      }
      ret.push(fantasyTeam);
    }

    // aggiunta della lega ai superAdmin (se non già presente)
    const superAdmins: IUser[] = await User.allSuperAdmins();
    for (const superAdmin of superAdmins) {
      const found = superAdmin.leagues.find(
        (managedLeague: ILeague | ObjectId) =>
          (managedLeague as ObjectId).equals(league._id)
      );
      if (!found) {
        superAdmin.leagues.push(league);
        await superAdmin.save();
      }
    }

    return Promise.resolve(ret);
  } catch (error) {
    if (error instanceof Error) {
      return Promise.reject(error.message);
    } else {
      return Promise.reject(erroreImprevisto);
    }
  }
};

export const FantasyTeam = model<IFantasyTeam, IFantasyTeamModel>(
  "FantasyTeam",
  schema
);
