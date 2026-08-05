type Severity = "low" | "medium" | "high" | "critical";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_ERROR_CHAT_ID;
const TOPIC_ID = process.env.TELEGRAM_ERROR_CHAT_ID_TOPIC;

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, (match) => "\\" + match);
}

function escapeCode(text: string): string {
  // Inside code blocks, only backticks and backslashes need escaping
  return text.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
}

function severityEmoji(severity: Severity): string {
  switch (severity) {
    case "low":
      return "ℹ️";
    case "medium":
      return "⚠️";
    case "high":
      return "🚨";
    case "critical":
      return "🔥";
  }
}

export function formatErrorMessage(
  message: string,
  severity: Severity,
  context?: {
    route?: string;
    method?: string;
    userEmail?: string;
    duration?: number;
    stack?: string;
    extra?: Record<string, unknown>;
  }
): string {
  const env = process.env.NODE_ENV || "unknown";
  const timestamp = new Date().toISOString();
  const emoji = severityEmoji(severity);

  // Build each line as a plain string (no Markdown formatting until final step)
  const lines: string[] = [];

  // Header: emoji + severity + environment
  lines.push(
    emoji + " *" + escapeMarkdown(severity.toUpperCase()) + "* \\- `" + escapeCode(env) + "`"
  );
  lines.push("");

  // Error message
  lines.push("*Error:* `" + escapeCode(message.slice(0, 500)) + "`");

  if (context?.route) {
    const routeStr = (context.method || "") + " " + context.route;
    lines.push("*Route:* `" + escapeCode(routeStr) + "`");
  }
  if (context?.userEmail) {
    lines.push("*User:* `" + escapeCode(context.userEmail) + "`");
  }
  if (context?.duration !== undefined) {
    lines.push("*Duration:* `" + context.duration + "ms`");
  }

  lines.push("*Time:* `" + escapeCode(timestamp) + "`");

  if (context?.stack) {
    const stackLines = context.stack.split("\n").slice(0, 4).join("\n");
    lines.push("");
    lines.push("*Stack:*");
    lines.push("```\n" + escapeCode(stackLines) + "\n```");
  }

  if (context?.extra && Object.keys(context.extra).length > 0) {
    const json = JSON.stringify(context.extra, null, 2).slice(0, 400);
    lines.push("");
    lines.push("*Context:*");
    lines.push("```json\n" + escapeCode(json) + "\n```");
  }

  return lines.join("\n");
}

export async function sendTelegramMessage(
  text: string,
  severity: Severity = "medium"
): Promise<boolean> {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn("[Telegram] Missing BOT_TOKEN or CHAT_ID");
    return false;
  }

  // Telegram punya limit 4096 char per message
  const truncated = text.length > 4000 ? text.slice(0, 3950) + "\n...[truncated]" : text;

  try {
    const res = await fetch("https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: truncated,
        parse_mode: "MarkdownV2",
        disable_web_page_preview: true,
        ...(TOPIC_ID ? { message_thread_id: Number(TOPIC_ID) } : {}),
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[Telegram] API " + res.status + ": " + errBody.slice(0, 200));
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Telegram] Send failed:", err);
    return false;
  }
}

export async function notifyError(
  message: string,
  severity: Severity = "medium",
  context?: Parameters<typeof formatErrorMessage>[2]
): Promise<void> {
  if (process.env.TELEGRAM_ERROR_ENABLED !== "true") return;
  const formatted = formatErrorMessage(message, severity, context);
  await sendTelegramMessage(formatted, severity);
}
