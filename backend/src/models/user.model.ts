import mongoose from 'mongoose';

import UserSchema, { UserType } from '../db/user.schema';

const UserModel = mongoose.model<UserType>('User', UserSchema);

export default UserModel;
