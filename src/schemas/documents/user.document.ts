import { Document } from 'mongoose';
import { IFantasyTeamDocument } from './fantasy-team.document';
import { ILeagueDocument } from './league.document';

export interface IUserDocument extends Document {
    name: string;
    email: string;
    password: string;
    role: string;
    tokens: string[];
    fantasyTeams: Array<IFantasyTeamDocument['id']>;
    leagues: Array<ILeagueDocument['id']>;
}
