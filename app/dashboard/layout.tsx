import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { createClient } from "@/utils/supabase/server";
import { ownerAccessStatus } from "@/lib/owner-access";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  const status = ownerAccessStatus(user.id, process.env.PROMPTWATCH_OWNER_ID);
  if (status !== 200)
    return (
      <main className="mx-auto max-w-xl bg-white p-8 font-sans text-black">
        <h1 className="mb-4 text-2xl font-bold">
          {status === 503 ? "Finish owner setup" : "Owner access required"}
        </h1>
        <p>
          {status === 503
            ? "Set PROMPTWATCH_OWNER_ID on the server to the intended owner's Supabase user UUID, then restart the deployment."
            : "This self-hosted deployment is managed by a different account."}
        </p>
        <form
          action={async () => {
            "use server";
            const client = await createClient();
            await client.auth.signOut();
            redirect("/login");
          }}
        >
          <button className="mt-6 border border-black px-4 py-2" type="submit">
            Sign out
          </button>
        </form>
      </main>
    );
  return (
    <div className="dashboard-shell flex h-dvh overflow-hidden bg-[#FFFFFF] text-[#0A0A0A] selection:bg-[#0A0A0A] selection:text-white">
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:p-3 focus:underline"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden pt-[56px] md:ml-[240px] md:pt-0">
        <TopBar email={user.email} />
        <main id="dashboard-main" tabIndex={-1} className="min-w-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
