const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Job = require('../models/Job');
const { protect } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');
const { filterMessage } = require('../lib/filter');

// GET /api/chat/:jobId - Get messages for a job
router.get('/:jobId', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Access check
    const isOwner = job.user.toString() === req.user._id.toString();
    const isAssigned = job.admin && job.admin.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.role === 'superadmin';
    if (!isOwner && !isAssigned && !isSuperAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.find({ job: req.params.jobId })
      .populate('sender', 'name role badge profilePic')
      .sort({ createdAt: 1 })
      .limit(200);

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/chat/:jobId - Send a text message
router.post('/:jobId', protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Message cannot be empty' });

    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const isOwner = job.user.toString() === req.user._id.toString();
    const isAssigned = job.admin && job.admin.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.role === 'superadmin';
    if (!isOwner && !isAssigned && !isSuperAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { filtered, clean } = filterMessage(content);

    const msg = await Message.create({
      job: job._id,
      sender: req.user._id,
      senderRole: req.user.role,
      type: 'text',
      content: clean,
      filtered,
    });
    await msg.populate('sender', 'name role badge profilePic');

    // Emit via socket
    const io = req.app.get('io');
    io.to(`job_${job._id}`).emit('new_message', msg);

    res.status(201).json({ message: msg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/chat/:jobId/image - Send image message
router.post('/:jobId/image', protect,
  (req, res, next) => uploadImage.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || 'Image upload failed' });
    next();
  }),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'No image received' });

      const job = await Job.findById(req.params.jobId);
      if (!job) return res.status(404).json({ message: 'Job not found' });

      const isOwner = job.user.toString() === req.user._id.toString();
      const isAssigned = job.admin && job.admin.toString() === req.user._id.toString();
      const isSuperAdmin = req.user.role === 'superadmin';
      if (!isOwner && !isAssigned && !isSuperAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const msg = await Message.create({
        job: job._id,
        sender: req.user._id,
        senderRole: req.user.role,
        type: 'image',
        content: req.body.caption || 'Image',
        imageUrl: req.file.path,
        imagePublicId: req.file.filename,
      });
      await msg.populate('sender', 'name role badge profilePic');

      const io = req.app.get('io');
      io.to(`job_${job._id}`).emit('new_message', msg);

      res.status(201).json({ message: msg });
    } catch (err) {
      console.error('Chat image error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
