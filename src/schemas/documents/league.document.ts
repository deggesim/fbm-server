import { Document } from 'mongoose';
import { CupFormat } from '../formats/cup-format';
import { PlayoffFormat } from '../formats/playoff-format';
import { PlayoutFormat } from '../formats/playout-format';
import { RegularSeasonFormat } from '../formats/regular-season-format';
import { IFantasyTeamDocument } from './fantasy-team.document';
import { ITeamDocument } from './team.document';

export interface ILeagueDocument extends Document {
    name: string;
    regularSeasonFormat: RegularSeasonFormat;
    playoffFormat: PlayoffFormat;
    playoutFormat: PlayoutFormat;
    cupFormat: CupFormat;
    realGames: number;
    roundRobinFirstRealFixture: number;
    playoffFirstRealFixture: number;
    playoutFirstRealFixture: number;
    cupFirstRealFixture: number;
    parameters: [{
        parameter: string;
        value: number;
    }];
    fantasyTeams: IFantasyTeamDocument[];
    team: ITeamDocument[];
}
