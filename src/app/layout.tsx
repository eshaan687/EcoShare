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

  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background text-text-primary antialiased">
        {clerkReady ? (
          <ClerkProvider
            appearance={{ theme: shadcn }}
            publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          >
            {children}
          </ClerkProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
