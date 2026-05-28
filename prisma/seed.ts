/**
 * Chanakya — seed orchestrator.
 *
 * Order matters: people → cycles+payroll → hostel (rolls up into payroll
 * deductions) → vendors+invoices → procurement → connectors → anomalies
 * (plants fingerprints by mutating prior rows).
 *
 * Run via `pnpm db:seed`.
 */

import path from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.join(process.cwd(), ".env.local") });
loadEnv({ path: path.join(process.cwd(), ".env") });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedUsers, seedEmployees } from "../seed/people";
import { seedCyclesAndPayroll } from "../seed/payroll";
import { seedHostelAllocations } from "../seed/hostel";
import { seedVendors, seedPOsAndInvoices } from "../seed/vendors";
import { seedProcurement } from "../seed/procurement";
import { seedConnectors } from "../seed/connectors";
import { plantAnomalies } from "../seed/anomalies";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const adapter = new PrismaPg({ connectionString: url });
  const prisma = new PrismaClient({ adapter });

  console.log("Chanakya seed — start");
  const t0 = Date.now();

  // Clean slate — delete in reverse FK order so re-running the seed
  // is fully idempotent. (Schema is already migrated; we only nuke data.)
  console.log("• Cleaning prior data");
  await prisma.aIMessage.deleteMany({});
  await prisma.aIConversation.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.excelUpload.deleteMany({});
  await prisma.auditEntry.deleteMany({});
  await prisma.anomaly.deleteMany({});
  await prisma.procurementEntry.deleteMany({});
  await prisma.procurementCategory.deleteMany({});
  await prisma.invoiceLine.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.purchaseOrderLine.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.vendor.deleteMany({});
  await prisma.hostelAllocation.deleteMany({});
  await prisma.shiftEntry.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.payrollLine.deleteMany({});
  await prisma.payrollRun.deleteMany({});
  await prisma.cycle.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.connector.deleteMany({});
  // Users are kept across runs so passwordHash isn't re-hashed every time.

  console.log("• Users");
  await seedUsers(prisma);

  console.log("• Employees");
  const employees = await seedEmployees(prisma);

  console.log("• Cycles + payroll + attendance + shift");
  const cycles = await seedCyclesAndPayroll(prisma, employees);

  console.log("• Hostel allocations");
  await seedHostelAllocations(prisma, cycles, employees);

  console.log("• Vendors + invoices");
  const vendors = await seedVendors(prisma);
  await seedPOsAndInvoices(prisma, vendors, cycles);

  console.log("• Procurement");
  await seedProcurement(prisma, cycles, vendors);

  console.log("• Connectors");
  await seedConnectors(prisma);

  console.log("• Anomalies (plant fingerprints)");
  await plantAnomalies(prisma, cycles);

  await prisma.$disconnect();
  console.log(`✓ Chanakya seed — done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
