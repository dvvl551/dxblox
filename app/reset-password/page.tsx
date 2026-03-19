"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setErrorMessage("Invalid or expired reset link.");
      }

      setCheckingSession(false);
    };

    checkSession();
  }, []);

  const handleUpdatePassword = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (loading) return;

    setErrorMessage("");
    setSuccessMessage("");

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password,
      });

if (error) {
  const errorText = error.message.toLowerCase();

  if (errorText.includes("same password")) {
    setErrorMessage("Please choose a different password.");
  } else if (
    errorText.includes("password should be at least") ||
    errorText.includes("weak password")
  ) {
    setErrorMessage("Password is too weak. Please choose a stronger one.");
  } else if (
    errorText.includes("invalid") ||
    errorText.includes("expired")
  ) {
    setErrorMessage("This reset link is invalid or has expired.");
  } else {
    setErrorMessage("Could not update password. Please try again.");
  }

  return;
}

      setSuccessMessage("Password updated successfully. Redirecting to login...");

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.push("/login");
      }, 1500);
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
              Reset password
            </h1>
            <p className="mt-2 text-sm text-[#9CA3AF]">
              Choose a new password for your account.
            </p>
          </div>

          {checkingSession ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#9CA3AF]">
              Checking reset link...
            </div>
          ) : (
            <>
              <form className="space-y-4" onSubmit={handleUpdatePassword}>
                <div>
                  <label className="mb-2 block text-sm text-[#9CA3AF]">
                    New password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter a new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-[#73798f]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[#9CA3AF]">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                  disabled={loading || !!errorMessage}
                  className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Updating..." : "Update password"}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-[#9CA3AF]">
                Back to{" "}
                <Link
                  href="/login"
                  className="text-violet-300 hover:text-violet-200"
                >
                  login
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}