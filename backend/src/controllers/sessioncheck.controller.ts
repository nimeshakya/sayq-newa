import express from 'express';
import UserModel from '../models/user.model';

export const sessionCheckController = async (
    req: express.Request,
    res: express.Response
) => {
    try {
        const userId = (req as any).user?.id;
        const user = await UserModel.findById(userId).select('__v');
        if (!user) return res.status(404).json({ message: 'User not found!' });
        res.status(200).json({ user, message: 'User is authenticated!' });
    } catch (error) {
        res.status(500).json({ message: 'Session check failed!' }).end();
    }
};
