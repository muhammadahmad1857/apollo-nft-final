import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const connectionString = `${process.env.TEST_DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString })
const db = new PrismaClient({ adapter })

export { db };