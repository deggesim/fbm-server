import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Document, HookNextFunction, model, Model, Schema } from 'mongoose';
import validator from 'validator';
import { IFantasyTeam } from './fantasy-team';
import { ILeague } from './league';

interface IUserDocument extends Document {
    name: string;
    email: string;
    password: string;
    role: string;
    tokens: string[];
    fantasyTeams: Array<IFantasyTeam['_id']>;
    leagues: Array<ILeague['id']>;
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
export interface IUser extends IUserDocument {
    generateAuthToken: () => Promise<string>;
    isAdmin: () => boolean;
    isSuperAdmin: () => boolean;
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IUserModel extends Model<IUser> {
    findByCredentials: (email: string, password: string) => Promise<IUser>;
    allSuperAdmins: () => Promise<IUser[]>;
}

const schema = new Schema<IUser>({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate: (value: string) => validator.isEmail(value),
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        trim: true,
    },
    role: {
        type: String,
        required: true,
        enum: [
            'User',
            'Admin',
            'SuperAdmin',
        ],
        defautl: 'User',
    },
    tokens: [{
        type: String,
        required: true,
    }],
    fantasyTeams: [{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'FantasyTeam',
    }],
    leagues: [{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'League',
    }],
}, {
    timestamps: true,
});

schema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.tokens;
    return userObject;
};

schema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, String(process.env.PUBLIC_KEY), {
        expiresIn: '14d',
    });
    user.tokens = user.tokens.concat(token);
    await user.save();
    return Promise.resolve(token);
};

schema.methods.isAdmin = function () {
    const user = this;
    return user.role === 'Admin';
};

schema.methods.isSuperAdmin = function () {
    const user = this;
    return user.role === 'SuperAdmin';
};

schema.statics.findByCredentials = async (email: string, password: string) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('Email o password errate');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Email o password errate');
    }

    return user;
};

schema.statics.allSuperAdmins = async () => {
    return await User.find({ role: 'SuperAdmin' });
};

// Hash the plain text password before saving
schema.pre<IUser>('save', async function (next: HookNextFunction) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
});

export const User = model<IUser, IUserModel>('User', schema);
