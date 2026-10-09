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

    let adminsToSeed = [];

    // Allow providing a JSON array via environment variable
    if (process.env.SEED_ADMINS_JSON) {
      try {
        adminsToSeed = JSON.parse(process.env.SEED_ADMINS_JSON);
      } catch (err) {
        console.warn('Warning: Could not parse SEED_ADMINS_JSON environment variable. Falling back to default list.');
      }
    }

    // Default admin accounts list if SEED_ADMINS_JSON is not provided
    if (!adminsToSeed.length) {
      adminsToSeed = [
        {
          name: process.env.SEED_ADMIN_NAME || 'Primary Administrator',
          email: process.env.SEED_ADMIN_EMAIL || 'admin@tms.local',
          password: process.env.SEED_ADMIN_PASSWORD || 'AdminPassword123!'
        },
        {
          name: process.env.SEED_ADMIN_2_NAME || 'Secondary Administrator',
          email: process.env.SEED_ADMIN_2_EMAIL || 'admin2@tms.local',
          password: process.env.SEED_ADMIN_2_PASSWORD || 'AdminPassword123!'
        }
      ];
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const adminData of adminsToSeed) {
      const name = adminData.name || 'Administrator';
      const email = (adminData.email || '').toLowerCase().trim();
      const password = adminData.password || 'AdminPassword123!';

      if (!email) {
        console.warn('Skipping entry with empty email.');
        continue;
      }

      const existingAdmin = await User.findOne({ email });
      if (existingAdmin) {
        console.log(`Admin account (${email}) already exists. Skipping.`);
        skippedCount++;
        continue;
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

      console.log(`Admin account successfully seeded: ${email} (${name})`);
      createdCount++;
    }

    console.log(`Admin seeding finished. Created: ${createdCount}, Skipped: ${skippedCount}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin accounts:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedAdmin();
