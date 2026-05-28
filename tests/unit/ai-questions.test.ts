import { describe, it, expect } from "vitest";
import { matchAndAnswer } from "@/lib/ai/questions";

describe("matchAndAnswer", () => {
  it("matches the Aarav Mehta salary question", async () => {
    const r = await matchAndAnswer("Why did Aarav Mehta's salary double in April?");
    expect(r.matchedKey).toBe("q.salary-aarav");
    expect(r.message).toContain("EMP-0142");
    expect(r.message).toContain("2,04,800");
    expect(r.citations.length).toBeGreaterThan(0);
  });

  it("matches the laptops spend question", async () => {
    const r = await matchAndAnswer("How much did we spend on laptops in April?");
    expect(r.matchedKey).toBe("q.laptops-spend");
    expect(r.message).toContain("14,80,000");
    expect(r.message).toContain("131%");
  });

  it("matches loose phrasing via fuzzy overlap", async () => {
    const r = await matchAndAnswer("show food costs trend");
    expect(r.matchedKey).toBe("q.food-tomatoes");
  });

  it("matches the everything-wrong cross-domain question", async () => {
    const r = await matchAndAnswer("show me everything wrong with April");
    expect(r.matchedKey).toBe("q.april-everything");
    expect(r.message).toContain("15 open anomalies");
  });

  it("returns graceful fallback for gibberish", async () => {
    const r = await matchAndAnswer("asdfgh qwerty xyz");
    expect(r.matchedKey).toBe(undefined);
    expect(r.message).toContain("payroll");
    expect(r.suggestedFollowUps.length).toBe(4);
  });

  it("returns fallback for empty input", async () => {
    const r = await matchAndAnswer("");
    expect(r.matchedKey).toBe(undefined);
    expect(r.suggestedFollowUps.length).toBe(4);
  });

  it("each match has at least one citation OR is the fallback", async () => {
    const tests = [
      "Why did Aarav Mehta's salary double?",
      "Show me anomalies in vendor invoices",
      "How much did we spend on laptops?",
      "Show me everything wrong with April",
    ];
    for (const q of tests) {
      const r = await matchAndAnswer(q);
      expect(r.citations.length).toBeGreaterThan(0);
    }
  });
});
