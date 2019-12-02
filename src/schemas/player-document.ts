import { Document } from 'mongoose';
import { IRoleDocument } from './role-document';

export interface IPlayerDocument extends Document {
    name: string;
    nationality: string;
    number: string;
    yearBirth: number;
    height: number;
    weight: number;
    role: IRoleDocument['_id'];
}
