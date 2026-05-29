/* Helper file for testing or local dev
/* Generates 25 fake notes */

const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');
const fetch = require('node-fetch');

const seedNotes = async (users) => {
  console.log('Seeding notes...');
  let notes = [];

  for (var i = 0; i < 25; i++) {
    let random = Math.floor(Math.random() * users.length);
    let content;

    const response = await fetch(
      'https://jaspervdj.be/lorem-markdownum/markdown.txt',
    );

    if (response.ok) {
      content = await response.text();
    } else {
      content = faker.lorem.paragraph();
    }

    notes.push({
      content,
      favoriteCount: 0,
      favoritedBy: [],
      author: new mongoose.Types.ObjectId(users[random]._id),
    });
  }
  return notes;
};

module.exports = seedNotes;
