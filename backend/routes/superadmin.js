const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Job = require('../models/Job');
const { protect, authorize } = require('../middleware/auth');
const { sendEmail } = require('../lib/email');

// GET /api/superadmin/admins - List all admins
router.get('/admins', protect, authorize('superadmin'), async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .populate('ongoingJob', 'title status')
      .sort({ createdAt: -1 });
    res.json({ admins });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/superadmin/admins - Create admin
router.post('/admins', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    const admin = await User.create({ name, email, password, phone, role: 'admin' });

    await sendEmail({
      to: email,
      subject: 'Welcome to VidEdit - Admin Account Created',
      html: `<h2>Welcome ${name}!</h2><p>Your admin account has been created.<br/>Email: ${email}<br/>Password: ${password}</p><p>Please change your password after first login.</p>`,
    });

    res.status(201).json({ admin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/superadmin/admins/:id/badge - Assign badge
router.patch('/admins/:id/badge', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { badge, badgeNote } = req.body;
    const validBadges = ['none', 'bronze', 'silver', 'gold', 'platinum', 'diamond'];
    if (!validBadges.includes(badge)) {
      return res.status(400).json({ message: 'Invalid badge' });
    }

    const admin = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'admin' },
      { badge, badgeNote },
      { new: true }
    );
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    await sendEmail({
      to: admin.email,
      subject: `🏅 You've been awarded a ${badge} badge!`,
      html: `<h2>Congratulations ${admin.name}!</h2><p>You've been awarded a <strong>${badge}</strong> badge by the Super Admin.</p>${badgeNote ? `<p>Note: ${badgeNote}</p>` : ''}`,
    });

    res.json({ admin });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/superadmin/admins/:id/toggle - Activate/deactivate admin
router.patch('/admins/:id/toggle', protect, authorize('superadmin'), async (req, res) => {
  try {
    const admin = await User.findOne({ _id: req.params.id, role: 'admin' });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    admin.isActive = !admin.isActive;
    await admin.save();
    res.json({ admin, message: `Admin ${admin.isActive ? 'activated' : 'deactivated'}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/superadmin/users - List all users
router.get('/users', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = await User.countDocuments({ role: 'user' });
    const users = await User.find({ role: 'user' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ users, total });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/superadmin/stats - Dashboard stats
router.get('/stats', protect, authorize('superadmin'), async (req, res) => {
  try {
    const [pending, ongoing, completed, totalUsers, totalAdmins] = await Promise.all([
      Job.countDocuments({ status: 'pending' }),
      Job.countDocuments({ status: { $in: ['ongoing', 'review', 'revision', 'price_discussion'] } }),
      Job.countDocuments({ status: 'completed' }),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'admin' }),
    ]);

    res.json({ pending, ongoing, completed, totalUsers, totalAdmins });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
