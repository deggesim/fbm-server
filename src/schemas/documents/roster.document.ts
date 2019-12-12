import { IPlayerDocument } from './player.document';
import { ITeamDocument } from './team.document';
import { ITenantDocument } from './tenant.document';

export interface IRosterDocument extends ITenantDocument {
    team: ITeamDocument;
    player: IPlayerDocument;
    fantasyRoster: {
        status: string;
        draft: boolean;
        contract: number;
        yearContract: number;
    };
}

export default IRosterDocument;
