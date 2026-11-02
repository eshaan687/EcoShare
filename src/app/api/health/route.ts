import { NextResponse } from "next/server";
import {
  isClerkClientConfigured,
  isSupabaseClientConfigured,
  parseClientEnv,
} from "@/lib/env.client";

export async function GET() {
  const env = parseClientEnv();

  return NextResponse.json(
    {
      status: "ok",
      milestone: 0,
      clerkConfigured: isClerkClientConfigured(env),
      supabaseConfigured: isSupabaseClientConfigured(env),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
