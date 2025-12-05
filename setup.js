import dotenv from "dotenv";
import { connectDb } from "./src/db/index.js";
import createAdminUser from "./src/utils/createAdmin.js";

dotenv.config();

const setup = async () => {
  console.log('🚀 Setting up Luxury Stay Management System...\n');

  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    await connectDb();
    console.log('✅ Database connected successfully\n');

    // Create admin user
    console.log('👤 Creating admin user...');
    await createAdminUser();
    console.log('✅ Admin user setup completed\n');

    console.log('🎉 Setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the server: npm start');
    console.log('2. Test the system: node test-role-system.js');
    console.log('3. Access admin dashboard with: admin@luxurystay.com / admin123');
    console.log('\n📚 Read ROLE_BASED_AUTH_README.md for detailed documentation');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
};

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setup();
}

export default setup;
