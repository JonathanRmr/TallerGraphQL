import mongoose from 'mongoose';

const MONGO_URI = 'mongodb+srv://pepe:CvuPs1L4s2dFj8D9@cluster0.skff2mq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'online_store';

export const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
    }
};
