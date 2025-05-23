require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const { configureSession, configureLusca } = require('./middleware/securityMiddleware');
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

// Configure security middleware
configureSession(app);
configureLusca(app);

// Routes
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
