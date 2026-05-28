import type { PrismaClient } from "@prisma/client";

export async function seedConnectors(prisma: PrismaClient) {
  const now = new Date();
  const connectors = [
    { slug: "zoho_people", displayName: "Zoho People", status: "CONNECTED" as const, lastSyncAt: new Date(now.getTime() - 12 * 60_000), lastSyncOk: true },
    { slug: "zoho_payroll", displayName: "Zoho Payroll", status: "CONNECTED" as const, lastSyncAt: new Date(now.getTime() - 3 * 60 * 60_000), lastSyncOk: true },
    { slug: "tally", displayName: "Tally Prime", status: "DEGRADED" as const, lastSyncAt: new Date(now.getTime() - 26 * 60 * 60_000), lastSyncOk: false, lastError: "Connection timeout — retry" },
    { slug: "email_inbox", displayName: "Email inbox — invoices@chanakya.app", status: "CONNECTED" as const, lastSyncAt: new Date(now.getTime() - 7 * 60_000), lastSyncOk: true },
    { slug: "slack", displayName: "Slack alerts", status: "CONNECTED" as const, lastSyncAt: new Date(now.getTime() - 1 * 60 * 60_000), lastSyncOk: true },
    { slug: "whatsapp", displayName: "WhatsApp Business", status: "DISCONNECTED" as const, lastSyncAt: null, lastSyncOk: false },
  ];
  for (const c of connectors) {
    await prisma.connector.upsert({
      where: { slug: c.slug },
      update: { status: c.status, lastSyncAt: c.lastSyncAt ?? undefined, lastSyncOk: c.lastSyncOk, lastError: c.lastError ?? null },
      create: c,
    });
  }
  console.log(`  ✓ ${connectors.length} connectors seeded`);
}
