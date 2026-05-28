import type { VendorCategory } from "@prisma/client";

export interface VendorSeed {
  code: string;
  legalName: string;
  category: VendorCategory;
  gstin: string;
  paymentTermsDays: number;
}

// 40+ vendors with believable Indian provenance.
// GSTINs are syntactically valid format but use checksum-failing tails
// where appropriate for the planted GSTIN-invalid anomaly (Madhuri Catering).

export const VENDORS: VendorSeed[] = [
  // Hardware (laptops, equipment)
  { code: "VEN-001", legalName: "TechPro Distributors Pvt Ltd", category: "HARDWARE", gstin: "27AABCT1234A1Z5", paymentTermsDays: 30 },
  { code: "VEN-008", legalName: "NorthStar Office Supplies Pvt Ltd", category: "HARDWARE", gstin: "07AABCN5678B1Z2", paymentTermsDays: 30 },
  { code: "VEN-014", legalName: "DataDrive Hardware Solutions Pvt Ltd", category: "HARDWARE", gstin: "29AABCD9876C1Z8", paymentTermsDays: 45 },
  { code: "VEN-027", legalName: "Bharat Compu Tech Pvt Ltd", category: "HARDWARE", gstin: "27AABCB4567D1Z9", paymentTermsDays: 30 },
  { code: "VEN-038", legalName: "Apex IT Equipment & Services", category: "HARDWARE", gstin: "29AABCA1122E1Z4", paymentTermsDays: 30 },
  // SaaS
  { code: "VEN-002", legalName: "CloudWise Subscriptions Pvt Ltd", category: "SAAS", gstin: "27AAACR0001F1Z6", paymentTermsDays: 15 },
  { code: "VEN-007", legalName: "SahyadriTech Services Pvt Ltd", category: "SAAS", gstin: "27AAACS2233G1Z3", paymentTermsDays: 30 },
  { code: "VEN-023", legalName: "Kavi Cloud Labs Pvt Ltd", category: "SAAS", gstin: "29AAACK4455H1Z2", paymentTermsDays: 30 },
  { code: "VEN-029", legalName: "Indus SoftServ Pvt Ltd", category: "SAAS", gstin: "07AAACI6677J1Z1", paymentTermsDays: 30 },
  // Professional services
  { code: "VEN-003", legalName: "Krishna Legal Advisors LLP", category: "PROFESSIONAL", gstin: "27AAFCK8899K1Z7", paymentTermsDays: 30 },
  { code: "VEN-009", legalName: "Acharya & Associates Chartered Accountants", category: "PROFESSIONAL", gstin: "29AAFCA3344L1Z0", paymentTermsDays: 45 },
  { code: "VEN-031", legalName: "Kaveri Travel House Pvt Ltd", category: "TRAVEL", gstin: "29AABCK5566M1Z8", paymentTermsDays: 30 },
  { code: "VEN-034", legalName: "Nilgiri Consulting Group", category: "PROFESSIONAL", gstin: "27AABCN7788N1Z2", paymentTermsDays: 30 },
  // Facility / Office
  { code: "VEN-004", legalName: "Pune Realty Estates Pvt Ltd", category: "FACILITY", gstin: "27AABCP1100A1ZZ", paymentTermsDays: 15 },
  { code: "VEN-010", legalName: "Saraswati Property Management", category: "FACILITY", gstin: "29AABCS2211B1Z3", paymentTermsDays: 30 },
  { code: "VEN-015", legalName: "Bharat Facilities Services Pvt Ltd", category: "FACILITY", gstin: "27AABCB3322C1Z4", paymentTermsDays: 30 },
  { code: "VEN-035", legalName: "Konark Maintenance & Services", category: "FACILITY", gstin: "21AABCK4433D1Z5", paymentTermsDays: 30 },
  // Food / Pantry
  { code: "VEN-019", legalName: "Madhuri Catering Services Pvt Ltd", category: "FOOD", gstin: "27AAACM1234X1ZZ", paymentTermsDays: 30 },
  { code: "VEN-026", legalName: "Annapurna Mart Pvt Ltd", category: "FOOD", gstin: "29AAACA5544E1Z6", paymentTermsDays: 15 },
  { code: "VEN-033", legalName: "Maharaja Caterers", category: "FOOD", gstin: "27AAACM6655F1Z7", paymentTermsDays: 30 },
  { code: "VEN-040", legalName: "Tasty Bites Express", category: "FOOD", gstin: "29AAACT7766G1Z8", paymentTermsDays: 30 },
  { code: "VEN-041", legalName: "Sweet Bengal Confectioners", category: "FOOD", gstin: "19AAACS8877H1Z9", paymentTermsDays: 15 },
  // Logistics / Travel
  { code: "VEN-022", legalName: "Bharat Logistics Pvt Ltd", category: "LOGISTICS", gstin: "27AABCB9988J1Z0", paymentTermsDays: 30 },
  { code: "VEN-024", legalName: "GoFleet Transport Services", category: "LOGISTICS", gstin: "29AABCG1199K1Z1", paymentTermsDays: 30 },
  { code: "VEN-036", legalName: "Sahyadri Couriers Pvt Ltd", category: "LOGISTICS", gstin: "27AABCS2200L1Z2", paymentTermsDays: 30 },
  // Marketing
  { code: "VEN-005", legalName: "BlueWave Digital Marketing Pvt Ltd", category: "MARKETING", gstin: "29AAACB3311M1Z3", paymentTermsDays: 30 },
  { code: "VEN-011", legalName: "Anant Creatives & Branding LLP", category: "MARKETING", gstin: "27AAFCA4422N1Z4", paymentTermsDays: 30 },
  { code: "VEN-018", legalName: "Vajra Performance Media Pvt Ltd", category: "MARKETING", gstin: "29AAACV5533P1Z5", paymentTermsDays: 30 },
  { code: "VEN-039", legalName: "Granular Insights Analytics Pvt Ltd", category: "MARKETING", gstin: "07AAACG6644Q1Z6", paymentTermsDays: 30 },
  // Other
  { code: "VEN-006", legalName: "Mahalaxmi Stationery Suppliers", category: "OTHER", gstin: "27AAACM7755R1Z7", paymentTermsDays: 15 },
  { code: "VEN-012", legalName: "Sanjeevani Medical Insurance Brokers", category: "OTHER", gstin: "29AAACS8866S1Z8", paymentTermsDays: 30 },
  { code: "VEN-013", legalName: "Pratham Security Services Pvt Ltd", category: "OTHER", gstin: "27AAACP9977T1Z9", paymentTermsDays: 30 },
  { code: "VEN-016", legalName: "Surya Power & Backup Solutions", category: "OTHER", gstin: "27AAACS0088U1Z0", paymentTermsDays: 30 },
  { code: "VEN-017", legalName: "Tata SkyView Communications", category: "OTHER", gstin: "27AAACT1199V1Z1", paymentTermsDays: 30 },
  { code: "VEN-020", legalName: "Reliance Internet Pvt Ltd", category: "OTHER", gstin: "27AABCR2200W1Z2", paymentTermsDays: 30 },
  { code: "VEN-021", legalName: "Mahindra Office Cars Pvt Ltd", category: "OTHER", gstin: "27AABCM3311X1Z3", paymentTermsDays: 30 },
  { code: "VEN-025", legalName: "Pidilite Specialty Cleaning", category: "OTHER", gstin: "29AABCP4422Y1Z4", paymentTermsDays: 30 },
  { code: "VEN-028", legalName: "Hindustan Furniture Mfrs", category: "OTHER", gstin: "27AABCH5533Z1Z5", paymentTermsDays: 30 },
  { code: "VEN-030", legalName: "Khimji Ramdas Trading", category: "OTHER", gstin: "27AABCK6644A1Z6", paymentTermsDays: 30 },
  { code: "VEN-032", legalName: "Adani Power Services", category: "OTHER", gstin: "24AABCA7755B1Z7", paymentTermsDays: 30 },
  { code: "VEN-037", legalName: "Godrej Office Interiors", category: "OTHER", gstin: "27AABCG8866C1Z8", paymentTermsDays: 30 },
];
