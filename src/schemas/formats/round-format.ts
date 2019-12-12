// tslint:disable-next-line: interface-over-type-literal
type RoundFormatType = {
    label: string;
};

export class RoundFormat {
    public static readonly ROUND_ROBIN = new RoundFormat('ROUND_ROBIN', {
        label: 'Girone all\'Italiana',
    });
    public static readonly PLAYOFF = new RoundFormat('PLAYOFF', {
        label: 'playoff',
    });
    public static readonly ROUND_TRIP = new RoundFormat('ROUND_TRIP', {
        label: 'Andata e Ritorno',
    });
    public static readonly ELIMINATION = new RoundFormat('ELIMINATION', {
        label: 'Gara unica',
    });

    // private to disallow creating other instances of this type
    private constructor(
        private readonly key: string,
        public readonly value: RoundFormatType,
    ) { }

    public toString() {
        return this.key;
    }
}

export const roundFormat = {
    key: {
        type: String,
        required: true,
    },
    value: {
        label: {
            type: String,
            required: true,
        },
    },
};
