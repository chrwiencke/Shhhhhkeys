require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const { router: helloRoutes } = require('./routes/indexRoutes.js');
const { router: dashboardRoutes } = require('./routes/dashboardRoutes.js');
const { router: authRoutes } = require('./routes/authRoutes.js');
const { router: key } = require('./routes/key.js');

const app = express();

app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Use each router separately
app.use('/', helloRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/auth', authRoutes);
app.use('/key', key);

app.listen(process.env.PORT, () => {
    mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/');
    console.log("Listening on PORT: " + process.env.PORT)
})

module.exports = app;