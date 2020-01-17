import { model, Model, Schema } from 'mongoose';
import { ILeague, ITenant, League } from './league';
import { Performance, IPerformance } from './performance';
import { Roster, IRoster } from './roster';
import { Team, ITeam } from './team';
import { IRealFixture, RealFixture } from './real-fixture';

interface IPlayerDocument extends ITenant {
    name: string;
    nationality: string;
    number: string;
    yearBirth: number;
    height: number;
    weight: number;
    role: string;
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
// tslint:disable-next-line: no-empty-interface
export interface IPlayer extends IPlayerDocument {
    // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IPlayerModel extends Model<IPlayer> {
    // metodi statici
    insertPlayers: (players: any[], league: ILeague) => Promise<IPlayer[]>;
}

const schema = new Schema<IPlayer>({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    nationality: {
        type: String,
        required: true,
        trim: true,
        maxlength: 3,
    },
    number: {
        type: String,
        trim: true,
        maxlength: 2,
    },
    yearBirth: {
        type: Number,
        min: 1900,
        max: 2999,
    },
    height: {
        type: Number,
        min: 0,
        max: 299,
    },
    weight: {
        type: Number,
        min: 0,
        max: 199,
    },
    role: {
        type: String,
        required: true,
        trim: true,
        enum: [
            'Playmaker',
            'Play/Guardia',
            'Guardia',
            'Guardia/Ala',
            'Ala',
            'Ala/Centro',
            'Centro',
        ],
    },
    league: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'League',
    },
}, {
    timestamps: true,
});

schema.statics.insertPlayers = async (uploadedPlayers: any[], league: ILeague) => {
    await Roster.deleteMany({ league: league._id });
    await Player.deleteMany({ league: league._id });
    const teams: ITeam[] = await Team.find();
    // const playersToInsert: IPlayer[] = players.map((player: IPlayer) => {
    //     player.league = league._id;
    //     return player;
    // });
    // const playersSaved: IPlayer[] = await Player.insertMany(playersToInsert);

    const realFixture: IRealFixture = await league.nextRealFixture();
    for (const uploadedPlayer of uploadedPlayers) {
        // tslint:disable-next-line: variable-name
        const { name, role, nationality, number, yearBirth, height, weight } = uploadedPlayer;
        const playerTeam = uploadedPlayer.team;
        const player = { name, role, nationality, number, yearBirth, height, weight, league: league._id };
        const playerSaved = await Player.create(player);

        const teamFound: ITeam = teams.find((team: ITeam) => {
            return team.fullName === String(playerTeam);
        }) as ITeam;
        const roster = {
            team: teamFound._id,
            player: playerSaved._id,
            league: league._id,
        };
        const rosterSaved: IRoster = await Roster.create(roster);
        realFixture.rosters.push(rosterSaved);
    }

    await realFixture.save();

};

export const Player = model<IPlayer, IPlayerModel>('Player', schema);
