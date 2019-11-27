import { Document } from 'mongoose';
import { IRole } from './role';

export interface IPlayer extends Document {
    name: string;
    nationality: string;
    number: string;
    yearBirth: number;
    height: number;
    weight: number;
    role: IRole['_id'];
}
