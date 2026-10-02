require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

const seedAdmin = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('Error: MONGODB_URI is not defined in environment variables.');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for admin seeding.');

    const name = process.env.SEED_ADMIN_NAME || 'System Administrator';
    const email = (process.env.SEED_ADMIN_EMAIL || 'admin@tms.local').toLowerCase().trim();
    const password = process.env.SEED_ADMIN_PASSWORD || 'AdminPassword123!';

    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log(`Admin account (${email}) already exists. Skipping seed.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await User.create({
      name,
      email,
      passwordHash,
      role: 'admin',
      isActive: true
    });

    console.log(`Admin user successfully seeded: ${email}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin account:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedAdmin();
