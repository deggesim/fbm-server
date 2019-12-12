import { IPlayerDocument } from './player.document';
import { ITenantDocument } from './tenant.document';

export interface IPerformanceDocument extends ITenantDocument {
    player: IPlayerDocument;
    ranking: number;
    minutes: number;
    oer: number;
    plusMinus: number;
    grade: number;
}

export default IPerformanceDocument;
