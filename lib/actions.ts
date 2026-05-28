"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";

interface ActionContext {
  actorId?: string;
  actorRole?: Role;
}

async function currentActor(): Promise<ActionContext> {
  const session = await auth();
  if (!session?.user) return { actorId: undefined, actorRole: "CFO_FINANCE" };
  return {
    actorId: (session.user as { id: string }).id,
    actorRole: (session.user as { role: Role }).role,
  };
}

export async function acknowledgeAnomaly(anomalyId: string) {
  const actor = await currentActor();
  const before = await prisma.anomaly.findUnique({ where: { id: anomalyId } });
  if (!before) throw new Error(`Anomaly not found: ${anomalyId}`);

  const after = await prisma.anomaly.update({
    where: { id: anomalyId },
    data: { status: "ACKNOWLEDGED", acknowledgedAt: new Date() },
  });

  await prisma.auditEntry.create({
    data: {
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: "anomaly.acknowledge",
      objectType: "Anomaly",
      objectId: anomalyId,
      before: { status: before.status } as unknown as object,
      after: { status: after.status } as unknown as object,
      cycleId: before.cycleId,
      workflow: "anomaly-triage",
    },
  });

  if (actor.actorId) {
    await prisma.notification.create({
      data: {
        userId: actor.actorId,
        kind: "ANOMALY",
        severity: before.severity,
        title: `Acknowledged: ${before.title}`,
        body: `Anomaly ${before.summary} marked as acknowledged.`,
        link: before.employeeEmpId
          ? `/payroll/employees/${before.employeeEmpId}`
          : before.vendorId
            ? `/vendors`
            : `/dashboard`,
        channel: "SLACK",
      },
    }).catch(() => {/* if write fails (e.g. user just deleted), skip */});
  }

  revalidatePath("/dashboard");
  revalidatePath("/payroll", "layout");
  revalidatePath("/vendors", "layout");
  revalidatePath("/spend", "layout");
  revalidatePath("/", "layout"); // refresh topbar notification count
}

export async function dismissAnomaly(anomalyId: string, reason: string) {
  const actor = await currentActor();
  const before = await prisma.anomaly.findUnique({ where: { id: anomalyId } });
  if (!before) throw new Error(`Anomaly not found: ${anomalyId}`);

  const after = await prisma.anomaly.update({
    where: { id: anomalyId },
    data: { status: "DISMISSED" },
  });

  await prisma.auditEntry.create({
    data: {
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: "anomaly.dismiss",
      objectType: "Anomaly",
      objectId: anomalyId,
      before: { status: before.status } as unknown as object,
      after: { status: after.status, reason } as unknown as object,
      cycleId: before.cycleId,
      workflow: "anomaly-triage",
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/payroll", "layout");
  revalidatePath("/vendors", "layout");
  revalidatePath("/spend", "layout");
}

export async function bulkAcknowledgeAnomalies(anomalyIds: string[]) {
  if (anomalyIds.length === 0) return { count: 0 };
  if (anomalyIds.length > 100) {
    throw new Error("Bulk-acknowledge limited to 100 at a time");
  }
  const actor = await currentActor();

  const before = await prisma.anomaly.findMany({
    where: { id: { in: anomalyIds }, status: "OPEN" },
    select: { id: true, status: true, cycleId: true, severity: true, title: true },
  });
  if (before.length === 0) return { count: 0 };

  await prisma.anomaly.updateMany({
    where: { id: { in: before.map((a) => a.id) } },
    data: { status: "ACKNOWLEDGED", acknowledgedAt: new Date(), acknowledgedById: actor.actorId },
  });

  await prisma.auditEntry.createMany({
    data: before.map((a) => ({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: "anomaly.acknowledge.bulk",
      objectType: "Anomaly",
      objectId: a.id,
      before: { status: a.status } as unknown as object,
      after: { status: "ACKNOWLEDGED" } as unknown as object,
      cycleId: a.cycleId,
      workflow: "anomaly-triage-bulk",
    })),
  });

  if (actor.actorId) {
    await prisma.notification.create({
      data: {
        userId: actor.actorId,
        kind: "ANOMALY",
        title: `Bulk acknowledged ${before.length} anomalies`,
        body: `${before.length} anomalies acknowledged by ${actor.actorRole}.`,
        link: "/anomalies",
        channel: "IN_APP",
      },
    }).catch(() => {/* skip */});
  }

  revalidatePath("/dashboard");
  revalidatePath("/payroll", "layout");
  revalidatePath("/vendors", "layout");
  revalidatePath("/spend", "layout");
  revalidatePath("/anomalies");
  revalidatePath("/audit");
  revalidatePath("/", "layout");

  return { count: before.length };
}

export async function bulkDismissAnomalies(anomalyIds: string[], reason: string) {
  if (!reason.trim()) throw new Error("Reason is required to dismiss");
  if (anomalyIds.length === 0) return { count: 0 };
  if (anomalyIds.length > 100) {
    throw new Error("Bulk-dismiss limited to 100 at a time");
  }
  const actor = await currentActor();

  const before = await prisma.anomaly.findMany({
    where: { id: { in: anomalyIds }, status: { in: ["OPEN", "ACKNOWLEDGED"] } },
    select: { id: true, status: true, cycleId: true, title: true },
  });
  if (before.length === 0) return { count: 0 };

  await prisma.anomaly.updateMany({
    where: { id: { in: before.map((a) => a.id) } },
    data: { status: "DISMISSED" },
  });

  await prisma.auditEntry.createMany({
    data: before.map((a) => ({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: "anomaly.dismiss.bulk",
      objectType: "Anomaly",
      objectId: a.id,
      before: { status: a.status } as unknown as object,
      after: { status: "DISMISSED", reason } as unknown as object,
      cycleId: a.cycleId,
      workflow: "anomaly-triage-bulk",
    })),
  });

  revalidatePath("/dashboard");
  revalidatePath("/payroll", "layout");
  revalidatePath("/vendors", "layout");
  revalidatePath("/spend", "layout");
  revalidatePath("/anomalies");
  revalidatePath("/audit");

  return { count: before.length };
}

export async function reopenAnomaly(anomalyId: string) {
  const actor = await currentActor();
  const before = await prisma.anomaly.findUnique({ where: { id: anomalyId } });
  if (!before) throw new Error(`Anomaly not found: ${anomalyId}`);

  await prisma.anomaly.update({
    where: { id: anomalyId },
    data: { status: "OPEN", acknowledgedAt: null },
  });

  await prisma.auditEntry.create({
    data: {
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: "anomaly.reopen",
      objectType: "Anomaly",
      objectId: anomalyId,
      before: { status: before.status } as unknown as object,
      after: { status: "OPEN" } as unknown as object,
      cycleId: before.cycleId,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/payroll", "layout");
  revalidatePath("/vendors", "layout");
  revalidatePath("/spend", "layout");
}

export async function triggerConnectorSync(slug: string) {
  const actor = await currentActor();
  const before = await prisma.connector.findUnique({ where: { slug } });
  if (!before) throw new Error(`Connector not found: ${slug}`);

  // Mocked sync — flip status to CONNECTED, update timestamp.
  const after = await prisma.connector.update({
    where: { slug },
    data: {
      status: "CONNECTED",
      lastSyncAt: new Date(),
      lastSyncOk: true,
      lastError: null,
    },
  });

  await prisma.auditEntry.create({
    data: {
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: "connector.sync",
      objectType: "Connector",
      objectId: slug,
      before: { status: before.status, lastSyncAt: before.lastSyncAt } as unknown as object,
      after: { status: after.status, lastSyncAt: after.lastSyncAt } as unknown as object,
    },
  });

  revalidatePath("/integrations");
}

export async function lockCycleAndGenerate(
  cycleLabel: string,
  typedConfirm: string,
) {
  const actor = await currentActor();
  if (typedConfirm !== "LOCK") {
    throw new Error('Confirmation must be the literal "LOCK"');
  }

  const cycle = await prisma.cycle.findUnique({ where: { label: cycleLabel } });
  if (!cycle) throw new Error(`Cycle not found: ${cycleLabel}`);
  if (cycle.state !== "OPEN") {
    throw new Error(`Cycle is already ${cycle.state}`);
  }

  const aggResult = await prisma.payrollLine.aggregate({
    where: { run: { cycleId: cycle.id, runType: "REGULAR" } },
    _sum: {
      grossPaise: true,
      totalDeductionsPaise: true,
      netPayPaise: true,
      reimbursementPaise: true,
    },
  });
  const employeeCount = await prisma.payrollLine.count({
    where: { run: { cycleId: cycle.id, runType: "REGULAR" } },
  });
  const anomalyBreakdown = await prisma.anomaly.groupBy({
    by: ["status"],
    where: { cycleId: cycle.id },
    _count: true,
  });
  const open = anomalyBreakdown.find((a) => a.status === "OPEN")?._count ?? 0;

  const locked = await prisma.cycle.update({
    where: { id: cycle.id },
    data: {
      state: "LOCKED",
      lockedAt: new Date(),
      lockedById: actor.actorId,
    },
  });

  await prisma.payrollRun.updateMany({
    where: { cycleId: cycle.id, locked: false },
    data: { locked: true },
  });

  await prisma.auditEntry.create({
    data: {
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: "cycle.lock",
      objectType: "Cycle",
      objectId: cycle.id,
      cycleId: cycle.id,
      workflow: "register-generation",
      before: { state: cycle.state } as unknown as object,
      after: {
        state: locked.state,
        lockedAt: locked.lockedAt,
        employeeCount,
        totalGrossPaise: String(aggResult._sum.grossPaise ?? 0n),
        totalDeductionsPaise: String(aggResult._sum.totalDeductionsPaise ?? 0n),
        totalNetPayPaise: String(aggResult._sum.netPayPaise ?? 0n),
        openAnomaliesAtLock: open,
      } as unknown as object,
    },
  });

  if (actor.actorId) {
    await prisma.notification.create({
      data: {
        userId: actor.actorId,
        kind: "SYSTEM",
        severity: open > 0 ? "MEDIUM" : null,
        title: `${cycleLabel} register locked`,
        body: `${employeeCount} employees · ${open > 0 ? `${open} anomalies still open at lock — ` : ""}export ready for Zoho Payroll`,
        link: `/payroll/${cycleLabel}`,
        channel: "IN_APP",
      },
    }).catch(() => {/* skip if no user */});
  }

  revalidatePath("/dashboard");
  revalidatePath("/payroll", "layout");
  revalidatePath("/", "layout");

  return {
    cycleId: cycle.id,
    cycleLabel,
    employeeCount,
    totalNetPayPaise: String(aggResult._sum.netPayPaise ?? 0n),
    openAnomaliesAtLock: open,
    downloadUrl: `/api/registers/${cycleLabel}/export`,
  };
}

export async function setUserRole(targetUserId: string, newRole: Role) {
  const actor = await currentActor();
  if (actor.actorRole !== "SYS_ADMIN") {
    throw new Error("Only Sys Admin can change user roles");
  }
  if (actor.actorId === targetUserId) {
    throw new Error("Sys Admins cannot change their own role — ask another Sys Admin");
  }

  const before = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!before) throw new Error(`User not found: ${targetUserId}`);

  const after = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
  });

  await prisma.auditEntry.create({
    data: {
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: "user.role.change",
      objectType: "User",
      objectId: targetUserId,
      before: { role: before.role, email: before.email } as unknown as object,
      after: { role: after.role, email: after.email } as unknown as object,
      workflow: "user-management",
    },
  });

  revalidatePath("/settings");
  revalidatePath("/audit");
}

export async function processEmailInvoice(emailId: string) {
  const actor = await currentActor();
  const { getMockEmail } = await import("@/lib/email-inbox");
  const email = getMockEmail(emailId);
  if (!email) throw new Error(`Email not found: ${emailId}`);

  const vendor = await prisma.vendor.findUnique({ where: { code: email.vendorCode } });
  if (!vendor) throw new Error(`Vendor ${email.vendorCode} not seeded`);

  const existing = await prisma.invoice.findUnique({
    where: { vendorId_invoiceNumber: { vendorId: vendor.id, invoiceNumber: email.parsed.invoiceNumber } },
  });
  if (existing) {
    return { invoiceId: existing.id, vendorCode: vendor.code, alreadyExisted: true };
  }

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: email.parsed.invoiceNumber,
      vendorId: vendor.id,
      issuedOn: email.parsed.issuedOn,
      receivedOn: email.receivedAt,
      dueOn: new Date(email.receivedAt.getTime() + vendor.paymentTermsDays * 86_400_000),
      subtotalPaise: email.parsed.subtotalPaise,
      taxPaise: email.parsed.taxPaise,
      tdsPaise: 0n,
      totalPaise: email.parsed.totalPaise,
      status: "RECEIVED",
      source: "EMAIL",
      rawFileRef: email.attachmentName,
      lines: {
        create: email.parsed.lines.map((l, i) => ({
          lineNo: i + 1,
          description: l.description,
          quantity: l.quantity,
          unitPricePaise: l.unitPricePaise,
          taxPct: l.taxPct,
          totalPaise: l.totalPaise,
        })),
      },
    },
  });

  await prisma.auditEntry.create({
    data: {
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: "invoice.create.email",
      objectType: "Invoice",
      objectId: invoice.id,
      workflow: "email-to-invoice",
      after: {
        invoiceNumber: invoice.invoiceNumber,
        vendorCode: vendor.code,
        totalPaise: String(invoice.totalPaise),
        attachment: email.attachmentName,
        confidence: email.parsed.confidence,
      } as unknown as object,
    },
  });

  if (actor.actorId) {
    await prisma.notification.create({
      data: {
        userId: actor.actorId,
        kind: "UPLOAD",
        severity: null,
        title: `Invoice processed from email`,
        body: `${email.parsed.invoiceNumber} from ${email.fromName} — ₹${(Number(email.parsed.totalPaise) / 100).toLocaleString("en-IN")}`,
        link: `/vendors/${vendor.code}/invoices/${invoice.id}`,
        channel: "EMAIL",
      },
    }).catch(() => {/* skip */});
  }

  revalidatePath("/integrations/email-inbox");
  revalidatePath("/integrations");
  revalidatePath("/vendors", "layout");
  revalidatePath("/", "layout");

  return { invoiceId: invoice.id, vendorCode: vendor.code, alreadyExisted: false };
}

export async function setUserActive(targetUserId: string, active: boolean) {
  const actor = await currentActor();
  if (actor.actorRole !== "SYS_ADMIN") {
    throw new Error("Only Sys Admin can enable/disable users");
  }
  if (actor.actorId === targetUserId) {
    throw new Error("Sys Admins cannot disable themselves");
  }

  const before = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!before) throw new Error(`User not found: ${targetUserId}`);

  const after = await prisma.user.update({
    where: { id: targetUserId },
    data: { active },
  });

  await prisma.auditEntry.create({
    data: {
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: active ? "user.activate" : "user.deactivate",
      objectType: "User",
      objectId: targetUserId,
      before: { active: before.active, email: before.email } as unknown as object,
      after: { active: after.active, email: after.email } as unknown as object,
      workflow: "user-management",
    },
  });

  revalidatePath("/settings");
  revalidatePath("/audit");
}

export async function commitUpload(uploadId: string) {
  const actor = await currentActor();
  const before = await prisma.excelUpload.findUnique({ where: { id: uploadId } });
  if (!before) throw new Error(`Upload not found: ${uploadId}`);
  if (before.status !== "PARSED") {
    throw new Error(`Cannot commit upload in status ${before.status}`);
  }
  if (before.errorCount > 0) {
    throw new Error(`Cannot commit upload with ${before.errorCount} parse errors`);
  }

  const after = await prisma.excelUpload.update({
    where: { id: uploadId },
    data: { status: "COMMITTED" },
  });

  await prisma.auditEntry.create({
    data: {
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: "upload.commit",
      objectType: "ExcelUpload",
      objectId: uploadId,
      before: { status: before.status } as unknown as object,
      after: {
        status: after.status,
        filename: after.filename,
        rowCount: after.rowCount,
      } as unknown as object,
      workflow: "data-ingestion",
    },
  });

  revalidatePath("/uploads");
  revalidatePath(`/uploads/${uploadId}/preview`);
  revalidatePath("/audit");
}

export async function askChanakya(input: { question: string; conversationId?: string }) {
  const actor = await currentActor();
  const { getAIEngine } = await import("@/lib/ai");
  const engine = await getAIEngine();

  // For V1 demo we don't require a real user — pick the first CFO if any.
  const fallbackUser = await prisma.user.findFirst({ where: { role: "CFO_FINANCE" } });
  if (!fallbackUser) {
    return {
      message: "No user found in DB. Run pnpm db:seed.",
      citations: [],
      suggestedFollowUps: [],
    };
  }

  let conversationId = input.conversationId;
  if (!conversationId) {
    const convo = await prisma.aIConversation.create({
      data: { userId: fallbackUser.id, title: input.question.slice(0, 60) },
    });
    conversationId = convo.id;
  }

  await prisma.aIMessage.create({
    data: { conversationId, role: "USER", content: input.question },
  });

  const result = await engine.answerQuestion({
    question: input.question,
    userId: fallbackUser.id,
    conversationId,
  });

  await prisma.aIMessage.create({
    data: {
      conversationId,
      role: "ASSISTANT",
      content: result.message,
      citations: result.citations as unknown as object,
      matchedKey: result.matchedKey,
    },
  });

  await prisma.auditEntry.create({
    data: {
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: "ai.ask",
      objectType: "AIConversation",
      objectId: conversationId,
      after: {
        question: input.question.slice(0, 200),
        matchedKey: result.matchedKey,
      } as unknown as object,
    },
  });

  return { ...result, conversationId };
}
