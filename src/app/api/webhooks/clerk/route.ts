import { NextRequest, NextResponse } from "next/server";
import { parseServerEnv } from "@/lib/env.server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  processClerkWebhookEvent,
  verifyClerkWebhookSignature,
} from "@/lib/auth/webhook-handler";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const env = parseServerEnv();

  if (!env.CLERK_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Clerk webhook secret is not configured on the server." },
      { status: 500 },
    );
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing required Svix webhook verification headers." },
      { status: 400 },
    );
  }

  let body: string;
  try {
    body = await req.text();
  } catch {
    return NextResponse.json(
      { error: "Failed to read request body." },
      { status: 400 },
    );
  }

  let event;
  try {
    event = verifyClerkWebhookSignature(
      body,
      {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      },
      env.CLERK_WEBHOOK_SECRET,
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature or verification failed." },
      { status: 400 },
    );
  }

  try {
    const supabaseAdmin = createAdminClient();
    const result = await processClerkWebhookEvent(event, svixId, supabaseAdmin);

    return NextResponse.json(
      {
        received: true,
        action: result.action,
        duplicate: result.duplicate ?? false,
      },
      { status: 200 },
    );
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to process webhook event.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
