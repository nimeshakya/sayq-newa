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

        const token = req.cookies.token; // read the token in cookie
        if (!token) return res.status(401).json({ message: 'No token!' });

        // verify jwt
        const decoded = jwt.verify(token, JWT_SECRET);

        if (!decoded)
            return res.status(401).json({ message: 'Invalid token!' });
        req.user = decoded;
        console.log(decoded);

        next();
    } catch (error) {
        return res
            .status(500)
            .json({ message: 'Authentication Failed!', error })
            .end();
    }
};
