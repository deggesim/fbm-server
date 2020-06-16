import * as mongoose from 'mongoose';

const PORT = String(process.env.MONGODB_URI);

mongoose.connect(PORT, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
});

mongoose.set('debug', process.env.DEBUG_MODE || false);
