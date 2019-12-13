import { IMatchDocument } from './match.document';
import { ITenantDocument } from './tenant.document';

export interface IFixtureDocument extends ITenantDocument {
    name: string;
    unnecessary: boolean;
    completed: boolean;
    matches: Array<IMatchDocument['id']>;
}

export default IFixtureDocument;
