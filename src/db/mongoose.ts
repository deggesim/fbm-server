import { MongoError } from 'mongodb';
import { connect } from 'mongoose';

const PORT = String(process.env.MONGODB_URI);

connect(PORT, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
});
