import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SkillTree — turn learning into measurable skill",
    template: "%s · SkillTree",
  },
  description:
    "AI-powered personal learning tracker: skill trees, spaced repetition, notes, journaling and progress analytics.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
};

/** Applies the saved theme before paint to avoid a flash. Dark is default. */
const themeInit = `try{if(localStorage.getItem("st-theme")==="light")document.documentElement.classList.add("light")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#8b5cf6",
          colorBackground: "#13131c",
          colorForeground: "#ededf4",
          colorInput: "#1a1a27",
          colorInputForeground: "#ededf4",
          colorBorder: "#26263a",
          borderRadius: "0.75rem",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body>
          <script dangerouslySetInnerHTML={{ __html: themeInit }} />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
