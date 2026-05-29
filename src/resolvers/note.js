module.exports = {
  author: async (note, args, { loaders }) => {
    return await loaders.user.load(note.author.toString());
  },
  favoritedBy: async (note, args, { models }) => {
    return await models.User.find({ _id: { $in: note.favoritedBy } });
  },
};
