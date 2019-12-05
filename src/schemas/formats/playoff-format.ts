// tslint:disable-next-line: interface-over-type-literal
type PlayoffType = {
    label: string;
    games: number;
    qfGames?: number;
    sfGames: number;
    fGames: number;
};

export class PlayoffFormat {
    public static readonly QF3SF5F5 = new PlayoffFormat('QF3SF5F5', {
        label: 'Quarti al meglio delle 3, semifinali al meglio delle 5, finale al meglio delle 5',
        games: 13,
        qfGames: 3,
        sfGames: 5,
        fGames: 5,
    });
    public static readonly QF5SF5F5 = new PlayoffFormat('QF5SF5F5', {
        label: 'Quarti al meglio delle 5, semifinali al meglio delle 5, finale al meglio delle 5',
        games: 15,
        qfGames: 5,
        sfGames: 5,
        fGames: 5,
    });
    public static readonly QF3SF5F7 = new PlayoffFormat('QF3SF5F7', {
        label: 'Quarti al meglio delle 3, semifinali al meglio delle 5, finale al meglio delle 7',
        games: 15,
        qfGames: 3,
        sfGames: 5,
        fGames: 7,
    });
    public static readonly QF5SF5F7 = new PlayoffFormat('QF5SF5F7', {
        label: 'Quarti al meglio delle 5, semifinali al meglio delle 5, finale al meglio delle 7',
        games: 17,
        qfGames: 5,
        sfGames: 5,
        fGames: 7,
    });
    public static readonly SF3F3 = new PlayoffFormat('SF3F3', {
        label: 'Semifinali al meglio delle 3, finale al meglio delle 3',
        games: 6,
        sfGames: 3,
        fGames: 3,
    });
    public static readonly SF3F5 = new PlayoffFormat('SF3F5', {
        label: 'Semifinali al meglio delle 3, finale al meglio delle 5',
        games: 8,
        sfGames: 3,
        fGames: 5,
    });
    public static readonly SF5F5 = new PlayoffFormat('SF5F5', {
        label: 'Semifinali al meglio delle 5, finale al meglio delle 5',
        games: 10,
        sfGames: 5,
        fGames: 5,
    });
    public static readonly SF5F7 = new PlayoffFormat('SF5F7', {
        label: 'Semifinali al meglio delle 5, finale al meglio delle 7',
        games: 12,
        sfGames: 5,
        fGames: 7,
    });
    public static readonly QF2SF5F5 = new PlayoffFormat('QF2SF5F5', {
        label: 'Quarti andata e ritorno, semifinali al meglio delle 5, finale al meglio delle 5',
        games: 12,
        qfGames: 2,
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
