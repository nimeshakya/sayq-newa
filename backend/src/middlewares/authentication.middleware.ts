import express from 'express';

import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../constants';
import { UserType } from '../db/user.schema';

interface AuthenticatedRequest extends express.Request {
    user?: UserType | string | jwt.JwtPayload;
}

export const hasAuthenticationToken = (
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
) => {
    try {
        if (!JWT_SECRET) {
            // Fail fast if secret is not set
            throw new Error(
                'JWT_SECRET is not defined in environment variables'
            );
        }
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res
                .status(401)
                .json({ message: 'No token provided!' })
                .end();
        }

        const token = authHeader.split(' ')[1]; // Bearer <token>
        if (!token) {
            return res
                .status(401)
                .json({ message: 'No token provided!' })
                .end();
        }

        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res
                    .status(401)
                    .json({ message: 'Invalid token!' })
                    .end();
            }

            req.user = decoded;
            next();
        });
    } catch (error) {
        return res
            .status(500)
            .json({ message: 'Authentication Failed!', error })
            .end();
    }
};
