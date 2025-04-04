import express from 'express';
import {Request, Response, NextFunction} from 'express';
//import {} from '../controllers/trackController';
import { uploadTrack, getTracks, deleteTrack, getTrack } from '../controllers/trackController';
import { userAuthCheck } from '../middleware/userAuth';

import db from '../config/db';

import { upload } from '../controllers/trackController';

const router = express.Router();

//route for uploading tracks
router.post('/trackupload', userAuthCheck, upload.single('trackFile'), uploadTrack);

//route for fetching track
router.get('/grabTracks', getTracks);

//route for fetching specific singular track
router.get('/grabTrack', getTrack);

//route for deleting specific track
router.delete('/delete/:trackID', userAuthCheck, deleteTrack);
export const trackRoute = router;