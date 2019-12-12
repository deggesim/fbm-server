import { IFormationDocument } from './formation.document';
import { ITenantDocument } from './tenant.document';

export interface IFantasyTeamDocument extends ITenantDocument {
    name: string;
    initialBalance: number;
    outgo: number;
    totalContracts: number;
    playersInRoster: number;
    extraPlayers: number;
    pointsPenalty: number;
    balancePenalty: number;
    formation: Array<IFormationDocument['id']>;
}
