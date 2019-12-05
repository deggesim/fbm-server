// tslint:disable-next-line: interface-over-type-literal
type PlayoutType = {
    label: string;
    games: number;
    rounds?: number;
    roundRobinTeams?: number;
    sfGames?: number;
    fGames: number;
};

export class PlayoutFormat {
    public static readonly SF3F5 = new PlayoutFormat('SF3F5', {
        label: 'Semifinali al meglio delle 3, spareggio al meglio delle 5',
        games: 8,
        sfGames: 3,
        fGames: 5,
    });
    public static readonly SF5F5 = new PlayoutFormat('SF5F5', {
        label: 'Semifinali al meglio delle 5, spareggio al meglio delle 5',
        games: 10,
        sfGames: 5,
        fGames: 5,
    });
    public static readonly SRR4SF3F5 = new PlayoutFormat('SRR4SF3F5', {
        label: 'Girone unico a 4, semifinali al meglio delle 3, spareggio al meglio delle 5',
        games: 11,
        rounds: 1,
        roundRobinTeams: 4,
        sfGames: 3,
        fGames: 5,
    });
    public static readonly SRR4SF5F5 = new PlayoutFormat('SRR4SF5F5', {
        label: 'Girone unico a 4, semifinali al meglio delle 5, spareggio al meglio delle 5',
        games: 13,
        rounds: 1,
        roundRobinTeams: 4,
        sfGames: 5,
        fGames: 5,
    });
    public static readonly DRR4SF3F5 = new PlayoutFormat('DRR4SF3F5', {
        label: 'Girone andata e ritorno a 4, semifinali al meglio delle 3, spareggio al meglio delle 5',
        games: 14,
        rounds: 2,
        roundRobinTeams: 4,
        sfGames: 3,
        fGames: 5,
    });
    public static readonly DRR4SF5F5 = new PlayoutFormat('DRR4SF5F5', {
        label: 'Girone andata e ritorno a 4, semifinali al meglio delle 4, spareggio al meglio delle 5',
        games: 16,
        rounds: 2,
        roundRobinTeams: 4,
        sfGames: 5,
        fGames: 5,
    });
    public static readonly SRR4F5 = new PlayoutFormat('SRR4F5', {
        label: 'Girone unico a 4, spareggio al meglio delle 5',
        games: 8,
        rounds: 1,
        roundRobinTeams: 4,
        fGames: 5,
    });
    public static readonly DRR4F5 = new PlayoutFormat('DRR4F5', {
        label: 'Girone unico a 4, semifinali al meglio delle 3, spareggio al meglio delle 5',
        games: 11,
        rounds: 2,
        roundRobinTeams: 4,
        fGames: 5,
    });
    public static readonly SF5F7 = new PlayoutFormat('SF5F7', {
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
