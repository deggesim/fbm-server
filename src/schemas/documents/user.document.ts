import { Document } from 'mongoose';
import { ILeagueDocument } from './league.document';

export interface IUserDocument extends Document {
    name: string;
    email: string;
    password: string;
    amdin: boolean;
    leagues: Array<ILeagueDocument['id']>;
    tokens: string[];
}
