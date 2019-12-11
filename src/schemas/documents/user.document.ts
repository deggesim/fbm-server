import { Document } from 'mongoose';
import { ILeagueDocument } from './league.document';

export interface IUserDocument extends Document {
    name: string;
    email: string;
    password: string;
    role: string;
    leagues: Array<ILeagueDocument['id']>;
    tokens: string[];
}
