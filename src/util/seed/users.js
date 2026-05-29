/* Helper file for testing or local dev
/* Generates 10 fake users */

const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');

const gravatar = require('../gravatar');

const seedUsers = async () => {
  console.log('Seeding users...');
  let users = [];

  for (var i = 0; i < 10; i++) {
    let user = {
      username: faker.internet.username(),
      password: await bcrypt.hash('password', 10),
      email: faker.internet.email(),
    };
    user.avatar = gravatar(user.email);
    users.push(user);
  }
  return users;
};

module.exports = seedUsers;
