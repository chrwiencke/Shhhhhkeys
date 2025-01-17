require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const lusca = require('lusca');
const { router: indexRoutes } = require('./routes/indexRoutes.js');
const { router: dashboardRoutes } = require('./routes/dashboardRoutes.js');
const { router: authRoutes } = require('./routes/authRoutes.js');
const { router: key } = require('./routes/key.js');

const app = express();

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set('trust proxy', 1);

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 1000 * 60 * 60 * 24
    }
}));

app.use(lusca({
    csrf: {
        angular: false,
        cookie: {
            name: 'XSRF-TOKEN',
            options: {
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                path: '/'
            }
        },
        header: 'X-XSRF-TOKEN',
        key: '_csrf',
        secret: process.env.SESSION_SECRET
    },
    xframe: 'SAMEORIGIN',
    xssProtection: true
}));

app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use('/', indexRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/auth', authRoutes);
app.use('/', key);

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB Connected");
        app.listen(process.env.PORT, () => {
            console.log("Listening on PORT: " + process.env.PORT);
        });
    })
    .catch((err) => {
        console.log("MongoDB did not connect:", err.message);
    });

module.exports = app;
