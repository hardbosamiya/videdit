const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');

// GET /api/admin/stats
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('ongoingJob', 'title status user');
    res.json({
      completedJobs: user.completedJobs,
      badge: user.badge,
      ongoingJob: user.ongoingJob,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
