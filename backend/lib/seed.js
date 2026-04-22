const User = require('../models/User');

const seedSuperAdmin = async () => {
  try {
    const existing = await User.findOne({ role: 'superadmin' });
    if (existing) {
      console.log('✅ Super Admin already exists');
      return;
    }

    const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@videdit.com';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123';

    await User.create({
      name: 'Super Admin',
      email,
      password,
      role: 'superadmin',
      isActive: true,
    });

    console.log(`✅ Super Admin seeded: ${email}`);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  }
};

module.exports = { seedSuperAdmin };
