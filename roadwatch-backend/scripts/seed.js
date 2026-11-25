const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.join(__dirname, '../.env.example') });
}

const User = require('../src/models/User');
const Team = require('../src/models/Team');
const Report = require('../src/models/Report');
const Repair = require('../src/models/Repair');
const Notification = require('../src/models/Notification');
const Counter = require('../src/models/Counter');

const sampleCity = {
  name: 'Austin Metro',
  baseLat: 30.2672,
  baseLng: -97.7431
};

const seedDatabase = async (standalone = false) => {
  try {
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/roadwatch';
      console.log(`Connecting to database: ${mongoUri}`);
      await mongoose.connect(mongoUri);
      console.log('[Seed] Database connected successfully.');
    }

    // 1. Clear Existing Data
    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Team.deleteMany({}),
      Report.deleteMany({}),
      Repair.deleteMany({}),
      Notification.deleteMany({}),
      Counter.deleteMany({})
    ]);

    // 2. Initialize Complaint Counter for 2026
    await Counter.create({ year: 2026, seq: 6 });

    // 3. Create Admin User
    console.log('[Seed] Creating Admin user...');
    const adminUser = await User.create({
      name: 'Chief Admin',
      email: 'admin@roadwatch.org',
      password: 'AdminPassword123!',
      phone: '+1-512-555-0100',
      role: 'admin',
      isActive: true
    });

    // 4. Create 2 Maintenance Teams
    console.log('[Seed] Creating Teams...');
    const teamDowntown = await Team.create({
      name: 'Central Pothole Squad',
      area: 'Downtown',
      members: []
    });

    const teamNorth = await Team.create({
      name: 'Metro Quick Repair',
      area: 'North Ward',
      members: []
    });

    // 5. Create Maintenance Users
    console.log('[Seed] Creating Maintenance users...');
    const maint1 = await User.create({
      name: 'John Martinez (Lead Tech)',
      email: 'john.maint@roadwatch.org',
      password: 'MaintPassword123!',
      phone: '+1-512-555-0111',
      role: 'maintenance',
      team: teamDowntown._id,
      isActive: true
    });

    const maint2 = await User.create({
      name: 'Sarah Connor (Asphalt Tech)',
      email: 'sarah.maint@roadwatch.org',
      password: 'MaintPassword123!',
      phone: '+1-512-555-0112',
      role: 'maintenance',
      team: teamDowntown._id,
      isActive: true
    });

    const maint3 = await User.create({
      name: 'David Kim (Field Tech)',
      email: 'david.maint@roadwatch.org',
      password: 'MaintPassword123!',
      phone: '+1-512-555-0121',
      role: 'maintenance',
      team: teamNorth._id,
      isActive: true
    });

    const maint4 = await User.create({
      name: 'Elena Rostova (Inspector)',
      email: 'elena.maint@roadwatch.org',
      password: 'MaintPassword123!',
      phone: '+1-512-555-0122',
      role: 'maintenance',
      team: teamNorth._id,
      isActive: true
    });

    // Update Team Member Lists
    teamDowntown.members = [maint1._id, maint2._id];
    await teamDowntown.save();

    teamNorth.members = [maint3._id, maint4._id];
    await teamNorth.save();

    // 6. Create Citizen Users
    console.log('[Seed] Creating Citizens...');
    const citizen1 = await User.create({
      name: 'Alice Walker',
      email: 'alice.citizen@gmail.com',
      password: 'CitizenPassword123!',
      phone: '+1-512-555-0201',
      role: 'citizen',
      isActive: true
    });

    const citizen2 = await User.create({
      name: 'Bob Jenkins',
      email: 'bob.citizen@gmail.com',
      password: 'CitizenPassword123!',
      phone: '+1-512-555-0202',
      role: 'citizen',
      isActive: true
    });

    const citizen3 = await User.create({
      name: 'Carlos Mendez',
      email: 'carlos.citizen@gmail.com',
      password: 'CitizenPassword123!',
      phone: '+1-512-555-0203',
      role: 'citizen',
      isActive: true
    });

    // 7. Create Sample Reports
    console.log('[Seed] Creating sample pothole reports...');

    // Report 1: In-Progress Critical Pothole (Assigned to Central Pothole Squad)
    const report1 = await Report.create({
      complaintId: 'RW-2026-0001',
      citizen: citizen1._id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
          publicId: 'sample_pothole_downtown_01'
        }
      ],
      description: 'Severe deep pothole on right lane causing wheel rim damage',
      location: {
        type: 'Point',
        coordinates: [-97.7431, 30.2672] // [lng, lat]
      },
      address: '400 Congress Ave, Austin, TX 78701',
      area: 'Downtown',
      priority: 'critical',
      complaintCount: 11,
      upvotes: [citizen1._id, citizen2._id],
      status: 'in-progress',
      assignedTeam: teamDowntown._id,
      assignedAt: new Date(Date.now() - 48 * 3600 * 1000),
      dueDate: new Date(Date.now() + 24 * 3600 * 1000),
      isOverdue: false,
      statusHistory: [
        {
          status: 'submitted',
          by: citizen1._id,
          note: 'Reported by citizen Alice Walker',
          at: new Date(Date.now() - 72 * 3600 * 1000)
        },
        {
          status: 'assigned',
          by: adminUser._id,
          note: 'Assigned to Central Pothole Squad due to critical traffic risk',
          at: new Date(Date.now() - 48 * 3600 * 1000)
        },
        {
          status: 'in-progress',
          by: maint1._id,
          note: 'Crew arrived on site and established safety perimeter',
          at: new Date(Date.now() - 6 * 3600 * 1000)
        }
      ]
    });

    // Report 2: Repair Completed, Awaiting Admin Verification
    const report2 = await Report.create({
      complaintId: 'RW-2026-0002',
      citizen: citizen2._id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
          publicId: 'sample_pothole_north_02'
        }
      ],
      description: 'Dangerous pothole near pedestrian crosswalk on Lamar Blvd',
      location: {
        type: 'Point',
        coordinates: [-97.7511, 30.2855]
      },
      address: '2400 N Lamar Blvd, Austin, TX 78705',
      area: 'North Ward',
      priority: 'high',
      complaintCount: 7,
      upvotes: [citizen2._id],
      status: 'repair-completed',
      assignedTeam: teamNorth._id,
      assignedAt: new Date(Date.now() - 36 * 3600 * 1000),
      dueDate: new Date(Date.now() + 12 * 3600 * 1000),
      isOverdue: false,
      statusHistory: [
        {
          status: 'submitted',
          by: citizen2._id,
          note: 'Submitted by citizen',
          at: new Date(Date.now() - 40 * 3600 * 1000)
        },
        {
          status: 'assigned',
          by: adminUser._id,
          note: 'Assigned to Metro Quick Repair',
          at: new Date(Date.now() - 36 * 3600 * 1000)
        },
        {
          status: 'repair-completed',
          by: maint3._id,
          note: 'Cold-mix patch and hot asphalt sealant applied',
          at: new Date(Date.now() - 2 * 3600 * 1000)
        }
      ]
    });

    // Repair for Report 2
    await Repair.create({
      report: report2._id,
      team: teamNorth._id,
      submittedBy: maint3._id,
      beforeImages: [
        {
          url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
          publicId: 'repair_before_02'
        }
      ],
      afterImages: [
        {
          url: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800',
          publicId: 'repair_after_02'
        }
      ],
      notes: 'Cleared loose debris, applied tack coat, filled with asphalt mix, tamped with pneumatic roller.',
      materialsUsed: ['Asphalt Cold Patch (50kg)', 'Tack Coat Sealant (5L)'],
      timeTakenHours: 2.5,
      completedAt: new Date(Date.now() - 2 * 3600 * 1000),
      verification: {
        status: 'pending'
      }
    });

    // Report 3: Verified and Fully Closed
    const report3 = await Report.create({
      complaintId: 'RW-2026-0003',
      citizen: citizen3._id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
          publicId: 'sample_pothole_verified_03'
        }
      ],
      description: 'Large surface crack and pothole cluster at intersection',
      location: {
        type: 'Point',
        coordinates: [-97.7425, 30.2715]
      },
      address: '800 Lavaca St, Austin, TX 78701',
      area: 'Downtown',
      priority: 'medium',
      complaintCount: 4,
      upvotes: [citizen3._id],
      status: 'verified',
      assignedTeam: teamDowntown._id,
      assignedAt: new Date(Date.now() - 120 * 3600 * 1000),
      dueDate: new Date(Date.now() - 48 * 3600 * 1000),
      isOverdue: false,
      statusHistory: [
        {
          status: 'submitted',
          by: citizen3._id,
          note: 'Submitted',
          at: new Date(Date.now() - 130 * 3600 * 1000)
        },
        {
          status: 'assigned',
          by: adminUser._id,
          note: 'Assigned to Central Pothole Squad',
          at: new Date(Date.now() - 120 * 3600 * 1000)
        },
        {
          status: 'repair-completed',
          by: maint2._id,
          note: 'Full patch completed',
          at: new Date(Date.now() - 50 * 3600 * 1000)
        },
        {
          status: 'verified',
          by: adminUser._id,
          note: 'Visual and leveling inspection passed with excellence',
          at: new Date(Date.now() - 24 * 3600 * 1000)
        }
      ]
    });

    // Repair for Report 3 (Verified)
    await Repair.create({
      report: report3._id,
      team: teamDowntown._id,
      submittedBy: maint2._id,
      beforeImages: [
        {
          url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
          publicId: 'repair_before_03'
        }
      ],
      afterImages: [
        {
          url: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800',
          publicId: 'repair_after_03'
        }
      ],
      notes: 'Full mill and overlay patch completed. Smooth transition to existing road grade.',
      materialsUsed: ['Hot Mix Asphalt (120kg)', 'Liquid Bitumen Emulsion (10L)'],
      timeTakenHours: 4.0,
      completedAt: new Date(Date.now() - 50 * 3600 * 1000),
      verification: {
        status: 'approved',
        by: adminUser._id,
        remarks: 'Excellent level and compacted finish.',
        at: new Date(Date.now() - 24 * 3600 * 1000)
      }
    });

    // Report 4: Freshly Submitted (Unassigned)
    const report4 = await Report.create({
      complaintId: 'RW-2026-0004',
      citizen: citizen1._id,
      images: [],
      description: 'Developing pothole near bike lane',
      location: {
        type: 'Point',
        coordinates: [-97.7388, 30.2644]
      },
      address: '200 E 4th St, Austin, TX 78701',
      area: 'Downtown',
      priority: 'low',
      complaintCount: 1,
      upvotes: [citizen1._id],
      status: 'submitted',
      statusHistory: [
        {
          status: 'submitted',
          by: citizen1._id,
          note: 'Initial report submitted',
          at: new Date(Date.now() - 2 * 3600 * 1000)
        }
      ]
    });

    // Report 5: Overdue Report (Due date 2 days ago, still assigned)
    const report5 = await Report.create({
      complaintId: 'RW-2026-0005',
      citizen: citizen2._id,
      images: [],
      description: 'Widening crack turning into pothole by bus stop',
      location: {
        type: 'Point',
        coordinates: [-97.7455, 30.2912]
      },
      address: '3200 Guadalupe St, Austin, TX 78705',
      area: 'North Ward',
      priority: 'medium',
      complaintCount: 3,
      upvotes: [citizen2._id],
      status: 'assigned',
      assignedTeam: teamNorth._id,
      assignedAt: new Date(Date.now() - 96 * 3600 * 1000),
      dueDate: new Date(Date.now() - 24 * 3600 * 1000), // In the past!
      isOverdue: true,
      statusHistory: [
        {
          status: 'submitted',
          by: citizen2._id,
          note: 'Initial report',
          at: new Date(Date.now() - 100 * 3600 * 1000)
        },
        {
          status: 'assigned',
          by: adminUser._id,
          note: 'Assigned to North team',
          at: new Date(Date.now() - 96 * 3600 * 1000)
        },
        {
          status: 'assigned',
          note: 'Marked overdue by automated monitoring',
          at: new Date(Date.now() - 24 * 3600 * 1000)
        }
      ]
    });

    // Report 6: Duplicate linked to Report 1 (Exact 10m away from Report 1)
    const report6 = await Report.create({
      complaintId: 'RW-2026-0006',
      citizen: citizen3._id,
      images: [],
      description: 'Car hit this pothole on 400 Congress Ave',
      location: {
        type: 'Point',
        // Slight offset (~10m east)
        coordinates: [-97.7430, 30.2672]
      },
      address: '400 Congress Ave, Austin, TX 78701',
      area: 'Downtown',
      priority: 'critical',
      complaintCount: 1,
      upvotes: [citizen3._id],
      status: 'duplicate',
      duplicateOf: report1._id,
      statusHistory: [
        {
          status: 'duplicate',
          by: citizen3._id,
          note: 'Automatically detected as duplicate of RW-2026-0001 within 25m',
          at: new Date(Date.now() - 5 * 3600 * 1000)
        }
      ]
    });

    // 8. Create Sample Notifications
    console.log('[Seed] Creating notifications...');
    await Notification.create([
      {
        user: adminUser._id,
        message: 'New pothole reported: RW-2026-0004 at 200 E 4th St (Downtown)',
        report: report4._id,
        type: 'report:new',
        isRead: false
      },
      {
        user: adminUser._id,
        message: 'Repair completed for RW-2026-0002. Awaiting your verification.',
        report: report2._id,
        type: 'repair:submitted',
        isRead: false
      },
      {
        user: citizen1._id,
        message: 'Your report RW-2026-0001 status changed to in-progress.',
        report: report1._id,
        type: 'report:statusChanged',
        isRead: true
      },
      {
        user: maint1._id,
        message: 'New task assigned to Central Pothole Squad: RW-2026-0001',
        report: report1._id,
        type: 'task:assigned',
        isRead: true
      }
    ]);

    console.log('\n=============================================================');
    console.log('       ROADWATCH DATABASE SEEDED SUCCESSFULLY!               ');
    console.log('=============================================================');
    console.log('\n--- SAMPLE LOGIN CREDENTIALS ---');
    console.log('1. ADMIN ACCOUNT:');
    console.log('   Email:    admin@roadwatch.org');
    console.log('   Password: AdminPassword123!');
    console.log('   Role:     admin\n');

    console.log('2. MAINTENANCE ACCOUNTS:');
    console.log('   Team 1: "Central Pothole Squad" (Downtown)');
    console.log('   Email:    john.maint@roadwatch.org');
    console.log('   Password: MaintPassword123!');
    console.log('   Email:    sarah.maint@roadwatch.org');
    console.log('   Password: MaintPassword123!\n');

    console.log('   Team 2: "Metro Quick Repair" (North Ward)');
    console.log('   Email:    david.maint@roadwatch.org');
    console.log('   Password: MaintPassword123!');
    console.log('   Email:    elena.maint@roadwatch.org');
    console.log('   Password: MaintPassword123!\n');

    console.log('3. CITIZEN ACCOUNTS:');
    console.log('   Email:    alice.citizen@gmail.com');
    console.log('   Email:    bob.citizen@gmail.com');
    console.log('   Email:    carlos.citizen@gmail.com');
    console.log('   Password: CitizenPassword123!\n');

    console.log('--- SAMPLE REPORTS CREATED ---');
    console.log(' - RW-2026-0001: Critical, In-Progress, 11 complaints (Downtown)');
    console.log(' - RW-2026-0002: High, Repair-Completed, Pending Verification');
    console.log(' - RW-2026-0003: Medium, Verified & Closed (Downtown)');
    console.log(' - RW-2026-0004: Low, Freshly Submitted (Downtown)');
    console.log(' - RW-2026-0005: Medium, OVERDUE Task (North Ward)');
    console.log(' - RW-2026-0006: Duplicate of RW-2026-0001 (<25m proximity)');
    console.log('=============================================================\n');

    if (standalone) {
      process.exit(0);
    }
    return true;
  } catch (err) {
    console.error('[Seed Error]:', err);
    if (standalone) {
      process.exit(1);
    }
    throw err;
  }
};

if (require.main === module) {
  seedDatabase(true);
}

module.exports = { seedDatabase };

