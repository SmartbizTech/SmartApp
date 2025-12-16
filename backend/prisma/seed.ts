import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding compliance types...");

  const complianceTypes = [
    {
      code: "ITR_INDIVIDUAL",
      displayName: "Income Tax Return (Individual)",
      frequency: "ANNUAL",
      meta: {
        description: "Annual income tax return filing for individuals",
        dueDateMonth: 7, // July
        dueDateDay: 31,
      },
    },
    {
      code: "ITR_BUSINESS",
      displayName: "Income Tax Return (Business)",
      frequency: "ANNUAL",
      meta: {
        description: "Annual income tax return filing for businesses",
        dueDateMonth: 9, // September
        dueDateDay: 30,
      },
    },
    {
      code: "GSTR_1",
      displayName: "GSTR-1 (Outward Supplies)",
      frequency: "MONTHLY",
      meta: {
        description: "Monthly return for outward supplies",
        dueDateDay: 11, // 11th of next month
      },
    },
    {
      code: "GSTR_3B",
      displayName: "GSTR-3B (Summary Return)",
      frequency: "MONTHLY",
      meta: {
        description: "Monthly summary return with payment of tax",
        dueDateDay: 20, // 20th of next month
      },
    },
    {
      code: "GSTR_9",
      displayName: "GSTR-9 (Annual Return)",
      frequency: "ANNUAL",
      meta: {
        description: "Annual GST return",
        dueDateMonth: 12, // December
        dueDateDay: 31,
      },
    },
    {
      code: "TDS_QUARTERLY",
      displayName: "TDS Return (Quarterly)",
      frequency: "QUARTERLY",
      meta: {
        description: "Quarterly TDS return filing",
        dueDateMonths: [7, 10, 1, 4], // July, October, January, April (for previous quarter)
      },
    },
    {
      code: "TDS_24Q",
      displayName: "TDS Return 24Q (Salaries)",
      frequency: "QUARTERLY",
      meta: {
        description: "Quarterly TDS return for salaries",
        dueDateMonths: [7, 10, 1, 4],
      },
    },
    {
      code: "TDS_26Q",
      displayName: "TDS Return 26Q (Non-Salary)",
      frequency: "QUARTERLY",
      meta: {
        description: "Quarterly TDS return for non-salary payments",
        dueDateMonths: [7, 10, 1, 4],
      },
    },
    {
      code: "ROC_AOC_4",
      displayName: "AOC-4 (Annual Return)",
      frequency: "ANNUAL",
      meta: {
        description: "Annual filing of financial statements",
        dueDateMonths: [10, 11], // October-November
      },
    },
    {
      code: "ROC_MGT_7",
      displayName: "MGT-7 (Annual Return)",
      frequency: "ANNUAL",
      meta: {
        description: "Annual return of company",
        dueDateMonths: [10, 11],
      },
    },
    {
      code: "AUDIT_TAX_AUDIT",
      displayName: "Tax Audit Report (3CD)",
      frequency: "ANNUAL",
      meta: {
        description: "Tax audit report under Income Tax Act",
        dueDateMonth: 9, // September
        dueDateDay: 30,
      },
    },
    {
      code: "TDS_TCS",
      displayName: "TCS Return (Quarterly)",
      frequency: "QUARTERLY",
      meta: {
        description: "Quarterly TCS (Tax Collected at Source) return",
        dueDateMonths: [7, 10, 1, 4],
      },
    },
    {
      code: "ADVANCE_TAX",
      displayName: "Advance Tax Payment",
      frequency: "QUARTERLY",
      meta: {
        description: "Quarterly advance tax payment",
        dueDateMonths: [6, 9, 12, 3], // June, September, December, March
      },
    },
  ];

  for (const type of complianceTypes) {
    await prisma.complianceType.upsert({
      where: { code: type.code },
      update: {
        displayName: type.displayName,
        frequency: type.frequency,
        meta: type.meta as any,
      },
      create: {
        code: type.code,
        displayName: type.displayName,
        frequency: type.frequency,
        meta: type.meta as any,
      },
    });
  }

  console.log(`Seeded ${complianceTypes.length} compliance types`);

  console.log("Seeding test firm and admin users...");

  // Create or update a test firm
  const firm = await prisma.firm.upsert({
    where: { gstin: "TESTFIRMGSTIN" },
    update: {
      name: "Test CA Firm",
      address: "Test Address",
    },
    create: {
      name: "Test CA Firm",
      address: "Test Address",
      gstin: "TESTFIRMGSTIN",
    },
  });

  // Create or update a CA admin user with full permissions
  const caPasswordHash = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      name: "Admin User",
      passwordHash: caPasswordHash,
      role: "CA_ADMIN",
      firmId: firm.id,
      canViewClients: true,
      canEditClients: true,
      canAccessDocuments: true,
      canAccessTasks: true,
      canAccessCalendar: true,
      canAccessChat: true,
    },
    create: {
      name: "Admin User",
      email: "admin@example.com",
      passwordHash: caPasswordHash,
      role: "CA_ADMIN",
      firmId: firm.id,
      canViewClients: true,
      canEditClients: true,
      canAccessDocuments: true,
      canAccessTasks: true,
      canAccessCalendar: true,
      canAccessChat: true,
    },
  });

  // Create or update platform SUPER_ADMIN (no firm)
  const superPasswordHash = await bcrypt.hash("superadmin123", 10);

  await prisma.user.upsert({
    where: { email: "root@platform.local" },
    update: {
      name: "Platform Super Admin",
      passwordHash: superPasswordHash,
      role: "SUPER_ADMIN",
      firmId: null,
      canViewClients: false,
      canEditClients: false,
      canAccessDocuments: false,
      canAccessTasks: false,
      canAccessCalendar: false,
      canAccessChat: false,
    },
    create: {
      name: "Platform Super Admin",
      email: "root@platform.local",
      passwordHash: superPasswordHash,
      role: "SUPER_ADMIN",
      firmId: null,
      canViewClients: false,
      canEditClients: false,
      canAccessDocuments: false,
      canAccessTasks: false,
      canAccessCalendar: false,
      canAccessChat: false,
    },
  });

  console.log("Seeded admin@example.com / admin123 (CA admin)");
  console.log("Seeded root@platform.local / superadmin123 (SUPER_ADMIN)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

