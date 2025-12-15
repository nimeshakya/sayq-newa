import express from 'express';

import { googleSignIn, logout } from '../controllers/authentication.controller';

export default (router: express.Router) => {
    router.post('/auth/google-sign-in', googleSignIn);
    router.post('/auth/logout', logout);
};
