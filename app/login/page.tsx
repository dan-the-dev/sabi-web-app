"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createAuth } from "@/lib/supabase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const auth = createAuth(supabase);
      const result = await auth.signIn(email, password);
      if (result.success) {
        router.refresh();
        router.push("/");
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-base-200 px-4 py-4">
      <div className="w-full max-w-md">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-center">
              <Image
                src="/sabi-icon.png"
                alt="Sabi"
                width={64}
                height={64}
                priority
                className="rounded-xl"
              />
            </div>
            <h1 className="card-title text-2xl justify-center text-primary">
              Sign in
            </h1>
            <p className="text-center text-base-content/70">
              Welcome back. Sign in to your account.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-primary">
              {error && (
                <div
                  role="alert"
                  className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error"
                >
                  {error}
                </div>
              )}
              <label className="form-control w-full">
                <span className="label-text">Email</span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="input input-bordered w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text">Password</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input input-bordered w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </label>
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-base-content/70">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="link link-primary font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
