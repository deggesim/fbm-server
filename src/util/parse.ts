import * as parse from 'csv-parse';
import * as fs from 'fs';

export const parseCsv = (buffer: any, columns: string[]): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const data: any[] = [];
        fs.createReadStream(buffer).pipe(parse(buffer, { delimiter: ';', columns }))
            .on('data', (row) => {
                data.push(row);
            })
            .on('error', (e) => {
                reject(e);
            })
            .on('end', () => {
                resolve(data);
            });
    });
};
