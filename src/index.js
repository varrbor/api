const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express5');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const depthLimit = require('graphql-depth-limit');
const { createComplexityLimitRule } = require('graphql-validation-complexity');
require('dotenv').config();

const db = require('./db');
const models = require('./models');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const createLoaders = require('./loaders/user');

const port = process.env.PORT || 4000;
const DB_HOST = process.env.DB_HOST;

const getUser = (token) => {
  if (token) {
    const raw = token.startsWith('Bearer ') ? token.slice(7) : token;
    try {
      return jwt.verify(raw, process.env.JWT_SECRET);
    } catch (err) {
      throw new Error('Session invalid');
    }
  }
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

async function startServer() {
  const app = express();

  db.connect(DB_HOST);

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use('/api', limiter);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    validationRules: [depthLimit(5), createComplexityLimitRule(1000)],
  });

  await server.start();

  app.use(
    '/api',
    expressMiddleware(server, {
      context: async ({ req }) => {
        const token = req.headers.authorization;
        const user = getUser(token);
        return { models, user, loaders: createLoaders(models) };
      },
    }),
  );

  app.listen(port, () =>
    console.log(`GraphQL Server running at http://localhost:${port}/api`),
  );
}

startServer();
