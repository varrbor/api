const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GraphQLError } = require('graphql');
const mongoose = require('mongoose');
require('dotenv').config();

const gravatar = require('../util/gravatar');

module.exports = {
  newNote: async (parent, args, { models, user }) => {
    if (!user) {
      throw new GraphQLError('You must be signed in to create a note', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    return await models.Note.create({
      content: args.content,
      author: new mongoose.Types.ObjectId(user.id),
      favoriteCount: 0,
    });
  },
  deleteNote: async (parent, { id }, { models, user }) => {
    if (!user) {
      throw new GraphQLError('You must be signed in to delete a note', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const note = await models.Note.findById(id);
    if (note && String(note.author) !== user.id) {
      throw new GraphQLError("You don't have permissions to delete the note", {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    try {
      await note.deleteOne();
      return true;
    } catch (err) {
      return false;
    }
  },
  updateNote: async (parent, { content, id }, { models, user }) => {
    if (!user) {
      throw new GraphQLError('You must be signed in to update a note', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const note = await models.Note.findById(id);
    if (note && String(note.author) !== user.id) {
      throw new GraphQLError("You don't have permissions to update the note", {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    return await models.Note.findOneAndUpdate(
      { _id: id },
      { $set: { content } },
      { new: true },
    );
  },
  toggleFavorite: async (parent, { id }, { models, user }) => {
    if (!user) {
      throw new GraphQLError('You must be signed in to favorite a note', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const noteCheck = await models.Note.findById(id);
    const hasUser = noteCheck.favoritedBy.indexOf(user.id);

    if (hasUser >= 0) {
      return await models.Note.findByIdAndUpdate(
        id,
        {
          $pull: { favoritedBy: new mongoose.Types.ObjectId(user.id) },
          $inc: { favoriteCount: -1 },
        },
        { new: true },
      );
    } else {
      return await models.Note.findByIdAndUpdate(
        id,
        {
          $push: { favoritedBy: new mongoose.Types.ObjectId(user.id) },
          $inc: { favoriteCount: 1 },
        },
        { new: true },
      );
    }
  },
  signUp: async (parent, { username, email, password }, { models }) => {
    email = email.trim().toLowerCase();
    const hashed = await bcrypt.hash(password, 10);
    const avatar = gravatar(email);
    try {
      const user = await models.User.create({
        username,
        email,
        avatar,
        password: hashed,
      });
      return jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    } catch (err) {
      throw new Error('Error creating account');
    }
  },
  signIn: async (parent, { username, email, password }, { models }) => {
    if (email) {
      email = email.trim().toLowerCase();
    }

    const user = await models.User.findOne({
      $or: [{ email }, { username }],
    });

    if (!user) {
      throw new GraphQLError('Error signing in', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new GraphQLError('Error signing in', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    return jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  },
};
