const DataLoader = require('dataloader');

const batchUsers = async (ids, User) => {
  const users = await User.find({ _id: { $in: ids } });
  const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));
  return ids.map((id) => userMap[id.toString()] || null);
};

module.exports = (models) => ({
  user: new DataLoader((ids) => batchUsers(ids, models.User)),
});
