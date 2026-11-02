import { ClerkProvider } from "@clerk/nextjs";
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

  const documentTree = (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background text-text-primary antialiased">
        {children}
      </body>
    </html>
  );

  if (!clerkReady) {
    return documentTree;
  }

  return (
    <ClerkProvider
      publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl={env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}
      signUpUrl={env.NEXT_PUBLIC_CLERK_SIGN_UP_URL}
    >
      {documentTree}
    </ClerkProvider>
  );
}
