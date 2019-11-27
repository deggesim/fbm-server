import { model, Schema } from 'mongoose';
import { IRole } from '../models/role';

const roleSchema = new Schema<IRole>({
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
});

const Role = model<IRole>('Role', roleSchema);

export default Role;
