import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = 'online_store';

export const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
    }
};
