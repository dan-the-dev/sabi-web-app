"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createAuth } from "@/lib/supabase/auth";

function getAuthParamsFromUrl(): { type: string | null; code: string | null } {
  if (typeof window === "undefined") return { type: null, code: null };
  const hash = window.location.hash.slice(1);
  const search = window.location.search.slice(1);
  const params = new URLSearchParams(hash || search);
  return {
    type: params.get("type"),
    code: params.get("code"),
  };
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const { type, code } = getAuthParamsFromUrl();

    if (type === "recovery") {
      const supabase = createClient();
      if (code) {
        supabase.auth
          .exchangeCodeForSession(code)
          .then(() => {
            setIsRecovery(true);
            setReady(true);
          })
          .catch(() => {
            setReady(true);
          });
      } else {
        setIsRecovery(true);
        setReady(true);
      }
      return;
    }

    const supabase = createClient();
    const auth = createAuth(supabase);
    auth.getUser().then((user) => {
      if (user) {
        setIsRecovery(true);
      }
      setReady(true);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const auth = createAuth(supabase);
      const result = await auth.updatePassword(password);
      if (result.success) {
        router.refresh();
        router.push("/");
      } else {
        setError(result.error ?? "Something went wrong");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-base-200 px-4 py-4 text-primary">
        <div className="text-base-content/70">Loading…</div>
      </div>
    );
  }

  if (!isRecovery) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-base-200 px-4 py-4 text-primary">
        <div className="w-full max-w-md">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <p className="text-center text-base-content/70">
                This page is for setting a new password after clicking the link
                in your email. If you need a new link,{" "}
                <Link href="/forgot-password" className="link link-primary">
                  request one
                </Link>
                .
              </p>
              <Link href="/login" className="btn btn-primary btn-block">
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
              Set new password
            </h1>
            <p className="text-center text-base-content/70">
              Enter your new password below.
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
                <span className="label-text">New password</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input input-bordered w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text">Confirm new password</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input input-bordered w-full"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </label>
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
              >
                {loading ? "Updating…" : "Update password"}
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
