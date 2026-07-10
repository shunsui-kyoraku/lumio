import { UserProfile } from "@clerk/nextjs";

export const metadata = { title: "Account" };

/**
 * Clerk's full account management UI (profile, security, sessions, billing).
 * Mounted on an optional catch-all route as required by Clerk path routing.
 */
export default function UserProfilePage() {
  return (
    <div className="flex justify-center py-4">
      <UserProfile path="/user-profile" />
    </div>
  );
}
