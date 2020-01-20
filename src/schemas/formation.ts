import { Model, model, Schema } from 'mongoose';
import { IFantasyTeam } from './fantasy-team';
import { IFixture } from './fixture';
import { ITenant } from './league';
import { IPlayer } from './player';

interface IFormationDocument extends ITenant {
    fantasyTeam: IFantasyTeam['id'];
    player: IPlayer;
    spot: number;
    benchOrder: number;
    fixture: IFixture;
    matchReport: {
        realRanking: number;
        realRanking40Min: number;
        minutesUsed: number;
    };
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
// tslint:disable-next-line: no-empty-interface
export interface IFormation extends IFormationDocument {
    // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IFormationModel extends Model<IFormationDocument> {
    // metodi statici
}

const schema = new Schema<IFormation>({
    fantasyTeam: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'FantasyTeam',
    },
    player: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Player',
    },
    spot: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
    },
    benchOrder: {
        type: Number,
        min: 1,
        max: 5,
    },
    fixture: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Fixture',
    },
    matchReport: {
        realRanking: {
            type: Number,
            required: true,
        },
        realRanking40Min: {
            type: Number,
            required: true,
        },
        minutesUsed: {
            type: Number,
            required: true,
        },
    },
    league: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'League',
    },
}, {
    timestamps: true,
});

export const Formation = model<IFormation, IFormationModel>('Formation', schema);
