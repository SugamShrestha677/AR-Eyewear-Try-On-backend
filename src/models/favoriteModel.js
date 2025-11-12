const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true, index: true },
  frameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Frame', required: true, index: true },
  createdAt: { type: Date, default: Date.now }
});

// unique compound index to prevent duplicate favorites
favoriteSchema.index({ userId: 1, frameId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);