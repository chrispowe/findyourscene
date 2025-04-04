import mysql2 from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

export default mysql2.createConnection({
    host: process.env.HOST,
    user: process.env.USERNAME,
    password: process.env.PASSWORD,
    database: process.env.DB
})