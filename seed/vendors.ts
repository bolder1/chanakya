import type { PrismaClient } from "@prisma/client";
import { Rng } from "./rng";
import { VENDORS } from "./dictionaries/vendorNames";
import type { CycleRef } from "./payroll";

export interface VendorRef {
  id: string;
  code: string;
  legalName: string;
  category: string;
}

export async function seedVendors(prisma: PrismaClient): Promise<VendorRef[]> {
  const refs: VendorRef[] = [];
  for (const v of VENDORS) {
    const created = await prisma.vendor.upsert({
      where: { code: v.code },
      update: { legalName: v.legalName, gstin: v.gstin, category: v.category, paymentTermsDays: v.paymentTermsDays },
      create: {
        code: v.code,
        legalName: v.legalName,
        gstin: v.gstin,
        category: v.category,
        paymentTermsDays: v.paymentTermsDays,
        status: "ACTIVE",
        primaryContact: `accounts@${v.code.toLowerCase()}.example`,
      },
    });
    refs.push({ id: created.id, code: created.code, legalName: created.legalName, category: created.category });
  }
  console.log(`  ✓ ${refs.length} vendors seeded`);
  return refs;
}

export async function seedPOsAndInvoices(
  prisma: PrismaClient,
  vendors: VendorRef[],
  cycles: CycleRef[],
) {
  const rng = new Rng(0x504f5648); // "POVH"
  let poCount = 0;
  let invCount = 0;

  // Per-vendor recurring invoices across cycles + occasional POs
  for (const v of vendors) {
    const cadence = pickCadence(v.category, rng);
    for (let i = 0; i < cycles.length; i++) {
      const cycle = cycles[i]!;
      if (i % cadence === 0 || rng.bool(0.25)) {
        const issued = new Date(cycle.periodStart);
        issued.setDate(rng.intBetween(2, 25));
        const received = new Date(issued);
        received.setDate(issued.getDate() + rng.intBetween(0, 3));

        const lineCount = rng.intBetween(1, 6);
        const lines: { lineNo: number; description: string; quantity: number; unitPricePaise: bigint; taxPct: number; totalPaise: bigint }[] = [];
        let subtotal = 0n;
        for (let l = 0; l < lineCount; l++) {
          const qty = rng.intBetween(1, 25);
          const unitPaise = BigInt(rng.intBetween(2_000, 95_000)) * 100n;
          const lineTotal = unitPaise * BigInt(qty);
          subtotal += lineTotal;
          lines.push({
            lineNo: l + 1,
            description: lineDescription(v.category, rng),
            quantity: qty,
            unitPricePaise: unitPaise,
            taxPct: 18,
            totalPaise: lineTotal,
          });
        }
        const tax = (subtotal * 18n) / 100n;
        const tds = rng.bool(0.4) ? (subtotal * 2n) / 100n : 0n;
        const total = subtotal + tax;

        const invoiceNumber = `INV-${cycle.label}-${v.code.replace("VEN-", "")}-${String(i).padStart(2, "0")}`;
        try {
          await prisma.invoice.create({
            data: {
              invoiceNumber,
              vendorId: v.id,
              issuedOn: issued,
              receivedOn: received,
              dueOn: new Date(received.getTime() + 30 * 86400000),
              subtotalPaise: subtotal,
              taxPaise: tax,
              tdsPaise: tds,
              totalPaise: total,
              status: i === cycles.length - 1 ? "RECEIVED" : "PAID",
              source: rng.weighted([
                { weight: 0.7, val: "UPLOAD" as const },
                { weight: 0.2, val: "EMAIL" as const },
                { weight: 0.05, val: "PORTAL" as const },
                { weight: 0.05, val: "MANUAL" as const },
              ]).val,
              lines: { create: lines },
            },
          });
          invCount++;
        } catch {
          // unique violation — skip
        }
      }
    }
  }

  console.log(`  ✓ ${poCount} POs + ${invCount} invoices generated`);
}

function pickCadence(category: string, rng: Rng): number {
  if (category === "FOOD") return 1; // every cycle
  if (category === "SAAS") return 1; // monthly
  if (category === "FACILITY") return 1;
  if (category === "LOGISTICS") return rng.intBetween(1, 2);
  if (category === "HARDWARE") return rng.intBetween(2, 4);
  if (category === "MARKETING") return rng.intBetween(1, 3);
  return rng.intBetween(2, 4);
}

function lineDescription(category: string, rng: Rng): string {
  switch (category) {
    case "HARDWARE":
      return rng.pick([
        "Dell Latitude 5440 — i7/16GB/512GB",
        "MacBook Air M3 13-inch — 16GB/256GB",
        "Lenovo ThinkPad P14s — 32GB/1TB",
        "Logitech MX Master 3S mouse",
        "Dell Ultrasharp U2723QE 27\" monitor",
        "HP LaserJet Pro M404n",
      ]);
    case "SAAS":
      return rng.pick([
        "Productivity suite — monthly subscription",
        "SaaS license renewal — Enterprise tier",
        "Security tooling — annual seat allocation",
        "Observability platform — monthly bill",
      ]);
    case "FOOD":
      return rng.pick([
        "Lunch catering — Bengaluru HQ",
        "Pantry supplies — biscuits/snacks",
        "Conference dinner — 80 pax",
        "Tea & coffee monthly supply",
        "Fresh vegetables and pantry produce",
      ]);
    case "FACILITY":
      return rng.pick([
        "Office rent — monthly",
        "Maintenance services — common areas",
        "Housekeeping monthly contract",
      ]);
    case "LOGISTICS":
      return rng.pick([
        "Last-mile delivery — Pune",
        "Inter-office courier — monthly",
        "Equipment shipping — Bengaluru → Pune",
      ]);
    case "TRAVEL":
      return rng.pick([
        "Hotel — Conference April",
        "Domestic flights — sales travel",
        "Cab booking — monthly invoice",
      ]);
    case "MARKETING":
      return rng.pick([
        "Performance ads — Q2 spend",
        "Content production — case studies",
        "Event sponsorship",
        "Branding refresh",
      ]);
    default:
      return "Misc services";
  }
}
