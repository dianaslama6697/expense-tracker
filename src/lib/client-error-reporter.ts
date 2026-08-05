/**
 * Client-side error reporter.
 * Hook ini bisa dipakai di global error boundary atau component client.
 * Kirim error via internal API yang sudah wrap Telegram reporter.
 */
"use client";

export type ClientErrorContext = {
  component?: string;
  userEmail?: string;
  extra?: Record<string, unknown>;
};

export async function reportClientError(
  error: Error,
  context?: ClientErrorContext,
): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    await fetch("/api/internal/log-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        component: context?.component,
        userEmail: context?.userEmail,
        extra: context?.extra,
        url: window.location.href,
      }),
    });
  } catch {
    // Gak boleh throw - ini background reporter
  }
}
