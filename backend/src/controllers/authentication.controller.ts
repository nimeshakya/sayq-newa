import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import { GOOGLE_CLIENT_ID, JWT_SECRET } from '../constants';

import jwt from 'jsonwebtoken';

import UserModel from '../models/user.model';

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export const authenticationController = async (
    req: express.Request,
    res: express.Response
) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res
                .status(400)
                .json({ message: 'Token is required!' })
                .end();
        }

        // Verify the token with Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });

        // Get the user information from the payload
        const payload = ticket.getPayload();
        if (!payload) {
            throw new Error('No payload from Google!');
        }

        const { sub, email, given_name, family_name, name, picture } = payload;

        // Check if user exists in our database
        let user = await UserModel.findOne({ googleId: sub });
        if (!user) {
            user = await UserModel.create({
                googleId: sub,
                email,
                name,
                given_name,
                family_name,
                picture,
                expertise_lvl: null,
            });
        }

        // jwt token for client
        const appToken = jwt.sign({ sub: user.googleId }, JWT_SECRET!, {
            expiresIn: '1d',
        });

        res.status(200).json({ user, token: appToken }).end();
    } catch (error) {
        res.status(500)
            .json({ message: 'Google Authentication Failed!', error })
            .end();
    }
};
