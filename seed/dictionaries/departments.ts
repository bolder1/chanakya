// MiniOrange-style department + designation + salary band mapping.
// Bands are monthly basic (paise) — bumped per designation seniority.

export interface DesignationBand {
  designation: string;
  basicMinPaise: number;
  basicMaxPaise: number;
}

export interface Department {
  name: string;
  ratio: number; // share of the 486 headcount
  designations: DesignationBand[];
}

export const DEPARTMENTS: Department[] = [
  {
    name: "Engineering / Security Products",
    ratio: 0.32,
    designations: [
      { designation: "Software Engineer", basicMinPaise: 50_000_00, basicMaxPaise: 78_000_00 },
      { designation: "Sr. Engineer", basicMinPaise: 80_000_00, basicMaxPaise: 1_25_000_00 },
      { designation: "Staff Engineer", basicMinPaise: 1_40_000_00, basicMaxPaise: 1_85_000_00 },
      { designation: "Engineering Manager", basicMinPaise: 1_60_000_00, basicMaxPaise: 2_20_000_00 },
    ],
  },
  {
    name: "DevOps & SRE",
    ratio: 0.06,
    designations: [
      { designation: "DevOps Engineer", basicMinPaise: 60_000_00, basicMaxPaise: 1_00_000_00 },
      { designation: "Sr. DevOps Engineer", basicMinPaise: 1_05_000_00, basicMaxPaise: 1_60_000_00 },
    ],
  },
  {
    name: "IAM Sales",
    ratio: 0.12,
    designations: [
      { designation: "BDR", basicMinPaise: 32_000_00, basicMaxPaise: 48_000_00 },
      { designation: "Account Executive", basicMinPaise: 65_000_00, basicMaxPaise: 1_10_000_00 },
      { designation: "Sales Manager", basicMinPaise: 1_25_000_00, basicMaxPaise: 1_85_000_00 },
    ],
  },
  {
    name: "Customer Success — APAC",
    ratio: 0.08,
    designations: [
      { designation: "CSM", basicMinPaise: 55_000_00, basicMaxPaise: 95_000_00 },
      { designation: "Sr. CSM", basicMinPaise: 1_00_000_00, basicMaxPaise: 1_45_000_00 },
    ],
  },
  {
    name: "Finance & Compliance",
    ratio: 0.05,
    designations: [
      { designation: "Accountant", basicMinPaise: 38_000_00, basicMaxPaise: 60_000_00 },
      { designation: "Finance Analyst", basicMinPaise: 65_000_00, basicMaxPaise: 95_000_00 },
      { designation: "Finance Manager", basicMinPaise: 1_15_000_00, basicMaxPaise: 1_70_000_00 },
    ],
  },
  {
    name: "People Ops",
    ratio: 0.04,
    designations: [
      { designation: "HR Executive", basicMinPaise: 38_000_00, basicMaxPaise: 58_000_00 },
      { designation: "HR Business Partner", basicMinPaise: 80_000_00, basicMaxPaise: 1_25_000_00 },
    ],
  },
  {
    name: "Vendor Management",
    ratio: 0.03,
    designations: [
      { designation: "Procurement Analyst", basicMinPaise: 42_000_00, basicMaxPaise: 65_000_00 },
      { designation: "Vendor Manager", basicMinPaise: 85_000_00, basicMaxPaise: 1_30_000_00 },
    ],
  },
  {
    name: "Product Management",
    ratio: 0.04,
    designations: [
      { designation: "Product Manager", basicMinPaise: 1_00_000_00, basicMaxPaise: 1_55_000_00 },
      { designation: "Sr. Product Manager", basicMinPaise: 1_60_000_00, basicMaxPaise: 2_15_000_00 },
    ],
  },
  {
    name: "GTM / Marketing",
    ratio: 0.06,
    designations: [
      { designation: "Marketing Executive", basicMinPaise: 40_000_00, basicMaxPaise: 65_000_00 },
      { designation: "Marketing Manager", basicMinPaise: 95_000_00, basicMaxPaise: 1_45_000_00 },
    ],
  },
  {
    name: "Support — Night Shift",
    ratio: 0.10,
    designations: [
      { designation: "Support Engineer", basicMinPaise: 40_000_00, basicMaxPaise: 62_000_00 },
      { designation: "Sr. Support Engineer", basicMinPaise: 68_000_00, basicMaxPaise: 95_000_00 },
    ],
  },
  {
    name: "IT & InfoSec",
    ratio: 0.05,
    designations: [
      { designation: "IT Admin", basicMinPaise: 38_000_00, basicMaxPaise: 60_000_00 },
      { designation: "SecOps Analyst", basicMinPaise: 75_000_00, basicMaxPaise: 1_20_000_00 },
    ],
  },
  {
    name: "Leadership",
    ratio: 0.02,
    designations: [
      { designation: "Director", basicMinPaise: 2_25_000_00, basicMaxPaise: 3_25_000_00 },
      { designation: "VP", basicMinPaise: 3_50_000_00, basicMaxPaise: 5_00_000_00 },
    ],
  },
  {
    name: "Admin & Facilities",
    ratio: 0.03,
    designations: [
      { designation: "Office Admin", basicMinPaise: 25_000_00, basicMaxPaise: 42_000_00 },
      { designation: "Facilities Manager", basicMinPaise: 55_000_00, basicMaxPaise: 85_000_00 },
    ],
  },
];

export const LOCATIONS = [
  { name: "Pune", weight: 0.42 },
  { name: "Bengaluru HQ", weight: 0.28 },
  { name: "Hyderabad", weight: 0.12 },
  { name: "Mumbai", weight: 0.08 },
  { name: "Delhi NCR", weight: 0.05 },
  { name: "Remote — India", weight: 0.05 },
];
