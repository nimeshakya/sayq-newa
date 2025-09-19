import express from 'express';

import { getDemoGreet } from '../controllers/demo.controller';

export default (router: express.Router) => {
    router.get('/demo/greet', getDemoGreet);
};
