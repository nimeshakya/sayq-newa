import express from 'express';

import { hasAuthenticationToken } from '../middlewares/authentication.middleware';
import { sessionCheckController } from '../controllers/sessioncheck.controller';

export default (router: express.Router) => {
    router.get(
        '/auth/check-session',
        hasAuthenticationToken,
        sessionCheckController
    );
};
