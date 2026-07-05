import Anthropic from '@anthropic-ai/sdk';
import { env, getPool } from '../../config/index.js';
import {
  createThread,
  getThreadMessages,
  insertMessage,
} from '../../queries/ai-assistant.generated.js';
import { assistantTools, SYSTEM_PROMPT } from './tools.js';
import { executeTool } from './executor.js';

const getClient = (() => {
  let client: Anthropic | null = null;
  return () => {
    if (!client) client = new Anthropic({ apiKey: env().ANTHROPIC_API_KEY });
    return client;
  };
})();

export async function chat(
  userId: string,
  userMessage: string,
  threadId?: string,
): Promise<{ threadId: string; response: string }> {
  const pool = getPool();
  const client = getClient();

  // 1. Create or fetch thread
  let activeThreadId = threadId;
  if (!activeThreadId) {
    const rows = await createThread.run(
      { userId, title: userMessage.slice(0, 100) },
      pool,
    );
    activeThreadId = rows[0]!.id;
  }

  // 2. Load conversation history
  const historyRows = await getThreadMessages.run({ threadId: activeThreadId }, pool);

  const messages: Anthropic.MessageParam[] = historyRows.map((row) => {
    const content = row.tool_calls
      ? JSON.parse(row.tool_calls as string)
      : (row.content as string);
    return {
      role: row.role as 'user' | 'assistant',
      content,
    };
  });

  // 3. Add user message
  messages.push({ role: 'user', content: userMessage });
  await insertMessage.run(
    { threadId: activeThreadId, role: 'user', content: userMessage, toolCalls: null },
    pool,
  );

  // 4. Agentic loop
  let response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: assistantTools,
    messages,
  });

  while (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    );

    messages.push({ role: 'assistant', content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const toolUse of toolUseBlocks) {
      const result = await executeTool(
        toolUse.name,
        toolUse.input as Record<string, unknown>,
      );
      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: result,
      });
    }

    messages.push({ role: 'user', content: toolResults });

    response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: assistantTools,
      messages,
    });
  }

  // 5. Extract final text
  const textBlocks = response.content.filter(
    (block): block is Anthropic.TextBlock => block.type === 'text',
  );
  const reply = textBlocks.map((b) => b.text).join('\n');

  // 6. Store assistant response
  await insertMessage.run(
    {
      threadId: activeThreadId,
      role: 'assistant',
      content: reply,
      toolCalls: JSON.stringify(response.content),
    },
    pool,
  );

  return { threadId: activeThreadId, response: reply };
}
