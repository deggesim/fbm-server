// tslint:disable-next-line: interface-over-type-literal
type RoundRobinType = {
    label: string;
    rounds: number;
};

export class RegularSeasonFormat {
    public static readonly SINGLE = new RegularSeasonFormat('SINGLE', {
        label: 'Girone unico',
        rounds: 1,
    });
    public static readonly DOUBLE = new RegularSeasonFormat('DOUBLE', {
        label: 'Girone andata e ritorno',
        rounds: 2,
    });
    public static readonly DOUBLE_PLUS = new RegularSeasonFormat('DOUBLE_PLUS', {
        label: 'Girone andata e ritorno più girone unico',
        rounds: 3,
    });
    public static readonly TWO_DOUBLE = new RegularSeasonFormat('TWO_DOUBLE', {
        label: 'Doppio girone andata e ritorno',
        rounds: 4,
    });

    // private to disallow creating other instances of this type
    private constructor(
        private readonly key: string,
        public readonly value: RoundRobinType,
    ) {}

    public toString() {
        return this.key;
    }
}
