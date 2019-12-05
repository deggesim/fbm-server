import { model, Model, Schema } from 'mongoose';
import { IRoleDocument } from './documents/role-document';

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
// tslint:disable-next-line: no-empty-interface
export interface IRole extends IRoleDocument {
    // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IRoleModel extends Model<IRole> {
    // metodi statici
}

const roleSchema = new Schema<IRoleDocument>({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    shortName: {
        type: String,
        required: true,
        trim: true,
    },
    spot: [{
        type: Number,
        required: true,
        min: 1,
        max: 12,
    }],
    league: {
        type: Number,
        required: true,
        ref: 'League',
    },
});

const Role = model<IRole, IRoleModel>('Role', roleSchema);

export default Role;
