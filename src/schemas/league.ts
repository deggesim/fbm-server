import { model, Model, Schema } from 'mongoose';
import { ILeagueDocument, RoundRobinFormatEnum } from './league-document';
import * as _ from 'lodash';

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
// tslint:disable-next-line: no-empty-interface
export interface ILeague extends ILeagueDocument {
    // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface ILeagueModel extends Model<ILeague> {
    // metodi statici
}

const leagueSchema = new Schema<ILeagueDocument>({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    roundRobinFormat: {
        type: String,
        required: true,
    }
});

const League = model<ILeague, ILeagueModel>('League', leagueSchema);

export default League;
