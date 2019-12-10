import { Document } from 'mongoose';
import { ILeagueDocument } from './league.document';

export interface ITenantDocument extends Document {
    tenant: ILeagueDocument['_id'];
}
