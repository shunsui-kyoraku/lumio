"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Show } from "@clerk/nextjs";
import Grainient from "@/components/reactbits/Grainient";
import CardNav from "@/components/reactbits/CardNav";
import MagicBento from "@/components/reactbits/MagicBento";
import GlassIcons from "@/components/reactbits/GlassIcons";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import LightPillar from "@/components/reactbits/LightPillar";
import {
  IconTree,
  IconBook,
  IconBrain,
  IconNote,
  IconJournal,
  IconChart,
  IconCheck,
} from "@/components/icons";

const navItems = [
  {
    label: "Product",
    bgColor: "#1B1722",
    textColor: "#fff",
    links: [
      { label: "Features", href: "#features", ariaLabel: "Features" },
      { label: "How it works", href: "#how", ariaLabel: "How it works" },
    ],
  },
  {
    label: "Pricing",
    bgColor: "#2F293A",
    textColor: "#fff",
    links: [
      { label: "Free plan", href: "/pricing", ariaLabel: "Free plan" },
      { label: "Premium", href: "/pricing", ariaLabel: "Premium plan" },
    ],
  },
  {
    label: "Account",
    bgColor: "#2F293A",
    textColor: "#fff",
    links: [
      { label: "Sign in", href: "/sign-in", ariaLabel: "Sign in" },
      { label: "Create account", href: "/sign-up", ariaLabel: "Create account" },
    ],
  },
];

const bentoCards = [
  {
    label: "Skill Tree",
    title: "Skills that grow like a game tree",
    description: "Beginner → Intermediate → Advanced → Expert. Every session feeds a skill.",
  },
  {
    label: "Spaced Repetition",
    title: "Reviews scheduled by SM-2",
    description: "Grade cards Easy / Medium / Hard and the algorithm plans your memory.",
  },
  {
    label: "AI Assistant",
    title: "Paste anything, get a study kit",
    description:
      "Summaries, key concepts, flashcards and quizzes generated from your material. Learning plans built week by week.",
  },
  {
    label: "Dashboard",
    title: "Progress you can actually see",
    description:
      "Streaks, XP, levels, a GitHub-style heatmap of every learning day, and per-skill progress bars that move when you do the work.",
  },
  {
    label: "Notes",
    title: "Markdown notes with [[links]]",
    description: "Connect ideas like Obsidian. Tag, search, and link notes to skills.",
  },
  {
    label: "Journal",
    title: "Daily reflection",
    description: "What did you learn? What was hard? Confidence tracked over time.",
  },
];

const glassItems = [
  { icon: <IconBook />, color: "blue", label: "Books & courses" },
  { icon: <IconTree />, color: "purple", label: "Skill trees" },
  { icon: <IconBrain />, color: "red", label: "Flashcards" },
  { icon: <IconNote />, color: "indigo", label: "Notes" },
  { icon: <IconJournal />, color: "orange", label: "Journal" },
  { icon: <IconChart />, color: "green", label: "Analytics" },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-[#0a0a0f] text-white">
      {/* ---------------- Hero ---------------- */}
      <section className="relative h-[100dvh] min-h-[640px] w-full overflow-hidden">
        <div className="absolute inset-0">
          <Grainient
            color1="#FF9FFC"
            color2="#5227FF"
            color3="#B497CF"
            timeSpeed={0.25}
            warpStrength={1}
            warpFrequency={5}
            warpSpeed={2}
            warpAmplitude={50}
            noiseScale={2}
            grainAmount={0.1}
            grainScale={2}
            contrast={1.5}
            zoom={0.9}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#0a0a0f]" />

        <CardNav
          logoText="SkillTree"
          items={navItems}
          baseColor="#fff"
          menuColor="#000"
          buttonBgColor="#111"
          buttonTextColor="#fff"
          ease="power3.out"
          ctaLabel="Get Started"
          onCtaClick={() => router.push("/sign-up")}
        />

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <p className="mb-4 rounded-full border border-white/25 bg-black/30 px-4 py-1 text-xs uppercase tracking-[0.2em] backdrop-blur">
            Your personal learning tracker
          </p>
          <h1 className="max-w-3xl font-display text-4xl leading-tight drop-shadow-lg sm:text-6xl">
            Stop forgetting what you learn.
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/85 sm:text-lg">
            SkillTree turns books, courses, videos and projects into a living skill
            tree — with AI summaries, spaced repetition and a streak you won&apos;t
            want to break.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Show when="signed-out">
              <Link
                href="/sign-up"
                className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/85"
              >
                Start learning free
              </Link>
              <Link
                href="/sign-in"
                className="rounded-xl border border-white/40 bg-black/25 px-6 py-3 text-sm font-medium backdrop-blur transition hover:bg-black/40"
              >
                Sign in
              </Link>
            </Show>
            <Show when="signed-in">
              <Link
                href="/dashboard"
                className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/85"
              >
                Open your dashboard →
              </Link>
            </Show>
          </div>
          <p className="mt-6 text-xs text-white/60">
            Free forever plan · No credit card required
          </p>
        </div>
      </section>

      {/* ---------------- Feature bento ---------------- */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-24">
        <h2 className="text-center font-display text-3xl sm:text-4xl">
          Everything between “I watched a video” <br className="hidden sm:block" />
          and “I have a skill”
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-white/60">
          One system for storing material, structuring knowledge, reviewing on
          schedule and proving progress.
        </p>
        <div className="mt-12">
          <MagicBento
            cards={bentoCards}
            textAutoHide
            enableStars
            enableSpotlight
            enableBorderGlow
            enableTilt={false}
            enableMagnetism
            clickEffect
            spotlightRadius={300}
            particleCount={12}
            glowColor="132, 0, 255"
          />
        </div>
      </section>

      {/* ---------------- Glass icons ---------------- */}
      <section className="border-y border-white/10 bg-[#0d0d14] px-4 py-20">
        <h2 className="text-center font-display text-3xl">One place for all of it</h2>
        <p className="mx-auto mt-3 max-w-md text-center text-white/60">
          Books, videos, courses, PDFs, podcasts, certifications and projects —
          organized under the skills they build.
        </p>
        <div className="mx-auto max-w-3xl">
          <GlassIcons items={glassItems} />
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-24">
        <h2 className="text-center font-display text-3xl sm:text-4xl">How it works</h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Plant a skill",
              body: "Create skills you want to grow — nest them like a tree: Programming → JavaScript → React.",
            },
            {
              step: "02",
              title: "Learn & log",
              body: "Add resources, take linked notes, log sessions. AI turns any material into flashcards and quizzes.",
            },
            {
              step: "03",
              title: "Review & level up",
              body: "SM-2 schedules your reviews. XP, streaks and achievements keep you coming back daily.",
            },
          ].map((s) => (
            <SpotlightCard key={s.step} spotlightColor="rgba(139, 92, 246, 0.25)">
              <p className="font-mono text-sm text-white/40">{s.step}</p>
              <h3 className="mt-3 font-display text-xl">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{s.body}</p>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* ---------------- Pricing preview ---------------- */}
      <section className="mx-auto max-w-4xl px-4 pb-24">
        <h2 className="text-center font-display text-3xl">Simple pricing</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <SpotlightCard spotlightColor="rgba(255,255,255,0.12)">
            <h3 className="font-display text-xl">Free</h3>
            <p className="mt-1 text-3xl font-semibold">€0</p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              {["3 skills", "25 resources · 50 notes", "10 AI requests / day", "Spaced repetition & streaks"].map(
                (f) => (
                  <li key={f} className="flex items-center gap-2">
                    <IconCheck size={14} className="text-emerald-400" /> {f}
                  </li>
                ),
              )}
            </ul>
          </SpotlightCard>
          <SpotlightCard
            className="border-violet-500/50"
            spotlightColor="rgba(139, 92, 246, 0.3)"
          >
            <h3 className="font-display text-xl">Premium</h3>
            <p className="mt-1 text-3xl font-semibold">
              €6.99<span className="text-sm font-normal text-white/50">/month</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              {[
                "Unlimited skills, resources & notes",
                "200 AI requests / day",
                "AI learning plans",
                "Personal knowledge search",
                "Advanced analytics",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <IconCheck size={14} className="text-violet-400" /> {f}
                </li>
              ))}
            </ul>
          </SpotlightCard>
        </div>
        <div className="mt-8 text-center">
          <Link href="/pricing" className="text-sm text-violet-300 underline-offset-4 hover:underline">
            See full pricing →
          </Link>
        </div>
      </section>

      {/* ---------------- CTA with LightPillar ---------------- */}
      <section className="relative overflow-hidden border-t border-white/10">
        <div className="relative mx-auto flex min-h-[420px] max-w-6xl flex-col items-center justify-center px-4 py-24 text-center">
          <div className="absolute inset-0">
            <LightPillar
              topColor="#5227FF"
              bottomColor="#FF9FFC"
              intensity={0.9}
              rotationSpeed={0.3}
              glowAmount={0.005}
              pillarWidth={3}
              pillarHeight={0.4}
              noiseIntensity={0.4}
              mixBlendMode="screen"
              quality="medium"
            />
          </div>
          <div className="relative z-10">
            <h2 className="font-display text-3xl sm:text-5xl">
              Day 1 of your streak <br /> starts now.
            </h2>
            <Link
              href="/sign-up"
              className="mt-8 inline-block rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-black transition hover:bg-white/85"
            >
              Create your free account
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer className="border-t border-white/10 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-white/50 sm:flex-row">
          <p>© {new Date().getFullYear()} SkillTree. Learn deliberately.</p>
          <div className="flex gap-6">
            <Link href="/pricing" className="hover:text-white">Pricing</Link>
            <Link href="/sign-in" className="hover:text-white">Sign in</Link>
            <Link href="/sign-up" className="hover:text-white">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
