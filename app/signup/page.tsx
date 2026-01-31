"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createAuth } from "@/lib/supabase/auth";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
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
      const result = await auth.signUp(email, password);
      if (result.success) {
        if (result.needsEmailConfirmation) {
          setMessage(
            "Check your email for the confirmation link to activate your account."
          );
        } else {
          router.refresh();
          router.push("/");
        }
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
              Create account
            </h1>
            <p className="text-center text-base-content/70">
              Sign up with your email and a password.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-primary">
              {(error || message) && (
                <div
                  role="alert"
                  className={`rounded-lg px-4 py-3 text-sm ${
                    error
                      ? "bg-error/10 text-error"
                      : "bg-success/10 text-success"
                  }`}
                >
                  {error ?? message}
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
                  minLength={6}
                  autoComplete="new-password"
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text">Confirm password</span>
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
                {loading ? "Creating account…" : "Sign up"}
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-base-content/70">
              Already have an account?{" "}
              <Link href="/login" className="link link-primary font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
