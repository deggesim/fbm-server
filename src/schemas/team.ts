import { Model, model, Schema } from 'mongoose';
import { ITeamDocument } from './documents/team.document';

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
// tslint:disable-next-line: no-empty-interface
export interface ITeam extends ITeamDocument {
    // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface ITeamModel extends Model<ITeam> {
    // metodi statici
}

const schema = new Schema<ITeam>({
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    sponsor: {
        type: String,
        trim: true,
    },
    name: {
        type: String,
        trim: true,
    },
    city: {
        type: String,
        required: true,
        trim: true,
    },
    abbreviation: {
        type: String,
        trim: true,
    },
    real: {
        type: Boolean,
        required: true,
    },
    league: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'League',
    },
});

const Team = model<ITeam, ITeamModel>('Team', schema);

export default Team;
