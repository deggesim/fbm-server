import { Document } from 'mongoose';
import { CupFormat } from '../formats/cup-format';
import { PlayoffFormat } from '../formats/playoff-format';
import { PlayoutFormat } from '../formats/playout-format';
import { RegularSeasonFormat } from '../formats/regular-season-format';
import { IUserDocument } from './user-document';

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
    fantasyTeams: [{
        name: string;
        owner: Array<IUserDocument['id']>;
        initialBalance: number;
        outgo: number;
        totalContracts: number;
        playersInRoster: number;
        extraPlayers: number;
        pointsPenalty: number;
        balancePenalty: number;
    }];
}
