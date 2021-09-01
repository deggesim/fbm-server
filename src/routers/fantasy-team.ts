import * as Koa from 'koa';
import * as Router from 'koa-router';
import { ObjectId } from 'mongodb';
import { FantasyTeam, IFantasyTeam } from '../schemas/fantasy-team';
import { ILeague, League } from '../schemas/league';
import { IRealFixture } from '../schemas/real-fixture';
import { IUser } from '../schemas/user';
import { admin, auth, parseToken } from '../util/auth';
import { tenant } from '../util/tenant';

const fantasyTeamRouter: Router = new Router<IFantasyTeam>();

fantasyTeamRouter.post('/fantasy-teams/league/:id', auth(), parseToken(), admin(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
  try {
    const league: ILeague = await League.findById(ctx.params.id) as ILeague;
    const fantasyTeams: IFantasyTeam[] = ctx.request.body;
    ctx.body = FantasyTeam.insertFantasyTeams(fantasyTeams, league);
    ctx.status = 201;
  } catch (error) {
    console.log(error);
    ctx.throw(500, error.message);
  }
});

fantasyTeamRouter.get('/fantasy-teams', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
  try {
    const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
    const user: IUser = ctx.state.user;
    const nextRealFixture: IRealFixture = await league.nextRealFixture();
    const conditions: any = { league: league._id };
    if (user.isUser()) {
      conditions.owners = user._id;
    }
    const fantasyTeams: IFantasyTeam[] = await FantasyTeam.find(conditions);
    for (const fantasyTeam of fantasyTeams) {
      await fantasyTeam.populate('owners').execPopulate();
      await fantasyTeam.populate({
        path: 'fantasyRosters',
        match: {
          realFixture: nextRealFixture._id,
        },
      }).execPopulate();
    }
    ctx.body = fantasyTeams;
  } catch (error) {
    console.log(error);
    ctx.throw(500, error.message);
  }
});

fantasyTeamRouter.get('/fantasy-teams/:id', auth(), parseToken(), tenant(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
  try {
    const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
    const nextRealFixture: IRealFixture = await league.nextRealFixture();
    const fantasyTeam: IFantasyTeam = await FantasyTeam.findOne({ _id: ctx.params.id, league: league._id }) as IFantasyTeam;
    if (fantasyTeam == null) {
      ctx.throw(404, 'Fantasquadra non trovata');
    }
    await fantasyTeam.populate('owners').execPopulate();
    await fantasyTeam.populate({
      path: 'fantasyRosters',
      match: {
        realFixture: nextRealFixture._id,
      },
    }).execPopulate();
    ctx.body = fantasyTeam;
  } catch (error) {
    console.log(error);
    ctx.throw(500, error.message);
  }
});

fantasyTeamRouter.patch('/fantasy-teams/:id', auth(), parseToken(), tenant(), admin(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
  try {
    const league: ILeague = await League.findById(ctx.get('league')) as ILeague;
    const nextRealFixture: IRealFixture = await league.nextRealFixture();
    const updatedFantasyTeam: IFantasyTeam = ctx.request.body;
    const fantasyTeamToUpdate = await FantasyTeam.findOne({ _id: ctx.params.id, league: league._id }) as IFantasyTeam;
    if (fantasyTeamToUpdate == null) {
      ctx.throw(404, 'Fantasquadra non trovata');
    }
    fantasyTeamToUpdate.set(updatedFantasyTeam);
    const fantasyTeam = await fantasyTeamToUpdate.save();
    await fantasyTeam.populate('owners').execPopulate();
    // add league to owners
    const owners = fantasyTeam.owners as IUser[];
    for (const user of owners) {
      const managedLeagues = user.leagues as ObjectId[];
      if (managedLeagues.find((managedLeague) => managedLeague.equals(league._id)) == null) {
        // add league to owner
        user.leagues.push(league);
        await user.save();
      }
    }
    await fantasyTeam.populate({
      path: 'fantasyRosters',
      match: {
        realFixture: nextRealFixture._id,
      },
    }).execPopulate();
    ctx.body = fantasyTeam;
  } catch (error) {
    console.log(error);
    ctx.throw(400, error.message);
  }
});

fantasyTeamRouter.delete('/fantasy-teams/:id', auth(), parseToken(), tenant(), admin(), async (ctx: Router.IRouterContext, next: Koa.Next) => {
  try {
    const fantasyTeam = await FantasyTeam.findOneAndDelete({ _id: ctx.params.id, league: ctx.get('league') }) as IFantasyTeam;
    if (fantasyTeam == null) {
      ctx.status = 404;
    }
    ctx.body = fantasyTeam;
  } catch (error) {
    console.log(error);
    ctx.throw(500, error.message);
  }
});
export default fantasyTeamRouter;
