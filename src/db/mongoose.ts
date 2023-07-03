import * as mongoose from "mongoose";

const URI = String(process.env.MONGODB_URI);
mongoose.set("strictQuery", true);
mongoose.set("debug", process.env.DEBUG_MODE === "true");
mongoose.connect(URI);
