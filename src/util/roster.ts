import _ = require("lodash");
import { ObjectId } from "mongodb";
import { ILeague } from "../schemas/league";
import { IPlayer, Player } from "../schemas/player";
import { IRealFixture } from "../schemas/real-fixture";

export const buildParameters = async (
  league: ILeague,
  nextRealFixture: IRealFixture,
  free: boolean,
  filter?: string
) => {
  const parameters = {
    league: league._id,
    realFixture: nextRealFixture._id,
  };
  if (free) {
    _.extend(parameters, { fantasyRoster: { $exists: false } });
  }
  if (filter != null) {
    const players = await Player.find({
      name: { $regex: new RegExp(filter, "i") },
    });
    const playersId: ObjectId[] = players.map((player: IPlayer) => player._id);
    _.extend(parameters, { player: playersId });
  }
  return parameters;
};
