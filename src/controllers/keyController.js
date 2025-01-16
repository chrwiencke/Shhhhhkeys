const ShhKey = require('../models/shhkey.js');

const getSshKey = async (req, res) => {
    try {
        const title = req.params.title;
        const user = req.params.user;

        if (!title) {
            return res.status(400).json({ message: 'No title found' });
        }
        if (!user) {
            return res.status(400).json({ message: 'No user found' });
        }

        const data = await ShhKey.findOne({ username: user, title });
        
        if (!data) {
            return res.status(404).json({ message: 'SSH Key not found' });
        }

        if (!data.shareable) {
            return res.status(403).json({ message: 'SSH Key is disabled' });
        }

        const sshKey = data.key;
        res.send(sshKey);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error retrieving SSH Key' });
    }
};

const getSshKeys = async (req, res) => {
    try {
        const user = req.params.user;

        if (!user) {
            return res.status(400).json({ message: 'No user found' });
        }
        
        const data = await ShhKey.find({ username: user });

        if (data.length === 0) {
            return res.status(404).json({ message: 'SSH Keys not found' });
        }

        let allKeys = "";
        
        data.forEach(document => {
            if (document.shareable) {
                allKeys += document.key + "\n";
            }
        });            
        console.log(allKeys)
        if (!allKeys) {
            return res.status(404).json({ message: 'No shareable SSH keys found' });
        }
        
        allKeys = allKeys.trim();

        res.send(allKeys);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error retrieving SSH Keys' });
    }
};

module.exports = {
    getSshKey,
    getSshKeys,
};