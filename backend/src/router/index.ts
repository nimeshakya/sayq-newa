import express from 'express';

import demoRouter from './demo.router';

const router = express.Router();

export default (): express.Router => {
    // Define routes here
    demoRouter(router);
    return router;
};
