const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  path: { type: String, required: true, unique: true },
  response: { type: Object, required: true }
});

module.exports = mongoose.model('Route', routeSchema);