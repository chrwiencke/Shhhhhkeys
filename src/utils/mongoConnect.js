const { MongoClient } = require('mongodb');

const url = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'data';
const dbNameAuth = 'auth';
let dataDb = null;
let authDb = null;

async function connectToData() {
    if (dataDb) return dataDb;
    
    try {
        const client = await MongoClient.connect(url);
        dataDb = client.db(dbName);
        console.log('Connected to MongoDB Data');
        return dataDb;
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
        throw err;
    }
}

async function connectToAuth() {
    if (authDb) return authDb;
    
    try {
        const client = await MongoClient.connect(url);
        authDb = client.db(dbNameAuth);
        console.log('Connected to MongoDB Auth');
        return authDb;
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
        throw err;
    }
}

module.exports = { connectToData, connectToAuth };