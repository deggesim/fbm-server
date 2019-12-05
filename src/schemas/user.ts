import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { model, Model, Schema } from 'mongoose';
import validator from 'validator';
import { IUserDocument } from './documents/user-document';

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
export interface IUser extends IUserDocument {
    generateAuthToken: () => Promise<string>;
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IUserModel extends Model<IUser> {
    findByCredentials: (email: string, password: string) => Promise<IUser>;
}

const userSchema = new Schema<IUser>({
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
        minlength: 7,
        trim: true,
        validate: (value: string) => !value.toLowerCase().includes('password'),
    },
    admin: {
        type: Boolean,
        required: true,
    },
    leagues: [{
        league: {
            type: Number,
            required: true,
            ref: 'League',
        },
    }],
    tokens: [{
        type: String,
        required: true,
    }],
}, {
    timestamps: true,
});

userSchema.methods.toJSON = function() {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    return userObject;
};

userSchema.methods.generateAuthToken = async function() {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, String(process.env.PUBLIC_KEY), {
        expiresIn: '14d',
      });
    user.tokens = user.tokens.concat(token);
    await user.save();

    return Promise.resolve(token);
};

userSchema.statics.findByCredentials = async (email: string, password: string) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('Email o password errate');
    }
    console.log('password', password);
    console.log('user.password', user.password);

    const isMatch = await bcrypt.compare(password, user.password);

    console.log('isMatch', isMatch);

    if (!isMatch) {
        throw new Error('Email o password errate');
    }

    return user;
};

// Hash the plain text password before saving
userSchema.pre<IUser>('save', async function (next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
});

const User = model<IUser, IUserModel>('User', userSchema);

export default User;
