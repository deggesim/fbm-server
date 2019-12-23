import { Model, model, Schema } from 'mongoose';
import { IFantasyTeam } from './fantasy-team';
import { ITenant } from './league';

interface IMatchDocument extends ITenant {
    homeTeam: IFantasyTeam['_id'];
    awayTeam: IFantasyTeam['_id'];
    homeRanking: number;
    homeRanking40Min: number;
    awayRanking: number;
    awayRanking40Min: number;
    homeFactor: number;
    homeOer: number;
    awayOer: number;
    homePlusMinus: number;
    awayPlusMinus: number;
    homeGrade: number;
    awayGrade: number;
    overtime: number;
    completed: boolean;
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
// tslint:disable-next-line: no-empty-interface
export interface IMatch extends IMatchDocument {
    // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IMatchModel extends Model<IMatch> {
    // metodi statici
}

const schema = new Schema<IMatch>({
    homeTeam: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'FantasyTeam',
    },
    awayTeam: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'FantasyTeam',
    },
    homeRanking: {
        type: Number,
    },
    homeRanking40Min: {
        type: Number,
    },
    awayRanking: {
        type: Number,
    },
    awayRanking40Min: {
        type: Number,
    },
    homeFactor: {
        type: Number,
    },
    homeOer: {
        type: Number,
    },
    awayOer: {
        type: Number,
    },
    homePlusMinus: {
        type: Number,
    },
    awayPlusMinus: {
        type: Number,
    },
    homeGrade: {
        type: Number,
    },
    awayGrade: {
        type: Number,
    },
    overtime: {
        type: Number,
    },
    completed: {
        type: Boolean,
        required: true,
        default: false,
    },
    league: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'League',
    },
}, {
    timestamps: true,
});

export const Match = model<IMatch, IMatchModel>('Match', schema);
