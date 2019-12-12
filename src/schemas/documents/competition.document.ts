import { IRoundDocument } from './round.document';
import { ITenantDocument } from './tenant.document';

export interface ICompetitionDocument extends ITenantDocument {
    name: string;
    prepared: boolean;
    rounds: Array<IRoundDocument['id']>;
}

export default ICompetitionDocument;
