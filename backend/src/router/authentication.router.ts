import express from 'express';

import { authenticationController } from '../controllers/authentication.controller';

export default (router: express.Router) => {
    router.post('/auth/google-sign-in', authenticationController);
};
