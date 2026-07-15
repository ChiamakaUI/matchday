import Anthropic from "@anthropic-ai/sdk";
import { env, getPool, camelizeRows } from "../../config/index.js";
import { listContests } from "../../queries/contests.generated.js";
import { getFixturesByContest } from "../../queries/fixtures.generated.js";
import type { PredictionType } from "../../types/index.js";

const getClient = (() => {
  let client: Anthropic | null = null;
  return () => {
    if (!client) client = new Anthropic({ apiKey: env().ANTHROPIC_API_KEY });
    return client;
  };
})();

// ── Types ───────────────────────────────────────────────────

export interface ContestEvaluation {
  contestId: string;
  contestName: string;
  shouldEnter: boolean;
  reasoning: string;
  confidence: number; // 0-1
  entryFee: number;
}

export interface AgentPrediction {
  fixtureId: string;
  homeTeam: string;
  awayTeam: string;
  predictionType: PredictionType;
  predictedValue: string;
  confidence: number;
  reasoning: string;
}

export interface PredictionSet {
  contestId: string;
  predictions: AgentPrediction[];
  totalConfidence: number;
  reasoning: string;
}

// ── Contest evaluation ──────────────────────────────────────

/**
 * Evaluate open contests and decide which ones to enter.
 * Returns a list of contests the agent wants to enter, with reasoning.
 */
export async function evaluateContests(
  maxEntryFee: number,
  maxContests: number,
): Promise<ContestEvaluation[]> {
  const pool = getPool();
  const contests = await listContests.run({ status: "open" }, pool);

  console.log(`[Agent] Found ${contests.length} open contests`);
  if (contests.length === 0) return [];

  // Fetch fixtures for each contest
  const contestsWithFixtures = await Promise.all(
    contests.map(async (c) => {
      const fixtures = await getFixturesByContest.run(
        { contestId: c.id },
        pool,
      );
      return {
        id: c.id,
        name: c.name,
        entryFee: Number(c.entry_fee),
        deadline: c.deadline,
        entryCount: Number(c.entry_count),
        maxEntries: c.max_entries,
        fixtures: camelizeRows(fixtures),
      };
    }),
  );

  // Filter by entry fee budget
  const affordable = contestsWithFixtures.filter(
    (c) => c.entryFee <= maxEntryFee,
  );
  console.log(
    `[Agent] ${affordable.length}/${contestsWithFixtures.length} contests within budget (max ${maxEntryFee})`,
  );
  if (affordable.length === 0) return [];

  const client = getClient();

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    system: `You are an autonomous prediction agent for MatchDay, a World Cup prediction game. You evaluate contests and decide which ones to enter based on the fixtures, entry fees, and competition level.

Respond ONLY with a JSON array of evaluations. No other text.

Each evaluation: {"contestId": "...", "shouldEnter": true/false, "reasoning": "...", "confidence": 0.0-1.0}

Factors to consider:
- Number of fixtures (more fixtures = more prediction opportunities = higher skill edge)
- Entry fee vs potential payout
- Current number of entries (fewer entries = better odds)
- Only skip if the contest deadline has already passed
- Matches kicking off soon are FINE — predictions can be made right up until kickoff
- Fewer entries means less competition, which is a positive signal
- You are an AI and can analyze matches instantly, so time pressure is not a concern`,
    messages: [
      {
        role: "user",
        content: `Evaluate these contests. Budget: max ${maxEntryFee} USDC per contest, max ${maxContests} contests total. Current time: ${new Date().toISOString()}

${JSON.stringify(affordable, null, 2)}`,
      },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  console.log("[Agent] Claude evaluation response:", text);

  try {
    const cleaned = text.replace(/```json\n?|```/g, "").trim();
    const evaluations = JSON.parse(cleaned) as Array<{
      contestId: string;
      shouldEnter: boolean;
      reasoning: string;
      confidence: number;
    }>;

    const toEnter = evaluations
      .filter((e) => e.shouldEnter)
      .slice(0, maxContests);
    console.log(
      `[Agent] ${toEnter.length} contests to enter out of ${evaluations.length} evaluated`,
    );

    return toEnter.map((e) => {
      const contest = affordable.find((c) => c.id === e.contestId);
      return {
        contestId: e.contestId,
        contestName: contest?.name ?? "Unknown",
        shouldEnter: true,
        reasoning: e.reasoning,
        confidence: e.confidence,
        entryFee: contest?.entryFee ?? 0,
      };
    });
  } catch (err) {
    console.error("[Agent] Failed to parse contest evaluation:", text, err);
    return [];
  }
}

// ── Prediction building ─────────────────────────────────────

/**
 * Build predictions for a specific contest.
 * Claude analyzes each fixture and generates predictions for all 4 types.
 */
export async function buildPredictions(
  contestId: string,
): Promise<PredictionSet> {
  const pool = getPool();
  const fixtures = await getFixturesByContest.run({ contestId }, pool);

  const fixtureData = fixtures
    .filter((f) => f.status === "NS")
    .map((f) => ({
      id: f.id,
      homeTeam: f.home_team_name,
      awayTeam: f.away_team_name,
      kickoff: f.kickoff,
      fixtureGroup: f.fixture_group,
    }));

  if (fixtureData.length === 0) {
    return {
      contestId,
      predictions: [],
      totalConfidence: 0,
      reasoning: "No upcoming fixtures to predict.",
    };
  }

  const client = getClient();

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    system: `You are an autonomous World Cup prediction agent. Analyze each fixture and generate predictions.

Respond ONLY with a JSON object. No other text.

Format:
{
  "reasoning": "Overall strategy explanation",
  "predictions": [
    {
      "fixtureId": "uuid",
      "homeTeam": "...",
      "awayTeam": "...",
      "predictionType": "match_result|correct_score|both_teams_score|over_under_2_5",
      "predictedValue": "home|draw|away | X-Y | yes|no | over|under",
      "confidence": 0.0-1.0,
      "reasoning": "Why this prediction"
    }
  ]
}

Rules:
- Generate ALL 4 prediction types for each fixture (match_result, correct_score, both_teams_score, over_under_2_5)
- match_result: "home", "draw", or "away"
- correct_score: "X-Y" format (e.g. "2-1")
- both_teams_score: "yes" or "no"
- over_under_2_5: "over" or "under"
- Make your correct_score prediction consistent with your match_result prediction
- Consider World Cup context: group stage vs knockout, team strength, historical patterns`,
    messages: [
      {
        role: "user",
        content: `Build predictions for these World Cup fixtures:

${JSON.stringify(fixtureData, null, 2)}`,
      },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  try {
    const cleaned = text.replace(/```json\n?|```/g, "").trim();
    const result = JSON.parse(cleaned) as {
      reasoning: string;
      predictions: AgentPrediction[];
    };

    const totalConfidence =
      result.predictions.length > 0
        ? result.predictions.reduce((sum, p) => sum + p.confidence, 0) /
          result.predictions.length
        : 0;

    return {
      contestId,
      predictions: result.predictions,
      totalConfidence,
      reasoning: result.reasoning,
    };
  } catch {
    console.error("[Agent] Failed to parse predictions:", text);
    return {
      contestId,
      predictions: [],
      totalConfidence: 0,
      reasoning: "Failed to generate predictions.",
    };
  }
}
