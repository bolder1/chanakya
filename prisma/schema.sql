-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CFO_FINANCE', 'HR_OPS', 'VENDOR_MGR', 'OPS_MGR', 'LEADERSHIP_RO', 'SYS_ADMIN');

-- CreateEnum
CREATE TYPE "CycleState" AS ENUM ('OPEN', 'LOCKED', 'CLOSED');

-- CreateEnum
CREATE TYPE "RunType" AS ENUM ('REGULAR', 'BONUS', 'CORRECTION');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'CONTRACT', 'INTERN');

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('PENDING', 'DEPOSITED', 'FAILED', 'HOLD');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('ACTIVE', 'PAUSED', 'OFFBOARDED');

-- CreateEnum
CREATE TYPE "VendorCategory" AS ENUM ('HARDWARE', 'SAAS', 'PROFESSIONAL', 'FACILITY', 'FOOD', 'TRAVEL', 'MARKETING', 'LOGISTICS', 'OTHER');

-- CreateEnum
CREATE TYPE "POStatus" AS ENUM ('OPEN', 'PARTIAL', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('RECEIVED', 'APPROVED', 'PAID', 'DISPUTED');

-- CreateEnum
CREATE TYPE "InvoiceSource" AS ENUM ('EMAIL', 'UPLOAD', 'PORTAL', 'MANUAL');

-- CreateEnum
CREATE TYPE "ProcurementUnit" AS ENUM ('KG', 'UNIT', 'LITRE', 'HOUR', 'BOX', 'PACK', 'HOUR_PERSON');

-- CreateEnum
CREATE TYPE "AnomalyKind" AS ENUM ('SALARY_SPIKE', 'SALARY_DUPLICATE_PAY', 'STATUTORY_PF_MISSING', 'STATUTORY_PT_MISMATCH', 'NEW_HIRE_NO_PRORATION', 'NET_FORMULA_BROKEN', 'REIMBURSEMENT_OUTLIER', 'ATTENDANCE_DAYS_MISMATCH', 'LWP_NOT_REFLECTED', 'EXIT_PAID_FULL_MONTH', 'SHIFT_ALLOW_MISSING', 'SHIFT_DAYS_NO_ALLOWANCE', 'HOSTEL_TOTAL_MISMATCH', 'HOSTEL_PAYROLL_MISMATCH', 'INVOICE_MISSING_LINES', 'INVOICE_DUPLICATE', 'INVOICE_PRICE_DRIFT', 'INVOICE_DEDUCTION_MISMATCH', 'INVOICE_TAX_INCONSISTENT', 'INVOICE_GST_INVALID', 'SPEND_CATEGORY_VARIANCE', 'SPEND_UNIT_PRICE_DRIFT', 'SPEND_OFF_CONTRACT', 'SPEND_SPLIT_PURCHASE');

-- CreateEnum
CREATE TYPE "AnomalySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AnomalyStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'DISMISSED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AnomalyEngine" AS ENUM ('SCRIPTED', 'LLM');

-- CreateEnum
CREATE TYPE "UploadKind" AS ENUM ('PAYROLL', 'ATTENDANCE', 'SHIFT', 'HOSTEL', 'INVOICES', 'PROCUREMENT');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PARSED', 'COMMITTED', 'FAILED');

-- CreateEnum
CREATE TYPE "AIContextScope" AS ENUM ('GLOBAL', 'CYCLE', 'VENDOR', 'CATEGORY');

-- CreateEnum
CREATE TYPE "AIMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ConnectorStatus" AS ENUM ('CONNECTED', 'DEGRADED', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('ANOMALY', 'UPLOAD', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'SLACK', 'WHATSAPP', 'EMAIL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL,
    "team" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cycles" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "state" "CycleState" NOT NULL DEFAULT 'OPEN',
    "lockedAt" TIMESTAMP(3),
    "lockedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "empId" TEXT NOT NULL,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "designation" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "managerEmpId" TEXT,
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "doj" DATE NOT NULL,
    "lwd" DATE,
    "ctcAnnualPaise" BIGINT NOT NULL,
    "basicMonthlyPaise" BIGINT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("empId")
);

-- CreateTable
CREATE TABLE "payroll_runs" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "runType" "RunType" NOT NULL DEFAULT 'REGULAR',
    "runDate" DATE NOT NULL,
    "generatedById" TEXT,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_lines" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "empId" TEXT NOT NULL,
    "totalDaysInMonth" INTEGER NOT NULL,
    "presentDays" INTEGER NOT NULL,
    "basicPaise" BIGINT NOT NULL,
    "hraPaise" BIGINT NOT NULL DEFAULT 0,
    "conveyanceAllowPaise" BIGINT NOT NULL DEFAULT 0,
    "otherAllowPaise" BIGINT NOT NULL DEFAULT 0,
    "otherEarningsPaise" BIGINT NOT NULL DEFAULT 0,
    "shiftAllowPaise" BIGINT NOT NULL DEFAULT 0,
    "bonusPaise" BIGINT NOT NULL DEFAULT 0,
    "grossPaise" BIGINT NOT NULL,
    "pfPaise" BIGINT NOT NULL DEFAULT 0,
    "esiPaise" BIGINT NOT NULL DEFAULT 0,
    "ptPaise" BIGINT NOT NULL DEFAULT 0,
    "incomeTaxPaise" BIGINT NOT NULL DEFAULT 0,
    "loanDeductionPaise" BIGINT NOT NULL DEFAULT 0,
    "guesthouseDedPaise" BIGINT NOT NULL DEFAULT 0,
    "insuranceDedPaise" BIGINT NOT NULL DEFAULT 0,
    "recoveryPaise" BIGINT NOT NULL DEFAULT 0,
    "totalDeductionsPaise" BIGINT NOT NULL DEFAULT 0,
    "netPayPaise" BIGINT NOT NULL,
    "reimbursementPaise" BIGINT NOT NULL DEFAULT 0,
    "totalPayPaise" BIGINT NOT NULL,
    "depositStatus" "DepositStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "empId" TEXT NOT NULL,
    "totalDaysInMonth" INTEGER NOT NULL,
    "totalLeavesTaken" INTEGER NOT NULL,
    "lwpDays" INTEGER NOT NULL DEFAULT 0,
    "presentDays" INTEGER NOT NULL,
    "dojThisMonth" DATE,
    "lwdThisMonth" DATE,
    "isTestRow" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_entries" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "empId" TEXT NOT NULL,
    "nightHomeDays" INTEGER NOT NULL DEFAULT 0,
    "phoneSupportDays" INTEGER NOT NULL DEFAULT 0,
    "nightOfficeDays" INTEGER NOT NULL DEFAULT 0,
    "weekendDays" INTEGER NOT NULL DEFAULT 0,
    "computedAllowPaise" BIGINT NOT NULL DEFAULT 0,
    "isTestRow" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shift_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_allocations" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "empId" TEXT NOT NULL,
    "guestHouse" TEXT NOT NULL,
    "flatNo" TEXT NOT NULL,
    "accommodationPaise" BIGINT NOT NULL DEFAULT 0,
    "maintenancePaise" BIGINT NOT NULL DEFAULT 0,
    "foodPaise" BIGINT NOT NULL DEFAULT 0,
    "transportPaise" BIGINT NOT NULL DEFAULT 0,
    "electricityPaise" BIGINT NOT NULL DEFAULT 0,
    "internetPaise" BIGINT NOT NULL DEFAULT 0,
    "totalPaise" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hostel_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "gstin" TEXT,
    "panMasked" TEXT,
    "category" "VendorCategory" NOT NULL,
    "status" "VendorStatus" NOT NULL DEFAULT 'ACTIVE',
    "onboardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "primaryContact" TEXT,
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "issuedOn" DATE NOT NULL,
    "totalPaise" BIGINT NOT NULL,
    "status" "POStatus" NOT NULL DEFAULT 'OPEN',
    "terms" TEXT,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_lines" (
    "id" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "sku" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPricePaise" BIGINT NOT NULL,
    "taxPct" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "totalPaise" BIGINT NOT NULL,

    CONSTRAINT "purchase_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "poId" TEXT,
    "issuedOn" DATE NOT NULL,
    "receivedOn" DATE NOT NULL,
    "dueOn" DATE,
    "subtotalPaise" BIGINT NOT NULL,
    "taxPaise" BIGINT NOT NULL DEFAULT 0,
    "tdsPaise" BIGINT NOT NULL DEFAULT 0,
    "totalPaise" BIGINT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'RECEIVED',
    "source" "InvoiceSource" NOT NULL DEFAULT 'UPLOAD',
    "rawFileRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_lines" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "sku" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPricePaise" BIGINT NOT NULL,
    "taxPct" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "totalPaise" BIGINT NOT NULL,
    "matchedPoLineId" TEXT,

    CONSTRAINT "invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthlyBudgetPaise" BIGINT NOT NULL,
    "owner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "procurement_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_entries" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "vendorId" TEXT,
    "invoiceId" TEXT,
    "occurredOn" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "unit" "ProcurementUnit" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPricePaise" BIGINT NOT NULL,
    "totalPaise" BIGINT NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "procurement_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anomalies" (
    "id" TEXT NOT NULL,
    "kind" "AnomalyKind" NOT NULL,
    "severity" "AnomalySeverity" NOT NULL,
    "confidence" INTEGER NOT NULL,
    "status" "AnomalyStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "narrative" TEXT NOT NULL,
    "scriptedResponseKey" TEXT,
    "payrollLineId" TEXT,
    "invoiceLineId" TEXT,
    "procurementEntryId" TEXT,
    "invoiceId" TEXT,
    "employeeEmpId" TEXT,
    "vendorId" TEXT,
    "cycleId" TEXT,
    "raisedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raisedByEngine" "AnomalyEngine" NOT NULL DEFAULT 'SCRIPTED',
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedById" TEXT,

    CONSTRAINT "anomalies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_entries" (
    "id" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "actorRole" "Role",
    "action" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "cycleId" TEXT,
    "workflow" TEXT,

    CONSTRAINT "audit_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "excel_uploads" (
    "id" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" "UploadKind" NOT NULL,
    "filename" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "status" "UploadStatus" NOT NULL DEFAULT 'PARSED',
    "summary" JSONB,

    CONSTRAINT "excel_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL DEFAULT 'New conversation',
    "contextScope" "AIContextScope" NOT NULL DEFAULT 'GLOBAL',
    "contextId" TEXT,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "AIMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "citations" JSONB,
    "matchedKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connectors" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" "ConnectorStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncOk" BOOLEAN,
    "lastError" TEXT,
    "config" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "NotificationKind" NOT NULL,
    "severity" "AnomalySeverity",
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_active_idx" ON "users"("role", "active");

-- CreateIndex
CREATE UNIQUE INDEX "cycles_label_key" ON "cycles"("label");

-- CreateIndex
CREATE INDEX "cycles_state_idx" ON "cycles"("state");

-- CreateIndex
CREATE UNIQUE INDEX "employees_externalId_key" ON "employees"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE INDEX "employees_department_active_idx" ON "employees"("department", "active");

-- CreateIndex
CREATE INDEX "employees_managerEmpId_idx" ON "employees"("managerEmpId");

-- CreateIndex
CREATE INDEX "payroll_runs_cycleId_idx" ON "payroll_runs"("cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_runs_cycleId_runType_runDate_key" ON "payroll_runs"("cycleId", "runType", "runDate");

-- CreateIndex
CREATE INDEX "payroll_lines_empId_runId_idx" ON "payroll_lines"("empId", "runId");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_lines_runId_empId_key" ON "payroll_lines"("runId", "empId");

-- CreateIndex
CREATE INDEX "attendance_cycleId_idx" ON "attendance"("cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_cycleId_empId_key" ON "attendance"("cycleId", "empId");

-- CreateIndex
CREATE INDEX "shift_entries_cycleId_idx" ON "shift_entries"("cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "shift_entries_cycleId_empId_key" ON "shift_entries"("cycleId", "empId");

-- CreateIndex
CREATE INDEX "hostel_allocations_cycleId_guestHouse_idx" ON "hostel_allocations"("cycleId", "guestHouse");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_allocations_cycleId_empId_key" ON "hostel_allocations"("cycleId", "empId");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_code_key" ON "vendors"("code");

-- CreateIndex
CREATE INDEX "vendors_category_status_idx" ON "vendors"("category", "status");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_poNumber_key" ON "purchase_orders"("poNumber");

-- CreateIndex
CREATE INDEX "purchase_orders_vendorId_issuedOn_idx" ON "purchase_orders"("vendorId", "issuedOn");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_lines_poId_lineNo_key" ON "purchase_order_lines"("poId", "lineNo");

-- CreateIndex
CREATE INDEX "invoices_vendorId_receivedOn_idx" ON "invoices"("vendorId", "receivedOn");

-- CreateIndex
CREATE INDEX "invoices_poId_idx" ON "invoices"("poId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_vendorId_invoiceNumber_key" ON "invoices"("vendorId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "invoice_lines_invoiceId_idx" ON "invoice_lines"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_lines_invoiceId_lineNo_key" ON "invoice_lines"("invoiceId", "lineNo");

-- CreateIndex
CREATE UNIQUE INDEX "procurement_categories_name_key" ON "procurement_categories"("name");

-- CreateIndex
CREATE INDEX "procurement_entries_categoryId_occurredOn_idx" ON "procurement_entries"("categoryId", "occurredOn");

-- CreateIndex
CREATE INDEX "procurement_entries_vendorId_occurredOn_idx" ON "procurement_entries"("vendorId", "occurredOn");

-- CreateIndex
CREATE INDEX "anomalies_status_idx" ON "anomalies"("status");

-- CreateIndex
CREATE INDEX "anomalies_kind_status_idx" ON "anomalies"("kind", "status");

-- CreateIndex
CREATE INDEX "anomalies_cycleId_idx" ON "anomalies"("cycleId");

-- CreateIndex
CREATE INDEX "anomalies_severity_status_idx" ON "anomalies"("severity", "status");

-- CreateIndex
CREATE INDEX "audit_entries_objectType_objectId_idx" ON "audit_entries"("objectType", "objectId");

-- CreateIndex
CREATE INDEX "audit_entries_occurredAt_idx" ON "audit_entries"("occurredAt");

-- CreateIndex
CREATE INDEX "audit_entries_actorId_occurredAt_idx" ON "audit_entries"("actorId", "occurredAt");

-- CreateIndex
CREATE INDEX "excel_uploads_uploadedById_uploadedAt_idx" ON "excel_uploads"("uploadedById", "uploadedAt");

-- CreateIndex
CREATE INDEX "ai_conversations_userId_startedAt_idx" ON "ai_conversations"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "ai_messages_conversationId_createdAt_idx" ON "ai_messages"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "connectors_slug_key" ON "connectors"("slug");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_sentAt_idx" ON "notifications"("userId", "readAt", "sentAt");

-- AddForeignKey
ALTER TABLE "cycles" ADD CONSTRAINT "cycles_lockedById_fkey" FOREIGN KEY ("lockedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_lines" ADD CONSTRAINT "payroll_lines_runId_fkey" FOREIGN KEY ("runId") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_lines" ADD CONSTRAINT "payroll_lines_empId_fkey" FOREIGN KEY ("empId") REFERENCES "employees"("empId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_empId_fkey" FOREIGN KEY ("empId") REFERENCES "employees"("empId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_entries" ADD CONSTRAINT "shift_entries_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_entries" ADD CONSTRAINT "shift_entries_empId_fkey" FOREIGN KEY ("empId") REFERENCES "employees"("empId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_allocations" ADD CONSTRAINT "hostel_allocations_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_allocations" ADD CONSTRAINT "hostel_allocations_empId_fkey" FOREIGN KEY ("empId") REFERENCES "employees"("empId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_poId_fkey" FOREIGN KEY ("poId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_poId_fkey" FOREIGN KEY ("poId") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_matchedPoLineId_fkey" FOREIGN KEY ("matchedPoLineId") REFERENCES "purchase_order_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_entries" ADD CONSTRAINT "procurement_entries_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "procurement_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_entries" ADD CONSTRAINT "procurement_entries_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_entries" ADD CONSTRAINT "procurement_entries_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_payrollLineId_fkey" FOREIGN KEY ("payrollLineId") REFERENCES "payroll_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_invoiceLineId_fkey" FOREIGN KEY ("invoiceLineId") REFERENCES "invoice_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_procurementEntryId_fkey" FOREIGN KEY ("procurementEntryId") REFERENCES "procurement_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_employeeEmpId_fkey" FOREIGN KEY ("employeeEmpId") REFERENCES "employees"("empId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_entries" ADD CONSTRAINT "audit_entries_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "excel_uploads" ADD CONSTRAINT "excel_uploads_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
