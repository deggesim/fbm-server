import { ObjectId } from 'mongodb';
import { Model, model, Schema } from 'mongoose';
import { playoffMatchList, roundRobinMatchList } from '../util/games';
import { IFantasyTeam } from './fantasy-team';
import { IFixture } from './fixture';
import { ITenant } from './league';

interface IRoundDocument extends ITenant {
  name: string;
  completed: boolean;
  homeFactor: number;
  teams: number;
  roundRobin: boolean;
  rounds: number;
  fantasyTeams: Array<IFantasyTeam | ObjectId>;
  fixtures: Array<IFixture | ObjectId>;
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
// tslint:disable-next-line: no-empty-interface
export interface IRound extends IRoundDocument {
  // metodi d'istanza
  buildRoundRobinMatchList: () => Promise<void>;
  buildPlayoffMatchList: () => Promise<void>;
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IRoundModel extends Model<IRound> {
  // metodi statici
}

const schema = new Schema<IRound>({
  name: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    required: true,
    default: false,
  },
  homeFactor: {
    type: Number,
    required: true,
    default: 0,
  },
  teams: {
    type: Number,
    required: true,
  },
  roundRobin: {
    type: Boolean,
    required: true,
  },
  rounds: {
    type: Number,
  },
  fantasyTeams: [{
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'FantasyTeam',
  }],
  fixtures: [{
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Fixture',
  }],
  league: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'League',
  },
}, {
  timestamps: true,
});

schema.methods.buildRoundRobinMatchList = async function (): Promise<void> {
  const round: IRound = this;
  const leagueId = round.league as ObjectId;
  await round.populate('fixtures').execPopulate();
  await roundRobinMatchList(leagueId, round.rounds, round.fixtures as IFixture[], round.fantasyTeams as IFantasyTeam[]);
};

schema.methods.buildPlayoffMatchList = async function (): Promise<void> {
  const round: IRound = this;
  const leagueId = round.league as ObjectId;
  await round.populate('fixtures').execPopulate();
  await playoffMatchList(leagueId, round.fixtures as IFixture[], round.fantasyTeams as IFantasyTeam[]);
};

export const Round = model<IRound, IRoundModel>('Round', schema);
