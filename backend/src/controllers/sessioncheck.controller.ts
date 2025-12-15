import express from 'express';
import jwt from 'jsonwebtoken';
import UserModel from '../models/user.model';
import { JWT_SECRET } from '../constants';

export const sessionCheckController = async (
    req: express.Request,
    res: express.Response
) => {
    try {
        const googleid = (req as any).user?.sub;
        const user = await UserModel.findOne({ googleId: googleid });
        if (!user) return res.status(404).json({ message: 'User not found!' });
        res.status(200).json({ user, message: 'User is authenticated!' });
    } catch (error) {
        res.status(500).json({ message: 'Session check failed!' }).end();
    }
};
