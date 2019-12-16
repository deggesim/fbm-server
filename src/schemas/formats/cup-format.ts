// tslint:disable-next-line: interface-over-type-literal
type CupType = {
    label: string;
    games: number;
    qfRoundTrip: boolean;
    sfRoundTrip: boolean;
    fRoundTrip: boolean;
};

export class CupFormat {
    public static readonly F8 = new CupFormat('F8', {
        label: 'Final 8',
        games: 3,
        qfRoundTrip: false,
        sfRoundTrip: false,
        fRoundTrip: false,
    });
    public static readonly QF2F4 = new CupFormat('QF2F4', {
        label: 'Quarti andata e ritorno, final 4',
        games: 4,
        qfRoundTrip: true,
        sfRoundTrip: false,
        fRoundTrip: false,
    });
    public static readonly QF2SF2F = new CupFormat('QF2SF2F', {
        label: 'Quarti andata e ritorno, semifinali andata e ritorno, finale',
        games: 5,
        qfRoundTrip: true,
        sfRoundTrip: true,
        fRoundTrip: false,
    });
    public static readonly QF2SF2F2 = new CupFormat('QF2SF2F2', {
        label: 'Quarti andata e ritorno, semifinali andata e ritorno, finale andata e ritorno',
        games: 6,
        qfRoundTrip: true,
        sfRoundTrip: true,
        fRoundTrip: true,
    });

    // private to disallow creating other instances of this type
    private constructor(
        private readonly key: string,
        public readonly value: CupType,
    ) { }

    public toString() {
        return this.key;
    }
}

export const cupFormat = {
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
        qfRoundTrip: {
            type: Boolean,
            required: true,
            default: false,
        },
        sfRoundTrip: {
            type: Boolean,
            required: true,
            efault: false,
        },
        fRoundTrip: {
            type: Boolean,
            required: true,
            efault: false,
        },
    },
};
