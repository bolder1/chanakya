import type { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { Rng } from "./rng";
import { FIRST_NAMES_MALE, FIRST_NAMES_FEMALE } from "./dictionaries/firstNames.in";
import { SURNAMES } from "./dictionaries/surnames.in";
import { DEPARTMENTS, LOCATIONS } from "./dictionaries/departments";

export const TOTAL_EMPLOYEES = 486;

export interface SeededEmployee {
  empId: string;
  externalId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  location: string;
  doj: Date;
  ctcAnnualPaise: bigint;
  basicMonthlyPaise: bigint;
}

/** Seed the 6 demo role users + 3 extras. */
export async function seedUsers(prisma: PrismaClient) {
  const passwordHash = await hash("demo", 10);
  const users: { email: string; name: string; role: "CFO_FINANCE" | "HR_OPS" | "VENDOR_MGR" | "OPS_MGR" | "LEADERSHIP_RO" | "SYS_ADMIN"; team: string | null }[] = [
    { email: "cfo@miniorange.test", name: "Surajit Roy", role: "CFO_FINANCE", team: "Finance" },
    { email: "hrops@miniorange.test", name: "Anita Nair", role: "HR_OPS", team: "People Ops" },
    { email: "vendor@miniorange.test", name: "Ravi Iyer", role: "VENDOR_MGR", team: "Vendor Management" },
    { email: "ops@miniorange.test", name: "Karthik Patil", role: "OPS_MGR", team: "Admin & Facilities" },
    { email: "leadership@miniorange.test", name: "Priya Banerjee", role: "LEADERSHIP_RO", team: "Leadership" },
    { email: "sysadmin@miniorange.test", name: "Arjun Sharma", role: "SYS_ADMIN", team: "IT & InfoSec" },
    { email: "cfo2@miniorange.test", name: "Vikram Mehrotra", role: "CFO_FINANCE", team: "Finance" },
    { email: "hr2@miniorange.test", name: "Sneha Joshi", role: "HR_OPS", team: "People Ops" },
    { email: "ops2@miniorange.test", name: "Pradeep Reddy", role: "OPS_MGR", team: "Admin & Facilities" },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash, role: u.role, name: u.name, team: u.team },
      create: { ...u, passwordHash, active: true },
    });
  }
  console.log(`  ✓ ${users.length} role users seeded`);
}

/** Seed 486 employees + the canonical anomaly-target employees baked in. */
export async function seedEmployees(prisma: PrismaClient): Promise<SeededEmployee[]> {
  const rng = new Rng(0x434841_4e); // "CHAN"
  const employees: SeededEmployee[] = [];

  // Canonical anomaly-target employees — baked in at known IDs so anomalies.ts can find them.
  const anchored: Omit<SeededEmployee, "externalId" | "email">[] = [
    { empId: "EMP-0142", name: "Aarav Mehta",     department: "Engineering / Security Products", designation: "Sr. Engineer",       location: "Pune",       doj: new Date("2022-07-11"), ctcAnnualPaise: 14_40_000_00n, basicMonthlyPaise: 1_02_400_00n },
    { empId: "EMP-0317", name: "Diya Iyer",       department: "IAM Sales",                       designation: "Account Executive",  location: "Bengaluru HQ", doj: new Date("2023-03-22"), ctcAnnualPaise: 11_00_000_00n, basicMonthlyPaise: 78_500_00n },
    { empId: "EMP-0205", name: "Rohan Pillai",    department: "DevOps & SRE",                    designation: "Sr. DevOps Engineer", location: "Pune",       doj: new Date("2021-11-04"), ctcAnnualPaise: 12_60_000_00n, basicMonthlyPaise: 68_000_00n },
    { empId: "EMP-0481", name: "Shreya Banerjee", department: "Customer Success — APAC",         designation: "CSM",                location: "Remote — India", doj: new Date("2026-04-19"), ctcAnnualPaise: 9_60_000_00n, basicMonthlyPaise: 72_000_00n },
    { empId: "EMP-0226", name: "Priyanka Joshi",  department: "GTM / Marketing",                 designation: "Marketing Manager",  location: "Mumbai",     doj: new Date("2022-09-15"), ctcAnnualPaise: 13_50_000_00n, basicMonthlyPaise: 86_000_00n },
    { empId: "EMP-0117", name: "Anand Krishnan",  department: "Support — Night Shift",           designation: "Sr. Support Engineer", location: "Bengaluru HQ", doj: new Date("2019-06-03"), lwd: new Date("2026-04-14"), ctcAnnualPaise: 11_40_000_00n, basicMonthlyPaise: 80_000_00n } as never,
    { empId: "EMP-0408", name: "Meera Subramanian", department: "Support — Night Shift",         designation: "Support Engineer",   location: "Bengaluru HQ", doj: new Date("2024-01-20"), ctcAnnualPaise: 7_80_000_00n, basicMonthlyPaise: 52_000_00n },
    { empId: "EMP-0349", name: "Vikram Choudhary", department: "Engineering / Security Products", designation: "Software Engineer", location: "Pune",       doj: new Date("2024-05-13"), ctcAnnualPaise: 8_40_000_00n, basicMonthlyPaise: 58_000_00n },
    { empId: "EMP-0091", name: "Karthik Nair",    department: "Finance & Compliance",            designation: "Finance Analyst",    location: "Bengaluru HQ", doj: new Date("2023-08-07"), ctcAnnualPaise: 10_20_000_00n, basicMonthlyPaise: 72_000_00n },
  ];

  for (const a of anchored) {
    const ext = String(20_000 + rng.intBetween(0, 9999));
    const email = a.name.toLowerCase().replace(/[^a-z0-9]+/g, ".") + "@miniorange.test";
    const lwd = "lwd" in a ? ((a as unknown) as { lwd?: Date }).lwd : undefined;
    employees.push({ ...a, externalId: ext, email });
    await prisma.employee.upsert({
      where: { empId: a.empId },
      update: {},
      create: {
        empId: a.empId,
        externalId: ext,
        name: a.name,
        email,
        department: a.department,
        designation: a.designation,
        location: a.location,
        doj: a.doj,
        lwd: lwd ?? null,
        ctcAnnualPaise: a.ctcAnnualPaise,
        basicMonthlyPaise: a.basicMonthlyPaise,
        active: lwd ? false : true,
      },
    });
  }

  // Fill remaining headcount across departments per ratio.
  const anchoredIds = new Set(anchored.map((a) => a.empId));
  let nextSeq = 1;
  for (const dept of DEPARTMENTS) {
    const count = Math.round(TOTAL_EMPLOYEES * dept.ratio);
    for (let i = 0; i < count && employees.length < TOTAL_EMPLOYEES; i++) {
      while (anchoredIds.has(`EMP-${String(nextSeq).padStart(4, "0")}`)) nextSeq++;
      const empId = `EMP-${String(nextSeq).padStart(4, "0")}`;
      nextSeq++;
      anchoredIds.add(empId);

      const isFemale = rng.bool(0.35);
      const first = rng.pick(isFemale ? FIRST_NAMES_FEMALE : FIRST_NAMES_MALE);
      const last = rng.pick(SURNAMES);
      const name = `${first} ${last}`;
      const slug = empId.replace("EMP-", "").toLowerCase();
      const email = `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-z0-9]/g, "")}.${slug}@miniorange.test`;
      const band = rng.pick(dept.designations);
      const basic = rng.intBetween(band.basicMinPaise, band.basicMaxPaise);
      // CTC ~ 1.7×–2.0× annual basic (HRA + employer PF + variable)
      const ctc = Math.round(basic * 12 * rng.floatBetween(1.7, 2.0));
      const dojYear = rng.intBetween(2018, 2025);
      const dojMonth = rng.intBetween(0, 11);
      const dojDay = rng.intBetween(1, 28);
      const location = rng.weighted(LOCATIONS).name;

      const ext = String(20_000 + rng.intBetween(10_000, 99_999));
      employees.push({
        empId,
        externalId: ext,
        name,
        email,
        department: dept.name,
        designation: band.designation,
        location,
        doj: new Date(dojYear, dojMonth, dojDay),
        ctcAnnualPaise: BigInt(ctc),
        basicMonthlyPaise: BigInt(basic),
      });

      await prisma.employee.create({
        data: {
          empId,
          externalId: ext,
          name,
          email,
          department: dept.name,
          designation: band.designation,
          location,
          doj: new Date(dojYear, dojMonth, dojDay),
          ctcAnnualPaise: BigInt(ctc),
          basicMonthlyPaise: BigInt(basic),
          active: true,
        },
      });
    }
  }

  console.log(`  ✓ ${employees.length} employees seeded`);
  return employees;
}
