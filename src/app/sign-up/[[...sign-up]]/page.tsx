import { SignUp } from "@clerk/nextjs";

export const metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg p-6">
      <SignUp />
    </div>
  );
}
