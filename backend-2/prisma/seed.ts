import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
// Change this:
// import { PrismaClient } from '@prisma/client';

// To this:
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { hashPassword } from '../src/utils/crypto.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('FATAL: DATABASE_URL environment variable is missing for the seeding engine!');
}

// Set up the native PostgreSQL connection pool
const pool = new pg.Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);

// Pass the adapter directly into the Prisma Client options object
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding (Prisma 7 Engine)...');

  const defaultFeeTypes = [
    'Hostel GST',
    'Mess GST',
    'Bed Charges GST',
    'Unit Charges GST',
    'Electricity Bill GST',
  ];
  for (const name of defaultFeeTypes) {
    await prisma.feeType.upsert({
      where: { name },
      update: { isSystemDefined: true, isActive: true },
      create: { name, isSystemDefined: true, isActive: true },
    });
  }

  const email = 'admin@system.com';
  const plainPassword = 'SuperSecureAdminPassword2026!'; // Change this immediately after setup!

  const passwordHash = await hashPassword(plainPassword);

  const masterAccount = await prisma.account.upsert({
    where: { email },
    update: {
      passwordHash,
      isActive: true,
      isDeleted: false,
    },
    create: {
      email,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'SUPER_ADMIN',
      customerType: 'NONE',
      passwordHash,
      isActive: true,
      isDeleted: false,
    },
  });

  console.log('================================================================');
  console.log('✅ Master admin account successfully synchronized!');
  console.log(`📧 Email:    ${masterAccount.email}`);
  console.log(`🔑 Password: ${plainPassword}`);
  console.log('================================================================');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error('❌ Error during seeding process:', error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });