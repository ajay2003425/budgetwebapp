import { connectDatabase } from './config/database';
import { User } from './models/User';
import { Department } from './models/Department';
import { Category } from './models/Category';
import { hashPassword } from './utils/passwords';

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDatabase();
    console.log('🔗 Connected to MongoDB for seeding');

    // Clear existing data (optional - remove if you want to keep existing data)
    await User.deleteMany({});
    await Department.deleteMany({});
    await Category.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Create departments
    const departments = await Department.insertMany([
      {
        name: 'Engineering',
        code: 'ENG',
        description: 'Software development and technical teams',
      },
      {
        name: 'Marketing',
        code: 'MKT',
        description: 'Marketing and advertising teams',
      },
      {
        name: 'Finance',
        code: 'FIN',
        description: 'Finance and accounting teams',
      },
      {
        name: 'Human Resources',
        code: 'HR',
        description: 'HR and people operations',
      },
    ]);
    console.log('🏢 Created departments');

    // Create categories
    const categories = await Category.insertMany([
      {
        name: 'Office Supplies',
        description: 'General office supplies and materials',
      },
      {
        name: 'Travel',
        description: 'Business travel and accommodation',
      },
      {
        name: 'Software',
        description: 'Software licenses and subscriptions',
      },
      {
        name: 'Equipment',
        description: 'Hardware and equipment purchases',
      },
      {
        name: 'Training',
        description: 'Employee training and development',
      },
    ]);
    console.log('📂 Created categories');

    // Create demo users
    const users = [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'ADMIN',
        departmentId: departments[2]._id, // Finance
      },
      {
        name: 'Manager User',
        email: 'manager@example.com',
        password: 'password123',
        role: 'MANAGER',
        departmentId: departments[0]._id, // Engineering
      },
      {
        name: 'Regular User',
        email: 'user@example.com',
        password: 'password123',
        role: 'USER',
        departmentId: departments[1]._id, // Marketing
      },
      {
        name: 'HR Manager',
        email: 'hr@example.com',
        password: 'password123',
        role: 'MANAGER',
        departmentId: departments[3]._id, // HR
      },
      {
        name: 'Finance User',
        email: 'finance@example.com',
        password: 'password123',
        role: 'USER',
        departmentId: departments[2]._id, // Finance
      },
    ];

    // Hash passwords and create users
    for (const userData of users) {
      const passwordHash = await hashPassword(userData.password);
      await User.create({
        name: userData.name,
        email: userData.email,
        passwordHash,
        role: userData.role,
        departmentId: userData.departmentId,
        isActive: true,
      });
    }

    console.log('👥 Created demo users:');
    console.log('  - admin@example.com / password123 (ADMIN)');
    console.log('  - manager@example.com / password123 (MANAGER)');
    console.log('  - user@example.com / password123 (USER)');
    console.log('  - hr@example.com / password123 (MANAGER)');
    console.log('  - finance@example.com / password123 (USER)');

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };
