/**
 * Error handler utility for API routes.
 * Logs errors to console and sends Telegram notifications (non-blocking).
 * Use: reportError(error, { route, method, userId })
 */
import { notifyError } from "./telegram";
import { prisma } from "./prisma";

export type ErrorContext = {
  route?: string;
  method?: string;
  userId?: string;
  userEmail?: string;
  duration?: number;
  extra?: Record<string, unknown>;
};

export type Severity = "low" | "medium" | "high" | "critical";

export function getSeverity(error: unknown, context?: ErrorContext): Severity {
  const msg = error instanceof Error ? error.message : String(error);

  // Critical: data integrity issues
  if (msg.includes("BUDGET") || msg.includes("PRISMA")) return "critical";
  if (error instanceof Error && error.name === "PrismaClientKnownRequestError") return "critical";

  // High: external service failures
  if (msg.includes("VISION") || msg.includes("OCR")) return "high";
  if (msg.includes("429") || msg.includes("RATE_LIMIT")) return "high";
  if (msg.includes("CLOUDINARY") || msg.includes("UPLOAD")) return "high";

  // Medium: generic server errors
  if (msg.includes("DATABASE") || msg.includes("CONNECT")) return "high";

  return "medium";
}

/**
 * Non-blocking error report. Always returns true so callers can ignore the result.
 */
export async function reportError(
  error: unknown,
  context?: ErrorContext,
): Promise<boolean> {
  const severity = getSeverity(error, context);
  const message = error instanceof Error ? error.message : String(error);

  // Try to fetch user email for context
  let userEmail = context?.userEmail;
  if (!userEmail && context?.userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: context.userId },
        select: { email: true },
      });
      userEmail = user?.email ?? undefined;
    } catch {
      // ignore
    }
  }

  const duration = context?.duration;
  const stack = error instanceof Error ? error.stack : undefined;

  // Fire-and-forget: don't let notification failure affect the API response
  notifyError(message, severity, {
    route: context?.route,
    method: context?.method,
    userEmail,
    duration,
    stack,
    extra: context?.extra,
  }).catch(() => {});

  console.error(`[${severity.toUpperCase()}]`, message, context);
  return true;
}

// NOTE: handleError utility kept for future use but currently unused
// because each route calls reportError directly in its catch block.