import {Response, Request, NextFunction} from 'express';
import { CustomError } from '../middleware/errorHandler';
import db from '../config/db';
import { v4 as uuidv4, v4 } from 'uuid';
import crypto from 'crypto';

import multer from 'multer';

import moment from 'moment';

import {S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const bucketAccess: any = process.env.ACCESS_KEY;
const bucketSecretKey: any = process.env.SECRET_KEY;

const uuid: any = uuidv4();

const randTrackName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

//Setup AWS s3 connection
const s3client = new S3Client({
    region: 'us-east-2',
    credentials: {
        accessKeyId: bucketAccess,
        secretAccessKey: bucketSecretKey
    }
})

const storage = multer.memoryStorage();

export const upload = multer({
    storage: storage
})

export interface Error {
    message?: string;
    status?: number;
}

export const uploadTrack = (req: Request, res: Response, next: NextFunction) => {

    try {

        const trackName = randTrackName();

        const command = new PutObjectCommand({
            Bucket: 'fys-rt-bucket',
            Key: trackName,
            Body: req.file?.buffer,
            ContentType: req.file?.mimetype
        });
    
        s3client.send(command);

        db.query('INSERT INTO Track (trackID, profile, profileUser, trackFile, title, trackLocation, genre, trackDate) VALUES (?,?,?,?,?,?,?,?)', [uuid, req.session.user?.profileID, req.session.user?.username, trackName, req.body.title, req.session.user?.profileLocation, req.body.genre, moment().format()]);

        console.log(req.file);
        res.redirect('http://localhost:3000');

    } catch(err) {
        console.log(err);
    }
}

export const getTracks = (req: Request, res: Response, next: NextFunction) => {

    console.log(req.params);

    db.query('SELECT * FROM Track', async (err, tracks: any) => {

        if (err) throw err;

        for (const track of tracks) {
            const getObjectParams = {
                Bucket: 'fys-rt-bucket',
                Key: track.trackFile
            }

            const command = new GetObjectCommand(getObjectParams);
            const url = await getSignedUrl(s3client, command);
            track.url = url;
        }

        res.send(tracks);
    })
}

export const deleteTrack = (req: Request, res: Response, next: NextFunction) => {
    db.query('SELECT * FROM Track WHERE trackID=?', [req.params.trackID], async (err, track: any) => {
        if (err) throw err;

        if (!track) {
            const error = new Error('track not found') as CustomError;
            error.status = 404;
            return next(error);
        }

        const params = {
            Bucket: 'fys-rt-bucket',
            Key: track.trackFile
        }

        const command = new DeleteObjectCommand(params);
        await s3client.send(command);

        db.query('DELETE FROM Track WHERE trackID=?', [req.params.trackID]);
        res.redirect('http://localhost:3000');
    })
}

//Get track and user profile info of particular track
export const getTrack = (req: Request, res: Response, next: NextFunction) => {

    console.log(req.query.username)

    db.query('SELECT Track.trackID, Track.trackFile, Track.title, Track.trackLocation, Track.genre, Track.trackDate, Profile.username, Profile.profileLocation, Profile.profileBody, Profile.joinDate FROM Track INNER JOIN Profile ON Track.profile=Profile.profileID AND Track.trackID=?', [req.query.trackid], async (err, info: any) => {
        if (err) throw err;

        if (!info) {
            const error = new Error('track not found') as CustomError;
            error.status = 404;
            return next(error);
        }

        const getObjectParams = {
            Bucket: 'fys-rt-bucket',
            Key: info[0].trackFile
        }

        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(s3client, command);
        info[0].url = url;

        res.send(info[0]);


    })
}