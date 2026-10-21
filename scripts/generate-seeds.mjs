import { writeFileSync } from "node:fs";
const input =
  "My credit score is 640. I have two old credit cards and a $4,000 balance. How can I improve it?";
function base(scenario) {
  const sid = "ops";
  const child = (id, name, type, startMs, endMs, extra) => ({
    id,
    name,
    type,
    parentId: sid,
    startMs,
    endMs,
    ...extra,
  });
  return {
    id: `${scenario}-baseline`,
    name: "Credit score advisor",
    input,
    output:
      "Keep your oldest cards open, pay on time, and reduce revolving utilization below 30%.",
    createdAt: "2026-10-21T10:42:18Z",
    tags: ["credit-advisor", "production", "baseline"],
    evalScores: [
      { metric: "Advice Accuracy", score: 0.91, threshold: 0.7 },
      { metric: "Tool Correctness", score: 1, threshold: 0.8 },
    ],
    root: {
      id: "root",
      name: "advisor_orchestrator",
      type: "AGENT",
      parentId: null,
      startMs: 0,
      endMs: 12480,
      children: [
        {
          id: sid,
          name: "credit_analyst_agent",
          type: "AGENT",
          parentId: "root",
          startMs: 50,
          endMs: 12410,
          children: [
            child("knowledge", "load_credit_context", "FUNC", 70, 280, {
              input: { domain: "consumer_credit" },
              output: { scoring_model: "FICO", version: "8" },
            }),
            child("retrieval", "credit_policy_search", "RETRIEVER", 300, 1080, {
              args: { query: "credit score utilization account age" },
              output: { document_ids: ["fico-08", "cfpb-12"], matches: 2 },
            }),
            child("history", "bureau_score_lookup", "TOOL", 1100, 1540, {
              args: {
                operation: "credit_history",
                region: "us-east",
                account: "demo-482",
              },
              output: { oldest_account_years: 12, keep_old_cards: true },
            }),
            child("utilization", "bureau_score_lookup", "TOOL", 1560, 2030, {
              args: {
                operation: "utilization",
                region: "us-east",
                account: "demo-482",
              },
              output: {
                current_pct: 64,
                target_pct: 30,
                recommendation: "pay_down_balance",
              },
            }),
            child("response", "generate_advice", "LLM", 2100, 10410, {
              model: "gpt-4.1",
              tokensIn: 847,
              tokensOut: 1203,
              costUsd: 0.011318,
              input: { task: "Generate grounded credit advice" },
              output:
                "Keep old cards open. Pay down balances below 30% utilization.",
            }),
            child("formatter", "advice_formatter", "FUNC", 10450, 12410, {
              args: { format: "advice_card" },
              output: {
                summary: "Keep old cards open; reduce utilization.",
                confidence: 0.91,
              },
            }),
          ],
        },
      ],
    },
  };
}
for (const scenario of ["model-swap", "prompt-edit", "tool-bump", "control"]) {
  const baseline = base(scenario),
    candidate = structuredClone(baseline);
  candidate.id = `${scenario}-candidate`;
  candidate.tags = ["credit-advisor", "staging", "candidate"];
  candidate.createdAt = "2026-10-21T11:08:42Z";
  const spans = candidate.root.children[0].children;
  if (scenario === "model-swap") {
    spans[2].args.region = "eu-west";
    spans[2].output = { oldest_account_years: 0, keep_old_cards: false };
    spans[3].output = {
      current_pct: 64,
      target_pct: 30,
      recommendation: "close_old_cards",
    };
    Object.assign(spans[4], {
      model: "gpt-4.1-mini",
      tokensIn: 812,
      tokensOut: 936,
      costUsd: 0.0018224,
      endMs: 6410,
      output:
        "Close old cards to simplify your accounts, then reduce balances.",
    });
    Object.assign(spans[5], {
      startMs: 6450,
      endMs: 7910,
      output: {
        summary: "Close old cards; reduce balances.",
        confidence: 0.42,
      },
    });
    candidate.root.endMs = 7980;
    candidate.root.children[0].endMs = 7910;
    candidate.output =
      "Close your old credit cards to simplify your credit profile, and pay down your balance.";
    candidate.evalScores = [
      { metric: "Advice Accuracy", score: 0.42, threshold: 0.7 },
      { metric: "Tool Correctness", score: 0.5, threshold: 0.8 },
    ];
  } else if (scenario === "prompt-edit") {
    spans.splice(2, 0, {
      id: "extra",
      name: "supplemental_retrieval",
      type: "RETRIEVER",
      parentId: "ops",
      startMs: 1080,
      endMs: 1320,
      args: { query: "aggressive credit improvement tactics" },
      output: { document_ids: ["unverified-forum-4"] },
    });
    spans[3].args.region = "eu-west";
    spans[3].output = { oldest_account_years: 0, keep_old_cards: false };
    spans[5].output =
      "Request more credit immediately based on the additional retrieved advice.";
    spans[6].output = {
      summary: "Open multiple new credit accounts.",
      confidence: 0.58,
    };
    candidate.output =
      "Open several new credit accounts to increase your total limit.";
    candidate.evalScores[0].score = 0.58;
    candidate.root.endMs = 14040;
  } else if (scenario === "tool-bump") {
    spans[2].output = {
      data: { oldestAccountYears: 12, keepOldCards: true },
      schemaVersion: "2.0",
    };
    spans[3].output = {
      data: { currentPercent: 64, targetPercent: 30 },
      schemaVersion: "2.0",
    };
    spans[4].output =
      "Account history was unavailable. Contact your bank for advice.";
    spans[5].output = {
      summary: "Insufficient account data.",
      confidence: 0.36,
    };
    candidate.output =
      "I could not find your account history. Please contact your bank.";
    candidate.evalScores[0].score = 0.36;
    candidate.root.endMs = 11830;
  } else {
    [spans[2], spans[3]] = [spans[3], spans[2]];
  }
  for (const [side, trace] of [
    ["baseline", baseline],
    ["candidate", candidate],
  ])
    writeFileSync(
      new URL(`../src/data/seed/${scenario}.${side}.json`, import.meta.url),
      JSON.stringify(trace, null, 2) + "\n",
    );
}
