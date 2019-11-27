import { model, Schema } from 'mongoose';
import { IPlayer } from '../models/player';

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
}, {
    timestamps: true,
});

const Player = model<IPlayer>('Player', playerSchema);

export default Player;
