const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = new Schema({
  firstname: { type: String, min: 1, required: true },
  lastname: { type: String, min: 1, required: true },
  username: { type: String, min: 3, required: true },
  password: { type: String, required: true },
  premium: { type: Boolean, required: true },
  is_admin: { type: Boolean, required: true },
  avatarURL: { type: String }
});

User.virtual('fullname').get(function () {
  return `${this.firstname} ${this.lastname}`;
});

User.virtual('url').get(function () {
  return '/users/' + this.username;
});

module.exports = mongoose.model('User', User);
