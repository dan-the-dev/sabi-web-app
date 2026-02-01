import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAuth } from "@/lib/supabase/auth";
import { KickoffContent } from "./components/KickoffContent";

export default async function HomePage() {
  const supabase = await createClient();
  const auth = createAuth(supabase);
  const user = await auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-base-200">
      <KickoffContent />
    </div>
  );
}
