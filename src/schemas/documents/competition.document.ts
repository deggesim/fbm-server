import { IRoundDocument } from './round.document';
import { ITenantDocument } from './tenant.document';

export interface ICompetitionDocument extends ITenantDocument {
    name: string;
    completed: boolean;
    rounds: Array<IRoundDocument['id']>;
}

export default ICompetitionDocument;
