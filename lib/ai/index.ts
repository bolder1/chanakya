import type { AIEngine } from "./engine";

// V1 ships only the scripted engine. V2 will introduce a real LLM engine
// behind the same interface and the factory selects via env.

let _engine: AIEngine | null = null;

export async function getAIEngine(): Promise<AIEngine> {
  if (_engine) return _engine;
  const choice = (process.env.CHANAKYA_AI_ENGINE ?? "scripted").toLowerCase();
  if (choice === "llm") {
    // Placeholder for future LLM engine. Until V2, fall through to scripted.
    const { ScriptedAIEngine } = await import("./scripted");
    _engine = new ScriptedAIEngine();
  } else {
    const { ScriptedAIEngine } = await import("./scripted");
    _engine = new ScriptedAIEngine();
  }
  return _engine;
}
