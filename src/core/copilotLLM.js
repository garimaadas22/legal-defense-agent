/**
 * core/copilotLLM.js
 *
 * Forwards the enriched message array to the GitHub Copilot LLM endpoint
 * and streams token-by-token responses back via the onToken callback.
 *
 * GitHub Copilot Extensions use the OpenAI-compatible chat completions API
 * at: https://api.githubcopilot.com/chat/completions
 *
 * Authentication: the user's GitHub token passed in the X-GitHub-Token header
 * is forwarded as a Bearer token – no separate API key needed.
 *
 * Reference:
 * https://docs.github.com/en/copilot/building-copilot-extensions/building-a-copilot-agent-for-your-copilot-extension
 */

const COPILOT_API_URL = "https://api.githubcopilot.com/chat/completions";
const MODEL = "gpt-4o"; // The model identifier used by GitHub Copilot

/**
 * forwardToCopilotLLM
 *
 * @param {Object}   options
 * @param {Array}    options.messages      – original messages from the webhook payload
 * @param {string}   options.systemPrompt  – enriched system prompt from promptBuilder
 * @param {string}   options.githubToken   – token from X-GitHub-Token header
 * @param {Function} options.onToken       – callback(tokenString) called per streamed token
 */
export async function forwardToCopilotLLM({ messages, systemPrompt, githubToken, onToken }) {
  // Prepend our enriched system prompt as the first message
  const enrichedMessages = [
    { role: "system", content: systemPrompt },
    // Filter out any existing system messages from the original payload,
    // then keep all user/assistant turns for conversational context.
    ...messages.filter((m) => m.role !== "system"),
  ];

  const response = await fetch(COPILOT_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${githubToken}`,
      "Content-Type": "application/json",
      "Copilot-Integration-Id": "legal-defense-agent",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: enrichedMessages,
      stream: true,
      max_tokens: 2048,
      temperature: 0.2, // Lower temp for more deterministic legal/code output
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Copilot API error ${response.status}: ${errorText}`);
  }

  // ── Parse the SSE stream ─────────────────────────────────────────────────
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");

    // Keep the last (possibly incomplete) line in the buffer
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return;

      try {
        const parsed = JSON.parse(data);
        const token = parsed?.choices?.[0]?.delta?.content;
        if (token) {
          onToken(token);
        }
      } catch {
        // Malformed SSE chunk – skip silently
      }
    }
  }
}
