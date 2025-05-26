import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, enum: ['admin', 'client'], default: 'client' }
});

userSchema.methods.comparePassword = function (password) {
    return bcrypt.compare(password, this.password);
};

export const User = mongoose.model('User', userSchema);
