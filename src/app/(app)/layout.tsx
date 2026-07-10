import AppShell from "@/components/AppShell";

/**
 * Layout for the authenticated product area. Route protection happens in
 * src/middleware.ts (default-deny) — nothing under this group is public.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
