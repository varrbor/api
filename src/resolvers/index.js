const Query = require('./query');
const Mutation = require('./mutation');
const Note = require('./note');
const User = require('./user');
const { DateTimeResolver } = require('graphql-scalars');

module.exports = {
  Query,
  Mutation,
  Note,
  User,
  DateTime: DateTimeResolver,
};
