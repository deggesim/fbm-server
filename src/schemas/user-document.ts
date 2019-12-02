import { Document } from 'mongoose';

export interface IUserDocument extends Document {
    name: string;
    email: string;
    password: string;
    amdin: boolean;
    leagues: number[];
    tokens: string[];
}
