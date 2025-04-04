import { NextFunction, Request, RequestHandler, Response } from 'express';
import { CustomError } from '../middleware/errorHandler';
import db from '../config/db';
//import user from '../model/user';
import { v4 as uuidv4, v4 } from 'uuid';
import bcrypt from 'bcrypt';

import moment from 'moment';

const saltRounds = 10;

const uuid: any = uuidv4();

export interface Error {
    message?: string;
    status?: number;
}

declare module 'express-session' {
    export interface SessionData {
      user: { [key: string]: any };
    }
  }

export const validEmail = (email: string) => {
    //Standard email regex
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    //Check if email matches regex
    if (emailRegex.test(email) == true) {
        return true;
    } else {
        return false;
    }
}

export const validUsername = (username: string) => {
    //Standard username regex
    const usernameRegex = /^[0-9A-Za-z]{6,16}$/;

    //Check if usernae matches regex
    if (usernameRegex.test(username) == true) {
        return true;
    } else {
        return false;
    }
}

export const validPassword = (password: string) => {
    //Check if password is valid
        //Password must be 8 chars min, 16 char max, must have 1 uppercase, 1 lowercase, 1 number, and 1 special char
        //const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/

        //Check if password mathes regex
        if (passwordRegex.test(password) == true) {
            return true;
        } else {
            return false;
        }
}

//Create User on signup
export const createUser  = (req: Request, res: Response, next: NextFunction) => {

    let userInfo = {}

    //Check if email is valid
    if (validEmail(req.body.email) == true) {
        //Check if email already exists
        db.query("SELECT * FROM User WHERE email=?", [req.body.email], (err, result: any) => {
            if (err) throw err;

            if (result[0]) {
                console.log(result);
                //ERROR: User already exists (email)
                //Redirect to signup page with error notice
                const error = new Error('Email already exists !') as CustomError;
                error.status = 409;
                return next(error);
            } else {
                //Check if username exists
                db.query("SELECT * FROM User WHERE username=?", [req.body.username], (err, result: any) => {
                    if (err) throw err;

                    if (result[0]) {
                        //ERROR: User already exists (username)
                        //Redirect to signup page with error notice
                        const error = new Error("Username already exists !") as CustomError;
                        error.status = 409;
                        return next(error);
                    } else {
                        //Check if password is valid
                        if (validPassword(req.body.password) == true) {
                            //Create user

                            //HASH PASSWORD
                            bcrypt.genSalt(saltRounds, function(err, salt) {
                                bcrypt.hash(req.body.password, salt, function(err, hash) {

                                    if (err) throw err;
                                    // Store hash in your password DB.
                                    db.query("INSERT INTO User (userID, email, username, userPassword) VALUES (?,?,?,?)", [uuid, req.body.email, req.body.username, hash]);

                                    db.query("SELECT * FROM User WHERE username=?", [req.body.username], (err, user: any) => {
                                        if (err) throw err;

                                        db.query('INSERT INTO Profile (profileID, username, profileLocation, profileBody, joinDate, userID) VALUES (?,?,?,?,?,?)', [user[0].userID, user[0].username, req.body.location, '', moment().format(), user[0].userID]);
                                        req.session.user = {
                                            userID: user[0].userID,
                                            username: user[0].username,
                                        };
                                        req.session.save();
                                        console.log(req.session.user);

                                    })

                                    //Create profile that goes with user
                                    //const userObj: any = grabUser(req.body.username);
                                    //db.query('INSERT INTO Profile (profileID, username, profileLocation, profileBody, joinDate) VALUES (?,?,?,?,?)', [userInfo.userID, userInfo.username, req.body.location, '', moment().format(), userInfo.userID]);

                                    res.json({
                                        msg: `successfully created account, logging in: ${req.session.user}`
                                    })
                                });
                            });

                        } else {
                            //ERROR: Invalid password
                            //Redirect to signup page with error notice
                            const error = new Error("Invalid password") as CustomError;
                            error.status = 400;
                            return next(error);
                        }
                    }
                })
            }
        })
    } else {
        //ERROR: Invalid email
        //Redirect to signup page with error notice
        const error = new Error("Invalid email !") as CustomError;
        error.status = 400;
        return next(error);
    }
}

//Login user
export const loginUser = (req: Request, res: Response, next: NextFunction) => {

    console.log(req.body.username);
    //Check for valid username
    if (validUsername(req.body.username) == true) {
        db.query('SELECT * FROM User INNER JOIN Profile ON User.username=Profile.username AND User.username=?', [req.body.username], (err, user: any) => {
            if (err) throw err;

            const userInfo = {
                userID: user[0].userID,
                username: user[0].username,
                profileID: user[0].profileID,
                profileLocation: user[0].profileLocation
            }

            if (user[0]) {
                //Check to see if password matches the username
                console.log(req.body.password);
                bcrypt.compare(req.body.password, user[0].userPassword, (err, result) =>  {
                    if (err) throw err;

                    if (result == true) {
                        //Success, log in user
                        req.session.user = userInfo;
                        req.session.save();
                        console.log(req.session.user);
                        res.redirect('http://localhost:3000')
                    } else {
                        const error = new Error("Username or password incorrect !") as CustomError;
                        error.status = 401;
                        return next(error);
                    }
                });
            }
        })
    } else {
        const error = new Error("Invalid username !") as CustomError;
        error.status = 400;
        return next(error);
    }

}

//Grab current logged in user
export const grabUser: any = (username: any) => {
    //Check if user exists
    db.query('SELECT * FROM User WHERE username=?', [username], (err, user: any) => {
        if (err) throw err;

        console.log(user)

        const userInfo = {
            userID: user[0].userID,
            username: user[0].username
        }

        return {userID: user[0].userID, username: user[0].username};
    })
}

//Grab current logged in user
export const grabLogged = (req: Request, res: Response, next: NextFunction) => {

    try {
        console.log(req.session.user);
        if (req.session.user == undefined) {
            res.json({
                msg: 'no user logged in'
            })
        } else {
            //Make sure user exists
            db.query('SELECT User.userID, User.username, Profile.profileLocation, Profile.profileID FROM User INNER JOIN Profile ON User.userID=Profile.userID AND User.userID=?', req.session.user.userID, (err, result) => {
                if (err) throw err;

                res.json(result);
            })
        }
    } catch(err) {
        console.log(err);
    }
}

//Log user out
export const logout = (req: Request, res: Response, next: NextFunction) => {
    req.session.destroy((err) => {
        if (err) throw err;
    });

    res.redirect('http://localost:3000');
}