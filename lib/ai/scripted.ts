/**
 * V1 — ScriptedAIEngine.
 *
 * Reads pre-planted anomalies from the DB and serves canned narratives from
 * the SCRIPTED_RESPONSES registry. NL questions match through `questions.ts`.
 *
 * Critically: this is deterministic. Same input → same output. The demo
 * uses Tour Mode chips to fire pattern-matched prompts on stage.
 */

import { prisma } from "@/lib/db";
import { SCRIPTED_RESPONSES } from "./responses";
import { matchAndAnswer } from "./questions";
import type {
  AIEngine,
  AnswerInput,
  AnswerResult,
  CycleSummary,
  DetectScope,
  ExplainResult,
} from "./engine";
import type { Anomaly } from "@prisma/client";

export class ScriptedAIEngine implements AIEngine {
  readonly engineId = "scripted" as const;

  async detectAnomalies(scope: DetectScope): Promise<Anomaly[]> {
    switch (scope.kind) {
      case "GLOBAL":
        return prisma.anomaly.findMany({
          where: { status: "OPEN" },
          orderBy: [{ severity: "desc" }, { raisedAt: "desc" }],
        });
      case "CYCLE":
        return prisma.anomaly.findMany({
          where: { status: "OPEN", cycleId: scope.cycleId },
          orderBy: [{ severity: "desc" }, { raisedAt: "desc" }],
        });
      case "VENDOR":
        return prisma.anomaly.findMany({
          where: { status: "OPEN", vendorId: scope.vendorId },
          orderBy: [{ severity: "desc" }, { raisedAt: "desc" }],
        });
      case "CATEGORY":
        return prisma.anomaly.findMany({
          where: {
            status: "OPEN",
            procurementEntry: { categoryId: scope.categoryId },
          },
          orderBy: [{ severity: "desc" }, { raisedAt: "desc" }],
        });
    }
  }

  async explainAnomaly(anomalyId: string): Promise<ExplainResult> {
    const anomaly = await prisma.anomaly.findUnique({
      where: { id: anomalyId },
    });
    if (!anomaly) {
      throw new Error(`Anomaly not found: ${anomalyId}`);
    }
    const key = anomaly.scriptedResponseKey;
    const scripted = key ? SCRIPTED_RESPONSES[key] : undefined;
    if (!scripted) {
      // Graceful fallback for anomalies without a scripted response.
      return {
        narrative: anomaly.narrative,
        citations: [],
        confidence: (anomaly.confidence as 1 | 2 | 3 | 4 | 5) ?? 3,
        followUps: ["Acknowledge", "Dismiss with reason"],
      };
    }
    return {
      narrative: scripted.narrative,
      citations: scripted.citations,
      confidence: scripted.confidence,
      followUps: scripted.followUps,
    };
  }

  async answerQuestion(input: AnswerInput): Promise<AnswerResult> {
    return matchAndAnswer(input.question);
  }

  async summarizeCycle(cycleId: string): Promise<CycleSummary> {
    const cycle = await prisma.cycle.findUnique({ where: { id: cycleId } });
    if (!cycle) throw new Error(`Cycle not found: ${cycleId}`);

    const anomalies = await prisma.anomaly.findMany({
      where: { cycleId, status: "OPEN" },
      orderBy: { severity: "desc" },
      take: 3,
    });

    const counts = await prisma.anomaly.groupBy({
      by: ["severity"],
      where: { cycleId, status: "OPEN" },
      _count: true,
    });

    const critical = counts.find((c) => c.severity === "CRITICAL")?._count ?? 0;
    const high = counts.find((c) => c.severity === "HIGH")?._count ?? 0;
    const total = counts.reduce((acc, c) => acc + c._count, 0);

    return {
      headline: `${total} open anomalies — ${critical} critical, ${high} high`,
      bullets: anomalies.map((a) => a.summary),
      topAnomalies: anomalies.map((a) => ({
        id: a.id,
        kind: a.kind,
        severity: a.severity,
      })),
    };
  }
}
