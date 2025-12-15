import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';
import mongoose from 'mongoose';
import helmet from 'helmet';

import { MONGO_URI, PORT } from './constants';

import router from './router';

const app = express();

app.use(
    helmet({
        crossOriginOpenerPolicy: {
            policy: 'same-origin-allow-popups',
        },
    })
);

app.use(
    cors({
        credentials: true,
        origin: 'http://localhost:5173',
        optionsSuccessStatus: 200,
    })
);

// Settings to optimize app
app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());

app.use('/api', router());

const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});

// Connect to MongoDB
mongoose.Promise = Promise;
mongoose.connect(MONGO_URI || '');
mongoose.connection.on('error', (err: Error) => {
    console.error(`MongoDB connection error: ${err}`);
});
