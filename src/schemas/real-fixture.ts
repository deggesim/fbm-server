import { ObjectId } from 'mongodb';
import { Model, model, Schema } from 'mongoose';
import { entityNotFound } from '../util/functions';
import { IFixture } from './fixture';
import { ITenant } from './league';
import { ITeam } from './team';

interface IRealFixtureDocument extends ITenant {
  name: string;
  prepared: boolean;
  fixtures: Array<IFixture | ObjectId>;
  teamsWithNoGame: Array<ITeam | ObjectId>;
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
// tslint:disable-next-line: no-empty-interface
export interface IRealFixture extends IRealFixtureDocument {
  // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IRealFixtureModel extends Model<IRealFixture> {
  // metodi statici
  findByFixture: (leagueId: string | ObjectId, fixtureId: string | ObjectId) => Promise<IRealFixture>;
}

const schema = new Schema<IRealFixture>({
  name: {
    type: String,
    required: true,
  },
  prepared: {
    type: Boolean,
    deafault: false,
  },
  fixtures: [{
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Fixture',
  }],
  teamsWithNoGame: [{
    type: Schema.Types.ObjectId,
    ref: 'Team',
  }],
  league: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'League',
  },
}, {
  timestamps: true,
});

schema.statics.findByFixture = async (leagueId: string | ObjectId, fixtureId: string | ObjectId): Promise<IRealFixture> => {
  const realFixture = await RealFixture.findOne({ league: leagueId, fixtures: fixtureId }) as IRealFixture;
  if (realFixture == null) {
    throw new Error(entityNotFound(realFixture, leagueId, fixtureId));
  }
  await realFixture.populate('fixtures').execPopulate();
  return realFixture;
};

export const RealFixture = model<IRealFixture, IRealFixtureModel>('RealFixture', schema);
