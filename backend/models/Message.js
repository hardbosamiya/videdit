const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['user', 'admin', 'superadmin'], required: true },
  type: { type: String, enum: ['text', 'image', 'system'], default: 'text' },
  content: { type: String, required: true },
  imageUrl: { type: String },
  imagePublicId: { type: String },
  filtered: { type: Boolean, default: false },
  expiresAt: { type: Date },
}, { timestamps: true });

// TTL index - messages expire 7 days after job is settled (set expiresAt when job settles)
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
messageSchema.index({ job: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
