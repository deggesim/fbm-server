import * as jwt from 'koa-jwt';

export const auth = () => {
    return jwt({ secret: String(process.env.PUBLIC_KEY) });
};
