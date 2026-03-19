"use client";

import Link from "next/link";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    setErrorMessage("");
    setSuccessMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage("Please enter your email.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

if (error) {
  const errorText = error.message.toLowerCase();

  if (
    errorText.includes("rate limit") ||
    errorText.includes("email rate limit exceeded")
  ) {
    setErrorMessage(
      "Too many reset requests right now. Please wait a bit and try again later."
    );
  } else if (
    errorText.includes("user not found") ||
    errorText.includes("email not found")
  ) {
    setErrorMessage("No account was found with this email.");
  } else {
    setErrorMessage("Could not send reset email. Please try again.");
  }

  return;
}

      setSuccessMessage(
        "Password reset email sent. Check your inbox."
      );
      setEmail("");
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0B0B12] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.16),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.10),transparent_28%)]" />

      <Navbar />

      <main className="relative mx-auto max-w-7xl px-6 py-12">
        <div className="mx-auto w-full max-w-xl rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)] sm:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-black tracking-tight">
              Forgot password
            </h1>
            <p className="mt-2 text-sm text-[#9CA3AF]">
              Enter your email to receive a password reset link.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleResetPassword}>
            <div>
              <label className="mb-2 block text-sm text-[#9CA3AF]">
                Email
              </label>
<input
  type="email"
  placeholder="Enter your email"
  value={email}
  onChange={(e) => {
    setEmail(e.target.value);
    if (errorMessage) setErrorMessage("");
    if (successMessage) setSuccessMessage("");
  }}
  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-[#73798f]"
/>
            </div>

            {errorMessage && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#9CA3AF]">
            Remembered your password?{" "}
            <Link
              href="/login"
              className="text-violet-300 hover:text-violet-200"
            >
              Back to login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}