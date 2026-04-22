const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const User = require('../models/User');
const Message = require('../models/Message');
const { protect, authorize } = require('../middleware/auth');
const { uploadVideo, uploadImage, uploadEditedVideo, handleMulterError, getFileInfo, deleteFromCloudinary } = require('../middleware/upload');
const { sendEmail } = require('../lib/email');

// ─── USER: Create a new job ───────────────────────────────────────────────────
router.post('/', protect, authorize('user'), async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const job = await Job.create({
      user: req.user._id,
      title,
      description,
      status: 'pending',
    });
    res.status(201).json({ job });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── USER: Upload sample video ────────────────────────────────────────────────
router.post('/:id/sample-video', protect, authorize('user'),
  (req, res, next) => uploadVideo.single('video')(req, res, (err) => {
    if (err) {
      console.error('Multer/Cloudinary error:', err);
      return res.status(400).json({ message: err.message || 'Upload failed' });
    }
    next();
  }),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file received' });

      const job = await Job.findOne({ _id: req.params.id, user: req.user._id });
      if (!job) return res.status(404).json({ message: 'Job not found' });

      if (job.sampleVideo?.publicId) {
        await deleteFromCloudinary(job.sampleVideo.publicId);
      }

      job.sampleVideo = getFileInfo(req.file);
      await job.save();
      res.json({ job });
    } catch (err) {
      console.error('Sample video save error:', err);
      res.status(500).json({ message: 'Upload failed' });
    }
  }
);

// ─── USER: Upload clips ───────────────────────────────────────────────────────
router.post('/:id/clips', protect, authorize('user'),
  (req, res, next) => uploadVideo.array('clips', 20)(req, res, (err) => {
    if (err) {
      console.error('Clips upload error:', err);
      return res.status(400).json({ message: err.message || 'Upload failed' });
    }
    next();
  }),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files received' });
      }

      const job = await Job.findOne({ _id: req.params.id, user: req.user._id });
      if (!job) return res.status(404).json({ message: 'Job not found' });

      const orders = req.body.orders ? JSON.parse(req.body.orders) : [];
      const newClips = req.files.map((file, i) => ({
        ...getFileInfo(file),
        order: orders[i] !== undefined ? orders[i] : job.clips.length + i,
      }));

      job.clips.push(...newClips);
      await job.save();
      res.json({ job });
    } catch (err) {
      console.error('Clips save error:', err);
      res.status(500).json({ message: 'Upload failed' });
    }
  }
);

// ─── USER: Get my jobs ────────────────────────────────────────────────────────
router.get('/my', protect, authorize('user'), async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const total = await Job.countDocuments(filter);
    const jobs = await Job.find(filter)
      .populate('admin', 'name email badge profilePic')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ jobs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── USER: Get single job ─────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('user', 'name email')
      .populate('admin', 'name email badge profilePic');

    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Role-based access
    const isOwner = job.user._id.toString() === req.user._id.toString();
    const isAssignedAdmin = job.admin && job.admin._id.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.role === 'superadmin';

    if (!isOwner && !isAssignedAdmin && !isSuperAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ job });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── USER: Submit edit request ────────────────────────────────────────────────
router.post('/:id/edit-request', protect, authorize('user'),
  (req, res, next) => uploadImage.array('images', 5)(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || 'Image upload failed' });
    next();
  }),
  async (req, res) => {
    try {
      const job = await Job.findOne({ _id: req.params.id, user: req.user._id });
      if (!job) return res.status(404).json({ message: 'Job not found' });
      if (!['review', 'completed'].includes(job.status)) {
        return res.status(400).json({ message: 'Cannot request edits at this stage' });
      }

      const images = (req.files || []).map(f => ({ url: f.path, publicId: f.filename }));
      job.editRequests.push({ text: req.body.text, images });
      job.status = 'revision';
      await job.save();

      // Notify admin
      if (job.admin) {
        const admin = await User.findById(job.admin);
        if (admin) {
          await sendEmail({
            to: admin.email,
            subject: `Edit Request - Job: ${job.title}`,
            html: `<p>The user has submitted an edit request for job "<strong>${job.title}</strong>".</p><p>Instructions: ${req.body.text}</p>`,
          });
        }
      }

      const io = req.app.get('io');
      io.to(`job_${job._id}`).emit('job_updated', { jobId: job._id, status: job.status });

      res.json({ job });
    } catch (err) {
      console.error('Edit request error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ─── USER: Settle job ─────────────────────────────────────────────────────────
router.post('/:id/settle', protect, authorize('user'), async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, user: req.user._id });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (!['review', 'revision'].includes(job.status)) {
      return res.status(400).json({ message: 'Job cannot be settled at this stage' });
    }

    job.status = 'completed';
    job.settledAt = new Date();
    job.settledBy = req.user._id;
    await job.save();

    // Set chat messages to expire in 7 days
    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await Message.updateMany({ job: job._id }, { expiresAt: expiry });

    // Update admin completed jobs count
    if (job.admin) {
      await User.findByIdAndUpdate(job.admin, {
        $inc: { completedJobs: 1 },
        $set: { ongoingJob: null },
      });
    }

    const io = req.app.get('io');
    io.to(`job_${job._id}`).emit('job_settled', { jobId: job._id });

    res.json({ job, message: 'Job settled successfully' });
  } catch (err) {
    console.error('Settle error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ─── ADMIN: Get available (unassigned, price-discussed) jobs ──────────────────
router.get('/admin/available', protect, authorize('admin'), async (req, res) => {
  try {
    // Admin can only see jobs with no admin assigned and status price_discussion AND user has accepted the price
    const jobs = await Job.find({ admin: null, status: 'price_discussion', userAcceptedPrice: true })
      .populate('user', 'name email')
      .sort({ updatedAt: -1 });

    // Filter out jobs that any admin already locked (double check)
    const available = jobs.filter(j => !j.admin);
    res.json({ jobs: available });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── ADMIN: Accept/lock a job ─────────────────────────────────────────────────
router.post('/:id/accept', protect, authorize('admin'), async (req, res) => {
  try {
    if (req.user.ongoingJob) {
      return res.status(400).json({ message: 'You already have an ongoing job' });
    }

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, admin: null, status: 'price_discussion' },
      { admin: req.user._id, status: 'ongoing', lockedAt: new Date() },
      { new: true }
    ).populate('user', 'name email');

    if (!job) return res.status(400).json({ message: 'Job not available or already taken' });

    await User.findByIdAndUpdate(req.user._id, { ongoingJob: job._id });

    const io = req.app.get('io');
    io.emit('job_locked', { jobId: job._id });

    res.json({ job });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── ADMIN: Get my assigned jobs ──────────────────────────────────────────────
router.get('/admin/my-jobs', protect, authorize('admin'), async (req, res) => {
  try {
    const jobs = await Job.find({ admin: req.user._id })
      .populate('user', 'name email')
      .sort({ updatedAt: -1 });
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── ADMIN: Upload edited video ───────────────────────────────────────────────
router.post('/:id/deliver', protect, authorize('admin'),
  (req, res, next) => uploadEditedVideo.single('video')(req, res, (err) => {
    if (err) {
      console.error('Deliver upload error:', err);
      return res.status(400).json({ message: err.message || 'Upload failed' });
    }
    next();
  }),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file received' });

      const job = await Job.findOne({ _id: req.params.id, admin: req.user._id });
      if (!job) return res.status(404).json({ message: 'Job not found or not assigned to you' });

      if (job.deliveredVideo?.publicId) {
        await deleteFromCloudinary(job.deliveredVideo.publicId);
      }

      job.deliveredVideo = getFileInfo(req.file);
      job.status = 'review';
      job.deliveredAt = new Date();
      await job.save();

      // Notify user
      const user = await User.findById(job.user);
      if (user) {
        await sendEmail({
          to: user.email,
          subject: `Your edited video is ready! - ${job.title}`,
          html: `
            <h2>Your video is ready for review!</h2>
            <p>Hi ${user.name}, your job "<strong>${job.title}</strong>" has been completed.</p>
            <p>Please log in to review the video and either request edits or settle the job.</p>
            <a href="${process.env.FRONTEND_URL}/dashboard/user/jobs/${job._id}">View Job</a>
          `,
        });
      }

      const io = req.app.get('io');
      io.to(`job_${job._id}`).emit('job_updated', { jobId: job._id, status: 'review' });

      res.json({ job });
    } catch (err) {
      console.error('Deliver save error:', err);
      res.status(500).json({ message: 'Delivery failed' });
    }
  }
);

// ─── SUPERADMIN: Get all jobs ─────────────────────────────────────────────────
router.get('/superadmin/all', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const total = await Job.countDocuments(filter);
    const jobs = await Job.find(filter)
      .populate('user', 'name email')
      .populate('admin', 'name email badge')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ jobs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── SUPERADMIN: Set price & move to price_discussion ────────────────────────
router.patch('/:id/set-price', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { agreedPrice, currency, notes } = req.body;
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { agreedPrice, currency: currency || 'USD', status: 'price_discussion', superAdminNotes: notes, userAcceptedPrice: false },
      { new: true }
    ).populate('user', 'name email');

    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Notify user
    await sendEmail({
      to: job.user.email,
      subject: `Price confirmed for your job - ${job.title}`,
      html: `<p>Hi ${job.user.name}, we've set the price for your job "<strong>${job.title}</strong>" at <strong>${agreedPrice} ${currency || 'USD'}</strong>. An admin will be assigned shortly.</p>`,
    });

    const io = req.app.get('io');
    io.to(`job_${job._id}`).emit('job_updated', { jobId: job._id, status: 'price_discussion' });

    res.json({ job });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── SUPERADMIN: Manually assign admin ───────────────────────────────────────
router.patch('/:id/assign-admin', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { adminId } = req.body;
    const admin = await User.findOne({ _id: adminId, role: 'admin', isActive: true });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { admin: adminId, status: 'ongoing', lockedAt: new Date() },
      { new: true }
    ).populate('user', 'name email').populate('admin', 'name email');

    if (!job) return res.status(404).json({ message: 'Job not found' });
    await User.findByIdAndUpdate(adminId, { ongoingJob: job._id });

    res.json({ job });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── USER: Accept price ───────────────────────────────────────────────────────
router.patch('/:id/accept-price', protect, authorize('user'), async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, status: 'price_discussion' },
      { userAcceptedPrice: true },
      { new: true }
    );
    if (!job) return res.status(404).json({ message: 'Job not found or invalid status' });

    const io = req.app.get('io');
    io.to(`job_${job._id}`).emit('job_updated', { jobId: job._id, status: 'price_discussion' });

    res.json({ job });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
