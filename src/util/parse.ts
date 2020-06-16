import * as parse from 'csv-parse/lib/sync';

export const parseCsv = (dataString: string, columns: string[]): any[] => {
  const matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (matches && matches.length >= 2) {
    const textToDecode = matches[2];
    const raw = Buffer.from(textToDecode, 'base64');
    return parse(raw, { delimiter: ';', columns }) as any[];
  } else {
    return [];
  }
};
