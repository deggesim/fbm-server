import { model, Model, Schema } from 'mongoose';
import { ILeague, ITenant } from './league';

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
    insertPlayers: (players: IPlayer[], league: ILeague) => Promise<IPlayer[]>;
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

schema.statics.insertPlayers = (players: IPlayer[], league: ILeague) => {
    const playersToInsert: IPlayer[] = players.map((player: IPlayer) => {
        player.league = league._id;
        return player;
    });
    return Player.insertMany(playersToInsert);
};

export const Player = model<IPlayer, IPlayerModel>('Player', schema);
