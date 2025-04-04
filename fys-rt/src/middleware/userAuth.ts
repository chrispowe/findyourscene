import {Request, Response, NextFunction} from 'express';

//Check if user is authenticated
export const userAuthCheck = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.user?.userID) next();
    else {
        res.status(401).redirect('http://localhost:3000/login');
    }
}