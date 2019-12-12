import { Model, model, Schema } from 'mongoose';
import { IMatchDocument } from './documents/match.document';

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

const schema = new Schema<IMatchDocument>({
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
});

const Match = model<IMatch, IMatchModel>('Match', schema);

export default Match;
