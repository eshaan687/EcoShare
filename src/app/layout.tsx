import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { isClerkClientConfigured, parseClientEnv } from "@/lib/env.client";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "EcoShare — Share Actions. Inspire Change.",
    template: "%s | EcoShare",
  },
  description:
    "A global environmental social network connecting people to share real-world environmental contributions, join communities, and build verified impact.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const env = parseClientEnv();
  const clerkReady = isClerkClientConfigured(env);

  const content = (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-md"
      >
        Skip to main content
      </a>
      {children}
    </>
  );

  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background text-text-primary antialiased">
        {clerkReady ? (
          <ClerkProvider
            publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
            signInUrl="/login"
            signUpUrl="/signup"
            signInFallbackRedirectUrl="/home"
            signUpFallbackRedirectUrl="/home"
            appearance={{
              theme: shadcn,
              variables: {
                colorPrimary: "#22C55E",
                borderRadius: "0.75rem",
              },
            }}
          >
            {content}
          </ClerkProvider>
        ) : (
          content
        )}
      </body>
    </html>
  );
}
