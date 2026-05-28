import type { PrismaClient } from "@prisma/client";
import { Rng } from "./rng";
import type { CycleRef } from "./payroll";
import type { SeededEmployee } from "./people";

const GUEST_HOUSES = [
  { name: "Pune GH-1", flats: 12, location: "Pune" },
  { name: "Pune GH-2", flats: 16, location: "Pune" },
  { name: "Bengaluru Saraswati", flats: 20, location: "Bengaluru HQ" },
  { name: "Bengaluru Tilak", flats: 14, location: "Bengaluru HQ" },
  { name: "Hyderabad Hitech", flats: 10, location: "Hyderabad" },
];

export async function seedHostelAllocations(
  prisma: PrismaClient,
  cycles: CycleRef[],
  employees: SeededEmployee[],
) {
  const rng = new Rng(0x4f535448); // "HOST"

  // Pick ~25% of employees from Pune/Bengaluru/Hyderabad to live in guest houses
  const candidates = employees.filter((e) =>
    ["Pune", "Bengaluru HQ", "Hyderabad"].includes(e.location),
  );
  const allocated = candidates.filter(() => rng.bool(0.25));

  // Make sure EMP-0349 (anchored anomaly target) is in the allocation list
  if (!allocated.find((e) => e.empId === "EMP-0349")) {
    const target = employees.find((e) => e.empId === "EMP-0349");
    if (target) allocated.push(target);
  }

  let count = 0;
  for (const cycle of cycles) {
    for (const e of allocated) {
      const gh = GUEST_HOUSES.find((g) => g.location === e.location)
        ?? rng.pick(GUEST_HOUSES);
      const flatNo = String(rng.intBetween(101, 405));
      const accommodation = BigInt(rng.intBetween(5000, 9000)) * 100n;
      const maintenance = BigInt(rng.intBetween(400, 800)) * 100n;
      const food = BigInt(rng.intBetween(3500, 5500)) * 100n;
      const transport = rng.bool(0.4) ? BigInt(rng.intBetween(500, 1500)) * 100n : 0n;
      const electricity = BigInt(rng.intBetween(600, 1200)) * 100n;
      const internet = BigInt(rng.intBetween(300, 500)) * 100n;
      const total = accommodation + maintenance + food + transport + electricity + internet;

      await prisma.hostelAllocation.upsert({
        where: { cycleId_empId: { cycleId: cycle.id, empId: e.empId } },
        update: {},
        create: {
          cycleId: cycle.id,
          empId: e.empId,
          guestHouse: gh.name,
          flatNo,
          accommodationPaise: accommodation,
          maintenancePaise: maintenance,
          foodPaise: food,
          transportPaise: transport,
          electricityPaise: electricity,
          internetPaise: internet,
          totalPaise: total,
        },
      });

      // Push the total into the matching PayrollLine.guesthouseDedPaise so payroll reflects hostel
      await prisma.payrollLine.updateMany({
        where: { empId: e.empId, run: { cycleId: cycle.id } },
        data: { guesthouseDedPaise: total },
      });

      count++;
    }
  }

  console.log(`  ✓ ${count} hostel allocations across ${cycles.length} cycles`);
}
