import { ITenantDocument } from './tenant.document';

export interface ITeamDocument extends ITenantDocument {
    fullName: string;
    sponsor: string;
    name: string;
    city: string;
    abbreviation: string;
    real: boolean;
}
