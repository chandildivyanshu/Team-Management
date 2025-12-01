const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

async function dropIndexes() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('dailyplans');

        // List indexes before
        const indexesBefore = await collection.indexes();
        console.log('Indexes before:', indexesBefore);

        // Drop all indexes (except _id) to be safe and let Mongoose recreate them correctly
        await collection.dropIndexes();
        console.log('Dropped all indexes');

        // List indexes after (should be only _id)
        const indexesAfter = await collection.indexes();
        console.log('Indexes after:', indexesAfter);

        console.log('Please restart your application to let Mongoose recreate the correct non-unique indexes.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

dropIndexes();
