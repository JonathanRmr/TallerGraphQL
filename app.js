import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

// Importa tu esquema, resolvers y DB
import { typeDefs } from './utils/schema.mjs';
import { resolvers } from './resolvers/index.mjs';
import { connectDB } from './utils/db.mjs';

const SECRET_KEY = 'mi_clave_secreta_super_segura';
const PORT = process.env.PORT || 4000;

// Setup __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const startServer = async () => {
    await connectDB();

    const app = express();

    // Apollo Server setup
    const server = new ApolloServer({
        typeDefs,
        resolvers,
    });

    await server.start();

    app.use(
        '/graphql',
        cors(),
        bodyParser.json(),
        expressMiddleware(server, {
            context: async ({ req }) => {
                const authHeader = req.headers.authorization || '';
                const token = authHeader.replace('Bearer ', '');

                try {
                    const decoded = jwt.verify(token, SECRET_KEY);
                    return {
                        userId: decoded.id,
                        role: decoded.role,
                    };
                } catch {
                    return {};
                }
            },
        })
    );

    // Servir archivos estáticos desde /public
    app.use(express.static(path.join(__dirname, 'public')));

    // Redirigir "/" al index.html
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // Iniciar servidor
    app.listen(PORT, () => {
        console.log(`🚀 GraphQL server running at http://localhost:${PORT}/graphql`);
        console.log(`🌐 Frontend served at http://localhost:${PORT}`);
    });
};

startServer();
