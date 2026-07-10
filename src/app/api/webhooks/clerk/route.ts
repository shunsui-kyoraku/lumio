import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Clerk -> SkillTree user sync.
 *
 * SECURITY: verifyWebhook() checks the Svix signature against
 * CLERK_WEBHOOK_SIGNING_SECRET before we trust a single byte of the payload.
 * Unsigned or tampered requests are rejected with 400.
 */
export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("[webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (evt.type) {
      case "user.created":
      case "user.updated": {
        const data = evt.data;
        const email =
          data.email_addresses?.find((e) => e.id === data.primary_email_address_id)
            ?.email_address ??
          data.email_addresses?.[0]?.email_address ??
          `${data.id}@users.noreply.skilltree.app`;
        const name =
          [data.first_name, data.last_name].filter(Boolean).join(" ") || null;

        await db.user.upsert({
          where: { clerkId: data.id },
          update: { email, name, imageUrl: data.image_url },
          create: { clerkId: data.id, email, name, imageUrl: data.image_url },
        });
        break;
      }
      case "user.deleted": {
        if (evt.data.id) {
          // Cascades to all user data via Prisma relations (GDPR-friendly).
          await db.user.deleteMany({ where: { clerkId: evt.data.id } });
        }
        break;
      }
      default:
        break; // ignore unsubscribed event types
    }
  } catch (err) {
    console.error("[webhook] handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
