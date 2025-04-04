import {Request, Response, NextFunction} from 'express';
import { CustomError } from '../middleware/errorHandler';
import db from '../config/db';

export interface Error {
    message?: string;
    status?: number;
}

//Fetch profile
export const getProfile = (req: Request, res: Response, next: NextFunction) => {
    //Check if profile exists
    db.query('SELECT * FROM Profile WHERE profileID=? VALUES (?)', [req.params.id], (err, profile: any) => {
        if (err) throw err;

        if (!profile) {
            const error = new Error("Profile not found !") as CustomError;
            error.status = 404;
        } else {
            //send to client
            res.json({
                profileID: profile.profileID,
                username: profile.username,
                location: profile.profileLocation,
                body: profile.profileBody,
                joineDate: profile.joinDate
            })
        }
    })
}

//Update users profile info
export const updateProfile = (req: Request, res: Response, next: NextFunction) => {
    db.query('UPDATE Profile SET profileLocation=?, profileBody=? WHERE profileID=?', [req.body.location, req.body.body, req.session.user?.profileID], (err) => {
        if (err) throw err;
        res.redirect('http://localhost:3000')
    });
}