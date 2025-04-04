import express, {Express, Request, Response} from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connection from './config/db';
import { userRoute } from './routes/userRoute';
import {profileRoute} from './routes/profileRoute';

import { errorHandler } from './middleware/errorHandler';
import crypto from 'crypto';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { trackRoute } from './routes/trackRoute';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT;

const sessionSecret: any = process.env.SECRET_SESSION;

//CORS
const allowedOrigins = ['http://localhost:3000', 'http://localhost:3000/delete/:trackid'];

const options: cors.CorsOptions = {
  origin: allowedOrigins,
   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
   credentials: true
};

// Then pass these options to cors:
app.use(cors(options));

//EXPRESS
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//EXPRESS CONFIG
app.use(cookieParser());

//SESSIONS
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: {secure: false}
}));

//ROUTES
app.use('/user', userRoute);
app.use('/track', trackRoute);
app.use('/profile', profileRoute);

//Error Handler Middleware
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`vibing in server: ${PORT}`);
});