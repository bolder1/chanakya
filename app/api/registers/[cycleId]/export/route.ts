import { NextRequest, NextResponse } from "next/server";
import { buildRegisterCsv } from "@/lib/register";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ cycleId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cycleId } = await params;
  const built = await buildRegisterCsv(cycleId);
  if (!built) {
    return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
  }

  // Audit the download
  await prisma.auditEntry.create({
    data: {
      actorId: (session.user as { id: string }).id,
      actorRole: (session.user as { role: "CFO_FINANCE" | "HR_OPS" | "VENDOR_MGR" | "OPS_MGR" | "LEADERSHIP_RO" | "SYS_ADMIN" }).role,
      action: "register.download",
      objectType: "Cycle",
      objectId: cycleId,
      workflow: "register-generation",
      after: { filename: built.filename } as unknown as object,
    },
  }).catch(() => {/* don't block download on audit failure */});

  return new NextResponse(built.csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${built.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
