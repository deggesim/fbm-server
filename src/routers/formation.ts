
import * as Koa from 'koa';
import * as Router from 'koa-router';
import { Formation, IFormation } from '../schemas/formation';
import { ILeague, League } from '../schemas/league';
import { auth, parseToken } from '../util/auth';
import { tenant } from '../util/tenant';

const formationRouter: Router = new Router<IFormation>();

formationRouter.get('/formations', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        ctx.body = await Formation.find({ league: ctx.get('league') });
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

formationRouter.get('/formations/:id', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const formation = await Formation.findOne({ _id: ctx.params.id, league: ctx.get('league') });
        if (formation == null) {
            ctx.throw(404, 'Giornata non trovata');
        }
        ctx.body = formation;
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

formationRouter.post('/formations', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
        const formations: IFormation[] = ctx.request.body;
        for (const formation of formations) {
            formation.league = league._id;
        }
        ctx.body = await Formation.insertMany(formations);
        ctx.status = 201;
    } catch (error) {
        console.log(error);
        ctx.throw(400, error.message);
    }
});

formationRouter.patch('/formations/:id', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const updatedFormation: IFormation = ctx.request.body;
        const formationToUpdate: IFormation = await Formation.findOne({ _id: ctx.params.id, league: ctx.get('league') }) as IFormation;
        if (formationToUpdate == null) {
            ctx.throw(404, 'Giornata non trovata');
        }
        formationToUpdate.set(updatedFormation);
        ctx.body = await formationToUpdate.save();
    } catch (error) {
        console.log(error);
        ctx.throw(400, error.message);
    }
});

formationRouter.delete('/formations/:id', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
    try {
        const formation = await Formation.findOneAndDelete({ _id: ctx.params.id, league: ctx.get('league') }) as IFormation;
        console.log(formation);
        if (formation == null) {
            ctx.status = 404;
        }
        ctx.body = formation;
    } catch (error) {
        console.log(error);
        ctx.throw(500, error.message);
    }
});

export default formationRouter;
