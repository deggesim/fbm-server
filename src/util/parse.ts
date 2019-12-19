import * as parse from 'csv-parse';

export const parseCsv = (buffer: any): any[] => {
    const output: any = [];
    const parser: parse.Parser = parse(buffer, { delimiter: ';' });
    parser.on('readable', () => {
        let record = parser.read();
        while (record) {
            console.log(record);
            output.push(record);
            record = parser.read();
        }
    }).on('end', () => {
        parser.destroy();
    });
    return output;
};
