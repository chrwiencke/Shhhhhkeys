const landingPage = (req, res) => {
    res.render('landingPage', { user: req.user });
};

module.exports = {
    landingPage,
};