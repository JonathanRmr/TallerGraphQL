import { ApolloServer } from 'apollo-server';
import { typeDefs } from './utils/schema.mjs';
import { resolvers } from './resolvers/index.mjs';
import { connectDB } from './utils/db.mjs';
import jwt from 'jsonwebtoken';

const SECRET_KEY = 'mi_clave_secreta_super_segura';

const startServer = async () => {
    await connectDB();

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context: ({ req }) => {
            const authHeader = req.headers.authorization || '';
            const token = authHeader.replace('Bearer ', '');

            try {
                const decoded = jwt.verify(token, SECRET_KEY);
                return {
                    userId: decoded.id,
                    role: decoded.role
                };
            } catch {
                return {};
            }
        },
        cors: {
            origin: '*',
        },
    });

    server.listen().then(({ url }) => {
        console.log(`🚀 Server ready at ${url}`);
    });
};

startServer();
