import { IFormationDocument } from './formation.document';
import { ITenantDocument } from './tenant.document';
import { IUserDocument } from './user.document';

export interface IFantasyTeamDocument extends ITenantDocument {
    name: string;
    initialBalance: number;
    outgo: number;
    totalContracts: number;
    playersInRoster: number;
    extraPlayers: number;
    pointsPenalty: number;
    balancePenalty: number;
    formations: Array<IFormationDocument['id']>;
    owners: Array<IUserDocument['id']>;
}
