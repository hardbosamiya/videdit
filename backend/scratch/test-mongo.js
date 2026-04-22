const mongoose = require('mongoose');
require('dotenv').config();

const uris = [
    process.env.MONGODB_URI,
    'mongodb+srv://Hard:hard@root.mnn4nqh.mongodb.net/videdit',
    'mongodb+srv://Haard:hard@root.mnn4nqh.mongodb.net/videdit',
    'mongodb+srv://Hard:hard@root.mnn4nqh.mongodb.net/videdit',
    'mongodb+srv://Haard:hard@root.mnn4nqh.mongodb.net/videdit',
];

async function test() {
    for (const uri of uris) {
        console.log(`Testing: ${uri.replace(/:([^@]+)@/, ':****@')}`);
        try {
            await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
            console.log('✅ Success!');
            await mongoose.disconnect();
            return;
        } catch (err) {
            console.log(`❌ Failed: ${err.message}`);
        }
    }
}

test();
