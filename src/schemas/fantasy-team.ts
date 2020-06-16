import { ObjectId } from 'mongodb';
import { Model, model, Schema } from 'mongoose';
import { ILeague, ITenant } from './league';
import { IUser, User } from './user';

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
// tslint:disable-next-line: no-empty-interface
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

const schema = new Schema<IFantasyTeam>({
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
  owners: [{
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  }],
  league: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'League',
  },
}, {
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
});

schema.virtual('fantasyRosters', {
  ref: 'FantasyRoster',
  localField: '_id',
  foreignField: 'fantasyTeam',
});

schema.statics.insertFantasyTeams = async (fantasyTeams: IFantasyTeam[], league: ILeague) => {
  try {
    const ret: IFantasyTeam[] = [];
    // aggiunta della lega ai superAdmin
    const superAdmins: IUser[] = await User.allSuperAdmins();
    for (const superAdmin of superAdmins) {
      superAdmin.leagues.push(league);
      await superAdmin.save();
    }
    for await (const newFantasyTeam of fantasyTeams) {
      newFantasyTeam.league = league._id;
      const fantasyTeam = await FantasyTeam.create(newFantasyTeam);
      for await (const owner of fantasyTeam.owners) {
        const user: IUser = await User.findById(owner) as IUser;
        // aggiunta lega all'utente
        const leagueFound = user.leagues.find((managedLeague) => {
          managedLeague.equals(league._id);
        });
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
    return Promise.resolve(ret);
  } catch (error) {
    return Promise.reject(error.message);
  }
};

export const FantasyTeam = model<IFantasyTeam, IFantasyTeamModel>('FantasyTeam', schema);
