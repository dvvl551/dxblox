"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (loading) return;

  setErrorMessage("");
  setSuccessMessage("");

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanUsername) {
      setErrorMessage("Please enter a username.");
      return;
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      setErrorMessage("Username must be between 3 and 20 characters.");
      return;
    }

    if (!cleanEmail) {
      setErrorMessage("Please enter an email.");
      return;
    }

    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!acceptedRules) {
      setErrorMessage("You must accept the platform rules.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            username: cleanUsername,
          },
        },
      });

if (error) {
  const errorText = error.message.toLowerCase();

  if (
    errorText.includes("rate limit") ||
    errorText.includes("email rate limit exceeded")
  ) {
    setErrorMessage(
      "Too many signup attempts right now. Please wait a bit and try again later."
    );
  } else if (
    errorText.includes("user already registered") ||
    errorText.includes("already registered")
  ) {
    setErrorMessage("An account already exists with this email.");
  } else if (
    errorText.includes("password should be at least") ||
    errorText.includes("weak password")
  ) {
    setErrorMessage("Password is too weak. Please choose a stronger one.");
  } else {
    setErrorMessage("Signup failed. Please check your details and try again.");
  }

  return;
}

setSuccessMessage("Account created successfully. You can now log in.");

      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setAcceptedRules(false);
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
        <div className="mb-6 w-full max-w-5xl text-sm text-[#9CA3AF]">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/" className="transition hover:text-white">
              Home
            </Link>
            <span>/</span>
            <span className="text-white">Signup</span>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_460px]">
          <section className="hidden rounded-[30px] border border-white/10 bg-[#131320] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.28)] lg:block">
            <div className="mb-4 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
              Create your account
            </div>
            <h1 className="text-4xl font-black tracking-tight">Join Dxblox</h1>
            <p className="mt-4 max-w-xl leading-7 text-[#9CA3AF]">
              Create your account to save items, manage listings and build your
              seller profile on Dxblox.
            </p>

            <div className="mt-8 grid gap-4">
              {[
                "Post and manage your own listings",
                "Build a cleaner seller profile",
                "Save items to your wishlist",
                "Get ready for future account tools and notifications",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-white/85"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)] sm:p-8">
            <div className="mb-6">
              <h2 className="text-3xl font-black tracking-tight">
                Create account
              </h2>
              <p className="mt-2 text-sm text-[#9CA3AF]">
                Start building your Dxblox profile.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSignup}>
              <div>
                <label className="mb-2 block text-sm text-[#9CA3AF]">
                  Username
                </label>
<input
  type="text"
  placeholder="Choose a username"
  value={username}
  onChange={(e) => {
    setUsername(e.target.value);
    if (errorMessage) setErrorMessage("");
    if (successMessage) setSuccessMessage("");
  }}
  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-[#73798f]"
/>
              </div>

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

              <div>
                <label className="mb-2 block text-sm text-[#9CA3AF]">
                  Password
                </label>
<input
  type="password"
  placeholder="Create a password"
  value={password}
  onChange={(e) => {
    setPassword(e.target.value);
    if (errorMessage) setErrorMessage("");
    if (successMessage) setSuccessMessage("");
  }}
  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-[#73798f]"
/>
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#9CA3AF]">
                  Confirm password
                </label>
<input
  type="password"
  placeholder="Confirm your password"
  value={confirmPassword}
  onChange={(e) => {
    setConfirmPassword(e.target.value);
    if (errorMessage) setErrorMessage("");
    if (successMessage) setSuccessMessage("");
  }}
  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-[#73798f]"
/>
              </div>

              <label className="flex items-start gap-3 text-sm text-[#9CA3AF]">
                <input
                  type="checkbox"
                  checked={acceptedRules}
                  onChange={(e) => setAcceptedRules(e.target.checked)}
                  className="mt-1 rounded border-white/10 bg-white/5"
                />
                <span>
                  I agree to the platform rules and understand that Dxblox is an
                  independent platform not affiliated with Roblox.
                </span>
              </label>

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
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-[#9CA3AF]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-violet-300 hover:text-violet-200"
              >
                Sign in
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}