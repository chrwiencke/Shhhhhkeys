const session = require('express-session');
const lusca = require('lusca');

const configureSession = (app) => {
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
};

const configureLusca = (app) => {
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
};

module.exports = {
    configureSession,
    configureLusca
};
