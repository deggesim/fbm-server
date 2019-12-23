import * as Router from 'koa-router';

export const decodeData = (dataString: string): Buffer => {
    console.log(dataString);
    const matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length >= 2) {
        const textToDecode = matches[2];
        const raw = Buffer.from(textToDecode, 'base64');
        return raw;
    } else {
        return Buffer.of();
    }
};
