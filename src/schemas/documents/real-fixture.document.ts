import IFixtureDocument from './fixture.document';
import IPerformanceDocument from './performance.document';
import IRosterDocument from './roster.document';
import { ITenantDocument } from './tenant.document';

export interface IRealFixtureDocument extends ITenantDocument {
    name: string;
    prepared: boolean;
    performances: Array<IPerformanceDocument['id']>;
    fixtures: Array<IFixtureDocument['id']>;
    rosters: Array<IRosterDocument['id']>;
}
