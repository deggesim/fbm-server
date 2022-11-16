import * as Router from "koa-router";
import { IUser, User } from "../schemas/user";
import { auth, parseToken, superAdmin } from "../util/auth";
import { entityNotFound } from "../util/functions";
import { parseCsv } from "../util/parse";

const userRouter: Router = new Router<IUser>();

userRouter.get(
  "/users",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext) => {
    ctx.body = await User.find().exec();
  }
);

userRouter.get(
  "/users/me",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext) => {
    const id = ctx.state.user._id;
    const user = await User.findById(id).exec();
    if (user == null) {
      ctx.throw(entityNotFound("User", id), 404);
    }
    await user.populate("leagues").execPopulate();
    await user.populate("fantasyTeams").execPopulate();
    const token = await user.generateAuthToken();
    user.tokens = user.tokens.concat(token);
    ctx.body = { user, token };
  }
);

userRouter.post(
  "/users",
  auth(),
  parseToken(),
  superAdmin(),
  async (ctx: Router.IRouterContext) => {
    const newUser: IUser = ctx.request.body;
    ctx.body = await User.create(newUser);
    ctx.status = 201;
  }
);

userRouter.post("/users/login", async (ctx: Router.IRouterContext) => {
  const user: IUser = await User.findByCredentials(
    ctx.request.body.email,
    ctx.request.body.password
  );
  await user.populate("leagues").execPopulate();
  await user.populate("fantasyTeams").execPopulate();
  const token = await user.generateAuthToken();
  user.tokens = user.tokens.concat(token);
  ctx.body = { user, token };
});

userRouter.post(
  "/users/logout",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext) => {
    const id = ctx.state.user._id;
    const token = ctx.state.token;
    const user = await User.findById(id).exec();
    if (user == null) {
      ctx.throw(entityNotFound("User", id), 404);
    }
    user.tokens = user.tokens.filter(
      (userToken: string) => userToken !== token
    );
    await user.save();
    ctx.body = null;
  }
);

const multer = require("@koa/multer");
const upload = multer({
  storage: multer.memoryStorage(),
});
userRouter.post(
  "/users/upload",
  auth(),
  parseToken(),
  upload.single("users"),
  superAdmin(),
  async (ctx: Router.IRouterContext) => {
    const users = parseCsv(ctx.request.body.users.toString(), [
      "name",
      "email",
      "password",
      "role",
    ]);
    const ret: IUser[] = [];
    for (const user of users) {
      const userSaved: IUser = await User.create(user);
      ret.push(userSaved);
    }
    ctx.body = ret;
  }
);

userRouter.patch(
  "/users/me",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext) => {
    const updatedUser = ctx.request.body;
    const user = await User.findById(updatedUser._id).exec();
    if (!user) {
      ctx.throw(entityNotFound("User", updatedUser._id), 404);
    }
    user.set(updatedUser);
    await user.save();
    await user.populate("leagues").execPopulate();
    await user.populate("fantasyTeams").execPopulate();
    ctx.body = user;
  }
);

userRouter.patch(
  "/users/:id",
  auth(),
  parseToken(),
  superAdmin(),
  async (ctx: Router.IRouterContext) => {
    const updatedUser = ctx.request.body;
    const user = await User.findById(ctx.params.id).exec();
    if (!user) {
      ctx.throw(entityNotFound("User", ctx.params.id), 404);
    }
    if (updatedUser.password == null) {
      delete updatedUser.password;
    }
    user.set(updatedUser);
    await user.save();
    await user.populate("leagues").execPopulate();
    await user.populate("fantasyTeams").execPopulate();
    ctx.body = user;
  }
);

userRouter.delete(
  "/users/:id",
  auth(),
  parseToken(),
  superAdmin(),
  async (ctx: Router.IRouterContext) => {
    const user = await User.findOneAndDelete({
      _id: ctx.params.id,
    }).exec();
    if (user == null) {
      ctx.throw(entityNotFound("User", ctx.params.id), 404);
    }
    ctx.body = user;
  }
);

export default userRouter;
