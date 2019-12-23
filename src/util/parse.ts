import * as parse from 'csv-parse';
import * as fs from 'fs';

export const parseCsvOld = (buffer: any, columns: string[]): Promise<any[]> => {
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

export const parseCsv = (buffer: any, columns: string[], callback: (output: any[]) => void) => {
    const output: any = [];
    const parser: parse.Parser = parse(buffer, { delimiter: ';', columns });
    parser.on('readable', () => {
        let record = parser.read();
        while (record) {
            console.log(record);
            output.push(record);
            record = parser.read();
        }
    }).on('end', () => {
        parser.destroy();
        callback(output);
    });
    return output;
};
