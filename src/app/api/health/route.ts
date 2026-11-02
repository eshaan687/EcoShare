import { NextResponse } from "next/server";
import { isSupabaseClientConfigured, parseClientEnv } from "@/lib/env.client";

export async function GET() {
  const env = parseClientEnv();

  return NextResponse.json(
    {
      status: "ok",
      milestone: 0,
      supabaseConfigured: isSupabaseClientConfigured(env),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
