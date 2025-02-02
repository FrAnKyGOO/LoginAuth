const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const session = require("express-session");

const app = express();
app.use(express.json());

app.use(
    cors({
        credentials: true,
        origin: ['http://localhost:8880']
    }),
);

app.use(cookieParser());

app.use(
    session({
        secret: "secret",
        resave: false,
        saveUninitialized: true,
    }),
);

const port = 8000;
const secret = "mysecret";

let conn = null;

const initMySQL = async () => {
    conn = await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "Frank22@mydb",
        database: "authen_db",
    });
};

app.post(`/api/register`, async (req, res) => {
    try {
        const { email, password } = req.body;
        const passwordHash = await bcrypt.hash(password, 10);
        const userData = {
            email,
            password: passwordHash,
        };
        const [results] = await conn.query("INSERT INTO users SET ?", userData);
        res.json({
            message: "Insert Success",
            results,
        });
    } catch (error) {
        console.error("error : ", error);
        res.json({
            message: "Insert Error",
            error,
        });
    }
});

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const [results] = await conn.query(
            "SELECT * FROM users WHERE email = ? ",
            email
        );
        const userData = results[0];
        const match = await bcrypt.compare(password, userData.password);

        if (!match) {
            res.status(400).json({
                massage: "Login fail (wrong email, pass)",
                data: null
            });
            return false;
        }

        // solution 1 && 2
        // const token = jwt.sign({ email, role: 'test' }, secret, { expiresIn: '1h' })

        // res.cookie('token', token, {
        //     maxAge: 300000,
        //     secure: true,
        //     httpOnly: true,
        //     sameSite: "none",
        // })

        //solution 3
        req.session.userId = userData.user_id;
        req.session.user = userData;

        res.status(200).json({
            massage: "Login success",
            data: req.session.userId
            
        });
    } catch (error) {
        console.error("error : ", error);
        res.status(401).json({
            message: "login fail",
            error,
        });
    }
});

app.get("/api/users", async (req, res) => {
    try {
        //solution 1
        // const authenHeader = req.headers["authorization"];
        // let authenToken = "";

        // if (authenHeader) {
        //     authenToken = authenHeader.split(" ")[1];
        // }

        //solution 2
        // const authenToken = req.cookies.token
        // console.log("authentoken = ", authenToken);
        // const user = jwt.verify(authenToken, secret);

        
        if (!req.session.userId) {
            throw { message: 'Auth fail' }
        }
        
        console.log(req.session);


        //solution 1 && 2
        // const [checkResults] = await conn.query("SELECT * from users where email = ?", user.email);

        // if (!checkResults[0]) {
        //     throw { message: "user not found" };
        // }

        const [results] = await conn.query("SELECT * from users");
        res.json({
            users: results,
        });
    } catch (error) {
        console.error("error : ", error.message);
        res.status(403).json({
            message: "authentication fail",
            error: error.message,
        });
    }
});

app.listen(port, async () => {
    await initMySQL();
    console.log("Server started at port 8000");
});