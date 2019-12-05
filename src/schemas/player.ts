import { model, Model, Schema } from 'mongoose';
import { IPlayerDocument } from './documents/player-document';

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
}

const playerSchema = new Schema<IPlayer>({
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
        min: 150,
        max: 299,
    },
    weight: {
        type: Number,
        min: 50,
        max: 199,
    },
    role: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Role',
    },
    league: {
        type: Number,
        required: true,
        ref: 'League',
    },
}, {
    timestamps: true,
});

const Player = model<IPlayer, IPlayerModel>('Player', playerSchema);

export default Player;
