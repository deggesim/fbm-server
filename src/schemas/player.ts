import { model, Model, Schema } from 'mongoose';
import { ITenant } from './league';

interface IPlayerDocument extends ITenant {
    name: string;
    nationality: string;
    number: string;
    yearBirth: number;
    height: number;
    weight: number;
    role: {
        name: string;
        shortName: string;
        spot: number[];
    };
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
        min: 150,
        max: 299,
    },
    weight: {
        type: Number,
        min: 50,
        max: 199,
    },
    role: {
        name: {
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
        shortName: {
            type: String,
            required: true,
            trim: true,
            enum: [
                'P',
                'P/G',
                'G',
                'G/A',
                'A',
                'A/C',
                'C',
            ],
        },
        spot: [{
            type: Number,
            required: true,
            min: 1,
            max: 12,
        }],
    },
    league: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'League',
    },
}, {
    timestamps: true,
});

export const Player = model<IPlayer, IPlayerModel>('Player', schema);
