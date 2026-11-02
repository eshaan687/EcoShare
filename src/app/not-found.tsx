import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold text-text-primary">
        Page Not Found
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        The requested EcoShare page could not be found.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-pill bg-primary px-5 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Return Home
      </Link>
    </main>
  );
}
