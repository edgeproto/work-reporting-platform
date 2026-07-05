import "dotenv/config";

import { Role } from "../app/generated/prisma/enums";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { hashPassword } from "../lib/password";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const db = new PrismaClient({ adapter });

const ORG_NAME = process.env.SEED_ORG_NAME ?? "Default Organization";
const ORG_SLUG = process.env.SEED_ORG_SLUG ?? "default";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@localhost";
const ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? "Admin";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "admin12345";

async function main() {
  const passwordHash = await hashPassword(ADMIN_PASSWORD);

  const organization = await db.organization.upsert({
    where: { slug: ORG_SLUG },
    update: { name: ORG_NAME },
    create: {
      name: ORG_NAME,
      slug: ORG_SLUG,
    },
  });

  const admin = await db.user.upsert({
    where: {
      organizationId_email: {
        organizationId: organization.id,
        email: ADMIN_EMAIL.toLowerCase(),
      },
    },
    update: {
      name: ADMIN_NAME,
      role: Role.ADMIN,
      passwordHash,
      isActive: true,
    },
    create: {
      email: ADMIN_EMAIL.toLowerCase(),
      name: ADMIN_NAME,
      role: Role.ADMIN,
      organizationId: organization.id,
      passwordHash,
      isActive: true,
    },
  });

  console.log("Seed complete.");
  console.log(`Organization: ${organization.name} (${organization.slug})`);
  console.log(`Admin user: ${admin.email}`);
  console.log(`Admin password: ${ADMIN_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
