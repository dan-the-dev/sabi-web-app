"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { createAuth } from "@/lib/supabase/auth";

function getResetPasswordUrl(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/reset-password`;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const auth = createAuth(supabase);
      const redirectTo = getResetPasswordUrl();
      const result = await auth.resetPasswordForEmail(email, redirectTo);
      if (result.success) {
        setSent(true);
      } else {
        setError(result.error ?? "Something went wrong");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
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
                Check your email
              </h1>
              <p className="text-center text-base-content/70">
                We sent a link to <strong>{email}</strong>. Click it to set a new
                password.
              </p>
              <Link href="/login" className="btn btn-primary btn-block mt-4">
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
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
              Reset password
            </h1>
            <p className="text-center text-base-content/70">
              Enter your email and we&apos;ll send you a link to set a new
              password.
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
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-base-content/70">
              <Link href="/login" className="link link-primary font-medium">
                Back to sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
