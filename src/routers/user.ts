import * as Router from "koa-router";
import { IUser, User } from "../schemas/user";
import { auth, parseToken, superAdmin } from "../util/auth";
import { erroreImprevisto } from "../util/globals";
import { parseCsv } from "../util/parse";

const userRouter: Router = new Router<IUser>();

userRouter.get(
  "/users",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext) => {
    try {
      ctx.body = await User.find().exec();
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        ctx.throw(500, error.message);
      } else {
        ctx.throw(500, erroreImprevisto);
      }
    }
  }
);

userRouter.get(
  "/users/me",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext) => {
    try {
      const id = ctx.state.user._id;
      const user = await User.findById(id).exec();
      if (user == null) {
        ctx.status = 404;
      } else {
        await user.populate("leagues").execPopulate();
        await user.populate("fantasyTeams").execPopulate();
        const token = await user.generateAuthToken();
        user.tokens = user.tokens.concat(token);
        ctx.body = { user, token };
      }
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        ctx.throw(500, error.message);
      } else {
        ctx.throw(500, erroreImprevisto);
      }
    }
  }
);

userRouter.post(
  "/users",
  auth(),
  parseToken(),
  superAdmin(),
  async (ctx: Router.IRouterContext) => {
    try {
      const newUser: IUser = ctx.request.body;
      ctx.body = await User.create(newUser);
      ctx.status = 201;
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        ctx.throw(400, error.message);
      } else {
        ctx.throw(500, erroreImprevisto);
      }
    }
  }
);

userRouter.post("/users/login", async (ctx: Router.IRouterContext) => {
  try {
    const user: IUser = await User.findByCredentials(
      ctx.request.body.email,
      ctx.request.body.password
    );
    await user.populate("leagues").execPopulate();
    await user.populate("fantasyTeams").execPopulate();
    const token = await user.generateAuthToken();
    user.tokens = user.tokens.concat(token);
    ctx.body = { user, token };
  } catch (error) {
    console.log(error);
    if (error instanceof Error) {
      ctx.throw(400, error.message);
    } else {
      ctx.throw(500, erroreImprevisto);
    }
  }
});

userRouter.post(
  "/users/logout",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext) => {
    try {
      const id = ctx.state.user._id;
      const token = ctx.state.token;
      const user = await User.findById(id).exec();
      if (user == null) {
        ctx.throw(404, "Utente non trovato");
      }
      user.tokens = user.tokens.filter(
        (userToken: string) => userToken !== token
      );
      await user.save();
      ctx.body = null;
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        ctx.throw(400, error.message);
      } else {
        ctx.throw(500, erroreImprevisto);
      }
    }
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
    try {
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
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        ctx.throw(400, error.message);
      } else {
        ctx.throw(500, erroreImprevisto);
      }
    }
  }
);

userRouter.patch(
  "/users/me",
  auth(),
  parseToken(),
  async (ctx: Router.IRouterContext) => {
    try {
      const updatedUser = ctx.request.body;
      const user = await User.findById(updatedUser._id).exec();
      if (!user) {
        ctx.throw(404, "Utente non trovato");
      }
      user.set(updatedUser);
      await user.save();
      await user.populate("leagues").execPopulate();
      await user.populate("fantasyTeams").execPopulate();
      ctx.body = user;
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        ctx.throw(400, error.message);
      } else {
        ctx.throw(500, erroreImprevisto);
      }
    }
  }
);

userRouter.patch(
  "/users/:id",
  auth(),
  parseToken(),
  superAdmin(),
  async (ctx: Router.IRouterContext) => {
    try {
      const updatedUser = ctx.request.body;
      const user = await User.findById(ctx.params.id).exec();
      if (!user) {
        ctx.throw(404, "Utente non trovato");
      }
      if (updatedUser.password == null) {
        delete updatedUser.password;
      }
      user.set(updatedUser);
      await user.save();
      await user.populate("leagues").execPopulate();
      await user.populate("fantasyTeams").execPopulate();
      ctx.body = user;
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        ctx.throw(400, error.message);
      } else {
        ctx.throw(500, erroreImprevisto);
      }
    }
  }
);

userRouter.delete(
  "/users/:id",
  auth(),
  parseToken(),
  superAdmin(),
  async (ctx: Router.IRouterContext) => {
    try {
      const user = await User.findOneAndDelete({
        _id: ctx.params.id,
      }).exec();
      if (user == null) {
        ctx.throw(404, "Utente non trovato");
      }
      ctx.body = user;
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        ctx.throw(500, error.message);
      } else {
        ctx.throw(500, erroreImprevisto);
      }
    }
  }
);

export default userRouter;
