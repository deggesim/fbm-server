import { IFantasyTeamDocument } from './fantasy-team.document';
import { ITenantDocument } from './tenant.document';

export interface IMatchDocument extends ITenantDocument {
    homeTeam: IFantasyTeamDocument;
    awayTeam: IFantasyTeamDocument;
    homeRanking: number;
    homeRanking40Min: number;
    awayRanking: number;
    awayRanking40Min: number;
    homeFactor: number;
    homeOer: number;
    awayOer: number;
    homePlusMinus: number;
    awayPlusMinus: number;
    homeGrade: number;
    awayGrade: number;
    overtime: number;
    completed: boolean;
}
