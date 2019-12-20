import { Model, model, Schema } from 'mongoose';
import { IFormation } from './formation';
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
    formations: Array<IFormation['_id']>;
    owners: Array<IUser['_id']>;
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
    formations: [{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Formation',
    }],
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
});

schema.statics.insertFantasyTeams = async (fantasyTeams: IFantasyTeam[], league: ILeague) => {
    try {
        for await (const fantasyTeam of fantasyTeams) {
            fantasyTeam.league = league._id;
            const newFantasyTeam = await FantasyTeam.create(fantasyTeam);
            for await (const owner of newFantasyTeam.owners) {
                const user: IUser = await User.findById(owner) as IUser;
                // aggiunta lega all'utente
                const leagueFound = user.leagues.find((managedLeague) => {
                    return String(managedLeague) === String(league._id);
                });
                if (!leagueFound) {
                    user.leagues.push(league._id);
                }
                // aggiunta squadra all'utente
                user.fantasyTeams.push(newFantasyTeam._id);
                // salvataggio
                await user.save();
            }
        }
    } catch (error) {
        return Promise.reject(error.message);
    }
};

export const FantasyTeam = model<IFantasyTeam, IFantasyTeamModel>('FantasyTeam', schema);
