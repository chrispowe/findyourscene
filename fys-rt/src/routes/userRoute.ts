import express, {Request, Response} from 'express';
import { createUser, loginUser, grabLogged, logout } from '../controllers/userController';

import { userAuthCheck } from '../middleware/userAuth';
import db from '../config/db';
import { errorHandler } from '../middleware/errorHandler';

const router = express.Router();

//USER SIGN UP
router.post('/signup', createUser);

//USER LOGIN
router.post('/login', loginUser);

//FETCH LOGGED IN USER
router.get('/logged', grabLogged);

//LOGOUT LOGGED USER
router.get('/logout', userAuthCheck, logout);

//FETCH USERS
router.get('/grab', (req: Request, res: Response) => {
    db.query("SELECT * FROM User", (err, result) => {
        if (err) throw err;

        res.json(result);
    })
})

export const userRoute = router;