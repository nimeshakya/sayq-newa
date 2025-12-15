import mongoose, { Schema, Document } from 'mongoose';

export interface UserType extends Document {
    googleId: string;
    email: string;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    expertise_lvl: number | null; // New field for expertise level
}

const UserSchema = new Schema<UserType>({
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    given_name: { type: String, required: false },
    family_name: { type: String, required: false },
    picture: { type: String, required: false },
    expertise_lvl: { type: Number, enum: [0, 1, 2, 3, 4, 5], default: 0 }, // Expertise level from 0 to 5
});

export default UserSchema;
