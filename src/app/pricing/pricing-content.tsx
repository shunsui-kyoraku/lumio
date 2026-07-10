"use client";

import Link from "next/link";
import { PricingTable, Show } from "@clerk/nextjs";
import { CheckoutButton } from "@clerk/nextjs/experimental";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import { IconCheck } from "@/components/icons";

const premiumPlanId = process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID;

export default function PricingContent() {
  return (
    <div className="min-h-dvh bg-bg px-4 py-16 text-text">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm text-muted hover:text-text">
          ← SkillTree
        </Link>
        <h1 className="mt-6 font-display text-4xl">Pricing</h1>
        <p className="mt-2 max-w-xl text-muted">
          Start free. Upgrade when your skill tree outgrows the pot. Billing is
          handled securely by Clerk — we never see or store your card details.
        </p>

        {/* Clerk Billing pricing table — plans configured in the Clerk Dashboard */}
        <div className="mt-10">
          <PricingTable />
        </div>

        {/* Direct checkout for signed-in users (Clerk Billing drawer) */}
        <Show when="signed-in">
          {premiumPlanId ? (
            <div className="mt-8 flex justify-center">
              <CheckoutButton
                planId={premiumPlanId}
                planPeriod="month"
                newSubscriptionRedirectUrl="/dashboard"
              >
                <button className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 cursor-pointer">
                  Subscribe to Premium — €6.99/month
                </button>
              </CheckoutButton>
            </div>
          ) : null}
        </Show>
        <Show when="signed-out">
          <p className="mt-8 text-center text-sm text-muted">
            <Link href="/sign-up" className="text-accent hover:underline">
              Create a free account
            </Link>{" "}
            to subscribe.
          </p>
        </Show>

        {/* Feature comparison */}
        <div className="mt-16 grid gap-5 md:grid-cols-2">
          <SpotlightCard spotlightColor="rgba(255,255,255,0.1)">
            <h3 className="font-display text-lg">Free includes</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {[
                "3 skills with full progress tracking",
                "25 resources and 50 notes",
                "Spaced repetition reviews",
                "Streaks, XP and achievements",
                "10 AI requests per day",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <IconCheck size={14} className="text-success" /> {f}
                </li>
              ))}
            </ul>
          </SpotlightCard>
          <SpotlightCard spotlightColor="rgba(139,92,246,0.28)">
            <h3 className="font-display text-lg">Premium adds</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {[
                "Unlimited skills, resources and notes",
                "200 AI requests per day",
                "AI learning plans (week-by-week)",
                "Personal knowledge search across your notes",
                "Advanced analytics",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <IconCheck size={14} className="text-accent" /> {f}
                </li>
              ))}
            </ul>
          </SpotlightCard>
        </div>
      </div>
    </div>
  );
}
