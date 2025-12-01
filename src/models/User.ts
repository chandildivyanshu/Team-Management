import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    empId: string;
    name: string;
    role: 'RBM' | 'AreaManager' | 'TerritoryManager' | 'MDO';
    email?: string;
    mobile?: string;
    passwordHash: string;
    managerId?: mongoose.Types.ObjectId;
    profilePicUrl?: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        empId: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        role: {
            type: String,
            enum: ['RBM', 'AreaManager', 'TerritoryManager', 'MDO'],
            required: true,
        },
        email: { type: String },
        mobile: { type: String },
        passwordHash: { type: String, required: true },
        managerId: { type: Schema.Types.ObjectId, ref: 'User' },
        profilePicUrl: { type: String },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
