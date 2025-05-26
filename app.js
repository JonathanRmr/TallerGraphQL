import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { typeDefs } from './utils/schema.mjs';
import { resolvers } from './resolvers/index.mjs';
import { connectDB } from './utils/db.mjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

// Variables de entorno
const PORT = process.env.PORT || 4000;
const SECRET_KEY = process.env.SECRET_KEY;

// __dirname para ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const startServer = async () => {
    await connectDB();

    const app = express();

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context: ({ req }) => {
            const authHeader = req.headers.authorization || '';
            const token = authHeader.replace('Bearer ', '');
            try {
                const decoded = jwt.verify(token, SECRET_KEY);
                return { userId: decoded.id, role: decoded.role };
            } catch {
                return {};
            }
        }
    });

    await server.start();
    server.applyMiddleware({ app });

    // Servir frontend (public/)
    app.use(express.static(path.join(__dirname, 'public')));
    app.get('*', (_, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    app.listen(PORT, () => {
        console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
    });
};

startServer();
