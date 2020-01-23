import { model, Model, Schema } from 'mongoose';
import { FantasyRoster } from './fantasy-roster';
import { ILeague, ITenant } from './league';
import { Performance } from './performance';
import { IRealFixture, RealFixture } from './real-fixture';
import { IRoster, Roster } from './roster';
import { ITeam, Team } from './team';
import { IFantasyTeam, FantasyTeam } from './fantasy-team';

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

schema.virtual('performances', {
    ref: 'Performance',
    localField: '_id',
    foreignField: 'player',
});

schema.statics.insertPlayers = async (uploadedPlayers: any[], league: ILeague) => {
    // pulizia tabelle correlate
    await Performance.deleteMany({ league: league._id });
    await Roster.deleteMany({ league: league._id });
    await FantasyRoster.deleteMany({ league: league._id });
    await Player.deleteMany({ league: league._id });
    const fantasyTeams: IFantasyTeam[] = await FantasyTeam.find({ league: league._id });
    for (const fantasyTeam of fantasyTeams) {
        fantasyTeam.outgo = 0;
        fantasyTeam.extraPlayers = 0;
        fantasyTeam.playersInRoster = 0;
        fantasyTeam.totalContracts = 0;
        await fantasyTeam.save();
    }

    const teams: ITeam[] = await Team.find();
    const nextRealFixture: IRealFixture = await league.nextRealFixture();
    const allRealFixtures: IRealFixture[] = await RealFixture.find({ league: league._id });
    for (const uploadedPlayer of uploadedPlayers) {
        // tslint:disable-next-line: variable-name
        const { name, role, nationality, number, yearBirth, height, weight } = uploadedPlayer;
        const playerTeam = uploadedPlayer.team;
        const newPlayer = { name, role, nationality, number, yearBirth, height, weight, league: league._id };
        const player = await Player.create(newPlayer);

        const team: ITeam = teams.find((t: ITeam) => {
            return t.fullName === String(playerTeam);
        }) as ITeam;
        const roster = {
            player: player._id,
            team: team._id,
            realFixture: nextRealFixture._id,
            league: league._id,
        };
        await Roster.create(roster);
        for (const realFixture of allRealFixtures) {
            Performance.create({
                player: player._id,
                realFixture: realFixture._id,
                league: league._id,
            });
        }
    }

    await nextRealFixture.save();

};

export const Player = model<IPlayer, IPlayerModel>('Player', schema);
