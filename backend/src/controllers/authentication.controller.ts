import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import { GOOGLE_CLIENT_ID, JWT_SECRET } from '../constants';

import jwt from 'jsonwebtoken';

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

        console.log(payload);

        const { sub, email, name, picture } = payload;

        const user = {
            googleId: sub,
            email,
            name,
            picture,
        };

        // jwt token for client
        const appToken = jwt.sign(user, JWT_SECRET!, { expiresIn: '20s' });

        res.status(200).json({ user, token: appToken }).end();
    } catch (error) {
        res.status(500)
            .json({ message: 'Google Authentication Failed!', error })
            .end();
    }
};
