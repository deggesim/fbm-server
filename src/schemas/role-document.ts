import { Document } from 'mongoose';

export interface IRoleDocument extends Document {
    name: string;
    shortName: string;
    spot: number[];
}
