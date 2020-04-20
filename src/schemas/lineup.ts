import { ObjectId } from 'mongodb';
import { Model, model, Schema } from 'mongoose';
import { FantasyRoster, IFantasyRoster } from './fantasy-roster';
import { IFixture } from './fixture';
import { ITenant } from './league';
import { IRealFixture, RealFixture } from './real-fixture';

interface ILineupDocument extends ITenant {
    fantasyRoster: IFantasyRoster | ObjectId;
    spot: number;
    benchOrder: number;
    fixture: IFixture | ObjectId;
    matchReport: {
        realRanking: number;
        realRanking40Min: number;
        minutesUsed: number;
    };
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
// tslint:disable-next-line: no-empty-interface
export interface ILineup extends ILineupDocument {
    // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface ILineupModel extends Model<ILineupDocument> {
    // metodi statici
    getLineupByFantasyTeamAndFixture: (leagueId: string | ObjectId, fantasyTeamId: string | ObjectId, fixtureId: string | ObjectId) =>
        Promise<ILineup[]>;
}

const schema = new Schema<ILineup>({
    fantasyRoster: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'FantasyRoster',
    },
    spot: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
    },
    benchOrder: {
        type: Number,
        min: 1,
        max: 5,
    },
    fixture: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Fixture',
    },
    matchReport: {
        realRanking: {
            type: Number,
        },
        realRanking40Min: {
            type: Number,
        },
        minutesUsed: {
            type: Number,
        },
    },
    league: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'League',
    },
}, {
    timestamps: true,
});

schema.statics.getLineupByFantasyTeamAndFixture =
    async (leagueId: string | ObjectId, fantasyTeamId: string | ObjectId, fixtureId: string | ObjectId) => {
        const realFixture: IRealFixture =
            await RealFixture.findOne({ league: leagueId, fixtures: fixtureId }) as IRealFixture;
        const fantasyRosters: IFantasyRoster[] =
            await FantasyRoster.find({ league: leagueId, fantasyTeam: fantasyTeamId, realFixture: realFixture._id });
        const fantasyRostersId: string[] = fantasyRosters.map((fr) => fr._id);
        const lineup: ILineup[] =
            await Lineup.find({ league: leagueId, fixture: fixtureId, fantasyRoster: { $in: fantasyRostersId } })
                .sort({ spot: 1 });
        return lineup;
    };

export const Lineup = model<ILineup, ILineupModel>('Lineup', schema);
