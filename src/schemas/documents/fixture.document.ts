import { ITenantDocument } from './tenant.document';

export interface IFixtureDocument extends ITenantDocument {
    name: string;
    unnecessary: boolean;
    completed: boolean;
}

export default IFixtureDocument;
