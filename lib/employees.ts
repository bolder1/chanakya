import { prisma } from "@/lib/db";

export interface EmployeeTimelinePoint {
  cycleLabel: string;
  periodEnd: Date;
  grossPaise: bigint;
  netPaise: bigint;
  totalDeductionsPaise: bigint;
  reimbursementPaise: bigint;
  basicPaise: bigint;
  presentDays: number;
  totalDaysInMonth: number;
  runType: string;
}

export async function getEmployeeTimeline(empId: string) {
  const employee = await prisma.employee.findUnique({ where: { empId } });
  if (!employee) return null;

  const lines = await prisma.payrollLine.findMany({
    where: { empId },
    include: {
      run: { include: { cycle: true } },
    },
    orderBy: { run: { runDate: "asc" } },
  });

  const timeline: EmployeeTimelinePoint[] = lines.map((l) => ({
    cycleLabel: l.run.cycle.label,
    periodEnd: l.run.cycle.periodEnd,
    grossPaise: l.grossPaise,
    netPaise: l.netPayPaise,
    totalDeductionsPaise: l.totalDeductionsPaise,
    reimbursementPaise: l.reimbursementPaise,
    basicPaise: l.basicPaise,
    presentDays: l.presentDays,
    totalDaysInMonth: l.totalDaysInMonth,
    runType: l.run.runType,
  }));

  // Latest cycle line (most recent regular run)
  const latestLine = lines
    .filter((l) => l.run.runType === "REGULAR")
    .sort((a, b) => b.run.runDate.getTime() - a.run.runDate.getTime())[0];

  // Anomalies on this employee
  const anomalies = await prisma.anomaly.findMany({
    where: {
      OR: [
        { employeeEmpId: empId },
        { payrollLine: { empId } },
      ],
    },
    orderBy: { raisedAt: "desc" },
  });

  // Latest attendance + hostel
  const latestAtt = latestLine
    ? await prisma.attendance.findUnique({
        where: { cycleId_empId: { cycleId: latestLine.run.cycleId, empId } },
      })
    : null;
  const latestHostel = latestLine
    ? await prisma.hostelAllocation.findUnique({
        where: { cycleId_empId: { cycleId: latestLine.run.cycleId, empId } },
      })
    : null;

  return { employee, timeline, latestLine, latestAtt, latestHostel, anomalies };
}
