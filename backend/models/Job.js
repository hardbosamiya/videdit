const mongoose = require('mongoose');

const clipSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String },
  originalName: { type: String },
  order: { type: Number, default: 0 },
  duration: { type: Number },
});

const editRequestSchema = new mongoose.Schema({
  text: { type: String, required: true },
  images: [{ url: String, publicId: String }],
  status: { type: String, enum: ['pending', 'done'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

const jobSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },

  // Uploads
  sampleVideo: { url: String, publicId: String, originalName: String },
  clips: [clipSchema],

  // Status
  status: {
    type: String,
    enum: ['pending', 'price_discussion', 'ongoing', 'review', 'revision', 'completed'],
    default: 'pending',
  },

  // Pricing
  agreedPrice: { type: Number, default: null },
  currency: { type: String, default: 'USD' },
  userAcceptedPrice: { type: Boolean, default: false },

  // Delivery
  deliveredVideo: { url: String, publicId: String, originalName: String },
  deliveredAt: Date,

  // Edit requests
  editRequests: [editRequestSchema],

  // Settled
  settledAt: Date,
  settledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Lock
  lockedAt: Date,

  // Notes
  superAdminNotes: { type: String },
  adminNotes: { type: String },
}, { timestamps: true });

// Index for efficient queries
jobSchema.index({ user: 1, status: 1 });
jobSchema.index({ admin: 1, status: 1 });
jobSchema.index({ status: 1 });

module.exports = mongoose.model('Job', jobSchema);
