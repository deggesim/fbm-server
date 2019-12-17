// tslint:disable-next-line: interface-over-type-literal
type PlayoffType = {
    label: string;
    games: number;
    qfGames?: number;
    qfTeams?: number;
    sfGames: number;
    fGames: number;
};

export class PlayoffFormat {
    public static readonly QF3_SF5_F5 = new PlayoffFormat('QF3_SF5_F5', {
        label: 'Quarti al meglio delle 3, semifinali al meglio delle 5, finale al meglio delle 5',
        games: 13,
        qfGames: 3,
        qfTeams: 8,
        sfGames: 5,
        fGames: 5,
    });
    public static readonly QF5_SF5_F5 = new PlayoffFormat('QF5_SF5_F5', {
        label: 'Quarti al meglio delle 5, semifinali al meglio delle 5, finale al meglio delle 5',
        games: 15,
        qfGames: 5,
        qfTeams: 8,
        sfGames: 5,
        fGames: 5,
    });
    public static readonly QF3_SF5_F7 = new PlayoffFormat('QF3_SF5_F7', {
        label: 'Quarti al meglio delle 3, semifinali al meglio delle 5, finale al meglio delle 7',
        games: 15,
        qfGames: 3,
        qfTeams: 8,
        sfGames: 5,
        fGames: 7,
    });
    public static readonly QF5_SF5_F7 = new PlayoffFormat('QF5_SF5_F7', {
        label: 'Quarti al meglio delle 5, semifinali al meglio delle 5, finale al meglio delle 7',
        games: 17,
        qfGames: 5,
        qfTeams: 8,
        sfGames: 5,
        fGames: 7,
    });
    public static readonly SF3_F3 = new PlayoffFormat('SF3_F3', {
        label: 'Semifinali al meglio delle 3, finale al meglio delle 3',
        games: 6,
        sfGames: 3,
        fGames: 3,
    });
    public static readonly SF3_F5 = new PlayoffFormat('SF3_F5', {
        label: 'Semifinali al meglio delle 3, finale al meglio delle 5',
        games: 8,
        sfGames: 3,
        fGames: 5,
    });
    public static readonly SF5_F5 = new PlayoffFormat('SF5_F5', {
        label: 'Semifinali al meglio delle 5, finale al meglio delle 5',
        games: 10,
        sfGames: 5,
        fGames: 5,
    });
    public static readonly SF5_F7 = new PlayoffFormat('SF5_F7', {
        label: 'Semifinali al meglio delle 5, finale al meglio delle 7',
        games: 12,
        sfGames: 5,
        fGames: 7,
    });
    public static readonly QF2_SQ8_SF5_F5 = new PlayoffFormat('QF2_SQ8_SF5_F5', {
        label: 'Quarti andata e ritorno, semifinali al meglio delle 5, finale al meglio delle 5',
        games: 12,
        qfGames: 2,
        qfTeams: 8,
        sfGames: 5,
        fGames: 5,
    });
    public static readonly QF2_SQ4_SF5_F5 = new PlayoffFormat('QF2_SQ4_SF5_F5', {
        label: 'Quarti andata e ritorno a 4 squadre, semifinali al meglio delle 5, finale al meglio delle 5',
        games: 12,
        qfGames: 2,
        qfTeams: 4,
        sfGames: 5,
        fGames: 5,
    });

    // private to disallow creating other instances of this type
    private constructor(
        private readonly key: string,
        public readonly value: PlayoffType,
    ) { }

    public toString() {
        return this.key;
    }
}

export const playoffFormat = {
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
        qfGames: {
            type: Number,
        },
        sfGames: {
            type: Number,
            required: true,
        },
        fGames: {
            type: Number,
            required: true,
        },
    },
};
