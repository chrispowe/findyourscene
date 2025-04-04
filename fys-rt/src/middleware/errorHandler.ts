import { NextFunction, Response, Request, ErrorRequestHandler } from "express";

// export class CustomError extends Error {
//     statusCode: number;
//     constructor(message?: string, statusCode: number) {
//         super(message);
//         this.statusCode = statusCode;

//         Object.setPrototypeOf(this, new.target.prototype);
//     }
// }

export interface CustomError extends Error {
    status?: number;
}


export const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction) => {

    if (err.status) {
        res.status(err.status).json({
            msg: err.message
        })
    } else {
        res.status(500).json({
            msg: err.message
        })
    }
}
