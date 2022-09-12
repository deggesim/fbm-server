import { IPlayer } from "../schemas/player";

export const playersUploadLineError = (players: IPlayer[]): number => {
  for (let index = 0; index < players.length; index++) {
    const player = players[index];
    if (!player.name || !player.nationality || !player.role) {
      // file error
      return index + 1;
    }
  }

  return -1;
};
