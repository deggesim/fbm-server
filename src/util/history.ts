import { IFantasyRoster } from "../schemas/fantasy-roster";
import { IFantasyTeam } from "../schemas/fantasy-team";
import { History } from "../schemas/history";
import { ILeague } from "../schemas/league";
import { IPlayer } from "../schemas/player";
import { IRealFixture } from "../schemas/real-fixture";
import { IRoster } from "../schemas/roster";

export const writeHistory = async (
  operation: string,
  realFixture: IRealFixture,
  balance: number,
  league: ILeague,
  fantasyTeam: IFantasyTeam,
  fantasyRoster?: IFantasyRoster
) => {
  let history;
  if (fantasyRoster) {
    // IFantasyRoster
    history = {
      operation,
      realFixture,
      fantasyTeam,
      balance,
      initialBalance: fantasyTeam.initialBalance,
      outgo: fantasyTeam.outgo,
      totalContracts: fantasyTeam.totalContracts,
      playersInRoster: fantasyTeam.playersInRoster,
      extraPlayers: fantasyTeam.extraPlayers,
      pointsPenalty: fantasyTeam.pointsPenalty,
      balancePenalty: fantasyTeam.balancePenalty,
      name: ((fantasyRoster.roster as IRoster).player as IPlayer).name,
      status: fantasyRoster.status,
      draft: fantasyRoster.draft,
      contract: fantasyRoster.contract,
      yearContract: fantasyRoster.yearContract,
      role: ((fantasyRoster.roster as IRoster).player as IPlayer).role,
      league,
    };
  } else {
    // IFantasyTeam
    history = {
      operation,
      realFixture,
      fantasyTeam,
      balance,
      initialBalance: fantasyTeam.initialBalance,
      outgo: fantasyTeam.outgo,
      totalContracts: fantasyTeam.totalContracts,
      playersInRoster: fantasyTeam.playersInRoster,
      extraPlayers: fantasyTeam.extraPlayers,
      pointsPenalty: fantasyTeam.pointsPenalty,
      balancePenalty: fantasyTeam.balancePenalty,
      league,
    };
  }

  await History.create(history);
};
