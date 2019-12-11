import { Document } from 'mongoose';

export interface ITeamDocument extends Document {
    fullName: string;
    sponsor: string;
    name: string;
    city: string;
    abbreviation: string;
    real: boolean;
}

export const team = {
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
};
