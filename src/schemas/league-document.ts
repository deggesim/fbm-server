import { Document } from 'mongoose';

export interface ILeagueDocument extends Document {
    name: string;
    roundRobinFormat: RoundRobinFormatEnum;
    playoffFormat: string;
    playoutFormat: string;
    cupFormat: string;
    realGames: number;
    roundRobinFirstRealFixture: number;
    playoffFirstRealFixture: number;
    playoutFirstRealFixture: number;
    cupFirstRealFixture: number;
}

export enum RoundRobinFormatEnum {
    Single = 'Girone unico',
    Double = 'Girone andata e ritorno',
    DoublePlus = 'Girone andata e ritorno più girone unico',
    TwoDouble = 'Doppio girone andata e ritorno',
}
