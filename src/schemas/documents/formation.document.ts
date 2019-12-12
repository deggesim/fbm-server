import IFixtureDocument from './fixture.document';
import { IPlayerDocument } from './player.document';
import { ITenantDocument } from './tenant.document';

export interface IFormationDocument extends ITenantDocument {
    spot: number;
    benchOrder: number;
    player: IPlayerDocument;
    fixture: IFixtureDocument;
    matchReport: {
        realRanking: number;
        realRanking40Min: number;
        minutesUsed: number;
    };
}
