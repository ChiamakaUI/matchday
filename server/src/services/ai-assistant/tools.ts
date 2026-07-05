import Anthropic from '@anthropic-ai/sdk';

export const assistantTools: Anthropic.Tool[] = [
  {
    name: 'get_fixtures',
    description:
      'Get World Cup fixtures. Filter by fixture group (Group Stage, Round of 32, etc.), status, or date range. Returns fixture details including teams, kickoff time, and current scores.',
    input_schema: {
      type: 'object' as const,
      properties: {
        fixture_group: {
          type: 'string',
          description: 'Filter by round: "Group Stage", "Round of 32", "Round of 16", "Quarter Final", "Semi Final", "Final"',
        },
        status: {
          type: 'string',
          enum: ['NS', 'H1', 'HT', 'H2', 'FT', 'ET', 'FET', 'PEN', 'FPEN'],
          description: 'Filter by fixture status',
        },
        from_date: {
          type: 'string',
          description: 'Filter fixtures from this date (ISO format)',
        },
        to_date: {
          type: 'string',
          description: 'Filter fixtures up to this date (ISO format)',
        },
      },
    },
  },
  {
    name: 'get_fixture_details',
    description:
      'Get detailed information about a specific fixture including teams, scores, and current status. Use this when discussing a specific match.',
    input_schema: {
      type: 'object' as const,
      properties: {
        fixture_id: {
          type: 'string',
          description: 'The fixture UUID',
        },
      },
      required: ['fixture_id'],
    },
  },
  {
    name: 'get_contest_details',
    description:
      'Get full details of a prediction contest including entry fee, deadline, associated fixtures, and current entry count.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contest_id: {
          type: 'string',
          description: 'The contest UUID',
        },
      },
      required: ['contest_id'],
    },
  },
  {
    name: 'list_contests',
    description:
      'List available prediction contests. Returns open contests with entry fees, deadlines, and fixture counts. Use this when the user asks what contests are available.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: {
          type: 'string',
          enum: ['open', 'locked', 'scoring', 'settled'],
          description: 'Filter by contest status (default: open)',
        },
      },
    },
  },
  {
    name: 'validate_predictions',
    description:
      'Validate a set of predictions against a contest. Checks that fixtures are in the contest, prediction types are valid, and values are correct. Use this before the user submits their entry.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contest_id: {
          type: 'string',
          description: 'The contest UUID',
        },
        predictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fixture_id: { type: 'string' },
              prediction_type: {
                type: 'string',
                enum: ['match_result', 'correct_score', 'both_teams_score', 'over_under_2_5'],
              },
              predicted_value: { type: 'string' },
            },
            required: ['fixture_id', 'prediction_type', 'predicted_value'],
          },
          description: 'Array of predictions to validate',
        },
      },
      required: ['contest_id', 'predictions'],
    },
  },
];

export const SYSTEM_PROMPT = `You are the MatchDay Assistant, an AI World Cup prediction expert that helps users make informed match predictions for USDC prize contests.

You have access to tools that query the real fixture and contest database. Use them to look up fixtures, check contest details, and validate predictions before submission.

PREDICTION TYPES AND SCORING:
- Match Result (home/draw/away): 3 points — predict the match outcome
- Correct Score (e.g. "2-1"): 5 points — predict the exact final score
- Both Teams to Score (yes/no): 2 points — will both teams score at least one goal?
- Over/Under 2.5 Goals (over/under): 2 points — will the total goals be more than 2.5?

Each contest covers a set of fixtures. For each fixture you can make up to 4 predictions (one per type). Maximum points per fixture: 12. The leaderboard ranks entries by total points.

HOW TO HELP USERS:
- When asked about matches, fetch the relevant fixtures and share team names, kickoff times, and scores
- When helping with predictions, consider team form, historical matchups, and the tournament context
- Always explain your reasoning: why you think a result is likely, what factors you're weighing
- If the user mentions a contest, fetch its details and list the fixtures involved
- Before the user submits, validate their predictions to catch any issues
- Be conversational and knowledgeable about football, not robotic
- If a match has already kicked off, let the user know they can't predict it

IMPORTANT:
- Prediction values must be exact: "home", "draw", or "away" for match result; "2-1" format for correct score; "yes" or "no" for BTTS; "over" or "under" for O/U 2.5
- Always validate predictions before presenting them as ready to submit
- Show the potential points breakdown so users understand the risk/reward

FORMATTING RULES:
- Never use markdown tables, horizontal rules, or headers (##).
- Never use emoji as bullet points or section markers.
- Keep responses conversational — short paragraphs, not structured reports.
- Use plain text lists with dashes if listing items, never pipe tables.
- Be concise. 3-4 short paragraphs max per response, not a full report.
- You're a knowledgeable football friend in a chat, not a document generator.`;
