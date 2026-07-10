"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import LineSidebar from "@/components/reactbits/LineSidebar";
import Dock from "@/components/reactbits/Dock";
import QuickAdd from "@/components/QuickAdd";
import {
  IconHome,
  IconTree,
  IconBook,
  IconNote,
  IconCards,
  IconSparkle,
  IconPlus,
} from "@/components/icons";

const NAV = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Skills", path: "/skills" },
  { label: "Library", path: "/resources" },
  { label: "Notes", path: "/notes" },
  { label: "Reviews", path: "/reviews" },
  { label: "Journal", path: "/journal" },
  { label: "Projects", path: "/projects" },
  { label: "Assistant", path: "/assistant" },
  { label: "Achievements", path: "/achievements" },
  { label: "Settings", path: "/settings" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const activeIndex = useMemo(() => {
    const idx = NAV.findIndex((n) => pathname === n.path || pathname.startsWith(`${n.path}/`));
    return idx === -1 ? null : idx;
  }, [pathname]);

  const dockItems = [
    { icon: <IconHome size={20} />, label: "Dashboard", onClick: () => router.push("/dashboard") },
    { icon: <IconTree size={20} />, label: "Skills", onClick: () => router.push("/skills") },
    { icon: <IconPlus size={22} />, label: "Quick add", onClick: () => setQuickAddOpen(true) },
    { icon: <IconCards size={20} />, label: "Reviews", onClick: () => router.push("/reviews") },
    { icon: <IconSparkle size={20} />, label: "Assistant", onClick: () => router.push("/assistant") },
  ];

  return (
    <div className="min-h-dvh bg-bg text-text">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-surface/60 backdrop-blur lg:flex">
        <Link href="/dashboard" className="flex items-center gap-2 px-6 pb-2 pt-6">
          <span className="grid size-8 place-items-center rounded-lg bg-accent font-bold text-white">
            S
          </span>
          <span className="font-display text-lg tracking-tight">SkillTree</span>
        </Link>
        <div className="flex-1 overflow-y-auto py-2 pl-2">
          <LineSidebar
            items={NAV.map((n) => n.label)}
            activeIndex={activeIndex}
            accentColor="#a78bfa"
            textColor="var(--color-muted)"
            markerColor="var(--color-border)"
            markerLength={26}
            markerGap={10}
            maxShift={10}
            itemGap={14}
            fontSize={0.92}
            onItemClick={(index) => router.push(NAV[index].path)}
          />
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-4">
          <UserButton
            userProfileMode="navigation"
            userProfileUrl="/user-profile"
            appearance={{ elements: { avatarBox: "size-9" } }}
          />
          <button
            onClick={() => setQuickAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 cursor-pointer"
          >
            <IconPlus size={15} /> Log
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-bg/80 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-accent text-sm font-bold text-white">
            S
          </span>
          <span className="font-display">SkillTree</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/notes" aria-label="Notes" className="text-muted">
            <IconNote size={20} />
          </Link>
          <Link href="/resources" aria-label="Library" className="text-muted">
            <IconBook size={20} />
          </Link>
          <UserButton userProfileMode="navigation" userProfileUrl="/user-profile" />
        </div>
      </header>

      {/* Content */}
      <main className="px-4 pb-28 pt-6 sm:px-6 lg:ml-64 lg:pb-12 lg:pt-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>

      {/* Mobile dock */}
      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        <Dock items={dockItems} panelHeight={64} baseItemSize={46} magnification={60} />
      </div>

      <QuickAdd open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </div>
  );
}
