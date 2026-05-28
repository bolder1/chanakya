import type { PrismaClient } from "@prisma/client";
import { Rng } from "./rng";
import type { CycleRef } from "./payroll";
import type { VendorRef } from "./vendors";

const CATEGORIES = [
  { name: "Laptops", monthlyBudgetPaise: 7_00_000_00n, owner: "ops@miniorange.test", primaryVendor: "VEN-014", unitDefault: "UNIT" as const },
  { name: "Office Equipment", monthlyBudgetPaise: 1_50_000_00n, owner: "ops@miniorange.test", primaryVendor: "VEN-008", unitDefault: "UNIT" as const },
  { name: "Vegetables & Pantry", monthlyBudgetPaise: 7_50_000_00n, owner: "ops@miniorange.test", primaryVendor: "VEN-026", unitDefault: "KG" as const },
  { name: "Conference Catering", monthlyBudgetPaise: 4_00_000_00n, owner: "ops@miniorange.test", primaryVendor: "VEN-019", unitDefault: "UNIT" as const },
  { name: "Hostel Maintenance", monthlyBudgetPaise: 2_50_000_00n, owner: "ops@miniorange.test", primaryVendor: "VEN-010", unitDefault: "UNIT" as const },
  { name: "Marketing Services", monthlyBudgetPaise: 12_00_000_00n, owner: "marketing@miniorange.test", primaryVendor: "VEN-018", unitDefault: "UNIT" as const },
  { name: "Travel & Hotels", monthlyBudgetPaise: 6_00_000_00n, owner: "ops@miniorange.test", primaryVendor: "VEN-031", unitDefault: "UNIT" as const },
  { name: "Stationery & Printing", monthlyBudgetPaise: 75_000_00n, owner: "ops@miniorange.test", primaryVendor: "VEN-006", unitDefault: "PACK" as const },
];

export async function seedProcurement(
  prisma: PrismaClient,
  cycles: CycleRef[],
  vendors: VendorRef[],
) {
  const rng = new Rng(0x50524f43); // "PROC"

  // Categories
  const catRefs: Record<string, { id: string; primaryVendorId: string; unit: "UNIT" | "KG" | "PACK" }> = {};
  for (const c of CATEGORIES) {
    const pv = vendors.find((v) => v.code === c.primaryVendor);
    if (!pv) continue;
    const created = await prisma.procurementCategory.upsert({
      where: { name: c.name },
      update: { monthlyBudgetPaise: c.monthlyBudgetPaise, owner: c.owner },
      create: { name: c.name, monthlyBudgetPaise: c.monthlyBudgetPaise, owner: c.owner },
    });
    catRefs[c.name] = { id: created.id, primaryVendorId: pv.id, unit: c.unitDefault };
  }

  // ~12–60 entries per category per cycle
  let entries = 0;
  for (const cycle of cycles) {
    for (const c of CATEGORIES) {
      const cat = catRefs[c.name];
      if (!cat) continue;
      const baseCount =
        c.name === "Vegetables & Pantry" ? 60 :
        c.name === "Marketing Services" ? 14 :
        c.name === "Conference Catering" ? 8 :
        c.name === "Laptops" ? 6 :
        c.name === "Office Equipment" ? 12 :
        16;
      const count = rng.intBetween(Math.max(4, baseCount - 6), baseCount + 6);
      for (let i = 0; i < count; i++) {
        const day = rng.intBetween(1, cycle.totalDays);
        const occurred = new Date(cycle.periodStart);
        occurred.setDate(day);
        const qty = cat.unit === "KG" ? rng.intBetween(5, 80) : rng.intBetween(1, 12);
        const unitPaise =
          c.name === "Laptops" ? BigInt(rng.intBetween(75_000, 95_000)) * 100n :
          c.name === "Vegetables & Pantry" ? BigInt(rng.intBetween(30, 60)) * 100n :
          c.name === "Office Equipment" ? BigInt(rng.intBetween(2_500, 18_000)) * 100n :
          c.name === "Conference Catering" ? BigInt(rng.intBetween(40_000, 90_000)) * 100n :
          c.name === "Hostel Maintenance" ? BigInt(rng.intBetween(1_500, 8_000)) * 100n :
          c.name === "Marketing Services" ? BigInt(rng.intBetween(25_000, 150_000)) * 100n :
          c.name === "Travel & Hotels" ? BigInt(rng.intBetween(8_000, 60_000)) * 100n :
          BigInt(rng.intBetween(200, 5_000)) * 100n;
        const total = unitPaise * BigInt(qty);
        await prisma.procurementEntry.create({
          data: {
            categoryId: cat.id,
            vendorId: cat.primaryVendorId,
            occurredOn: occurred,
            description: descriptionFor(c.name, rng),
            unit: cat.unit,
            quantity: qty,
            unitPricePaise: unitPaise,
            totalPaise: total,
            location: rng.pick(["Pune", "Bengaluru HQ", "Hyderabad", "Mumbai"]),
          },
        });
        entries++;
      }
    }
  }

  console.log(`  ✓ ${entries} procurement entries across ${cycles.length} cycles`);
}

function descriptionFor(category: string, rng: Rng): string {
  switch (category) {
    case "Vegetables & Pantry":
      return rng.pick(["Tomatoes", "Onions", "Potatoes", "Bananas", "Apples", "Lentils — toor dal", "Rice — basmati", "Tea", "Coffee", "Sugar"]);
    case "Laptops":
      return rng.pick(["Dell Latitude 5440", "MacBook Air M3 13\"", "Lenovo ThinkPad P14s"]);
    case "Office Equipment":
      return rng.pick(["Conference chairs", "Desk lamps", "Standing desk converters", "Printers", "Whiteboards"]);
    case "Conference Catering":
      return rng.pick(["Quarterly all-hands", "Customer dinner", "Engineering offsite lunch", "Sales kickoff catering"]);
    case "Marketing Services":
      return rng.pick(["Performance ads — Google", "LinkedIn campaigns", "Brand content production", "Event sponsorship"]);
    case "Travel & Hotels":
      return rng.pick(["Customer visit — Mumbai", "Conference travel — Bengaluru", "Sales travel — Delhi"]);
    case "Hostel Maintenance":
      return rng.pick(["Plumbing", "Electricians", "Cleaning services", "Pest control"]);
    case "Stationery & Printing":
      return rng.pick(["Notebooks", "Pens", "Letterheads", "Visiting cards"]);
    default:
      return "Misc";
  }
}
