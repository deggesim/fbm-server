import { ITenantDocument } from './tenant-document';

export interface IRoleDocument extends ITenantDocument {
    name: string;
    shortName: string;
    spot: number[];
}
