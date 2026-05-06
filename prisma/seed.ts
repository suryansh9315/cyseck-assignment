import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string })
const prisma = new PrismaClient({ adapter })

async function main() {
  const hashedPassword = await bcrypt.hash('Cyseck@123', 10)

  const admin = await prisma.employee.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: { email: 'admin@company.com', name: 'Admin User', password: hashedPassword, role: 'admin' },
  })

  const bob = await prisma.employee.upsert({
    where: { email: 'bob@company.com' },
    update: {},
    create: { email: 'bob@company.com', name: 'Bob Smith', password: hashedPassword, role: 'employee' },
  })

  const carol = await prisma.employee.upsert({
    where: { email: 'carol@company.com' },
    update: {},
    create: { email: 'carol@company.com', name: 'Carol Jones', password: hashedPassword, role: 'employee' },
  })

  const dave = await prisma.employee.upsert({
    where: { email: 'dave@company.com' },
    update: {},
    create: { email: 'dave@company.com', name: 'Dave Brown', password: hashedPassword, role: 'employee' },
  })

  const eve = await prisma.employee.upsert({
    where: { email: 'eve@company.com' },
    update: {},
    create: { email: 'eve@company.com', name: 'Eve Davis', password: hashedPassword, role: 'employee' },
  })

  console.log('Seeded employees:', [admin, bob, carol, dave, eve].map(e => e.email))

  const review1 = await prisma.review.create({
    data: {
      employeeId: bob.id,
      period: 'Q1 2026',
      status: 'open',
      assignments: {
        create: [
          { reviewerId: carol.id },
          { reviewerId: dave.id },
        ],
      },
    },
  })

  const review2 = await prisma.review.create({
    data: {
      employeeId: carol.id,
      period: 'Q1 2026',
      status: 'open',
      assignments: {
        create: [
          { reviewerId: bob.id },
          { reviewerId: eve.id },
        ],
      },
    },
  })

  console.log('Seeded reviews:', [review1.id, review2.id])
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
