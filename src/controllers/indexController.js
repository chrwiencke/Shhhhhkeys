const landingPage = (req, res) => {
    res.render('landingPage');
};

const aboutPage = (req, res) => {
    res.render('aboutPage');
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
    loginPage,
    registerPage
};