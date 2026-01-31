import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAuth } from "@/lib/supabase/auth";
import { LogoutButton } from "@/app/components/LogoutButton";

export default async function HomePage() {
  const supabase = await createClient();
  const auth = createAuth(supabase);
  const user = await auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-base-200">
      <header className="shrink-0 border-b border-base-300 bg-base-100">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-semibold text-base-content">Sabi</h1>
          <LogoutButton />
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-hidden px-4 py-6">
        <div className="mx-auto max-w-4xl">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-primary">Welcome home</h2>
            <p className="text-base-content/80">
              You&apos;re signed in as{" "}
              <span className="font-medium text-base-content">
                {user.email ?? "Unknown"}
              </span>
              .
            </p>
            <p className="mt-2 text-sm text-base-content/60">
              This is your protected homepage. Use the button above to sign out.
            </p>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
