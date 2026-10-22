import Link from "next/link";

export function TopBar({ email }: { email?: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-[56px] shrink-0 items-center justify-between gap-4 border-b border-[#E0DDD8] bg-white px-4 md:px-6">
      <Link
        href="/dashboard/setup"
        className="inline-flex min-h-11 items-center text-sm font-medium text-gray-700 underline underline-offset-4"
      >
        Deployment setup
      </Link>
      <div className="flex min-w-0 items-center gap-4">
        <Link
          href="/dashboard/health"
          className="inline-flex min-h-11 shrink-0 items-center text-sm underline underline-offset-4"
        >
          Tracking health
        </Link>
        <span className="hidden max-w-56 truncate text-xs text-gray-600 sm:block" title={email}>
          {email ?? "Owner"}
        </span>
      </div>
    </header>
  );
}
