const Level = require('../models/level');

const secretPage = (req, res) => {
    res.render('secretPage', { user: req.user });
};

const mainDashboard = (req, res) => {
    res.render('dashboard/mainPage', { user: req.user });
};

const addLevel = (req, res) => {
    res.render('dashboard/addLevel', { user: req.user });
};

const createLevel = async (req, res) => {
    if (!req.user.teacher) {
        return res.redirect('/dashboard');
    }

    try {
        const { username, levelNumber, milestones } = req.body;
        
        // Check if user already has levels
        let userLevel = await Level.findOne({ username });

        if (userLevel) {
            // Update or add new level
            const levelIndex = userLevel.levels.findIndex(l => l.levelNumber === parseInt(levelNumber));
            
            if (levelIndex !== -1) {
                userLevel.levels[levelIndex].milestones = milestones;
            } else {
                userLevel.levels.push({
                    levelNumber: parseInt(levelNumber),
                    milestones
                });
            }
            await userLevel.save();
        } else {
            // Create new level document
            await Level.create({
                username,
                levels: [{
                    levelNumber: parseInt(levelNumber),
                    milestones
                }]
            });
        }

        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.render('dashboard/addLevel', { 
            user: req.user, 
            error: 'Error creating level' 
        });
    }
};

module.exports = {
    secretPage,
    mainDashboard,
    addLevel,
    createLevel
};