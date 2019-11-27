import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as logger from 'koa-logger';
import * as Router from 'koa-router';
import playerRouter from './routers/player';
import roleRouter from './routers/role';

import './db/mongoose';

const app: Koa = new Koa();
const router: Router = new Router();

// tslint:disable-next-line: no-var-requires
const cors = require('@koa/cors');
app.use(cors());

app.use(logger());
app.use(bodyParser());

app.use(roleRouter.routes());
app.use(playerRouter.routes());

app.use(router.routes());
app.use(router.allowedMethods());
console.log(`Started listening on port ${process.env.PORT}...`);
app.listen(process.env.PORT || 5000);
