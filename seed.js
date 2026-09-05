const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("password123", salt);

  // Seed Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@drishti.com' },
    update: {},
    create: {
      email: 'admin@drishti.com',
      name: 'System Admin',
      mobileNumber: '9999999999',
      passwordHash: passwordHash,
      role: 'ADMIN',
    },
  });

  // Seed Worker
  const worker = await prisma.user.upsert({
    where: { email: 'worker@drishti.com' },
    update: {},
    create: {
      email: 'worker@drishti.com',
      name: 'Field Worker Bob',
      mobileNumber: '8888888888',
      passwordHash: passwordHash,
      role: 'FIELD_WORKER',
    },
  });

  console.log({ admin, worker });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
