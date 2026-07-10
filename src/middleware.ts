import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Default-deny route protection.
 *
 * Everything is protected unless it is explicitly listed here. New routes are
 * therefore private by default — the safe failure mode.
 */
const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/sign-in(.*)",
  "/sign-up(.*)",
  // Webhooks authenticate via Svix signature verification, not a session.
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
