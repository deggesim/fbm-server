import { RoundFormat } from '../formats/round-format';
import { IFantasyTeamDocument } from './fantasy-team.document';
import IFixtureDocument from './fixture.document';
import { ITenantDocument } from './tenant.document';

export interface IRoundDocument extends ITenantDocument {
    name: string;
    roundFormat: RoundFormat;
    completed: boolean;
    homeFactor: number;
    fantasyTeam: Array<IFantasyTeamDocument['id']>;
    fixtures: Array<IFixtureDocument['id']>;
}
