/**
 * Chanakya AI Engine — contract for both V1 ScriptedEngine and V2 LlmEngine.
 *
 * The scripted V1 implementation reads from a hand-tuned response registry
 * keyed off pre-planted anomaly fingerprints in the seeded data. The V2 LLM
 * implementation will satisfy the same interface — switch via env:
 *
 *   CHANAKYA_AI_ENGINE = "scripted" | "llm"
 *
 * Callers depend on this interface, never on implementations.
 */

import type {
  Anomaly,
  AnomalyKind,
  AnomalySeverity,
} from "@prisma/client";

export type DetectScope =
  | { kind: "GLOBAL" }
  | { kind: "CYCLE"; cycleId: string }
  | { kind: "VENDOR"; vendorId: string }
  | { kind: "CATEGORY"; categoryId: string };

export type CitationType =
  | "PayrollLine"
  | "InvoiceLine"
  | "ProcurementEntry"
  | "Invoice"
  | "Vendor"
  | "Employee"
  | "Cycle"
  | "Category";

export interface Citation {
  type: CitationType;
  id: string;
  label: string;
  href?: string;
}

export interface ExplainResult {
  narrative: string;
  citations: Citation[];
  confidence: 1 | 2 | 3 | 4 | 5;
  followUps?: string[];
}

export interface AnswerInput {
  question: string;
  userId: string;
  contextScope?: DetectScope["kind"];
  contextId?: string;
  conversationId?: string;
}

export interface AnswerResult {
  message: string;
  citations: Citation[];
  suggestedFollowUps: string[];
  matchedKey?: string;
}

export interface CycleSummary {
  headline: string;
  bullets: string[];
  topAnomalies: { id: string; kind: AnomalyKind; severity: AnomalySeverity }[];
}

export interface AIEngine {
  /** Run anomaly detection over the given scope. Returns existing Anomaly rows. */
  detectAnomalies(scope: DetectScope): Promise<Anomaly[]>;

  /** Return the narrative + citations for an anomaly. Pure registry lookup in V1. */
  explainAnomaly(anomalyId: string): Promise<ExplainResult>;

  /** Answer a natural-language question. Pattern-matched in V1, RAG in V2. */
  answerQuestion(input: AnswerInput): Promise<AnswerResult>;

  /** Cycle-level summary card for the dashboard. */
  summarizeCycle(cycleId: string): Promise<CycleSummary>;

  /** Identifier — used for telemetry and the "running on scripted engine" hint. */
  readonly engineId: "scripted" | "llm";
}
