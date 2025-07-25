const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  path: { type: String, required: true },
  response: { type: Object, required: true },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  name: { type: String, trim: true },
  description: { type: String, trim: true },
  
  // Simple folder-level sharing
  sharedWith: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    sharedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Compound index to ensure unique path per user
routeSchema.index({ path: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Route', routeSchema);