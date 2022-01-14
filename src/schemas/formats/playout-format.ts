type PlayoutType = {
  label: string;
  games: number;
  rounds?: number;
  roundRobinTeams?: number;
  sfGames?: number;
  fGames: number;
};

export class PlayoutFormat {
  public static readonly SF3_F5 = new PlayoutFormat('SF3_F5', {
    label: 'Semifinali al meglio delle 3, spareggio al meglio delle 5',
    games: 8,
    sfGames: 3,
    fGames: 5,
  });
  public static readonly SF5_F5 = new PlayoutFormat('SF5_F5', {
    label: 'Semifinali al meglio delle 5, spareggio al meglio delle 5',
    games: 10,
    sfGames: 5,
    fGames: 5,
  });
  public static readonly SRR4_SF3_F5 = new PlayoutFormat('SRR4_SF3_F5', {
    label: 'Girone unico a 4, semifinali al meglio delle 3, spareggio al meglio delle 5',
    games: 11,
    rounds: 1,
    roundRobinTeams: 4,
    sfGames: 3,
    fGames: 5,
  });
  public static readonly SRR4_SF5_F5 = new PlayoutFormat('SRR4_SF5_F5', {
    label: 'Girone unico a 4, semifinali al meglio delle 5, spareggio al meglio delle 5',
    games: 13,
    rounds: 1,
    roundRobinTeams: 4,
    sfGames: 5,
    fGames: 5,
  });
  public static readonly DRR4_SF3_F5 = new PlayoutFormat('DRR4_SF3_F5', {
    label: 'Girone andata e ritorno a 4, semifinali al meglio delle 3, spareggio al meglio delle 5',
    games: 14,
    rounds: 2,
    roundRobinTeams: 4,
    sfGames: 3,
    fGames: 5,
  });
  public static readonly DRR4_SF5_F5 = new PlayoutFormat('DRR4_SF5_F5', {
    label: 'Girone andata e ritorno a 4, semifinali al meglio delle 4, spareggio al meglio delle 5',
    games: 16,
    rounds: 2,
    roundRobinTeams: 4,
    sfGames: 5,
    fGames: 5,
  });
  public static readonly SRR4_F5 = new PlayoutFormat('SRR4_F5', {
    label: 'Girone unico a 4, spareggio al meglio delle 5',
    games: 8,
    rounds: 1,
    roundRobinTeams: 4,
    fGames: 5,
  });
  public static readonly DRR4_F5 = new PlayoutFormat('DRR4_F5', {
    label: 'Girone andata e ritorno a 4, spareggio al meglio delle 5',
    games: 11,
    rounds: 2,
    roundRobinTeams: 4,
    fGames: 5,
  });
  public static readonly SF5_F7 = new PlayoutFormat('SF5_F7', {
    label: 'Semifinali al meglio delle 5, spareggio al meglio delle 7',
    games: 12,
    roundRobinTeams: 5,
    fGames: 7,
  });

  // private to disallow creating other instances of this type
  private constructor(
    private readonly key: string,
    public readonly value: PlayoutType,
  ) { }

  public toString() {
    return this.key;
  }
}

export const playoutFormat = {
  key: {
    type: String,
    required: true,
  },
  value: {
    label: {
      type: String,
      required: true,
    },
    games: {
      type: Number,
      required: true,
    },
    rounds: {
      type: Number,
    },
    roundRobinTeams: {
      type: Number,
    },
    sfGames: {
      type: Number,
    },
    fGames: {
      type: Number,
      required: true,
    },
  },
};
