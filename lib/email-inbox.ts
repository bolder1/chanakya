/**
 * Mock email inbox for invoices@chanakya.app.
 *
 * In production this would be fed by an IMAP/Microsoft Graph poll. For V1,
 * the inbox is a deterministic hardcoded set keyed off real seeded vendors,
 * so the demo can fire "process" and watch a real Invoice + audit appear.
 *
 * Each mock carries a parsed-invoice payload that's the result of pretending
 * we already ran OCR / AI parse on the attached PDF.
 */

import { prisma } from "@/lib/db";

export interface MockEmail {
  id: string;
  from: string;
  fromName: string;
  vendorCode: string;
  subject: string;
  receivedAt: Date;
  body: string;
  attachmentName: string;
  attachmentSizeKb: number;
  parsed: {
    invoiceNumber: string;
    issuedOn: Date;
    subtotalPaise: bigint;
    taxPaise: bigint;
    totalPaise: bigint;
    confidence: 1 | 2 | 3 | 4 | 5;
    lines: Array<{
      description: string;
      quantity: number;
      unitPricePaise: bigint;
      taxPct: number;
      totalPaise: bigint;
    }>;
  };
}

// Anchored to the active 2026-04 cycle dates so emails look fresh.
const REC = (daysAgo: number, hours: number = 9) => {
  const d = new Date("2026-04-29T00:00:00");
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hours, Math.floor(Math.random() * 60), 0, 0);
  return d;
};

// Deterministic dates (no Math.random for the date components in production)
function detRec(daysAgo: number, hour: number, minute: number): Date {
  const d = new Date("2026-04-29T00:00:00");
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export const MOCK_EMAILS: MockEmail[] = [
  {
    id: "MAIL-001",
    from: "billing@sahyadritech.in",
    fromName: "SahyadriTech Billing",
    vendorCode: "VEN-007",
    subject: "Invoice INV-ST-2026-05-92 · SaaS subscriptions April 2026",
    receivedAt: detRec(2, 10, 14),
    body: "Hi Accounts Team,\n\nPlease find attached the SaaS subscription invoice for April 2026. Auto-renewals across the standard plans plus one new seat upgrade.\n\nLet me know if anything looks off.\n\nThanks,\nMeena · SahyadriTech Services Pvt Ltd",
    attachmentName: "Invoice-ST-2026-05-92.pdf",
    attachmentSizeKb: 184,
    parsed: {
      invoiceNumber: "INV-ST-2026-05-92",
      issuedOn: detRec(2, 0, 0),
      subtotalPaise: 1_24_000_00n,
      taxPaise: 22_320_00n,
      totalPaise: 1_46_320_00n,
      confidence: 5,
      lines: [
        { description: "Productivity Suite — Standard × 28 seats", quantity: 28, unitPricePaise: 2_500_00n, taxPct: 18, totalPaise: 70_000_00n },
        { description: "Observability platform — monthly", quantity: 1, unitPricePaise: 36_000_00n, taxPct: 18, totalPaise: 36_000_00n },
        { description: "New seat upgrade — Pro tier", quantity: 6, unitPricePaise: 3_000_00n, taxPct: 18, totalPaise: 18_000_00n },
      ],
    },
  },
  {
    id: "MAIL-002",
    from: "accounts@bharatlogistics.co.in",
    fromName: "Bharat Logistics — Accounts",
    vendorCode: "VEN-022",
    subject: "Re: April delivery invoice + March short-pay clarification",
    receivedAt: detRec(1, 14, 32),
    body: "Hi Surajit,\n\nAttaching the consolidated April delivery invoice. Also flagging that the March invoice (INV-2026-04-119) appears short-paid by ₹64,500 against the PO — the Pune last-mile line was missed in your ledger. Happy to credit-note this if you'd prefer, or include it in this month's bill.\n\nRegards,\nSandeep · Bharat Logistics Pvt Ltd",
    attachmentName: "BharatLog-Apr-Inv.pdf",
    attachmentSizeKb: 312,
    parsed: {
      invoiceNumber: "INV-BL-2026-05-204",
      issuedOn: detRec(1, 0, 0),
      subtotalPaise: 3_18_000_00n,
      taxPaise: 38_160_00n,
      totalPaise: 3_56_160_00n,
      confidence: 4,
      lines: [
        { description: "Inter-city delivery — Pune ↔ Bengaluru", quantity: 22, unitPricePaise: 4_200_00n, taxPct: 12, totalPaise: 92_400_00n },
        { description: "Last-mile delivery — Pune", quantity: 18, unitPricePaise: 3_500_00n, taxPct: 12, totalPaise: 63_000_00n },
        { description: "Inter-office courier — monthly", quantity: 1, unitPricePaise: 1_62_600_00n, taxPct: 12, totalPaise: 1_62_600_00n },
      ],
    },
  },
  {
    id: "MAIL-003",
    from: "ar@madhuri-catering.com",
    fromName: "Madhuri Catering AR",
    vendorCode: "VEN-019",
    subject: "Quarterly all-hands catering — invoice attached",
    receivedAt: detRec(0, 9, 11),
    body: "Sir,\n\nKindly find attached our invoice for the recent all-hands lunch (~120 pax, Bengaluru HQ). Same menu as last quarter.\n\nNote: our GSTIN on this invoice is unchanged — please verify with your records.\n\nRegards,\nM. Pillai · Madhuri Catering Services Pvt Ltd",
    attachmentName: "Madhuri-AllHands-Apr.pdf",
    attachmentSizeKb: 96,
    parsed: {
      invoiceNumber: "INV-MC-2026-05-018",
      issuedOn: detRec(0, 0, 0),
      subtotalPaise: 84_000_00n,
      taxPaise: 4_200_00n,
      totalPaise: 88_200_00n,
      confidence: 5,
      lines: [
        { description: "Lunch service — 120 pax × ₹650", quantity: 120, unitPricePaise: 650_00n, taxPct: 5, totalPaise: 78_000_00n },
        { description: "Service + delivery (Bengaluru HQ)", quantity: 1, unitPricePaise: 6_000_00n, taxPct: 5, totalPaise: 6_000_00n },
      ],
    },
  },
  {
    id: "MAIL-004",
    from: "billing@datadrive.tech",
    fromName: "DataDrive Hardware",
    vendorCode: "VEN-014",
    subject: "Invoice — 4 × Dell Latitude 5440 (Engineering refresh)",
    receivedAt: detRec(0, 16, 47),
    body: "Hi Procurement Team,\n\nDelivery of 4 × Dell Latitude 5440 i7/16GB/512GB completed today to your Pune office. Invoice attached.\n\nUnit price reflects our updated SKU list — please review if this is unexpected.\n\nThanks,\nKavita · DataDrive Hardware Solutions Pvt Ltd",
    attachmentName: "DataDrive-Apr-Latitudes.pdf",
    attachmentSizeKb: 78,
    parsed: {
      invoiceNumber: "INV-DD-2026-05-441",
      issuedOn: detRec(0, 0, 0),
      subtotalPaise: 3_72_800_00n,
      taxPaise: 67_104_00n,
      totalPaise: 4_39_904_00n,
      confidence: 5,
      lines: [
        { description: "Dell Latitude 5440 — i7/16GB/512GB", quantity: 4, unitPricePaise: 93_200_00n, taxPct: 18, totalPaise: 3_72_800_00n },
      ],
    },
  },
];

export async function getInboxState() {
  // Which mocks already correspond to a real Invoice?
  const numbers = MOCK_EMAILS.map((m) => m.parsed.invoiceNumber);
  const existing = await prisma.invoice.findMany({
    where: { invoiceNumber: { in: numbers } },
    select: { invoiceNumber: true, id: true, vendor: { select: { code: true } } },
  });
  const processedMap = new Map(existing.map((e) => [e.invoiceNumber, e]));

  return MOCK_EMAILS.map((m) => ({
    ...m,
    processed: processedMap.has(m.parsed.invoiceNumber),
    createdInvoiceId: processedMap.get(m.parsed.invoiceNumber)?.id ?? null,
    createdInvoiceVendorCode:
      processedMap.get(m.parsed.invoiceNumber)?.vendor?.code ?? null,
  }));
}

export function getMockEmail(id: string): MockEmail | undefined {
  return MOCK_EMAILS.find((m) => m.id === id);
}
