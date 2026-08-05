import { NextRequest, NextResponse } from "next/server";
import { reportError } from "@/lib/error-handler";

/**
 * Internal endpoint untuk client-side error reporting.
 * Menerima error dari client via fetch, lalu forward ke Telegram.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, stack, component, userEmail, extra, url } = body;

    const err = new Error(message || "Unknown client error");
    if (stack) err.stack = stack;

    await reportError(err, {
      route: `client:${url || "unknown"}`,
      method: component ? `CLIENT:${component}` : "CLIENT",
      userEmail,
      extra,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    // Silent fail - jangan sampai reporter crash app
    return NextResponse.json({ ok: false });
  }
}
