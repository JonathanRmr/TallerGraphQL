import { User } from '../models/User.mjs';
import { Product } from '../models/Product.mjs';
import { Order } from '../models/Order.mjs';

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const SECRET_KEY = 'mi_clave_secreta_super_segura';

export const resolvers = {
    Query: {
        users: async () => User.find(),

        products: async () => Product.find(),

        orders: async (_, __, context) => {
            if (context.role !== 'admin') throw new Error('Only admin can see all orders');
            return Order.find()
                .populate('user')
                .populate('items.product');
        },

        ordersByUser: async (_, { userId }, context) => {
            if (context.role !== 'client' || context.userId !== userId) {
                throw new Error('Access denied');
            }
            return Order.find({ user: userId })
                .populate('user')
                .populate('items.product');
        }
    },

    Mutation: {
        // === AUTH ===
        registerUser: async (_, { name, email, password, role = 'client' }) => {
            const existing = await User.findOne({ email });
            if (existing) throw new Error('Email already registered');

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await User.create({ name, email, password: hashedPassword, role });

            const token = jwt.sign({ id: user._id, role: user.role }, SECRET_KEY, { expiresIn: '1d' });

            return {
                token,
                user: { id: user._id, name: user.name, email: user.email, role: user.role }
            };
        },

        loginUser: async (_, { email, password }) => {
            const user = await User.findOne({ email });
            if (!user) throw new Error('User not found');

            const valid = await bcrypt.compare(password, user.password);
            if (!valid) throw new Error('Invalid password');

            const token = jwt.sign({ id: user._id, role: user.role }, SECRET_KEY, { expiresIn: '1d' });

            return {
                token,
                user: { id: user._id, name: user.name, email: user.email, role: user.role }
            };
        },

        // === ADMIN ONLY ===
        createProduct: async (_, { name, price, stock }, context) => {
    console.log('🔧 CreateProduct called with:', { name, price, stock });
    console.log('🔐 Context:', context);

    if (context.role !== 'admin') throw new Error('Only admin can create products');
    return Product.create({ name, price, stock });
},


        updateProduct: async (_, { id, name, price, stock }, context) => {
            if (context.role !== 'admin') throw new Error('Only admin can update products');
            return Product.findByIdAndUpdate(id, { name, price, stock }, { new: true });
        },

        deleteProduct: async (_, { id }, context) => {
            if (context.role !== 'admin') throw new Error('Only admin can delete products');
            await Product.findByIdAndDelete(id);
            return true;
        },

        // === CLIENT ONLY ===
        createOrder: async (_, { items }, context) => {
            if (context.role !== 'client') throw new Error('Only clients can create orders');

            const user = await User.findById(context.userId);
            if (!user) throw new Error('User not found');

            const orderItems = [];

            for (const { productId, quantity } of items) {
                const product = await Product.findById(productId);
                if (!product || product.stock < quantity) {
                    throw new Error(`Invalid or insufficient stock for product: ${product?.name || productId}`);
                }

                product.stock -= quantity;
                await product.save();

                orderItems.push({ product: product._id, quantity });
            }

            const order = await Order.create({
                user: user._id,
                items: orderItems
            });

            return Order.findById(order._id)
                .populate('user')
                .populate('items.product');
        }
    }
};
