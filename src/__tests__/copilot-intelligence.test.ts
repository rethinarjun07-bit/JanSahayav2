import { classifyIntent, extractEntities, detectLanguage } from "../lib/copilot/intents";
import { processCopilotMessage } from "../lib/copilot/orchestrator";

describe("JanSahaya Copilot Intelligence & Natural Response Suite", () => {
  describe("Intent Classification Accuracy", () => {
    test("'flood' query should correctly classify as DISASTER_GUIDANCE", () => {
      const { intent } = classifyIntent("flood");
      expect(intent).toBe("DISASTER_GUIDANCE");
    });

    test("'flooding in village' with reporting phrase should classify as REPORT_PROBLEM", () => {
      const { intent } = classifyIntent("there is severe flooding near my village");
      expect(intent).toBe("REPORT_PROBLEM");
    });

    test("'roads' and 'potholes' should classify as CIVIC_ISSUE_INFO", () => {
      expect(classifyIntent("potholes").intent).toBe("CIVIC_ISSUE_INFO");
      expect(classifyIntent("roads in ranchi").intent).toBe("CIVIC_ISSUE_INFO");
      expect(classifyIntent("broken road").intent).toBe("REPORT_PROBLEM");
    });

    test("'drinking water' and 'electricity' should classify as CIVIC_ISSUE_INFO", () => {
      expect(classifyIntent("drinking water fluoride").intent).toBe("CIVIC_ISSUE_INFO");
      expect(classifyIntent("power cut electricity").intent).toBe("CIVIC_ISSUE_INFO");
    });

    test("District name like 'Ranchi' should classify as FIND_PROBLEMS", () => {
      expect(classifyIntent("Ranchi").intent).toBe("FIND_PROBLEMS");
      expect(classifyIntent("problems in Dhanbad").intent).toBe("FIND_PROBLEMS");
    });

    test("Lightning and drought should classify as DISASTER_GUIDANCE", () => {
      expect(classifyIntent("lightning safety").intent).toBe("DISASTER_GUIDANCE");
      expect(classifyIntent("drought in palamu").intent).toBe("DISASTER_GUIDANCE");
    });

    test("General questions should classify as GENERAL_QUESTION or relevant intent", () => {
      expect(classifyIntent("what is the capital of jharkhand?").intent).toBe("GENERAL_QUESTION");
      expect(classifyIntent("what is JanSahaya?").intent).toBe("EXPLAIN_JANSAHAYA");
    });
  });

  describe("Entity Extraction", () => {
    test("Should correctly extract category and district for flood in Ranchi", () => {
      const entities = extractEntities("flood in Ranchi");
      expect(entities.district).toBe("Ranchi");
      expect(entities.category).toBe("Disaster Management");
    });

    test("Should correctly extract Hindi district and category", () => {
      const entities = extractEntities("धनबाद में सड़क खराब है");
      expect(entities.district).toBe("Dhanbad");
      expect(entities.category).toBe("Infrastructure & Transport");
    });
  });

  describe("Full Copilot Response Generation", () => {
    test("User query 'flood' should return detailed safety protocol and direct action links", async () => {
      const res = await processCopilotMessage("flood");
      expect(res.intent).toBe("DISASTER_GUIDANCE");
      expect(res.reply).toContain("0651-2446900");
      expect(res.reply).toContain("112");
      expect(res.actions.length).toBeGreaterThan(0);
      expect(res.actions.some(a => a.label.includes("Report"))).toBe(true);
      expect(res.groundedSource).toBeTruthy();
    });

    test("User query 'potholes' should return infrastructure guidance and reporting actions", async () => {
      const res = await processCopilotMessage("potholes on road");
      expect(res.intent).toBe("CIVIC_ISSUE_INFO");
      expect(res.reply).toContain("Road");
      expect(res.actions.some(a => a.label.includes("Report"))).toBe(true);
    });

    test("User query 'what is JanSahaya' should explain Quad-Helix platform", async () => {
      const res = await processCopilotMessage("what is JanSahaya");
      expect(res.reply).toContain("Quad-Helix");
      expect(res.reply).toContain("BIT Mesra");
    });

    test("Greeting should provide warm welcoming guidance with concrete sample prompts", async () => {
      const res = await processCopilotMessage("hi");
      expect(res.reply).toContain("JanSahaya AI");
      expect(res.actions.length).toBeGreaterThanOrEqual(2);
    });
  });
});
