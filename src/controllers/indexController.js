const landingPage = (req, res) => {
    res.render('landingPage');
};

const aboutPage = (req, res) => {
    res.render('aboutPage');
};

const secretPage = (req, res) => {
    res.render('secretPage', { user: req.user });
};

const mainDashboard = (req, res) => {
    res.render('dashboard/mainPage', { user: req.user });
};

const loginPage = (req, res) => {
    res.render('loginPage');
};

const registerPage = (req, res) => {
    res.render('registerPage');
};

module.exports = {
    landingPage,
    aboutPage,
    secretPage,
    loginPage,
    registerPage,
    mainDashboard
};