import * as parse from 'csv-parse/lib/sync';

export const parseCsv = (buffer: any, columns: string[]) => {
    return parse(buffer, { delimiter: ';', columns });
};
