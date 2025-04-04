import express, {Request, Response} from 'express';
import db from '../config/db';
import {getProfile, updateProfile} from '../controllers/profileController';
import { errorHandler } from '../middleware/errorHandler';
import { userAuthCheck } from '../middleware/userAuth';

const router = express.Router();

export interface Error {
    message?: string;
    status?: number;
}

//Grab logged users profile
router.get('/loggedProfile', getProfile);

//Update users profile info
router.patch('/update', userAuthCheck, updateProfile);

export const profileRoute = router;