import { ITenantDocument } from './tenant-document';

export interface IPlayerDocument extends ITenantDocument {
    name: string;
    nationality: string;
    number: string;
    yearBirth: number;
    height: number;
    weight: number;
    role: {
        name: string;
        shortName: string;
        spot: number[];
    };
}
