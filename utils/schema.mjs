import { gql } from 'apollo-server';

export const typeDefs = gql`
    # Types
    type User {
        id: ID!
        name: String!
        email: String!
        role: String!
    }

    type Product {
        id: ID!
        name: String!
        price: Float!
        stock: Int!
    }

    type OrderItem {
        product: Product!
        quantity: Int!
    }

    type Order {
        id: ID!
        user: User!
        items: [OrderItem!]!
        date: String!
    }

    type AuthPayload {
        token: String!
        user: User!
    }

    # Inputs
    input OrderItemInput {
        productId: ID!
        quantity: Int!
    }

    # Queries
    type Query {
        users: [User!]!
        products: [Product!]!
        orders: [Order!]!
        ordersByUser(userId: ID!): [Order!]!
    }

    # Mutations
    type Mutation {
        # Authentication
        registerUser(
            name: String!
            email: String!
            password: String!
            role: String
        ): AuthPayload!

        loginUser(
            email: String!
            password: String!
        ): AuthPayload!

        # Product management (admin only)
        createProduct(
            name: String!
            price: Float!
            stock: Int!
        ): Product!

        updateProduct(
            id: ID!
            name: String
            price: Float
            stock: Int
        ): Product!

        deleteProduct(
            id: ID!
        ): Boolean!

        # Order management (clients only)
        createOrder(
            items: [OrderItemInput!]!
        ): Order!
    }
`;
